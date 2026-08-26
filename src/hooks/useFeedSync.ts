import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FeedImport = {
  id: string;
  started_at: string;
  finished_at: string | null;
  created_count: number;
  updated_count: number;
  deactivated_count: number;
  total_in_feed: number;
  error: string | null;
};

export function useLastFeedImport() {
  return useQuery({
    queryKey: ["feed-imports", "last"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_imports")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as FeedImport | null) ?? null;
    },
  });
}

export function useFeedSync() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("vehicles-feed-sync", {
        body: {},
      });
      if (error) throw error;
      if (data && (data as { ok?: boolean }).ok === false) {
        throw new Error((data as { error?: string }).error ?? "Falha na importação");
      }
      return data as {
        ok: true;
        total_in_feed: number;
        created: number;
        updated: number;
        deactivated: number;
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["feed-imports"] });
    },
  });
}
