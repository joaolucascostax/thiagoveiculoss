import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Vehicle = Tables<"vehicles">;
export type VehicleInsert = TablesInsert<"vehicles">;
export type VehicleUpdate = TablesUpdate<"vehicles">;

export function useVehicles(onlyActive = false) {
  return useQuery({
    queryKey: ["vehicles", { onlyActive }],
    queryFn: async () => {
      let query = supabase.from("vehicles").select("*").order("display_order", { ascending: true });
      if (onlyActive) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data as Vehicle[];
    },
  });
}

export function useVehicle(id: string | undefined) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: async () => {
      if (!id) throw new Error("No id");
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vehicle: VehicleInsert) => {
      const { data, error } = await supabase.from("vehicles").insert(vehicle).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: VehicleUpdate & { id: string }) => {
      const { data, error } = await supabase.from("vehicles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
