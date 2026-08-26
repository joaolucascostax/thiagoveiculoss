import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type VehicleEvent = {
  id: string;
  event_type:
    | "view"
    | "view_content"
    | "whatsapp_click"
    | "lead"
    | "filter_use"
    | "gallery_open"
    | "phone_view"
    | "share_click";
  vehicle_id: string | null;
  session_id: string | null;
  event_id: string | null;
  event_value: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  fbc: string | null;
  fbp: string | null;
  gclid: string | null;
  ttclid: string | null;
  device_type: string | null;
  referrer: string | null;
  user_agent: string | null;
  path: string | null;
  created_at: string;
  vehicles?: { brand: string; model: string; year: string; price?: number } | null;
};


export function useAnalytics(days: number) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["analytics", "events", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("vehicle_events")
        .select("*, vehicles(brand, model, year, price)")
        .gte("created_at", since)

        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as VehicleEvent[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("vehicle_events_stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vehicle_events" },
        () => {
          qc.invalidateQueries({ queryKey: ["analytics", "events"] });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return query;
}
