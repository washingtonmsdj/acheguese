#!/usr/bin/env tsx
/**
 * Script para encontrar o ID correto de Salvador no banco remoto
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function findSalvador() {
  console.log('🔍 Buscando Salvador no banco remoto...\n');

  try {
    // Buscar Salvador
    const { data: salvador, error: salvadorError } = await supabase
      .from('locations')
      .select('id, name, type, geographic_path')
      .eq('name', 'Salvador')
      .eq('type', 'city')
      .single();

    if (salvadorError) {
      console.error('❌ Erro ao buscar Salvador:', salvadorError);
      
      // Tentar buscar qualquer cidade
      console.log('\n🔍 Buscando todas as cidades...');
      const { data: cities } = await supabase
        .from('locations')
        .select('id, name, type, geographic_path')
        .eq('type', 'city')
        .limit(10);
      
      console.log('\n📍 Cidades encontradas:');
      console.table(cities);
      return;
    }

    console.log('✅ Salvador encontrado!');
    console.log('─'.repeat(70));
    console.log(`ID: ${salvador.id}`);
    console.log(`Nome: ${salvador.name}`);
    console.log(`Tipo: ${salvador.type}`);
    console.log(`Path: ${salvador.geographic_path}`);
    console.log('─'.repeat(70));
    console.log('');

    // Buscar rollouts existentes
    console.log('📝 Buscando rollouts existentes em Salvador...\n');
    const { data: rollouts, error: rolloutsError } = await supabase
      .from('module_rollouts')
      .select('module_key, status, created_at')
      .eq('location_id', salvador.id)
      .order('module_key');

    if (rolloutsError) {
      console.error('❌ Erro ao buscar rollouts:', rolloutsError);
    } else if (rollouts && rollouts.length > 0) {
      console.log('✅ Rollouts existentes:');
      console.table(rollouts);
    } else {
      console.log('⚠️  Nenhum rollout encontrado em Salvador');
    }

    // Buscar bairros do Complexo do Nordeste
    console.log('\n🔍 Buscando bairros do Complexo do Nordeste...\n');
    const { data: bairros } = await supabase
      .from('locations')
      .select('id, name, type, geographic_path')
      .ilike('name', '%nordeste%')
      .limit(10);

    if (bairros && bairros.length > 0) {
      console.log('📍 Bairros encontrados:');
      console.table(bairros);
    }

    // Buscar grupos territoriais
    console.log('\n🔍 Buscando grupos territoriais...\n');
    const { data: groups } = await supabase
      .from('territorial_groups')
      .select('id, name, slug')
      .limit(10);

    if (groups && groups.length > 0) {
      console.log('📍 Grupos encontrados:');
      console.table(groups);
    }

    // Gerar SQL correto
    console.log('\n📋 SQL CORRETO para aplicar:');
    console.log('─'.repeat(70));
    console.log(`
-- Passo 1: Atualizar constraint
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community', 'business', 'services', 'mobility', 'classifieds', 'ads',
    'gastronomy', 'events', 'jobs'
  ));

-- Passo 2: Inserir rollouts em Salvador
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy', '${salvador.id}', 'active', NULL),
  ('events', '${salvador.id}', 'active', NULL),
  ('jobs', '${salvador.id}', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;

-- Passo 3: Verificar
SELECT module_key, status FROM module_rollouts 
WHERE location_id = '${salvador.id}'
ORDER BY module_key;
    `.trim());
    console.log('─'.repeat(70));

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

findSalvador();
