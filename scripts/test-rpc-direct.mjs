#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve('.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

console.log('🧪 Testando RPC search_entities_hybrid diretamente...\n');

const { data, error } = await supabase.rpc('search_entities_hybrid', {
  p_latitude: -12.9977,
  p_longitude: -38.4502,
  p_radius_km: 8,
  p_entity_type: 'business',
  p_location_ids: ['384add59-4e53-489d-a7b5-97dea2b3f442'],
  p_limit: 5
});

if (error) {
  console.error('❌ Erro:', error);
  console.error('\n⚠️  A migration pode não ter sido aplicada corretamente.');
  console.error('   Verifique no Supabase Dashboard se a função foi recriada.\n');
  process.exit(1);
}

console.log('✅ RPC funcionou!');
console.log(`   Resultados: ${data?.length || 0}`);

if (data && data.length > 0) {
  console.log('\n📊 Primeiro resultado:');
  console.log('   Nome:', data[0].name);
  console.log('   Latitude:', data[0].latitude, '(tipo:', typeof data[0].latitude, ')');
  console.log('   Longitude:', data[0].longitude, '(tipo:', typeof data[0].longitude, ')');
  console.log('   Distância:', data[0].distance_meters, 'm');
  console.log('   In Territory:', data[0].in_territory);
}

console.log('\n✅ Migration aplicada com sucesso!\n');
