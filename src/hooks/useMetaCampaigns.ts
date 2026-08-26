import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MetaCampaign = {
  campaign_id: string;
  campaign_name: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
};

export type CampaignTarget = {
  campaign_name: string;
  cpl_target: number;
};

export function useMetaCampaigns(days: number) {
  return useQuery({
    queryKey: ["meta_campaigns", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("meta_campaigns")
        .select("*")
        .gte("date", since);
      if (error) throw error;
      return (data ?? []) as MetaCampaign[];
    },
  });
}

export function useCampaignTargets() {
  return useQuery({
    queryKey: ["meta_campaign_targets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("meta_campaign_targets").select("*");
      if (error) throw error;
      return (data ?? []) as CampaignTarget[];
    },
  });
}

export function useUpsertTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: CampaignTarget) => {
      const { error } = await supabase
        .from("meta_campaign_targets")
        .upsert({ campaign_name: t.campaign_name, cpl_target: t.cpl_target });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meta_campaign_targets"] }),
  });
}

export type MetaAdInsight = {
  level: "adset" | "ad";
  object_id: string;
  date: string;
  campaign_id: string | null;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string | null;
  ad_name: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
};

/** Métricas diárias por conjunto e por anúncio (últimos N dias). */
export function useMetaAdInsights(days: number) {
  return useQuery({
    queryKey: ["meta_ad_insights", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("meta_ad_insights")
        .select("*")
        .gte("date", since);
      if (error) throw error;
      return (data ?? []) as MetaAdInsight[];
    },
  });
}
