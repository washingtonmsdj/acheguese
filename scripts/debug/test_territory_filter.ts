#!/usr/bin/env tsx
/**
 * Script para testar filtro territorial na query de gastronomia
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
  console.log('🔍 Testando filtro territorial...\n');

  // ============================================================================
  // PASSO 1: Buscar location de Salvador (cidade)
  // ============================================================================
  console.log('📍 PASSO 1: Buscando location de Salvador...');
  
  const { data: salvadorCity, error: cityError } = await supabase
    .from('locations')
    .select('*')
    .eq('type', 'city')
    .eq('geographic_path', '/br/ba/salvador')
    .maybeSingle();

  if (cityError) {
    console.error('❌ Erro ao buscar Salvador:', cityError);
    process.exit(1);
  }

  if (!salvadorCity) {
    console.log('⚠️  Salvador (cidade) não encontrado');
  } else {
    console.log(`✅ Salvador encontrado:`);
    console.log(`   ID: ${salvadorCity.id}`);
    console.log(`   Name: ${salvadorCity.name}`);
    console.log(`   Type: ${salvadorCity.type}`);
    console.log(`   Geographic Path: ${salvadorCity.geographic_path}`);
    console.log('');
  }

  // ============================================================================
  // PASSO 2: Buscar empresas de gastronomia SEM filtro territorial
  // ============================================================================
  console.log('🏢 PASSO 2: Buscando empresas SEM filtro territorial...');
  
  const { data: allBusinesses, error: allError } = await supabase
    .from('gastronomy_profiles')
    .select(`
      *,
      business:business_data!business_id(
        id,
        business_name,
        slug,
        location_id,
        location:locations!location_id(
          id,
          name,
          type,
          geographic_path,
          parent_id
        )
      )
    `)
    .eq('status', 'active');

  if (allError) {
    console.error('❌ Erro:', allError);
  } else {
    console.log(`✅ Encontradas ${allBusinesses?.length || 0} empresas\n`);
    
    allBusinesses?.forEach(item => {
      console.log(`  - ${item.business?.business_name}`);
      console.log(`    Location ID: ${item.business?.location_id}`);
      console.log(`    Location: ${item.business?.location?.name} (${item.business?.location?.type})`);
      console.log(`    Geographic Path: ${item.business?.location?.geographic_path}`);
      console.log(`    Parent ID: ${item.business?.location?.parent_id}`);
      console.log('');
    });
  }

  // ============================================================================
  // PASSO 3: Testar filtro territorial por location_id (Salvador)
  // ============================================================================
  if (salvadorCity) {
    console.log('🔍 PASSO 3: Testando filtro por Salvador (cidade)...');
    
    const { data: filteredByCity, error: filterError } = await supabase
      .from('gastronomy_profiles')
      .select(`
        *,
        business:business_data!business_id(
          id,
          business_name,
          location_id
        )
      `)
      .eq('status', 'active')
      .eq('business.location_id', salvadorCity.id);

    if (filterError) {
      console.error('❌ Erro no filtro:', filterError);
    } else {
      console.log(`✅ Filtro por cidade retornou: ${filteredByCity?.length || 0} empresas\n`);
    }
  }

  // ============================================================================
  // PASSO 4: Buscar bairros de Salvador e contar empresas
  // ============================================================================
  console.log('🏘️  PASSO 4: Buscando bairros de Salvador...');
  
  const { data: districts, error: districtsError } = await supabase
    .from('locations')
    .select('id, name, geographic_path')
    .eq('type', 'district')
    .like('geographic_path', '/br/ba/salvador/%');

  if (districtsError) {
    console.error('❌ Erro ao buscar bairros:', districtsError);
  } else {
    console.log(`✅ Encontrados ${districts?.length || 0} bairros\n`);
    
    // Contar empresas por bairro
    for (const district of districts || []) {
      const { data: businessesInDistrict } = await supabase
        .from('business_data')
        .select('id, business_name')
        .eq('location_id', district.id)
        .eq('status', 'active');
      
      const count = businessesInDistrict?.length || 0;
      if (count > 0) {
        console.log(`  ${district.name}: ${count} empresa(s)`);
        businessesInDistrict?.forEach(b => {
          console.log(`    - ${b.business_name}`);
        });
      }
    }
  }

  // ============================================================================
  // PASSO 5: Verificar se há filtro territorial sendo aplicado incorretamente
  // ============================================================================
  console.log('\n🔍 PASSO 5: Verificando hierarquia de locations...');
  
  if (allBusinesses && allBusinesses.length > 0) {
    const firstBusiness = allBusinesses[0].business;
    if (firstBusiness?.location) {
      console.log(`\nExemplo: ${firstBusiness.business_name}`);
      console.log(`  Location ID: ${firstBusiness.location_id}`);
      console.log(`  Location Type: ${firstBusiness.location.type}`);
      console.log(`  Parent ID: ${firstBusiness.location.parent_id}`);
      
      // Buscar parent (cidade)
      if (firstBusiness.location.parent_id) {
        const { data: parent } = await supabase
          .from('locations')
          .select('*')
          .eq('id', firstBusiness.location.parent_id)
          .maybeSingle();
        
        if (parent) {
          console.log(`  Parent: ${parent.name} (${parent.type})`);
          console.log(`  Parent Geographic Path: ${parent.geographic_path}`);
        }
      }
    }
  }
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
