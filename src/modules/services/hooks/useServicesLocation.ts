/**
 * useServicesLocation - Hook para integração com fundação geográfica
 *
 * REFATORADO: Agora usa useModuleLocation genérico (SSOT).
 *
 * Responsável por:
 * - Obter localização ativa do contexto
 * - Validar localização para criação/edição de prestador
 * - Fornecer parâmetros de filtro por localização
 */

import { useModuleLocation } from '@/core/location/hooks/useModuleLocation';
import { servicesLocationService } from '../services';

export function useServicesLocation() {
  return useModuleLocation(servicesLocationService);
}
