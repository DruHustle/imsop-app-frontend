import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { safeLocalStorage } from "@/lib/storage";
import { API_ORIGIN } from "@/lib/api-origin";
import {
  Mode,
  SourceStatus,
  Shipment,
  OperationalOrder,
  normalizeShipment,
  normalizeOrder,
  canOrder,
} from "@/lib/workspace";
import { demoShipments, demoOrders } from "@/lib/demo-data";
export interface Source<T> {
  status: SourceStatus;
  items: T[];
  total: number;
  error?: string;
}
export class ReadError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
export async function readSource(path: string, signal: AbortSignal) {
  const res = await fetch(`${API_ORIGIN}${path}`, {
    credentials: "include",
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok)
    throw new ReadError(
      res.status,
      res.status === 403
        ? "You do not have permission to read this source."
        : res.status === 404
          ? "Record not found."
          : "The source is unavailable. Retry the read."
    );
  return res.json();
}
interface DataState {
  scope: string;
  mode: Mode;
  setMode: (mode: Mode) => void;
  demoIdentity: boolean;
  shipments: Source<Shipment>;
  orders: Source<OperationalOrder>;
  refresh: () => void;
}
const DataContext = createContext<DataState | null>(null);
const loading = <T,>(): Source<T> => ({
  status: "loading",
  items: [],
  total: 0,
});
function ScopedDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const demoIdentity = !!safeLocalStorage
    .getItem("imsop_token")
    ?.startsWith("mock_");
  const key = `imsop:mode:${user!.id}:${user!.email}:${demoIdentity ? "demo-account" : "account"}`;
  const [mode, setSelectedMode] = useState<Mode>(() =>
    demoIdentity
      ? "demo"
      : safeLocalStorage.getItem(key) === "demo"
        ? "demo"
        : "live"
  );
  const [shipments, setShipments] = useState<Source<Shipment>>(loading);
  const [orders, setOrders] = useState<Source<OperationalOrder>>(loading);
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion(v => v + 1), []);
  const setMode = (next: Mode) => {
    if (demoIdentity && next === "live") return;
    setShipments(loading());
    setOrders(loading());
    setSelectedMode(next);
    safeLocalStorage.setItem(key, next);
  };
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    setShipments(loading());
    setOrders(loading());
    if (mode === "demo") {
      setShipments({
        status: "ready",
        items: demoShipments,
        total: demoShipments.length,
      });
      setOrders(
        canOrder(user)
          ? { status: "ready", items: demoOrders, total: demoOrders.length }
          : { status: "forbidden", items: [], total: 0 }
      );
      clearTimeout(timeout);
      return () => controller.abort();
    }
    const load = async <T,>(
      kind: string,
      normalize: (r: Record<string, unknown>) => T,
      set: (s: Source<T>) => void
    ) => {
      try {
        const data = await readSource(
          `/api/operations/${kind}?limit=500&offset=0`,
          controller.signal
        );
        if (!Array.isArray(data.items))
          throw new Error(
            "Unsupported API contract. Deploy the bounded read API."
          );
        const items = data.items.map(normalize);
        if (!controller.signal.aborted)
          set({ status: "ready", items, total: data.total });
      } catch (e) {
        if (controller.signal.aborted && disposed) return;
        set({
          status:
            e instanceof ReadError && e.status === 403
              ? "forbidden"
              : "unavailable",
          items: [],
          total: 0,
          error: e instanceof Error ? e.message : "Source unavailable",
        });
      }
    };
    let disposed = false;
    void Promise.all([
      load("shipments", normalizeShipment, setShipments),
      canOrder(user)
        ? load("orders", normalizeOrder, setOrders)
        : Promise.resolve(
            setOrders({ status: "forbidden", items: [], total: 0 })
          ),
    ]).finally(() => clearTimeout(timeout));
    return () => {
      disposed = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [mode, version, user?.id, user?.role]);
  return (
    <DataContext.Provider
      value={{
        scope: `${user!.id}:${user!.email}:${demoIdentity ? "demo-account" : "account"}`,
        mode,
        setMode,
        demoIdentity,
        shipments,
        orders,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? (
    <ScopedDataProvider key={`${user.id}:${user.email}`}>
      {children}
    </ScopedDataProvider>
  ) : (
    <>{children}</>
  );
}
export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("Data provider required");
  return value;
}
