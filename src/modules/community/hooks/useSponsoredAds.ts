import { useAdDelivery } from '@/core/promotions';
import type { SponsoredAd } from '@/modules/community/types';

/**
 * Hook para buscar anúncio patrocinado no widget lateral do community.
 *
 * Delega toda a lógica de targeting e elegibilidade para modules/ads.
 * Não contém lógica geográfica local — apenas adapta o resultado
 * para o tipo SponsoredAd esperado pelo SponsoredWidget.
 */
export function useSponsoredAds() {
  const { campaign, isLoading } = useAdDelivery('sidebar_widget');

  // Adaptar AdCampaignWithTargets → SponsoredAd (tipo legado do community)
  const ad: SponsoredAd | undefined = campaign
    ? {
        id: campaign.id,
        title: campaign.title,
        description: campaign.content,
        imageUrl: campaign.image_url ?? '',
        link: campaign.cta_url ?? '',
      }
    : undefined;

  return { data: ad, isLoading };
}
