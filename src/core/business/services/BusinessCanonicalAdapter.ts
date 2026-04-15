/**
 * BusinessCanonicalAdapter
 * 
 * ETAPA 12: Apenas modelo canônico (address_id + location_id)
 * Fallbacks legados removidos
 */

import type { Address } from '@/core/address/types';
import type { Location } from '@/core/location/types';
import type { BusinessDataRecord } from '../types';

export interface BusinessWithCanonicalRelations extends Omit<BusinessDataRecord, 'address'> {
  address?: Address | null;
  location?: Location | null;
}

/**
 * Verificar se empresa está migrada para modelo canônico
 * ETAPA 12: Sempre true (location_id obrigatório para standalone/branch)
 */
export function isBusinessMigrated(business: BusinessDataRecord): boolean {
  return true;
}

/**
 * Verificar se empresa tem endereço físico
 */
export function hasPhysicalAddress(business: BusinessDataRecord): boolean {
  return business.address_id !== null && business.address_id !== undefined;
}

/**
 * Obter endereço formatado (apenas canônico)
 * ETAPA 12: Sem fallback legado
 */
export function getFormattedBusinessAddress(business: BusinessWithCanonicalRelations): string {
  if (!business.address) return '';
  
  const addr = business.address;
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
export function getBusinessCoordinates(
  business: BusinessWithCanonicalRelations
): { latitude: number; longitude: number } | null {
  // Usar apenas address canônico
  if (business.address?.latitude && business.address?.longitude) {
    return {
      latitude: business.address.latitude,
      longitude: business.address.longitude,
    };
  }

  return null;
}

/**
 * Obter território principal (location_id)
 * Retorna null para brand_hub (sem território).
 * standalone e branch sempre têm location_id.
 */
export function getBusinessTerritory(business: BusinessDataRecord): string | null {
  return business.location_id ?? null;
}

/**
 * Verificar se a empresa é territorial (standalone ou branch).
 * brand_hub não é territorial — não tem location_id.
 */
export function isTerritorialBusiness(business: BusinessDataRecord): boolean {
  const role = (business as any).business_role;
  if (role === 'brand_hub') return false;
  return business.location_id !== null && business.location_id !== undefined;
}

/**
 * Obter nome do território (apenas canônico)
 * ETAPA 12: Sem fallback legado
 */
export function getBusinessTerritoryName(
  business: BusinessWithCanonicalRelations
): string | null {
  return business.location?.name || null;
}
