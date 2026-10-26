/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
    gm_authFailure?: () => void;
  }
}

// Use environment variable for Google Maps API key
// Users should set VITE_GOOGLE_MAPS_API_KEY in their .env file
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
let mapScriptPromise: Promise<void> | null = null;

function loadMapScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (!API_KEY)
    return Promise.reject(new Error("Google Maps API key is not configured"));
  if (mapScriptPromise) return mapScriptPromise;

  const scriptPromise = new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId: number | undefined;
    const previousInit = window.initGoogleMaps;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (window.initGoogleMaps === onReady)
        window.initGoogleMaps = previousInit;

      if (error) reject(error);
      else resolve();
    };

    const onReady = () => {
      if (window.google?.maps) finish();
      else finish(new Error("Google Maps loaded without initializing"));
    };
    const onLoad = () => {
      if (window.google?.maps) finish();
      else finish(new Error("Google Maps loaded without initializing"));
    };
    const onError = () => finish(new Error("Failed to load Google Maps"));

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    const script = existingScript ?? document.createElement("script");

    if (!existingScript) {
      window.initGoogleMaps = onReady;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
    }

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    timeoutId = window.setTimeout(
      () => finish(new Error("Timed out while loading Google Maps")),
      15_000
    );

    if (!existingScript) document.head.appendChild(script);
  });

  mapScriptPromise = scriptPromise.catch((error: unknown) => {
    mapScriptPromise = null;
    throw error;
  });

  return mapScriptPromise;
}

interface Asset {
  id: string;
  label: string;
  position: google.maps.LatLngLiteral;
  href?: string;
}
interface MapViewProps {
  className?: string;
  assets?: Asset[];
}
export function MapView({ className, assets = [] }: MapViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [status, setStatus] = useState<"loading" | "google" | "fallback">(
    "loading"
  );
  const { theme } = useTheme();
  const valid = assets.filter(
    a =>
      Number.isFinite(a.position.lat) &&
      Number.isFinite(a.position.lng) &&
      Math.abs(a.position.lat) <= 90 &&
      Math.abs(a.position.lng) <= 180
  );
  useEffect(() => {
    let active = true;
    const previous = window.gm_authFailure;
    const fail = () => {
      if (active) setStatus("fallback");
    };
    window.gm_authFailure = fail;
    void loadMapScript()
      .then(() => {
        if (!active || !container.current || !window.google?.maps) return;
        map.current = new window.google.maps.Map(container.current, {
          center: { lat: 15, lng: 0 },
          zoom: 2,
          streetViewControl: false,
          mapTypeControl: false,
        });
        setStatus("google");
      })
      .catch(fail);
    return () => {
      active = false;
      if (window.gm_authFailure === fail) window.gm_authFailure = previous;
      if (map.current)
        window.google?.maps.event.clearInstanceListeners(map.current);
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (status !== "google" || !map.current || !window.google?.maps) return;
    const bounds = new window.google.maps.LatLngBounds();
    const markers = valid.map(a => {
      const marker = new window.google!.maps.Marker({
        map: map.current,
        position: a.position,
        title: a.label,
      });
      bounds.extend(a.position);
      if (a.href)
        marker.addListener("click", () => {
          window.location.hash = a.href!;
        });
      return marker;
    });
    if (valid.length) map.current.fitBounds(bounds, 45);
    return () =>
      markers.forEach(marker => {
        window.google?.maps.event.clearInstanceListeners(marker);
        marker.setMap(null);
      });
  }, [assets, status]);
  useEffect(() => {
    const apply = () =>
      map.current?.setOptions({
        styles: document.documentElement.classList.contains("dark")
          ? [
              { elementType: "geometry", stylers: [{ color: "#1e3045" }] },
              {
                elementType: "labels.text.fill",
                stylers: [{ color: "#bacbdb" }],
              },
              {
                elementType: "labels.text.stroke",
                stylers: [{ color: "#142235" }],
              },
            ]
          : [],
      });
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [theme, status]);
  return (
    <div className={cn("space-y-3", className)}>
      <p className="muted text-xs">
        {status === "google"
          ? "Map markers from supplied coordinates only."
          : "Tracking map provider unavailable or not configured. Showing a schematic coordinate view and linked records."}{" "}
        {valid.length} records have valid coordinates. No destination-based
        positions are inferred.
      </p>
      <div
        ref={container}
        className={status === "google" ? "h-[340px] rounded border" : "hidden"}
        aria-label="Shipment map"
      />
      {status !== "google" && (
        <div className="map-fallback">
          <svg
            viewBox="0 0 720 360"
            role="img"
            aria-label={`Schematic longitude and latitude plot of ${valid.length} recorded positions. Use the linked coordinate list below.`}
          >
            <rect width="720" height="360" fill="var(--muted)" />
            {[-180, -120, -60, 0, 60, 120, 180].map(x => (
              <g key={x}>
                <path d={`M${(x + 180) * 2} 0V360`} stroke="var(--border)" />
                <text
                  x={(x + 180) * 2 + 4}
                  y={350}
                  fontSize="9"
                  fill="var(--muted-foreground)"
                >
                  {x}°
                </text>
              </g>
            ))}
            {[-60, -30, 0, 30, 60].map(y => (
              <g key={y}>
                <path d={`M0 ${(90 - y) * 2}H720`} stroke="var(--border)" />
                <text
                  x="5"
                  y={(90 - y) * 2 - 5}
                  fontSize="9"
                  fill="var(--muted-foreground)"
                >
                  {y}°
                </text>
              </g>
            ))}
            {valid.map(a => (
              <Link
                href={a.href ?? `/supply-chain/shipments/${a.id}`}
                key={a.id}
                aria-label={`Open ${a.label}`}
              >
                <circle
                  cx={(a.position.lng + 180) * 2}
                  cy={(90 - a.position.lat) * 2}
                  r="5"
                >
                  <title>{a.label}</title>
                </circle>
              </Link>
            ))}
          </svg>
        </div>
      )}
      <div className="coordinate-list">
        {valid.map(a => (
          <div key={a.id}>
            <Link href={a.href ?? `/supply-chain/shipments/${a.id}`}>
              {a.label} ↗
            </Link>
            <p className="muted">
              Latitude {a.position.lat} · Longitude {a.position.lng}
            </p>
          </div>
        ))}
      </div>
      {!valid.length && (
        <p className="muted text-sm">
          No valid coordinates in the filtered records. Use List to inspect
          shipments.
        </p>
      )}
    </div>
  );
}
