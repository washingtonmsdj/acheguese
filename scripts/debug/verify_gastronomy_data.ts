#!/usr/bin/env tsx
/**
 * Script para verificar TODAS as empresas de gastronomia no banco
 * e identificar quais ainda têm location_id incorreto
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
  console.log('🔍 Verificando TODAS as empresas de gastronomia no banco...\n');

  // Buscar usando join direto
  const { data: gastronomyBusinesses, error: gastroError } = await supabase
    .from('gastronomy_profiles')
    .select(`
      id,
      business_id,
      business:business_data!business_id(
        id,
        profile_id,
        business_name,
        slug,
        location_id,
        location:locations!location_id(
          id,
          name,
          type,
          geographic_path
        )
      )
    `);

  if (gastroError) {
    console.error('❌ Erro ao buscar gastronomy_profiles:', gastroError);
    process.exit(1);
  }

  console.log(`📊 Total de empresas de gastronomia: ${gastronomyBusinesses?.length || 0}\n`);

  const problematicas: any[] = [];
  const corretas: any[] = [];

  gastronomyBusinesses?.forEach((gp: any) => {
    const business = gp.business;
    if (!business) return;

    const geoPath = business.location?.geographic_path || '';
    const segmentCount = (geoPath.match(/\//g) || []).length;
    const isValid = segmentCount === 4;

    const info = {
      profile_id: business.profile_id,
      business_name: business.business_name,
      slug: business.slug,
      location_id: business.location_id,
      location_name: business.location?.name,
      location_type: business.location?.type,
      geographic_path: geoPath,
      segment_count: segmentCount,
    };

    if (isValid) {
      corretas.push(info);
    } else {
      problematicas.push(info);
    }
  });

  console.log('✅ EMPRESAS CORRETAS (4 segmentos):\n');
  corretas.forEach(b => {
    console.log(`  ✅ ${b.business_name}`);
    console.log(`     Slug: ${b.slug}`);
    console.log(`     Profile ID: ${b.profile_id}`);
    console.log(`     Geographic Path: ${b.geographic_path}`);
    console.log('');
  });

  console.log(`\n❌ EMPRESAS PROBLEMÁTICAS (${problematicas.length}):\n`);
  problematicas.forEach(b => {
    console.log(`  ❌ ${b.business_name}`);
    console.log(`     Slug: ${b.slug}`);
    console.log(`     Profile ID: ${b.profile_id}`);
    console.log(`     Location ID: ${b.location_id}`);
    console.log(`     Location: ${b.location_name} (${b.location_type})`);
    console.log(`     Geographic Path: ${b.geographic_path}`);
    console.log(`     Segmentos: ${b.segment_count}/4`);
    console.log('');
  });

  // Verificar se há profile_ids com 'a' no início (mock data)
  const mockProfiles = problematicas.filter(b => b.profile_id?.startsWith('a'));
  if (mockProfiles.length > 0) {
    console.log('\n⚠️  ATENÇÃO: Encontrados profile_ids de MOCK DATA:\n');
    mockProfiles.forEach(b => {
      console.log(`  - ${b.business_name}: ${b.profile_id}`);
    });
    console.log('\nEstes são dados de teste que precisam ser removidos ou corrigidos!');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`RESUMO: ${corretas.length} corretas, ${problematicas.length} problemáticas`);
  console.log('='.repeat(80));
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
