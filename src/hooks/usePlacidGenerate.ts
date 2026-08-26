import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlacidResult {
  vehicle_id: string;
  status: "success" | "error";
  image_url?: string;
  error?: string;
  label?: string;
}

export function usePlacidGenerate() {
  return useMutation({
    mutationFn: async (vehicle_ids: string[]): Promise<PlacidResult[]> => {
      const { data, error } = await supabase.functions.invoke("placid-generate", {
        body: { vehicle_ids },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.results ?? []) as PlacidResult[];
    },
  });
}
