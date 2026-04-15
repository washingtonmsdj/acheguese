/**
 * useClassifiedsLocation - Hook para integração com fundação geográfica
 *
 * REFATORADO: Agora usa useModuleLocation genérico (SSOT).
 *
 * Responsável por:
 * - Obter localização ativa do contexto
 * - Validar location_id para criação/edição de classificado
 * - Fornecer parâmetros de filtro por localização
 */

import { useModuleLocation } from '@/core/location/hooks/useModuleLocation';
import { classifiedsLocationService } from '../services';

export function useClassifiedsLocation() {
  return useModuleLocation(classifiedsLocationService);
}
