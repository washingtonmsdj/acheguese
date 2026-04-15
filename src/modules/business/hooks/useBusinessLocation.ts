/**
 * useBusinessLocation - Hook para integração com fundação geográfica
 * 
 * REFATORADO: Agora usa useModuleLocation genérico (SSOT).
 * 
 * Responsável por:
 * - Obter localização ativa do contexto
 * - Validar localização para criação/edição de business
 * - Fornecer parâmetros de filtro por localização
 */

import { useModuleLocation } from '@/core/location/hooks/useModuleLocation';
import { businessLocationService } from '../services';

export function useBusinessLocation() {
  return useModuleLocation(businessLocationService);
}
