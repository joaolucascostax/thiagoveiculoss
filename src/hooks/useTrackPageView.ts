import { useEffect } from "react";
import { trackEvent } from "@/lib/tracking";

export function useTrackPageView(vehicleId?: string | null) {
  useEffect(() => {
    trackEvent("view", { vehicle_id: vehicleId ?? null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);
}
