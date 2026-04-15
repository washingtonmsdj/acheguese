/**
 * Script de migração: ride_requests (legado) → modelo canônico
 * 
 * Estratégia:
 * 1. Resolver pickup_location_id e dropoff_location_id por texto/alias/geoespacial
 * 2. Criar pickup_address_id e dropoff_address_id quando houver dados mínimos
 * 3. Reaproveitar coordenadas válidas dos campos legados
 * 4. Não chutar ambiguidades
 * 5. Gerar relatório detalhado
 * 
 * Segurança:
 * - Não inventa dados
 * - Não chuta ambiguidades
 * - Mantém campos legados intactos
 * - Gera relatório detalhado
 */

import { supabase } from '@/integrations/supabase';
import { AddressService } from '@/core/address/services/AddressService';
import { GeospatialService } from '@/core/geospatial/services/GeospatialService';
import { getAllRideRequests } from '../services/mobility.queries';
import { updateRide } from '../services/mobility.mutations';
import type { CreateAddressInput } from '@/core/address/types';
import type { RideMigrationResult, ResolutionStrategy } from '../types';

const addressService = new AddressService();
const geospatialService = new GeospatialService();

interface LegacyRide {
  id: string;
  passenger_profile_id: string;
  pickup_location_id: string | null;
  dropoff_location_id: string | null;
  pickup_address_id: string | null;
  dropoff_address_id: string | null;
  origin: any;
  destination: any;
  pickup_location: any;
  dropoff_location: any;
}

interface LocationData {
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
}

interface ResolvedLocation {
  location_id: string | null;
  address_id: string | null;
  strategy: ResolutionStrategy;
  coordinates_reused: boolean;
}

export async function migrateRideRequestsToCanonical(): Promise<RideMigrationResult> {
  const result: RideMigrationResult = {
    total: 0,
    pickup_location_resolved: 0,
    dropoff_location_resolved: 0,
    pickup_address_created: 0,
    dropoff_address_created: 0,
    resolved_by_text: 0,
    resolved_by_alias: 0,
    resolved_by_geospatial: 0,
    gps_only_addresses: 0,
    ambiguous: 0,
    unresolved: 0,
    skipped_already_migrated: 0,
    failed_other: 0,
    failures: [],
  };

  // Buscar todas as corridas via SSOT
  const rides = await getAllRideRequests() as LegacyRide[];

  if (!rides || rides.length === 0) {
    return result;
  }

  result.total = rides.length;

  // Migrar cada corrida
  for (const ride of rides) {
    try {
      await migrateRide(ride, result);
    } catch (error) {
      result.failed_other++;
      result.failures.push({
        ride_id: ride.id,
        reason: error instanceof Error ? error.message : 'Unknown error',
        pickup_strategy: 'unresolved',
        dropoff_strategy: 'unresolved',
        data: {
          pickup_data: ride.pickup_location,
          dropoff_data: ride.dropoff_location,
        },
      });
    }
  }

  return result;
}

async function migrateRide(
  ride: LegacyRide,
  result: RideMigrationResult
): Promise<void> {
  // Skip se já migrado completamente
  if (
    ride.pickup_location_id &&
    ride.dropoff_location_id &&
    ride.pickup_address_id &&
    ride.dropoff_address_id
  ) {
    result.skipped_already_migrated++;
    return;
  }

  // Extrair dados de localização dos campos legados
  const pickupData = extractLocationData(ride.pickup_location, ride.origin);
  const dropoffData = extractLocationData(ride.dropoff_location, ride.destination);

  // Resolver pickup
  const pickup = await resolveLocation(pickupData, result);
  
  // Resolver dropoff
  const dropoff = await resolveLocation(dropoffData, result);

  // Contabilizar resoluções
  if (pickup.location_id) result.pickup_location_resolved++;
  if (dropoff.location_id) result.dropoff_location_resolved++;
  if (pickup.address_id) result.pickup_address_created++;
  if (dropoff.address_id) result.dropoff_address_created++;
  if (pickup.coordinates_reused || dropoff.coordinates_reused) {
    // Já contabilizado em resolveLocation
  }

  // Atualizar ride_requests
  const updateData: any = {};
  
  if (pickup.location_id) updateData.pickup_location_id = pickup.location_id;
  if (dropoff.location_id) updateData.dropoff_location_id = dropoff.location_id;
  if (pickup.address_id) updateData.pickup_address_id = pickup.address_id;
  if (dropoff.address_id) updateData.dropoff_address_id = dropoff.address_id;

  if (Object.keys(updateData).length > 0) {
    await updateRide(ride.id, updateData);
  } else {
    // Nenhum campo resolvido
    result.unresolved++;
    result.failures.push({
      ride_id: ride.id,
      reason: 'No data could be resolved',
      pickup_strategy: pickup.strategy,
      dropoff_strategy: dropoff.strategy,
      data: {
        pickup_data: pickupData,
        dropoff_data: dropoffData,
      },
    });
  }
}

