/**
 * IAdRepository - Contrato do repositório de anúncios
 */

import type { AdCampaignWithTargets, AdPlacementKey } from '../types';

export interface IAdRepository {
  /**
   * Busca campanhas ativas para um placement, filtrando por location_ids elegíveis.
   * Retorna ordenado por prioridade (district antes de city).
   */
  findActiveCampaignsByLocationIds(
    placement_key: AdPlacementKey,
    location_ids: string[]
  ): Promise<AdCampaignWithTargets[]>;

  /**
   * Busca campanhas sem target (fallback genérico da plataforma).
   */
  findGenericCampaigns(placement_key: AdPlacementKey): Promise<AdCampaignWithTargets[]>;

  /**
   * Busca campanha por ID.
   */
  findById(id: string): Promise<AdCampaignWithTargets | null>;
}
