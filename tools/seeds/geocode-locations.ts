/**
 * CLI script to geocode locations missing coordinates.
 *
 * Usage:
 *   npm run geocode-locations
 *   npm run geocode-locations -- --refine
 */

import { createServiceRoleClient, loadSupabaseScriptEnv } from '../supabase/supabase-client';

type LocationRow = {
  id: string;
  name: string;
  fullName: string;
  type: string;
  parentId: string | null;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
  source: 'nominatim';
  confidence: 'high' | 'medium' | 'low';
  needsRefinement: boolean;
};

type BatchStats = {
  success: number;
  failed: number;
  skipped: number;
};

loadSupabaseScriptEnv();

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`FALHA Variavel de ambiente obrigatoria ausente: ${name}`);
    process.exit(1);
  }

  return value;
}

function readRequiredIntEnv(name: string): number {
  const value = Number.parseInt(readRequiredEnv(name), 10);
  if (!Number.isInteger(value) || value <= 0) {
    console.error(`FALHA Variavel de ambiente invalida: ${name}`);
    process.exit(1);
  }

  return value;
}

function readHttpsBaseUrl(name: string): string {
  const value = readRequiredEnv(name).replace(/\/+$/, '');
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') throw new Error(`${name} must use https`);
    return parsed.toString().replace(/\/+$/, '');
  } catch (error) {
    console.error(`FALHA ${name} invalida:`, error);
    process.exit(1);
  }
}

const nominatimBaseUrl = readHttpsBaseUrl('NOMINATIM_BASE_URL');
const nominatimUserAgent = readRequiredEnv('NOMINATIM_USER_AGENT');
const nominatimDefaultFormat = readRequiredEnv('NOMINATIM_DEFAULT_FORMAT');
const nominatimDefaultLimit = readRequiredEnv('NOMINATIM_DEFAULT_LIMIT');
const nominatimDefaultCountryCodes = readRequiredEnv('NOMINATIM_DEFAULT_COUNTRY_CODES');
const nominatimDefaultCountryName = readRequiredEnv('NOMINATIM_DEFAULT_COUNTRY_NAME');
const requestDelayMs = readRequiredIntEnv('NOMINATIM_REQUEST_DELAY_MS');

const supabase = createServiceRoleClient();