function extractLocationData(primarySource: any, fallbackSource: any): LocationData {
  const data: LocationData = {};
  
  // Tentar extrair de primarySource (pickup_location ou dropoff_location)
  if (primarySource && typeof primarySource === 'object') {
    data.address = primarySource.address || primarySource.street || primarySource.endereco;
    data.neighborhood = primarySource.neighborhood || primarySource.bairro;
    data.city = primarySource.city || primarySource.cidade;
    data.state = primarySource.state || primarySource.estado || primarySource.uf;
    data.cep = primarySource.cep || primarySource.postal_code || primarySource.zipcode;
    data.latitude = primarySource.latitude || primarySource.lat;
    data.longitude = primarySource.longitude || primarySource.lng || primarySource.lon;
  }
  
  // Fallback para fallbackSource (origin ou destination)
  if (fallbackSource && typeof fallbackSource === 'object') {
    if (!data.address) data.address = fallbackSource.address || fallbackSource.street || fallbackSource.endereco;
    if (!data.neighborhood) data.neighborhood = fallbackSource.neighborhood || fallbackSource.bairro;
    if (!data.city) data.city = fallbackSource.city || fallbackSource.cidade;
    if (!data.state) data.state = fallbackSource.state || fallbackSource.estado || fallbackSource.uf;
    if (!data.cep) data.cep = fallbackSource.cep || fallbackSource.postal_code || fallbackSource.zipcode;
    if (!data.latitude) data.latitude = fallbackSource.latitude || fallbackSource.lat;
    if (!data.longitude) data.longitude = fallbackSource.longitude || fallbackSource.lng || fallbackSource.lon;
  }
  
  return data;
}

async function resolveLocation(
  data: LocationData,
  result: RideMigrationResult
): Promise<ResolvedLocation> {
  let locationId: string | null = null;
  let addressId: string | null = null;
  let strategy: ResolutionStrategy = 'unresolved';
  let coordinatesReused = false;

  // 1. Tentar resolução por texto (cidade/bairro)
  if (data.city) {
    const cityId = await resolveCityByName(data.city);
    
    if (cityId) {
      if (data.neighborhood) {
        const districtId = await resolveDistrictByName(data.neighborhood, cityId);
        if (districtId) {
          locationId = districtId;
          strategy = 'text_resolution';
          result.resolved_by_text++;
        } else {
          // Bairro não encontrado, usar cidade
          locationId = cityId;
          strategy = 'text_resolution';
          result.resolved_by_text++;
        }
      } else {
        // Sem bairro, usar cidade
        locationId = cityId;
        strategy = 'text_resolution';
        result.resolved_by_text++;
      }
    }
  }

  // 2. Fallback para alias se texto falhou
  if (!locationId && data.city) {
    const aliasId = await resolveByAlias(data.city);
    if (aliasId) {
      locationId = aliasId;
      strategy = 'alias_resolution';
      result.resolved_by_alias++;
    }
  }

  // 3. Fallback para geoespacial se houver coordenadas válidas
  if (!locationId && isValidCoordinate(data.latitude, data.longitude)) {
    const geoId = await resolveByGeospatial(data.latitude!, data.longitude!);
    if (geoId) {
      locationId = geoId;
      strategy = 'geospatial_resolution';
      result.resolved_by_geospatial++;
    }
  }

  // 4. Criar address_id se houver dados mínimos
  if (locationId) {
    addressId = await createAddress(data, locationId, result);
    if (addressId && isValidCoordinate(data.latitude, data.longitude)) {
      coordinatesReused = true;
    }
  }

  return {
    location_id: locationId,
    address_id: addressId,
    strategy,
    coordinates_reused: coordinatesReused,
  };
}

async function createAddress(
  data: LocationData,
  locationId: string,
  result: RideMigrationResult
): Promise<string | null> {
  // Determinar se há dados mínimos para criar address
  const hasAddress = (data.address?.trim() || '').length > 3;
  const hasCoordinates = isValidCoordinate(data.latitude, data.longitude);
  
  if (!hasAddress && !hasCoordinates) {
    // Sem dados mínimos
    return null;
  }

  const addressInput: CreateAddressInput = {
    location_id: locationId,
    geocoding_source: 'migration_legacy',
    geocoding_confidence: 0.7,
  };

  // Caso 1: Apenas coordenadas GPS
  if (!hasAddress && hasCoordinates) {
    addressInput.address_type = 'gps_only';
    addressInput.latitude = data.latitude;
    addressInput.longitude = data.longitude;
    result.gps_only_addresses++;
  }
  // Caso 2: Endereço completo com número
  else if (hasAddress && /\d+/.test(data.address || '')) {
    addressInput.address_type = 'exact';
    addressInput.street = data.address;
    addressInput.postal_code = data.cep || undefined;
    
    if (hasCoordinates) {
      addressInput.latitude = data.latitude;
      addressInput.longitude = data.longitude;
    }
  }
  // Caso 3: Endereço aproximado ou referência
  else if (hasAddress) {
    addressInput.address_type = 'approximate';
    addressInput.street = data.address;
    addressInput.postal_code = data.cep || undefined;
    
    if (hasCoordinates) {
      addressInput.latitude = data.latitude;
      addressInput.longitude = data.longitude;
    }
  }

  try {
    const address = await addressService.createAddress(addressInput);
    return address.id;
  } catch (error) {
    // Falha ao criar address não bloqueia migração
    return null;
  }
}

