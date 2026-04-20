import { useAdDelivery } from '@/core/promotions';
import type { SponsoredAd } from '@/core/community/types';

/**
 * Hook para buscar anÃºncio patrocinado no widget lateral do community.
 *
 * Delega toda a lÃ³gica de targeting e elegibilidade para modules/ads.
 * NÃ£o contÃ©m lÃ³gica geogrÃ¡fica local â€” apenas adapta o resultado
 * para o tipo SponsoredAd esperado pelo SponsoredWidget.
 */
export function useSponsoredAds() {
  const { campaign, isLoading } = useAdDelivery('sidebar_widget');

  // Adaptar AdCampaignWithTargets â†’ SponsoredAd (tipo legado do community)
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