async function geocodeWithNominatim(location: LocationRow): Promise<GeocodeResult | null> {
  try {
    const query = buildGeocodingQuery(location);

    const url = new URL(`${nominatimBaseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', nominatimDefaultFormat);
    url.searchParams.set('limit', nominatimDefaultLimit);
    url.searchParams.set('countrycodes', nominatimDefaultCountryCodes);

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': nominatimUserAgent,
      },
    });

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('No results for:', query);
      return null;
    }

    const result = data[0] as { lat: string; lon: string; importance?: string | number };

    return {
      latitude: Number.parseFloat(result.lat),
      longitude: Number.parseFloat(result.lon),
      source: 'nominatim',
      confidence: assessConfidence(result),
      needsRefinement: false,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function buildGeocodingQuery(location: LocationRow): string {
  switch (location.type) {
    case 'country':
      return location.name;
    case 'state':
      return `${location.name}, ${nominatimDefaultCountryName}`;
    case 'city':
    case 'district':
      return location.fullName;
    default:
      return location.name;
  }
}

function assessConfidence(result: { importance?: string | number }): 'high' | 'medium' | 'low' {
  const importance = Number.parseFloat(String(result.importance || 0));
  if (importance > 0.6) return 'high';
  if (importance > 0.3) return 'medium';
  return 'low';
}

async function updateLocationCoordinates(locationId: string, result: GeocodeResult): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('locations')
      .update({
        metadata: {
          center_latitude: result.latitude,
          center_longitude: result.longitude,
          coordinates_source: result.source,
          coordinates_confidence: result.confidence,
          coordinates_needs_refinement: result.needsRefinement,
          coordinates_updated_at: new Date().toISOString(),
        },
      })
      .eq('id', locationId);

    if (error) {
      console.error('Update error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Update exception:', error);
    return false;
  }
}

function toLocationRow(loc: {
  id: string;
  name: string;
  full_name: string;
  type: string;
  parent_id: string | null;
}): LocationRow {
  return {
    id: loc.id,
    name: loc.name,
    fullName: loc.full_name,
    type: loc.type,
    parentId: loc.parent_id,
  };
}

async function getLocationsWithoutCoordinates(): Promise<LocationRow[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, full_name, type, parent_id, metadata')
      .in('type', ['city', 'district'])
      .is('metadata->center_latitude', null);

    if (error) {
      console.error('Query error:', error);
      return [];
    }

    return (data || []).map(toLocationRow);
  } catch (error) {
    console.error('Query exception:', error);
    return [];
  }
}

async function getLocationsNeedingRefinement(): Promise<LocationRow[]> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, full_name, type, parent_id, metadata')
      .in('type', ['city', 'district'])
      .eq('metadata->coordinates_needs_refinement', true);

    if (error) {
      console.error('Query error:', error);
      return [];
    }

    return (data || []).map(toLocationRow);
  } catch (error) {
    console.error('Query exception:', error);
    return [];
  }
}

async function processBatch(
  locations: LocationRow[],
  onProgress?: (current: number, total: number, location: LocationRow) => void,
): Promise<BatchStats> {
  const stats: BatchStats = { success: 0, failed: 0, skipped: 0 };

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    onProgress?.(i + 1, locations.length, location);

    const result = await geocodeWithNominatim(location);
    if (!result) {
      stats.failed++;
      console.warn(`Failed to geocode: ${location.fullName}`);
      continue;
    }

    const updated = await updateLocationCoordinates(location.id, result);
    if (updated) {
      stats.success++;
      console.log(`OK ${location.fullName} - ${result.latitude}, ${result.longitude}`);
    } else {
      stats.failed++;
    }

    if (i < locations.length - 1) {
      await new Promise(resolve => setTimeout(resolve, requestDelayMs));
    }
  }

  return stats;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const refineMode = args.includes('--refine');

  console.log('========================================');
  console.log('Location Geocoding Script');
  console.log('========================================');
  console.log('');

  if (refineMode) {
    console.log('Modo: Refinar coordenadas existentes');
    console.log('');

    const locations = await getLocationsNeedingRefinement();
    if (locations.length === 0) {
      console.log('OK Nenhum location precisa de refinamento!');
      return;
    }

    console.log(`Encontrados ${locations.length} locations para refinar:`);
    locations.forEach((loc, i) => {
      console.log(`  ${i + 1}. ${loc.fullName} (${loc.type})`);
    });
    console.log('');

    const stats = await processBatch(locations, (current, total, location) => {
      console.log(`[${current}/${total}] Refinando: ${location.fullName}...`);
    });

    console.log('');
    console.log('========================================');
    console.log('Refinamento concluido:');
    console.log(`  OK Sucesso: ${stats.success}`);
    console.log(`  FALHA Falhas: ${stats.failed}`);
    console.log('========================================');
    return;
  }

  console.log('Modo: Geocodificar locations sem coordenadas');
  console.log('');

  const locations = await getLocationsWithoutCoordinates();
  if (locations.length === 0) {
    console.log('OK Todos os locations ja tem coordenadas!');
    return;
  }

  console.log(`Encontrados ${locations.length} locations sem coordenadas:`);
  locations.forEach((loc, i) => {
    console.log(`  ${i + 1}. ${loc.fullName} (${loc.type})`);
  });
  console.log('');
  console.log(`Iniciando geocoding com intervalo de ${requestDelayMs}ms...`);
  console.log('');

  const stats = await processBatch(locations, (current, total, location) => {
    console.log(`[${current}/${total}] Geocodificando: ${location.fullName}...`);
  });

  console.log('');
  console.log('========================================');
  console.log('Geocoding concluido:');
  console.log(`  OK Sucesso: ${stats.success}`);
  console.log(`  FALHA Falhas: ${stats.failed}`);
  console.log('========================================');
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
