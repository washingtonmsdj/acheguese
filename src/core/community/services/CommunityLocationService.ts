/**
 * CommunityLocationService
 *
 * Integra o módulo community com a fundação geográfica.
 * Estende BaseLocationService e centraliza o comportamento default.
 */

import { BaseLocationService } from '@/core/location/services/BaseLocationService';

export class CommunityLocationService extends BaseLocationService {
  getDefaultBehavior() {
    return {
      allowContent: false,
      showMessage: 'Selecione uma localização para ver o conteúdo da comunidade',
      filterScope: 'none' as const,
    };
  }
}

export const communityLocationService = new CommunityLocationService();
