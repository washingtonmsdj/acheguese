/**
 * ClassifiedsLocationService
 *
 * Integra o módulo classifieds com a fundação geográfica.
 * Estende BaseLocationService — não duplica lógica comum.
 *
 * CoverageService NÃO é usado: classificados são anúncios pontuais,
 * não entidades com área de atendimento.
 */

import { BaseLocationService } from '@/core/location/services/BaseLocationService';

export class ClassifiedsLocationService extends BaseLocationService {
  getDefaultBehavior() {
    return {
      allowListing: false,
      showMessage: 'Selecione uma localização para ver os classificados da região',
      filterScope: 'none' as const,
    };
  }
}

export const classifiedsLocationService = new ClassifiedsLocationService();
