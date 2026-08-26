import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export type StoreSettings = Tables<"store_settings">;

export function useStoreSettings() {
  return useQuery({
    queryKey: ["store_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").limit(1).single();
      if (error) throw error;
      return data as StoreSettings;
    },
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: TablesUpdate<"store_settings"> & { id: string }) => {
      const { id, ...rest } = updates;
      const { data, error } = await supabase.from("store_settings").update(rest).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["store_settings"] }),
  });
}
