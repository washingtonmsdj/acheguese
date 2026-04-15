/**
 * ServicesLocationService
 *
 * Integra o módulo services com a fundação geográfica.
 * Estende BaseLocationService — não duplica lógica comum.
 */

import { BaseLocationService } from '@/core/location/services/BaseLocationService';

export class ServicesLocationService extends BaseLocationService {
  getDefaultBehavior() {
    return {
      allowListing: false,
      showMessage: 'Selecione uma localização para ver os prestadores da região',
      filterScope: 'none' as const,
    };
  }
}

export const servicesLocationService = new ServicesLocationService();
