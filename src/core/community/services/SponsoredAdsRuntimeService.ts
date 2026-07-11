import { useAdDelivery } from "@/core/business/promotions";
import type { AdPlacementKey } from "@/core/business/promotions";

type SponsoredAd = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
};

export function useSponsoredAdsRuntime(
  placementKey: AdPlacementKey = "sidebar_widget",
) {
  const { campaign, isLoading } = useAdDelivery(placementKey);

  const data: SponsoredAd | null = campaign
    ? {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description ?? "",
        imageUrl: campaign.image_url ?? "",
        link: campaign.cta_url ?? "",
      }
    : null;

  return { data, isLoading };
}
