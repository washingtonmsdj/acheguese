/**
 * AdDeliveryService
 *
 * Ponto de entrada principal para entrega de anúncios.
 * Orquestra AdContextService + AdEligibilityService.
 *
 * API para módulos consumidores (community, business, services, classifieds):
 *   const result = await adDeliveryService.getAdForPlacement('feed_sponsored', fallbackLocationId);
 */

import { AdEligibilityService } from './AdEligibilityService';
import { AdContextService, adContextService } from './AdContextService';
import { createAdRepository } from '../repositories/createAdRepository';
import type { IAdRepository } from '../repositories/IAdRepository';
import type { AdPlacementKey, AdResolutionResult } from '../types';

export class AdDeliveryService {
  private eligibilityService: AdEligibilityService;
  private contextService: AdContextService;

  constructor(repository: IAdRepository = createAdRepository()) {
    this.eligibilityService = new AdEligibilityService(repository);
    this.contextService = adContextService;
  }

  /**
   * Retorna o anúncio mais elegível para um placement dado o contexto geográfico atual.
   *
   * @param placement_key - Slot de exibição
   * @param fallbackLocationId - primary_location_id do perfil (opcional)
   */
  async getAdForPlacement(
    placement_key: AdPlacementKey,
    fallbackLocationId?: string | null
  ): Promise<AdResolutionResult> {
    const context = await this.contextService.buildContext(fallbackLocationId);
    return this.eligibilityService.resolve(placement_key, context);
  }

  /** Verifica se há localização ativa para exibição de anúncios */
  hasActiveLocation(): boolean {
    return this.contextService.hasActiveLocation();
  }

  /** Retorna o ID da localização ativa */
  getActiveLocationId(): string | null {
    return this.contextService.getActiveLocationId();
  }
}

export const adDeliveryService = new AdDeliveryService();
