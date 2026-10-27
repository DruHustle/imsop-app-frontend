import { useData } from "@/contexts/DataContext";
import { PageHeader, SourceNote } from "@/components/Workspace";
import { Notice } from "@/components/Board";
import { OperationalReview } from "@/components/OperationalReview";
import { DemoReview } from "@/components/DemoReview";
export default function Intelligence() {
  const { mode } = useData();
  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Review exceptions and decide what to do next"
      />
      <SourceNote />
      <Notice title="Forecasts not configured">
        Review guidance uses recorded shipment events. Predictions and automated
        operational changes are unavailable.
      </Notice>
      {mode === "demo" ? <DemoReview /> : <OperationalReview />}
      <details className="source-details">
        <summary>
          {mode === "live"
            ? "Live forecasts not configured"
            : "About demonstration reviews"}
        </summary>
        <p>
          Forecasts need an optional provider with a defined horizon and
          evidence contract. Review actions document human follow-up and do not
          change delivery status, inventory or bookings. Demo actions persist
          only on this device.
        </p>
      </details>
    </>
  );
}
