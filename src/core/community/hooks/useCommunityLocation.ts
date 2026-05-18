/**
 * useCommunityLocation - Hook para integração com fundação geográfica
 * 
 * REFATORADO: Agora usa useModuleLocation genérico (SSOT).
 * 
 * Responsável por:
 * - Obter localização ativa do contexto
 * - Validar localização para criação de conteúdo
 * - Fornecer parâmetros de filtro por localização
 */

import { useModuleLocation } from '@/core/location/hooks/useModuleLocation';
import type { BaseLocationService } from '@/core/location/services/BaseLocationService';
import { communityLocationService } from '../services';

export function useCommunityLocation() {
  return useModuleLocation(communityLocationService as BaseLocationService);
}
