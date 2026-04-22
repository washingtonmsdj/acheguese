/**
 * Mobility Location Service
 *
 * Integra o módulo mobility com a fundação geográfica.
 *
 * DISTINÇÃO CANÔNICA:
 * - "Contexto geográfico do app" → district/city ativo via locationContextStore
 *   Usado para: filtrar rotas disponíveis, verificar rollout, escopo de listagem
 * - "Localização operacional da corrida" → coordenadas GPS (lat/lng) em tempo real
 *   Domínio interno da corrida, NÃO toca na fundação geográfica
 *
 * REGRA DE ESCOPO OPERACIONAL (aplicada neste serviço, não delegada ao backend):
 * - Mobility opera por CITY. Rotas cruzam bairros.
 * - Se activeLocation for CITY → usa city_id diretamente
 * - Se activeLocation for DISTRICT → resolve para city_parent_id via LocationService
 * - A promoção district → city é responsabilidade de getOperationalLocationId()
 * 
 * REFATORAÇÃO: Agora estende BaseLocationService (SSOT).
 */

import { BaseLocationService } from '@/core/location/services/BaseLocationService';
import { LocationType } from '@/core/location/types/index';

export class MobilityLocationService extends BaseLocationService {
  /**
   * Override: Obtém o location_id operacional para filtros de rotas.
   *
   * REGRA CANÔNICA: mobility opera por cidade.
   * - CITY ativo → retorna city_id
   * - DISTRICT ativo → resolve para city (parent_id) via LocationService
   *
   * A promoção district → city vive aqui, no MobilityLocationService.
   * Não é delegada ao backend/view.
   */
  async getOperationalLocationId(): Promise<string | null> {
    const location = this.getActiveLocation();
    if (!location) return null;

    // Já é cidade — retorna direto
    if (location.type === LocationType.CITY) {
      return location.id;
    }

    // É distrito — resolve para a cidade pai
    if (location.type === LocationType.DISTRICT && location.parent_id) {
      try {
        const output = await this.locationService.getLocationById({
          id: location.parent_id
        });
        const parent = output.location;
        if (parent && parent.type === LocationType.CITY) {
          return parent.id;
        }
      } catch {
        // fallback: retorna o próprio id se não conseguir resolver
        return location.id;
      }
    }

    // Para outros tipos (state, country), retorna o id como está
    return location.id;
  }

  /**
   * Override: Escopo de filtro para listagem de rotas.
   * Sempre retorna 'city' — mobility não opera por distrito.
   */
  getFilterScope(): 'city' | 'none' {
    const location = this.getActiveLocation();
    if (!location) return 'none';
    return 'city';
  }

  /**
   * Comportamento padrão quando não há localização de contexto ativa.
   */
  getDefaultBehavior() {
    return {
      allowListing: false,
      showMessage: 'Selecione uma localização para ver as rotas disponíveis',
      filterScope: 'none' as const
    };
  }
}

// Singleton instance
export const mobilityLocationService = new MobilityLocationService();
