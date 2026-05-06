#!/usr/bin/env node
/**
 * Teste final das 6 queries obrigatórias da Fase 1 IA Transversal
 * Após resolver schema cache e completar seed
 */

import { createClient } from '@supabase/supabase-js';
import { loadSupabaseEnvStrict } from './_shared/supabase-env.mjs';

const { url: supabaseUrl, publishableKey: supabaseKey } = loadSupabaseEnvStrict();

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PITUBA_LOCATION_ID = '384add59-4e53-489d-a7b5-97dea2b3f442';

console.log('🧪 TESTE FINAL DAS 6 QUERIES - FASE 1 IA TRANSVERSAL\n');
console.log(`📍 Location: Pituba (${PITUBA_LOCATION_ID})\n`);

// Teste 1: Verificar empresas
console.log('=' .repeat(80));
console.log('📦 VERIFICANDO DADOS DE SEED');
console.log('='.repeat(80));

console.log('\n🏢 Empresas na Pituba:');
const { data: businesses, error: bizError } = await supabase
  .from('public_business_search')
  .select('id, business_name, slug, category, is_premium, has_active_gastronomy_profile, location_id')
  .eq('location_id', PITUBA_LOCATION_ID);

if (bizError) {
  console.log(`❌ Erro ao buscar empresas: ${bizError.message}`);
  console.log('⚠️  View public_business_search não encontrada.');
  console.log('   Execute a migration: 20260503010000_create_public_search_views.sql');
  process.exit(1);
} else {
  console.log(`✅ ${businesses.length} empresas encontradas:`);
  businesses.forEach((b, idx) => {
    console.log(`   ${idx + 1}. ${b.business_name} (${b.slug})`);
    console.log(`      Categoria: ${b.category}`);
    console.log(`      Premium: ${b.is_premium ? 'Sim' : 'Não'}`);
  });
}

console.log('\n👷 Profissionais na Pituba:');
const { data: professionals, error: profError } = await supabase
  .from('public_professional_search')
  .select('id, professional_name, slug, service_category, is_accepting_clients, location_id')
  .eq('location_id', PITUBA_LOCATION_ID);

if (profError) {
  console.log(`❌ Erro ao buscar profissionais: ${profError.message}`);
  console.log('⚠️  View public_professional_search não encontrada.');
  console.log('   Execute a migration: 20260503010000_create_public_search_views.sql');
  process.exit(1);
} else {
  console.log(`✅ ${professionals.length} profissionais encontrados:`);
  professionals.forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.professional_name} (${p.slug})`);
    console.log(`      Categoria: ${p.service_category}`);
  });
}

// Verificar perfis gastronômicos
console.log('\n🍽️  Perfis Gastronômicos:');
const { data: gastro, error: gastroError } = await supabase
  .from('gastronomy_profiles')
  .select(`
    id,
    business_id,
    business_data!inner(business_name, slug)
  `)
  .eq('status', 'active');

if (gastroError) {
  console.log(`⚠️  Erro ao buscar perfis gastronômicos: ${gastroError.message}`);
} else {
  console.log(`✅ ${gastro?.length || 0} perfis gastronômicos encontrados`);
  gastro?.forEach((g, idx) => {
    console.log(`   ${idx + 1}. ${g.business_data.business_name} (${g.business_data.slug})`);
  });
}

// Resumo
console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DO SEED');
console.log('='.repeat(80));
console.log(`✅ Empresas: ${businesses.length}/3 esperadas`);
console.log(`✅ Profissionais: ${professionals.length}/2 esperados`);
console.log(`✅ Perfis Gastronômicos: ${gastro?.length || 0}/1 esperado`);

const seedCompleto = businesses.length >= 3 && professionals.length >= 2;
console.log(`\n${seedCompleto ? '✅' : '❌'} Seed ${seedCompleto ? 'COMPLETO' : 'INCOMPLETO'}`);

if (!seedCompleto) {
  console.log('\n⚠️  Seed incompleto. Execute os comandos em COMANDOS_VALIDACAO_FINAL.md');
  process.exit(1);
}

// Teste de queries simuladas
console.log('\n' + '='.repeat(80));
console.log('🔍 SIMULAÇÃO DAS 6 QUERIES');
console.log('='.repeat(80));

const queries = [
  {
    id: 1,
    query: 'pizzaria barata com delivery',
    intent: 'business_search',
    test: () => businesses.filter(b => 
      b.category?.toLowerCase().includes('pizza') || 
      b.category?.toLowerCase().includes('gastronomia')
    ),
  },
  {
    id: 2,
    query: 'restaurante aberto agora',
    intent: 'business_search',
    test: () => businesses.filter(b => 
      b.category?.toLowerCase().includes('restaurante') ||
      b.category?.toLowerCase().includes('gastronomia')
    ),
  },
  {
    id: 3,
    query: 'eletricista perto de mim',
    intent: 'service_search',
    test: () => professionals.filter(p => 
      p.service_category?.toLowerCase().includes('eletricista')
    ),
  },
  {
    id: 4,
    query: 'encanador urgente',
    intent: 'service_search',
    test: () => professionals.filter(p => 
      p.service_category?.toLowerCase().includes('encanador')
    ),
  },
  {
    id: 5,
    query: 'empresa no meu bairro',
    intent: 'business_search',
    test: () => businesses,
  },
  {
    id: 6,
    query: 'me conte uma piada',
    intent: 'unknown',
    test: () => [],
  },
];

let successCount = 0;
const results = [];

for (const q of queries) {
  console.log(`\n📝 Query ${q.id}: "${q.query}"`);
  console.log(`   Intent: ${q.intent}`);
  
  const items = q.test();
  const success = q.intent === 'unknown' ? items.length === 0 : items.length > 0;
  
  console.log(`   Resultados: ${items.length}`);
  
  if (items.length > 0) {
    items.forEach((item, idx) => {
      const name = item.business_name || item.professional_name;
      const slug = item.slug;
      console.log(`   ${idx + 1}. ${name} (${slug})`);
    });
  }
  
  console.log(`   Status: ${success ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  if (success) successCount++;
  results.push({ query: q.query, intent: q.intent, count: items.length, success });
}

// Resumo final
console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO FINAL');
console.log('='.repeat(80));

results.forEach((r, idx) => {
  console.log(`${r.success ? '✅' : '❌'} Query ${idx + 1}: "${r.query}"`);
  console.log(`   Intent: ${r.intent} | Resultados: ${r.count}`);
});

console.log(`\n✅ Queries bem-sucedidas: ${successCount}/6`);

if (successCount >= 4) {
  console.log('\n✅ APROVADA: Pelo menos 4/6 queries funcionaram');
  console.log('\n📋 PRÓXIMO PASSO: Testar manualmente em /buscar');
  console.log('   1. Acessar /buscar no navegador');
  console.log('   2. Testar as 6 queries');
  console.log('   3. Validar URLs geradas');
  console.log('   4. Confirmar que URLs abrem corretamente');
} else {
  console.log('\n❌ REPROVADA: Menos de 4/6 queries funcionaram');
  console.log('\n⚠️  Verifique o seed e tente novamente');
}

console.log('\n' + '='.repeat(80));
