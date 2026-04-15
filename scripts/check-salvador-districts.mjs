#!/usr/bin/env node
/**
 * Script para Verificar Bairros de Salvador
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSalvadorDistricts() {
  console.log('========================================');
  console.log('VERIFICANDO BAIRROS DE SALVADOR');
  console.log('========================================\n');

  try {
    // 1. Buscar Salvador
    const { data: salvador } = await supabase
      .from('locations')
      .select('id, name, slug, geographic_path')
      .eq('slug', 'salvador')
      .eq('type', 'city')
      .single();

    if (!salvador) {
      console.log('❌ Salvador não encontrado!');
      return;
    }

    console.log(`✓ Salvador encontrado: ${salvador.name}`);
    console.log(`  ID: ${salvador.id}`);
    console.log(`  Path: ${salvador.geographic_path}\n`);

    // 2. Buscar todos os bairros de Salvador
    const { data: districts } = await supabase
      .from('locations')
      .select('id, name, slug, status, geographic_path')
      .eq('parent_id', salvador.id)
      .eq('type', 'district')
      .order('name');

    console.log(`Total de bairros: ${districts?.length || 0}\n`);

    if (districts && districts.length > 0) {
      console.log('Bairros encontrados:\n');
      districts.forEach((d, idx) => {
        console.log(`${idx + 1}. ${d.name}`);
        console.log(`   Slug: ${d.slug}`);
        console.log(`   Status: ${d.status}`);
        console.log(`   Path: ${d.geographic_path}\n`);
      });
    }

    // 3. Buscar membros do Complexo
    const { data: complexo } = await supabase
      .from('territorial_groups')
      .select('id, name')
      .eq('slug', 'complexo-do-nordeste-de-amaralina')
      .single();

    if (complexo) {
      const { data: members } = await supabase
        .from('territorial_group_members')
        .select('location_id, locations(name, slug)')
        .eq('group_id', complexo.id);

      console.log(`\n📍 Complexo do Nordeste de Amaralina:`);
      console.log(`   Membros: ${members?.length || 0}\n`);

      if (members && members.length > 0) {
        members.forEach((m, idx) => {
          console.log(`   ${idx + 1}. ${m.locations.name} (${m.locations.slug})`);
        });
      }

      // 4. Bairros que NÃO estão no grupo
      const memberIds = members?.map(m => m.location_id) || [];
      const districtsNotInGroup = districts?.filter(d => !memberIds.includes(d.id)) || [];

      console.log(`\n\n📍 Bairros SEM grupo:`);
      console.log(`   Total: ${districtsNotInGroup.length}\n`);

      if (districtsNotInGroup.length > 0) {
        districtsNotInGroup.forEach((d, idx) => {
          console.log(`   ${idx + 1}. ${d.name} (${d.slug})`);
        });
      }
    }

    console.log('\n========================================');
    console.log('VERIFICAÇÃO CONCLUÍDA');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

checkSalvadorDistricts();
