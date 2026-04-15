/**
 * BusinessLocationService
 *
 * Integra o módulo business com a fundação geográfica.
 * Estende BaseLocationService — não duplica lógica comum.
 */

import { BaseLocationService } from '@/core/location/services/BaseLocationService';

export class BusinessLocationService extends BaseLocationService {
  getDefaultBehavior() {
    return {
      allowListing: false,
      showMessage: 'Selecione uma localização para ver os negócios da região',
      filterScope: 'none' as const,
    };
  }
}

export const businessLocationService = new BusinessLocationService();
