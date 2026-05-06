#!/usr/bin/env node
/**
 * Script de validação da Fase 1 da IA transversal
 * Testa queries reais com location_id da Pituba
 */

import { createClient } from '@supabase/supabase-js';
import { loadSupabaseEnvStrict } from './_shared/supabase-env.mjs';

const { url: supabaseUrl, publishableKey: supabaseKey } = loadSupabaseEnvStrict();

const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const PITUBA_LOCATION_ID = '384add59-4e53-489d-a7b5-97dea2b3f442';
const PITUBA_COORDS = { latitude: -12.9977, longitude: -38.4502 };

const TEST_QUERIES = [
  { query: 'pizzaria barata com delivery', expectedIntent: 'business_search' },
  { query: 'restaurante aberto agora', expectedIntent: 'business_search' },
  { query: 'eletricista perto de mim', expectedIntent: 'service_search' },
  { query: 'encanador urgente', expectedIntent: 'service_search' },
  { query: 'empresa no meu bairro', expectedIntent: 'business_search' },
  { query: 'me conte uma piada', expectedIntent: 'unknown' },
];

async function testSpatialRPC() {
  console.log('\n🔍 Testando RPC search_entities_hybrid...\n');
  
  try {
    const { data, error } = await supabase.rpc('search_entities_hybrid', {
      p_latitude: PITUBA_COORDS.latitude,
      p_longitude: PITUBA_COORDS.longitude,
      p_radius_km: 8,
      p_entity_type: 'business',
      p_location_ids: [PITUBA_LOCATION_ID],
      p_limit: 10,
    });

    if (error) {
      console.error('❌ RPC falhou:', error.message);
      console.error('   Detalhes:', error);
      return false;
    }

    console.log('✅ RPC funcionou!');
    console.log(`   Resultados: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('   Primeiro resultado:', {
        name: data[0].name,
        distance_meters: data[0].distance_meters,
        latitude: data[0].latitude,
        longitude: data[0].longitude,
        in_territory: data[0].in_territory,
      });
    }
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar RPC:', err.message);
    return false;
  }
}

async function testProfessionalSearch() {
  console.log('\n🔍 Testando busca de profissionais...\n');
  
  try {
    const { data, error } = await supabase
      .from('public_professional_search')
      .select('id, professional_name, slug, service_category, location_id')
      .eq('location_id', PITUBA_LOCATION_ID)
      .limit(5);

    if (error) {
      console.error('❌ Busca de profissionais falhou:', error.message);
      console.error('   Detalhes:', error);
      return false;
    }

    console.log('✅ Busca de profissionais funcionou!');
    console.log(`   Resultados: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('   Primeiro resultado:', {
        name: data[0].professional_name,
        category: data[0].service_category,
        location_id: data[0].location_id,
      });
    }
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar busca de profissionais:', err.message);
    return false;
  }
}

async function testBusinessSearch() {
  console.log('\n🔍 Testando busca de empresas...\n');
  
  try {
    const { data, error } = await supabase
      .from('public_business_search')
      .select('id, business_name, slug, category, location_id')
      .eq('location_id', PITUBA_LOCATION_ID)
      .limit(5);

    if (error) {
      console.error('❌ Busca de empresas falhou:', error.message);
      return false;
    }

    console.log('✅ Busca de empresas funcionou!');
    console.log(`   Resultados: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('   Primeiro resultado:', {
        business_name: data[0].business_name,
        category: data[0].category,
        location_id: data[0].location_id,
      });
    }
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar busca de empresas:', err.message);
    return false;
  }
}

async function testGastronomyProfile() {
  console.log('\n🔍 Testando perfis gastronômicos...\n');
  
  try {
    const { data: businesses } = await supabase
      .from('public_business_search')
      .select('id, business_name')
      .eq('location_id', PITUBA_LOCATION_ID)
      .limit(5);

    if (!businesses || businesses.length === 0) {
      console.log('⚠️  Nenhuma empresa encontrada para testar perfil gastronômico');
      return true;
    }

    const businessIds = businesses.map(b => b.id);
    const { data: profiles, error } = await supabase
      .from('gastronomy_profiles')
      .select('business_id, status')
      .in('business_id', businessIds)
      .eq('status', 'active');

    if (error) {
      console.error('❌ Busca de perfis gastronômicos falhou:', error.message);
      return false;
    }

    console.log('✅ Busca de perfis gastronômicos funcionou!');
    console.log(`   Perfis ativos: ${profiles?.length || 0} de ${businesses.length} empresas`);
    return true;
  } catch (err) {
    console.error('❌ Erro ao testar perfis gastronômicos:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Validação da Fase 1 - IA Transversal\n');
  console.log(`📍 Location ID: ${PITUBA_LOCATION_ID} (Pituba)`);
  console.log(`📍 Coordenadas: ${PITUBA_COORDS.latitude}, ${PITUBA_COORDS.longitude}\n`);

  const results = {
    spatialRPC: await testSpatialRPC(),
    professionalSearch: await testProfessionalSearch(),
    businessSearch: await testBusinessSearch(),
    gastronomyProfile: await testGastronomyProfile(),
  };

  console.log('\n📊 Resumo dos Testes:\n');
  console.log(`   RPC Geoespacial: ${results.spatialRPC ? '✅' : '❌'}`);
  console.log(`   Busca de Profissionais: ${results.professionalSearch ? '✅' : '❌'}`);
  console.log(`   Busca de Empresas: ${results.businessSearch ? '✅' : '❌'}`);
  console.log(`   Perfis Gastronômicos: ${results.gastronomyProfile ? '✅' : '❌'}`);

  const allPassed = Object.values(results).every(r => r);
  
  console.log(`\n${allPassed ? '✅ Todos os testes passaram!' : '❌ Alguns testes falharam'}\n`);
  
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
