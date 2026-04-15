#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkHierarchy() {
  console.log('🔍 Verificando hierarquia de territórios...\n');

  // Buscar todas as localizações
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .order('geographic_path');

  if (error) {
    console.error('❌ Erro ao buscar localizações:', error);
    return;
  }

  console.log(`📊 Total de localizações: ${locations.length}\n`);

  // Verificar órfãos
  const orphans = [];
  const locationMap = new Map(locations.map(l => [l.id, l]));

  locations.forEach(loc => {
    if (loc.parent_id && !locationMap.has(loc.parent_id)) {
      orphans.push(loc);
    }
  });

  if (orphans.length > 0) {
    console.log(`⚠️  Encontrados ${orphans.length} nós órfãos:\n`);
    orphans.forEach(orphan => {
      console.log(`  - ${orphan.name} (${orphan.type})`);
      console.log(`    ID: ${orphan.id}`);
      console.log(`    Parent ID: ${orphan.parent_id} ❌ NÃO EXISTE`);
      console.log(`    Geographic Path: ${orphan.geographic_path}`);
      console.log('');
    });
  } else {
    console.log('✅ Nenhum nó órfão encontrado!\n');
  }

  // Mostrar hierarquia Brasil → Bahia → Salvador
  console.log('🌳 Hierarquia Brasil → Bahia → Salvador:\n');
  
  const brasil = locations.find(l => l.slug === 'br' || l.slug === 'brasil');
  if (brasil) {
    console.log(`✅ Brasil: ${brasil.id} (${brasil.slug})`);
    
    const bahia = locations.find(l => l.parent_id === brasil.id && (l.slug === 'ba' || l.slug === 'bahia'));
    if (bahia) {
      console.log(`  ✅ Bahia: ${bahia.id} (${bahia.slug})`);
      
      const salvador = locations.find(l => l.parent_id === bahia.id && l.slug === 'salvador');
      if (salvador) {
        console.log(`    ✅ Salvador: ${salvador.id} (${salvador.slug})`);
      } else {
        console.log(`    ❌ Salvador não encontrado como filho de Bahia`);
        const salvadorAny = locations.find(l => l.slug === 'salvador');
        if (salvadorAny) {
          console.log(`    ⚠️  Salvador existe mas com parent_id: ${salvadorAny.parent_id}`);
        }
      }
    } else {
      console.log(`  ❌ Bahia não encontrada como filha de Brasil`);
    }
  } else {
    console.log('❌ Brasil não encontrado');
  }
}

checkHierarchy().catch(console.error);
