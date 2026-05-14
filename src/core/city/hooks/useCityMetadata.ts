/**
 * useCityMetadata
 * 
 * Hook para buscar metadados de uma cidade específica.
 * Dados incluem: população, número de bairros, empresas ativas, escolas, etc.
 * 
 * Esses dados são gerenciados pelo admin e podem ser atualizados pela IA.
 * Enquanto não houver dados no banco, usa valores padrão para Salvador.
 * 
 * ✅ SSOT COMPLIANT - Usa CityService para acesso ao banco
 */

import { useQuery } from '@tanstack/react-query';
import { CityService } from '@/core/city/services/CityService';

// Re-export types from CityService
export type {
  EmergencyContact,
  UtilityContact,
  TouristAttraction,
  CityHallInfo,
  ElectedOfficial,
  ElectedOfficials,
  FeaturedDistrict,
  CityMetadata,
  CityStatus,
} from '@/core/city/services/CityService';

export function useCityMetadata(state?: string, city?: string) {
  return useQuery({
    queryKey: ['city-metadata', state, city],
    queryFn: () => CityService.getCityMetadata(state ?? 'ba', city ?? 'salvador'),
    enabled: Boolean(state && city),
    staleTime: 10 * 60 * 1000, // 10 minutos - dados da cidade mudam raramente
    gcTime: 30 * 60 * 1000, // 30 minutos no cache
  });
}
