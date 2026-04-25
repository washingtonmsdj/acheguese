import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";
import type { SponsoredAd } from "@/core/community/types";

export function useSponsoredAdsRuntime(placementKey = "sidebar_widget") {
  const query = useQuery({
    queryKey: ["sponsored-ad", placementKey],
    queryFn: async (): Promise<SponsoredAd | undefined> => {
      const { data, error } = await (supabase as any)
        .from("ad_campaigns")
        .select("id, title, content, image_url, cta_url")
        .eq("status", "active")
        .eq("placement_key", placementKey)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return undefined;

      return {
        id: data.id,
        title: data.title,
        description: data.content,
        imageUrl: data.image_url ?? "",
        link: data.cta_url ?? "",
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  return { data: query.data, isLoading: query.isLoading };
}
