#!/usr/bin/env tsx
/**
 * Script para testar a query de gastronomia e ver o que está sendo retornado
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do .env.remote
dotenv.config({ path: resolve(__dirname, '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Testando query de gastronomia...\n');

  // ============================================================================
  // PASSO 1: Buscar gastronomy_profiles ativos
  // ============================================================================
  console.log('📋 PASSO 1: Buscando gastronomy_profiles ativos...');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('gastronomy_profiles')
    .select('*')
    .eq('status', 'active');

  if (profilesError) {
    console.error('❌ Erro ao buscar profiles:', profilesError);
    process.exit(1);
  }

  console.log(`✅ Encontrados ${profiles?.length || 0} perfis gastronômicos ativos\n`);
  
  if (profiles && profiles.length > 0) {
    console.log('Perfis encontrados:');
    profiles.forEach(p => {
      console.log(`  - ID: ${p.id}`);
      console.log(`    Business ID: ${p.business_id}`);
      console.log(`    Cuisine: ${p.cuisine_type}`);
      console.log(`    Price: ${p.price_range}`);
      console.log('');
    });
  }

  // ============================================================================
  // PASSO 2: Buscar business_data correspondentes
  // ============================================================================
  console.log('🏢 PASSO 2: Buscando business_data correspondentes...');
  
  const businessIds = profiles?.map(p => p.business_id) || [];
  
  if (businessIds.length === 0) {
    console.log('⚠️  Nenhum business_id para buscar');
    return;
  }

  const { data: businesses, error: businessError } = await supabase
    .from('business_data')
    .select(`
      *,
      location:locations!location_id(
        id,
        name,
        type,
        geographic_path
      )
    `)
    .eq('status', 'active')
    .in('id', businessIds);

  if (businessError) {
    console.error('❌ Erro ao buscar business_data:', businessError);
    process.exit(1);
  }

  console.log(`✅ Encontrados ${businesses?.length || 0} business_data ativos\n`);
  
  if (businesses && businesses.length > 0) {
    console.log('Empresas encontradas:');
    businesses.forEach(b => {
      console.log(`  - ${b.business_name}`);
      console.log(`    ID: ${b.id}`);
      console.log(`    Profile ID: ${b.profile_id}`);
      console.log(`    Slug: ${b.slug}`);
      console.log(`    Location: ${b.location?.name} (${b.location?.type})`);
      console.log(`    Geographic Path: ${b.location?.geographic_path}`);
      console.log('');
    });
  }

  // ============================================================================
  // PASSO 3: Simular query da página (com join)
  // ============================================================================
  console.log('🔗 PASSO 3: Simulando query da página (com join)...');
  
  const { data: joinedData, error: joinError } = await supabase
    .from('gastronomy_profiles')
    .select(`
      *,
      business:business_data!business_id(
        *,
        location:locations!location_id(
          id,
          name,
          type,
          geographic_path
        )
      )
    `)
    .eq('status', 'active')
    .eq('business.status', 'active');

  if (joinError) {
    console.error('❌ Erro no join:', joinError);
  } else {
    console.log(`✅ Join retornou ${joinedData?.length || 0} resultados\n`);
    
    if (joinedData && joinedData.length > 0) {
      console.log('Dados completos (join):');
      joinedData.forEach(item => {
        console.log(`  - ${item.business?.business_name || 'N/A'}`);
        console.log(`    Cuisine: ${item.cuisine_type}`);
        console.log(`    Price: ${item.price_range}`);
        console.log(`    Location: ${item.business?.location?.geographic_path || 'N/A'}`);
        console.log('');
      });
    }
  }

  // ============================================================================
  // RESUMO
  // ============================================================================
  console.log('\n' + '='.repeat(80));
  console.log('RESUMO:');
  console.log(`  - Gastronomy Profiles: ${profiles?.length || 0}`);
  console.log(`  - Business Data: ${businesses?.length || 0}`);
  console.log(`  - Join Result: ${joinedData?.length || 0}`);
  console.log('='.repeat(80));
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
