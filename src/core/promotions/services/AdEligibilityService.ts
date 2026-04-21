/**
 * AdEligibilityService
 *
 * Resolve qual anúncio exibir dado um contexto geográfico e um placement.
 *
 * Regra de elegibilidade canônica:
 *
 * 1. Contexto DISTRICT:
 *    - Elegível: anúncios do district exato
 *    - Elegível: anúncios da city pai
 *    - NÃO elegível: anúncios de bairros irmãos
 *    Prioridade: district > city > fallback genérico
 *
 * 2. Contexto CITY:
 *    - Elegível: anúncios da city
 *    - NÃO exibe automaticamente anúncios de todos os bairros
 *    Prioridade: city > fallback genérico
 *
 * 3. Sem activeLocation:
 *    - Usa primary_location_id do perfil como fallback, se existir
 *    - Se não existir fallback válido, retorna genérico ou nenhum
 *
 * Não usa CoverageService.
 * Não usa strings de bairro/cidade — apenas location_id.
 */

import type { IAdRepository } from '../repositories/IAdRepository';
import type {
  AdEligibilityContext,
  AdResolutionResult,
  AdPlacementKey,
  AdCampaignWithTargets,
} from '../types';

export class AdEligibilityService {
  constructor(private repository: IAdRepository) {}

  /**
   * Resolve o anúncio mais elegível para um placement dado o contexto geográfico.
   */
  async resolve(
    placement_key: AdPlacementKey,
    context: AdEligibilityContext
  ): Promise<AdResolutionResult> {
    // Determinar quais location_ids são elegíveis e em que prioridade
    const eligibleIds = this.buildEligibleLocationIds(context);

    if (eligibleIds.length > 0) {
      const candidates = await this.repository.findActiveCampaignsByLocationIds(
        placement_key,
        eligibleIds
      );

      if (candidates.length > 0) {
        const selected = this.selectByPriority(candidates, context);
        if (selected) {
          return {
            campaign: selected.campaign,
            resolution_source: selected.source,
          };
        }
      }
    }

    // Fallback genérico (sem target)
    const generics = await this.repository.findGenericCampaigns(placement_key);
    if (generics.length > 0) {
      return {
        campaign: generics[0],
        resolution_source: 'generic',
      };
    }

    return { campaign: null, resolution_source: 'none' };
  }

  /**
   * Constrói a lista de location_ids elegíveis para o contexto.
   * Ordem importa: district exato primeiro, depois city pai.
   */
  private buildEligibleLocationIds(context: AdEligibilityContext): string[] {
    const ids: string[] = [];

    if (context.active_location_id) {
      // Localização ativa existe
      ids.push(context.active_location_id);

      // Se for district, city pai também é elegível
      if (context.active_location_type === 'district' && context.parent_city_id) {
        ids.push(context.parent_city_id);
      }
    } else if (context.fallback_location_id) {
      // Sem localização ativa — usar fallback do perfil
      ids.push(context.fallback_location_id);
    }

    return ids;
  }

  /**
   * Seleciona o melhor candidato aplicando prioridade:
   * district exato > city pai > fallback de perfil
   */
  private selectByPriority(
    candidates: AdCampaignWithTargets[],
    context: AdEligibilityContext
  ): { campaign: AdCampaignWithTargets; source: AdResolutionResult['resolution_source'] } | null {
    // 1. Tentar district exato
    if (context.active_location_id && context.active_location_type === 'district') {
      const districtMatch = candidates.find((c) =>
        c.targets.some(
          (t) =>
            t.location_id === context.active_location_id &&
            t.target_scope === 'district'
        )
      );
      if (districtMatch) return { campaign: districtMatch, source: 'district' };
    }

    // 2. Tentar city (ativa ou pai do district)
    const cityId =
      context.active_location_type === 'city'
        ? context.active_location_id
        : context.parent_city_id;

    if (cityId) {
      const cityMatch = candidates.find((c) =>
        c.targets.some(
          (t) => t.location_id === cityId && t.target_scope === 'city'
        )
      );
      if (cityMatch) return { campaign: cityMatch, source: 'city' };
    }

    // 3. Fallback de perfil (qualquer match nos candidatos)
    if (context.fallback_location_id && !context.active_location_id) {
      const fallbackMatch = candidates.find((c) =>
        c.targets.some((t) => t.location_id === context.fallback_location_id)
      );
      if (fallbackMatch) return { campaign: fallbackMatch, source: 'fallback' };
    }

    return null;
  }

  /**
   * Verifica se uma campanha é elegível para um contexto.
   * Útil para validação antes de exibir.
   */
  isEligible(campaign: AdCampaignWithTargets, context: AdEligibilityContext): boolean {
    if (campaign.targets.length === 0) return true; // genérico sempre elegível

    const eligibleIds = this.buildEligibleLocationIds(context);
    return campaign.targets.some((t) => eligibleIds.includes(t.location_id));
  }
}
