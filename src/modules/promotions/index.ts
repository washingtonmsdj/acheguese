/**
 * modules/ads - API pública
 *
 * Anúncios locais segmentados por location_id.
 * Consumível por: community, business, services, classifieds.
 *
 * Uso básico:
 *   import { useAdDelivery } from '@/modules/promotions';
 *   const { campaign } = useAdDelivery('feed_sponsored');
 *
 * Uso com fallback de perfil:
 *   import { useAdDelivery } from '@/modules/promotions';
 *   const { campaign } = useAdDelivery('sidebar_widget', { fallbackLocationId: profile.primary_location_id });
 */

// Hook principal
export { useAdDelivery } from './hooks/useAdDelivery';

// Componente compartilhado
export { SponsoredAdCard } from './components/SponsoredAdCard';

// Services (para consumo direto fora de React)
export { adDeliveryService, AdDeliveryService } from './services/AdDeliveryService';
export { adContextService, AdContextService } from './services/AdContextService';
export { AdEligibilityService } from './services/AdEligibilityService';

// Repositório mock (para testes)
export { AdRepositoryMock } from './repositories/AdRepositoryMock';
export { AdRepositorySupabase } from './repositories/AdRepositorySupabase';
export { createAdRepository } from './repositories/createAdRepository';

// Tipos públicos
export type {
  AdCampaign,
  AdCampaignWithTargets,
  AdTarget,
  AdEligibilityContext,
  AdResolutionResult,
  AdOwnerEntityType,
  AdCampaignStatus,
  AdTargetScope,
  AdPlacementKey,
} from './types';
