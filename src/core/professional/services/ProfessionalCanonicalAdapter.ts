/**
 * ProfessionalCanonicalAdapter
 * 
 * ETAPA 12: Apenas modelo canônico (address_id + location_id)
 * Fallbacks legados removidos
 */

import type { Address } from '@/core/address/types';
import type { Location } from '@/core/location/types';
import type { ProfessionalDataRecord } from '@/core/professional/types';

export type { ProfessionalDataRecord } from '@/core/professional/types';

export interface ProfessionalDataWithRelations extends ProfessionalDataRecord {
  address?: Address | null;
  location?: Location | null;
}

/**
 * Verificar se profissional está migrado para modelo canônico
 * ETAPA 12: Sempre true (location_id obrigatório)
 */
export function isProfessionalMigrated(professional: ProfessionalDataRecord): boolean {
  return typeof professional.location_id === 'string' && professional.location_id.length > 0;
}

/**
 * Verificar se profissional tem endereço físico
 */
export function hasPhysicalAddress(professional: ProfessionalDataRecord): boolean {
  return professional.address_id !== null && professional.address_id !== undefined;
}

/**
 * Obter endereço formatado (apenas canônico)
 * ETAPA 12: Sem fallback legado
 */
export function getFormattedProfessionalAddress(professional: ProfessionalDataWithRelations): string {
  if (!professional.address) return '';
  
  const addr = professional.address;
  const parts: string[] = [];
  
  if (addr.street) parts.push(addr.street);
  if (addr.number) parts.push(addr.number);
  if (addr.complement) parts.push(addr.complement);
  if (addr.postal_code) parts.push(`CEP ${addr.postal_code}`);

  return parts.join(', ');
}

/**
 * Obter coordenadas (apenas canônico)
 * ETAPA 12: Sem fallback legado
 */
export function getProfessionalCoordinates(
  professional: ProfessionalDataWithRelations
): { latitude: number; longitude: number } | null {
  // Usar apenas address canônico
  if (professional.address?.latitude != null && professional.address?.longitude != null) {
    return {
      latitude: professional.address.latitude,
      longitude: professional.address.longitude,
    };
  }

  return null;
}

/**
 * Obter território principal (location_id)
 * ETAPA 12: Sempre presente (obrigatório)
 */
export function getProfessionalTerritory(professional: ProfessionalDataRecord): string | null {
  return professional.location_id || null;
}

/**
 * Obter nome do território (apenas canônico)
 * ETAPA 12: Sem fallback legado
 */
export function getProfessionalTerritoryName(
  professional: ProfessionalDataWithRelations
): string | null {
  return professional.location?.name || null;
}