async function resolveCityByName(cityName: string): Promise<string | null> {
  const normalized = normalizeText(cityName);

  const { data: cities, error } = await supabase
    .from('locations')
    .select('id, name, slug, type')
    .eq('type', 'city')
    .eq('status', 'active');

  if (error || !cities) return null;

  const matches = cities.filter((city: any) => 
    normalizeText(city.name) === normalized ||
    normalizeText(city.slug) === normalized
  );

  // Retornar apenas se único
  if (matches.length === 1) return matches[0].id;
  
  return null;
}

async function resolveDistrictByName(districtName: string, cityId: string): Promise<string | null> {
  const normalized = normalizeText(districtName);

  const { data: districts, error } = await supabase
    .from('locations')
    .select('id, name, slug, type')
    .eq('type', 'district')
    .eq('parent_id', cityId)
    .eq('status', 'active');

  if (error || !districts) return null;

  const matches = districts.filter((district: any) => 
    normalizeText(district.name) === normalized ||
    normalizeText(district.slug) === normalized
  );

  // Retornar apenas se único
  if (matches.length === 1) return matches[0].id;

  return null;
}

async function resolveByAlias(text: string): Promise<string | null> {
  const normalized = normalizeText(text);

  const { data: aliases, error } = await supabase
    .from('location_aliases')
    .select('location_id')
    .ilike('alias_value', normalized);

  if (error || !aliases || aliases.length !== 1) return null;

  // Validar que location é válida
  const { data: location } = await supabase
    .from('locations')
    .select('id, type, status')
    .eq('id', aliases[0].location_id)
    .eq('status', 'active')
    .maybeSingle();

  if (!location) return null;

  // Garantir que não é territorial_group
  if (location.type === 'territorial_group') return null;

  return location.id;
}

async function resolveByGeospatial(lat: number, lng: number): Promise<string | null> {
  try {
    const result = await geospatialService.resolvePointToLocationWithFallback({
      latitude: lat,
      longitude: lng,
    });

    if (result?.location_id) {
      return result.location_id;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function isValidCoordinate(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (lat === null || lat === undefined) return false;
  if (lng === null || lng === undefined) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Gerar relatório formatado da migração
 */
export function formatMigrationReport(result: RideMigrationResult): string {
  const lines: string[] = [];

  lines.push('# RELATÓRIO DE MIGRAÇÃO - ride_requests');
  lines.push('');
  lines.push(`Total de corridas: ${result.total}`);
  lines.push(`Origem resolvida (pickup_location_id): ${result.pickup_location_resolved}`);
  lines.push(`Destino resolvido (dropoff_location_id): ${result.dropoff_location_resolved}`);
  lines.push(`Endereço origem criado (pickup_address_id): ${result.pickup_address_created}`);
  lines.push(`Endereço destino criado (dropoff_address_id): ${result.dropoff_address_created}`);
  lines.push('');
  lines.push('## Estratégias de Resolução');
  lines.push(`Resolvido por texto: ${result.resolved_by_text}`);
  lines.push(`Resolvido por alias: ${result.resolved_by_alias}`);
  lines.push(`Resolvido por geoespacial: ${result.resolved_by_geospatial}`);
  lines.push(`Endereços GPS-only: ${result.gps_only_addresses}`);
  lines.push('');
  lines.push('## Falhas');
  lines.push(`Ambíguas: ${result.ambiguous}`);
  lines.push(`Não resolvidas: ${result.unresolved}`);
  lines.push(`Outros erros: ${result.failed_other}`);
  lines.push(`Já migradas (skip): ${result.skipped_already_migrated}`);
  lines.push('');

  if (result.failures.length > 0) {
    lines.push('## Exemplos de Falhas (primeiros 10)');
    lines.push('');
    result.failures.slice(0, 10).forEach((failure, index) => {
      lines.push(`${index + 1}. Ride ID: ${failure.ride_id}`);
      lines.push(`   Razão: ${failure.reason}`);
      lines.push(`   Estratégia pickup: ${failure.pickup_strategy}`);
      lines.push(`   Estratégia dropoff: ${failure.dropoff_strategy}`);
      lines.push('');
    });
  }

  lines.push('## Taxa de Sucesso');
  const pickupRate = result.total > 0 
    ? ((result.pickup_location_resolved / result.total) * 100).toFixed(2)
    : '0.00';
  const dropoffRate = result.total > 0 
    ? ((result.dropoff_location_resolved / result.total) * 100).toFixed(2)
    : '0.00';
  lines.push(`Origem: ${pickupRate}% (${result.pickup_location_resolved}/${result.total})`);
  lines.push(`Destino: ${dropoffRate}% (${result.dropoff_location_resolved}/${result.total})`);

  return lines.join('\n');
}
