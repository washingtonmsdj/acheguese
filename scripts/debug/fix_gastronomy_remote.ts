#!/usr/bin/env tsx
/**
 * Script para corrigir location_id das empresas de gastronomia
 * Conecta ao Supabase remoto e atualiza os dados
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
  console.error('Certifique-se de que .env.remote está configurado corretamente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LocationInfo {
  id: string;
  name: string;
  type: string;
  geographic_path: string;
}

interface BusinessInfo {
  id: string;
  business_name: string;
  slug: string;
  location_name: string;
  location_type: string;
  geographic_path: string;
  segment_count: number;
}

async function main() {
  console.log('🚀 Iniciando correção de location_id para empresas de gastronomia...\n');

  // ============================================================================
  // PASSO 1: VERIFICAR LOCATIONS DISPONÍVEIS (BAIRROS)
  // ============================================================================
  console.log('📍 PASSO 1: Verificando bairros disponíveis em Salvador...');
  
  const { data: districts, error: districtsError } = await supabase
    .from('locations')
    .select('id, name, type, geographic_path')
    .eq('type', 'district')
    .like('geographic_path', '/br/ba/salvador/%')
    .order('name');

  if (districtsError) {
    console.error('❌ Erro ao buscar bairros:', districtsError);
    process.exit(1);
  }

  console.log(`✅ Encontrados ${districts?.length || 0} bairros em Salvador:\n`);
  districts?.forEach((d: LocationInfo) => {
    console.log(`   - ${d.name}: ${d.geographic_path}`);
  });
  console.log('');

  // Criar mapa de bairros para facilitar lookup
  const districtMap = new Map<string, string>();
  districts?.forEach((d: LocationInfo) => {
    const districtSlug = d.geographic_path.split('/').pop();
    if (districtSlug) {
      districtMap.set(districtSlug, d.id);
    }
  });

  // ============================================================================
  // PASSO 2: ATUALIZAR BUSINESS_DATA COM LOCATION_ID CORRETO
  // ============================================================================
  console.log('🏢 PASSO 2: Atualizando location_id das empresas de gastronomia...\n');

  const businessUpdates = [
    { slug: 'restaurante-barra-mar', district: 'barra' },
    { slug: 'bar-do-rio', district: 'rio-vermelho' },
    { slug: 'casa-da-moqueca', district: 'pelourinho' },
    { slug: 'pizzaria-bella-napoli', district: 'itaigara' },
    { slug: 'sushi-house-pituba', district: 'pituba' },
  ];

  for (const update of businessUpdates) {
    const locationId = districtMap.get(update.district);
    
    if (!locationId) {
      console.log(`⚠️  Bairro "${update.district}" não encontrado, pulando ${update.slug}`);
      continue;
    }

    const { error } = await supabase
      .from('business_data')
      .update({ location_id: locationId })
      .eq('slug', update.slug);

    if (error) {
      console.error(`❌ Erro ao atualizar ${update.slug}:`, error);
    } else {
      console.log(`✅ ${update.slug} → ${update.district}`);
    }
  }

  // ============================================================================
  // PASSO 3: ATUALIZAR ADDRESSES COM LOCATION_ID CORRETO
  // ============================================================================
  console.log('\n📮 PASSO 3: Atualizando location_id dos endereços...\n');

  const addressUpdates = [
    { neighborhood: 'Barra', district: 'barra' },
    { neighborhood: 'Rio Vermelho', district: 'rio-vermelho' },
    { neighborhood: 'Pelourinho', district: 'pelourinho' },
    { neighborhood: 'Itaigara', district: 'itaigara' },
    { neighborhood: 'Pituba', district: 'pituba' },
  ];

  for (const update of addressUpdates) {
    const locationId = districtMap.get(update.district);
    
    if (!locationId) {
      console.log(`⚠️  Bairro "${update.district}" não encontrado, pulando ${update.neighborhood}`);
      continue;
    }

    const { error } = await supabase
      .from('addresses')
      .update({ location_id: locationId })
      .eq('neighborhood', update.neighborhood)
      .eq('city', 'Salvador');

    if (error) {
      console.error(`❌ Erro ao atualizar endereço ${update.neighborhood}:`, error);
    } else {
      console.log(`✅ Endereço ${update.neighborhood} → ${update.district}`);
    }
  }

  // ============================================================================
  // PASSO 4: VALIDAÇÃO FINAL
  // ============================================================================
  console.log('\n✅ PASSO 4: Validando correções...\n');

  const { data: validation, error: validationError } = await supabase
    .from('business_data')
    .select(`
      id,
      business_name,
      slug,
      location:locations!location_id(
        name,
        type,
        geographic_path
      )
    `)
    .in('slug', [
      'restaurante-barra-mar',
      'bar-do-rio',
      'casa-da-moqueca',
      'pizzaria-bella-napoli',
      'sushi-house-pituba'
    ])
    .order('business_name');

  if (validationError) {
    console.error('❌ Erro na validação:', validationError);
    process.exit(1);
  }

  console.log('📊 Resultado da validação:\n');
  
  let allValid = true;
  validation?.forEach((business: any) => {
    const geoPath = business.location?.geographic_path || '';
    const segmentCount = (geoPath.match(/\//g) || []).length;
    const isValid = segmentCount === 4;
    
    if (!isValid) allValid = false;
    
    const status = isValid ? '✅' : '❌';
    console.log(`${status} ${business.business_name}`);
    console.log(`   Slug: ${business.slug}`);
    console.log(`   Location: ${business.location?.name} (${business.location?.type})`);
    console.log(`   Geographic Path: ${geoPath}`);
    console.log(`   Segmentos: ${segmentCount}/4`);
    console.log('');
  });

  // ============================================================================
  // PASSO 5: TESTAR FORMATO DE URL
  // ============================================================================
  console.log('🔗 PASSO 5: Testando formato de URLs canônicas...\n');

  validation?.forEach((business: any) => {
    const geoPath = business.location?.geographic_path || '';
    const parts = geoPath.replace(/^\//, '').split('/');
    
    if (parts.length >= 4) {
      const [country, state, city, district] = parts;
      const canonicalUrl = `/empresas/${state}/${city}/${district}/${business.slug}`;
      console.log(`✅ ${business.business_name}`);
      console.log(`   URL: ${canonicalUrl}\n`);
    } else {
      console.log(`❌ ${business.business_name}`);
      console.log(`   ERRO: Geographic path inválido: ${geoPath}\n`);
    }
  });

  // ============================================================================
  // RESULTADO FINAL
  // ============================================================================
  if (allValid) {
    console.log('🎉 SUCESSO! Todas as empresas de gastronomia foram corrigidas!');
    console.log('✅ Todas têm geographic_path com 4 segmentos (país/estado/cidade/bairro)');
    console.log('✅ BusinessUrlService agora funcionará corretamente');
  } else {
    console.log('⚠️  ATENÇÃO! Algumas empresas ainda têm problemas');
    console.log('Verifique os erros acima e corrija manualmente se necessário');
  }
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
