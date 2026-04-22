/**
 * useServicesAd
 *
 * Entrega o anúncio patrocinado para a listagem de profissionais/serviços.
 * Delega toda a lógica de targeting e elegibilidade para modules/ads.
 * Não contém lógica geográfica local.
 *
 * Placement: feed_sponsored
 * Contexto geográfico: resolvido automaticamente pela fundação via AdDeliveryService
 */

import { useAdDelivery } from '@/shared/services/promotions';
import type { AdCampaignWithTargets } from '@/shared/services/promotions';

interface UseServicesAdReturn {
  /** Campanha elegível para o contexto atual, ou null */
  ad: AdCampaignWithTargets | null;
  isLoading: boolean;
  /** Como o anúncio foi selecionado (district, city, fallback, generic, none) */
  resolutionSource: string;
}

/**
 * @param fallbackLocationId - primary_location_id do perfil, se disponível
 */
export function useServicesAd(fallbackLocationId?: string | null): UseServicesAdReturn {
  const { campaign, resolutionSource, isLoading } = useAdDelivery('feed_sponsored', {
    fallbackLocationId,
  });

  return {
    ad: campaign,
    isLoading,
    resolutionSource,
  };
}

