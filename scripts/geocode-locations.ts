/**
 * Script CLI para geocodificar locations sem coordenadas
 * 
 * Uso:
 *   npm run geocode-locations
 *   npm run geocode-locations -- --refine
 * 
 * @module scripts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('FALHA Variáveis de ambiente não encontradas');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? 'OK' : 'FALHA');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'OK' : 'FALHA');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- Geocoding Service (inline) ----------------------------------------------

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const REQUEST_DELAY_MS = 1000;

async function geocodeWithNominatim(location: any) {
  try {
    const query = buildGeocodingQuery(location);
    
    const url = new URL(`${NOMINATIM_BASE_URL}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'br');
    
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'AchegueSeApp/1.0',
      },
    });
    
    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('No results for:', query);
      return null;
    }
    
    const result = data[0];
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      source: 'nominatim',
      confidence: assessConfidence(result),
      needsRefinement: false,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

function buildGeocodingQuery(location: any): string {
  switch (location.type) {
    case 'country':
      return location.name;
    case 'state':
      return `${location.name}, Brasil`;
    case 'city':
      return location.fullName;
    case 'district':
      return location.fullName;
    default:
      return location.name;
  }
}

function assessConfidence(result: any): 'high' | 'medium' | 'low' {
  const importance = parseFloat(result.importance || 0);
  if (importance > 0.6) return 'high';
  if (importance > 0.3) return 'medium';
  return 'low';
}

async function updateLocationCoordinates(locationId: string, result: any) {
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

async function getLocationsWithoutCoordinates() {
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
    
    return (data || []).map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      fullName: loc.full_name,
      type: loc.type,
      parentId: loc.parent_id,
    }));
  } catch (error) {
    console.error('Query exception:', error);
    return [];
  }
}

async function getLocationsNeedingRefinement() {
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
    
    return (data || []).map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      fullName: loc.full_name,
      type: loc.type,
      parentId: loc.parent_id,
    }));
  } catch (error) {
    console.error('Query exception:', error);
    return [];
  }
}

async function processBatch(locations: any[], onProgress?: any) {
  const stats = { success: 0, failed: 0, skipped: 0 };
  
  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    
    if (onProgress) {
      onProgress(i + 1, locations.length, location);
    }
    
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
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }
  
  return stats;
}

// --- Main ---------------------------------------------------------------------

async function main() {
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
    locations.forEach((loc: any, i: number) => {
      console.log(`  ${i + 1}. ${loc.fullName} (${loc.type})`);
    });
    console.log('');
    
    const stats = await processBatch(
      locations,
      (current: number, total: number, location: any) => {
        console.log(`[${current}/${total}] Refinando: ${location.fullName}...`);
      }
    );
    
    console.log('');
    console.log('========================================');
    console.log('Refinamento concluído:');
    console.log(`  OK Sucesso: ${stats.success}`);
    console.log(`  FALHA Falhas: ${stats.failed}`);
    console.log('========================================');
  } else {
    console.log('Modo: Geocodificar locations sem coordenadas');
    console.log('');
    
    const locations = await getLocationsWithoutCoordinates();
    
    if (locations.length === 0) {
      console.log('OK Todos os locations já têm coordenadas!');
      return;
    }
    
    console.log(`Encontrados ${locations.length} locations sem coordenadas:`);
    locations.forEach((loc: any, i: number) => {
      console.log(`  ${i + 1}. ${loc.fullName} (${loc.type})`);
    });
    console.log('');
    console.log('Iniciando geocoding (1 req/segundo para respeitar rate limit)...');
    console.log('');
    
    const stats = await processBatch(
      locations,
      (current: number, total: number, location: any) => {
        console.log(`[${current}/${total}] Geocodificando: ${location.fullName}...`);
      }
    );
    
    console.log('');
    console.log('========================================');
    console.log('Geocoding concluído:');
    console.log(`  OK Sucesso: ${stats.success}`);
    console.log(`  FALHA Falhas: ${stats.failed}`);
    console.log('========================================');
  }
}

main().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
