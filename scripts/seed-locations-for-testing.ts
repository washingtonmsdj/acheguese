/**
 * Seed de locations para testes de grupos territoriais
 * 
 * Cria estrutura mínima:
 * - 2 cidades (Salvador e Lauro de Freitas)
 * - 5 bairros em cada cidade
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SEED DE LOCATIONS PARA TESTES');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Buscar estado da Bahia
  const { data: bahia } = await supabase
    .from('locations')
    .select('id')
    .eq('type', 'state')
    .eq('slug', 'bahia')
    .maybeSingle();

  if (!bahia) {
    console.error('❌ Estado da Bahia não encontrado');
    process.exit(1);
  }

  console.log('✅ Estado da Bahia encontrado:', bahia.id);

  // Criar/buscar Salvador
  let { data: salvador } = await supabase
    .from('locations')
    .select('id')
    .eq('type', 'city')
    .eq('slug', 'salvador')
    .eq('parent_id', bahia.id)
    .maybeSingle();

  if (!salvador) {
    console.log('📍 Criando Salvador...');
    const { data: created, error } = await supabase
      .from('locations')
      .insert({
        parent_id: bahia.id,
        type: 'city',
        slug: 'salvador',
        name: 'Salvador',
        full_name: 'Salvador, Bahia, Brasil',
        geographic_path: `/brasil/bahia/salvador`,
        status: 'active',
        metadata: {
          canonical_lat: -12.9714,
          canonical_lng: -38.5014,
        },
      })
      .select()
      .single();

    if (error) throw error;
    salvador = created;
    console.log('✅ Salvador criado:', salvador.id);
  } else {
    console.log('✅ Salvador já existe:', salvador.id);
  }

  // Criar/buscar Lauro de Freitas
  let { data: lauro } = await supabase
    .from('locations')
    .select('id')
    .eq('type', 'city')
    .eq('slug', 'lauro-de-freitas')
    .eq('parent_id', bahia.id)
    .maybeSingle();

  if (!lauro) {
    console.log('📍 Criando Lauro de Freitas...');
    const { data: created, error } = await supabase
      .from('locations')
      .insert({
        parent_id: bahia.id,
        type: 'city',
        slug: 'lauro-de-freitas',
        name: 'Lauro de Freitas',
        full_name: 'Lauro de Freitas, Bahia, Brasil',
        geographic_path: `/brasil/bahia/lauro-de-freitas`,
        status: 'active',
        metadata: {
          canonical_lat: -12.8944,
          canonical_lng: -38.3222,
        },
      })
      .select()
      .single();

    if (error) throw error;
    lauro = created;
    console.log('✅ Lauro de Freitas criado:', lauro.id);
  } else {
    console.log('✅ Lauro de Freitas já existe:', lauro.id);
  }

  // Bairros de Salvador
  const salvadorDistricts = [
    { slug: 'nordeste-de-amaralina', name: 'Nordeste de Amaralina' },
    { slug: 'santa-cruz', name: 'Santa Cruz' },
    { slug: 'vale-das-pedrinhas', name: 'Vale das Pedrinhas' },
    { slug: 'pituba', name: 'Pituba' },
    { slug: 'barra', name: 'Barra' },
  ];

  console.log('\n📍 Criando bairros de Salvador...');
  for (const district of salvadorDistricts) {
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('type', 'district')
      .eq('slug', district.slug)
      .eq('parent_id', salvador.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('locations')
        .insert({
          parent_id: salvador.id,
          type: 'district',
          slug: district.slug,
          name: district.name,
          full_name: `${district.name}, Salvador, Bahia, Brasil`,
          geographic_path: `/brasil/bahia/salvador/${district.slug}`,
          status: 'active',
          metadata: {},
        });

      if (error) {
        console.error(`❌ Erro ao criar ${district.name}:`, error.message);
      } else {
        console.log(`  ✅ ${district.name}`);
      }
    } else {
      console.log(`  ✓ ${district.name} (já existe)`);
    }
  }

  // Bairros de Lauro de Freitas
  const lauroDistricts = [
    { slug: 'centro', name: 'Centro' },
    { slug: 'itinga', name: 'Itinga' },
    { slug: 'vilas-do-atlantico', name: 'Vilas do Atlântico' },
    { slug: 'buraquinho', name: 'Buraquinho' },
    { slug: 'portao', name: 'Portão' },
  ];

  console.log('\n📍 Criando bairros de Lauro de Freitas...');
  for (const district of lauroDistricts) {
    const { data: existing } = await supabase
      .from('locations')
      .select('id')
      .eq('type', 'district')
      .eq('slug', district.slug)
      .eq('parent_id', lauro.id)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('locations')
        .insert({
          parent_id: lauro.id,
          type: 'district',
          slug: district.slug,
          name: district.name,
          full_name: `${district.name}, Lauro de Freitas, Bahia, Brasil`,
          geographic_path: `/brasil/bahia/lauro-de-freitas/${district.slug}`,
          status: 'active',
          metadata: {},
        });

      if (error) {
        console.error(`❌ Erro ao criar ${district.name}:`, error.message);
      } else {
        console.log(`  ✅ ${district.name}`);
      }
    } else {
      console.log(`  ✓ ${district.name} (já existe)`);
    }
  }

  console.log('\n✅ SEED CONCLUÍDO');
  console.log('');
  console.log('Estrutura criada:');
  console.log('  - 2 cidades (Salvador, Lauro de Freitas)');
  console.log('  - 10 bairros (5 por cidade)');
  console.log('');
  console.log('Próximo passo: Aplicar RLS (migration 20260329000001)');
}

main().catch(console.error);
