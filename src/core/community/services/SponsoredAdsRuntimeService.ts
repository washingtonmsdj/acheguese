import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase";

type SponsoredAd = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
};

export function useSponsoredAdsRuntime(placementKey = "sidebar_widget") {
  const query = useQuery({
    queryKey: ["sponsored-ad", placementKey],
    queryFn: async (): Promise<SponsoredAd | null> => {
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("id, title, description, image_url, cta_url")
        .eq("status", "active")
        .eq("placement_key", placementKey)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<{
          id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          cta_url: string | null;
        }>();

      if (error || !data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        imageUrl: data.image_url ?? "",
        link: data.cta_url ?? "",
      };
    },
    staleTime: 1000 * 60 * 5,
  });

  return { data: query.data, isLoading: query.isLoading };
}
