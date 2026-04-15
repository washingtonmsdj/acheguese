/**
 * Script para testar busca espacial de businesses
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpatialSearch() {
  console.log('🧪 Testando busca espacial de businesses...\n');
  
  const { data, error } = await supabase.rpc('search_entities_by_radius', {
    p_latitude: -12.9822,
    p_longitude: -38.4812,
    p_radius_km: 10.0,
    p_entity_type: 'business',
    p_location_id: null,
    p_limit: 10,
    p_offset: 0
  });
  
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log(`✅ Sucesso! Encontradas ${data?.length || 0} empresas\n`);
  
  if (data && data.length > 0) {
    console.log('Primeiras 3 empresas:');
    data.slice(0, 3).forEach((business, i) => {
      console.log(`\n${i + 1}. ${business.name}`);
      console.log(`   Distância: ${Math.round(business.distance_meters)}m`);
      console.log(`   Coordenadas: ${business.latitude}, ${business.longitude}`);
    });
  } else {
    console.log('⚠️ Nenhuma empresa encontrada no raio de 10km');
  }
}

testSpatialSearch().catch(console.error);
