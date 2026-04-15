/**
 * useCoverage - Hooks para sistema de cobertura geográfica
 * 
 * Permite:
 * - Verificar se entidade atende uma localização
 * - Listar áreas de cobertura
 * - Adicionar/remover cobertura
 * 
 * @module core/geospatial/hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coverageService } from '../services/CoverageService';
import type {
  CoverageEntityType,
  CheckCoverageInput,
  AddCoverageByRadiusInput,
  AddCoverageByLocationInput,
  CoverageCheckResult,
  CoverageArea,
} from '../services/CoverageService';

// ============================================
// VERIFICAR COBERTURA
// ============================================

export interface UseCheckCoverageOptions {
  entityType: CoverageEntityType;
  entityId: string;
  userLocation: { latitude: number; longitude: number } | null;
  enabled?: boolean;
}

/**
 * Hook para verificar se uma entidade atende uma localização
 * 
 * @example
 * ```tsx
 * const { data: coverage } = useCheckCoverage({
 *   entityType: 'business',
 *   entityId: business.id,
 *   userLocation: coords
 * });
 * 
 * {coverage?.has_coverage && (
 *   <Badge>Atende sua região</Badge>
 * )}
 * ```
 */
export function useCheckCoverage(options: UseCheckCoverageOptions) {
  return useQuery({
    queryKey: [
      'coverage',
      'check',
      options.entityType,
      options.entityId,
      options.userLocation?.latitude,
      options.userLocation?.longitude,
    ],
    queryFn: async (): Promise<CoverageCheckResult> => {
      if (!options.userLocation) {
        return { has_coverage: false };
      }

      return await coverageService.checkCoverage({
        entityType: options.entityType,
        entityId: options.entityId,
        userLocation: options.userLocation,
      });
    },
    enabled: options.enabled !== false && options.userLocation !== null,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

// ============================================
// LISTAR ÁREAS DE COBERTURA
// ============================================

export interface UseEntityCoverageOptions {
  entityType: CoverageEntityType;
  entityId: string;
  enabled?: boolean;
}

/**
 * Hook para listar áreas de cobertura de uma entidade
 * 
 * @example
 * ```tsx
 * const { data: areas } = useEntityCoverage({
 *   entityType: 'business',
 *   entityId: business.id
 * });
 * 
 * areas?.forEach(area => {
 *   if (area.coverage_type === 'radius') {
 *     console.log(`Raio de ${area.radius_km} km`);
 *   }
 * });
 * ```
 */
export function useEntityCoverage(options: UseEntityCoverageOptions) {
  return useQuery({
    queryKey: ['coverage', 'areas', options.entityType, options.entityId],
    queryFn: async (): Promise<CoverageArea[]> => {
      return await coverageService.getCoverageAreas(
        options.entityType,
        options.entityId
      );
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

// ============================================
// DESCRIÇÃO DE COBERTURA
// ============================================

export interface UseCoverageDescriptionOptions {
  entityType: CoverageEntityType;
  entityId: string;
  enabled?: boolean;
}

/**
 * Hook para obter descrição textual da cobertura
 * 
 * @example
 * ```tsx
 * const { data: description } = useCoverageDescription({
 *   entityType: 'business',
 *   entityId: business.id
 * });
 * 
 * // "Atende Pituba, Barra e raio de 5 km"
 * ```
 */
export function useCoverageDescription(options: UseCoverageDescriptionOptions) {
  return useQuery({
    queryKey: [
      'coverage',
      'description',
      options.entityType,
      options.entityId,
    ],
    queryFn: async (): Promise<string> => {
      return await coverageService.getCoverageDescription(
        options.entityType,
        options.entityId
      );
    },
    enabled: options.enabled !== false,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

// ============================================
// ADICIONAR COBERTURA POR RAIO
// ============================================

/**
 * Hook para adicionar área de cobertura por raio
 * 
 * @example
 * ```tsx
 * const addCoverageByRadius = useAddCoverageByRadius();
 * 
 * await addCoverageByRadius.mutateAsync({
 *   entityType: 'business',
 *   entityId: business.id,
 *   center: { latitude: -12.9714, longitude: -38.5014 },
 *   radiusKm: 5
 * });
 * ```
 */
export function useAddCoverageByRadius() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCoverageByRadiusInput): Promise<string> => {
      return await coverageService.addCoverageByRadius(input);
    },
    onSuccess: (_, variables) => {
      // Invalidar cache de cobertura da entidade
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'areas', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'description', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'check', variables.entityType, variables.entityId],
      });
    },
  });
}

// ============================================
// ADICIONAR COBERTURA POR LOCATION
// ============================================

/**
 * Hook para adicionar área de cobertura por bairro/localidade
 * 
 * @example
 * ```tsx
 * const addCoverageByLocation = useAddCoverageByLocation();
 * 
 * await addCoverageByLocation.mutateAsync({
 *   entityType: 'business',
 *   entityId: business.id,
 *   locationId: 'loc-pituba'
 * });
 * ```
 */
export function useAddCoverageByLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCoverageByLocationInput): Promise<string> => {
      return await coverageService.addCoverageByLocation(input);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'areas', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'description', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'check', variables.entityType, variables.entityId],
      });
    },
  });
}

// ============================================
// REMOVER COBERTURA
// ============================================

export interface RemoveCoverageInput {
  areaId: string;
  entityType: CoverageEntityType;
  entityId: string;
}

/**
 * Hook para remover (desativar) área de cobertura
 * 
 * @example
 * ```tsx
 * const removeCoverage = useRemoveCoverage();
 * 
 * await removeCoverage.mutateAsync({
 *   areaId: 'area-123',
 *   entityType: 'business',
 *   entityId: business.id
 * });
 * ```
 */
export function useRemoveCoverage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveCoverageInput): Promise<boolean> => {
      return await coverageService.removeCoverage(input.areaId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'areas', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'description', variables.entityType, variables.entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['coverage', 'check', variables.entityType, variables.entityId],
      });
    },
  });
}
