import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type LeadStatus = Database["public"]["Enums"]["lead_status"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  vehicles?: { brand: string; model: string; year: string; price: number | null } | null;
};

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*, vehicles(brand, model, year, price)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      sale_value,
    }: {
      id: string;
      status: LeadStatus;
      sale_value?: number | null;
    }) => {
      const update: Partial<Database["public"]["Tables"]["leads"]["Update"]> = { status };
      if (sale_value !== undefined) update.sale_value = sale_value;
      const { data, error } = await supabase
        .from("leads")
        .update(update)
        .eq("id", id)
        .select("*, vehicles(brand, model, year, price)")
        .single();
      if (error) throw error;
      return data as unknown as Lead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
  });
}
