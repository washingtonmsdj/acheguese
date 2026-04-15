#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkActiveStatus() {
  console.log('🔍 Verificando status is_selector_active...\n');

  // Buscar todas as localizações
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .order('type, name');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  // Agrupar por tipo e status
  const stats = {
    country: { total: 0, active: 0 },
    state: { total: 0, active: 0 },
    city: { total: 0, active: 0 },
    district: { total: 0, active: 0 },
  };

  const activeLocations = [];

  locations.forEach(loc => {
    const type = loc.type || 'unknown';
    if (stats[type]) {
      stats[type].total++;
      const isActive = loc.metadata?.is_selector_active === true;
      if (isActive) {
        stats[type].active++;
        activeLocations.push(loc);
      }
    }
  });

  console.log('📊 Estatísticas por tipo:\n');
  Object.entries(stats).forEach(([type, data]) => {
    console.log(`${type.toUpperCase()}:`);
    console.log(`  Total: ${data.total}`);
    console.log(`  Ativos no seletor: ${data.active}`);
    console.log(`  Percentual: ${data.total > 0 ? ((data.active / data.total) * 100).toFixed(1) : 0}%`);
    console.log('');
  });

  if (activeLocations.length > 0) {
    console.log(`\n🟢 Localizações com is_selector_active = true (${activeLocations.length}):\n`);
    activeLocations.forEach(loc => {
      console.log(`  - ${loc.name} (${loc.type}) - ${loc.slug}`);
      console.log(`    ID: ${loc.id}`);
      console.log(`    Path: ${loc.geographic_path || 'N/A'}`);
      console.log('');
    });
  } else {
    console.log('\n✅ Nenhuma localização está ativa no seletor (correto!)');
  }

  // Verificar grupos
  const { data: groups } = await supabase
    .from('territorial_groups')
    .select('*');

  if (groups) {
    const activeGroups = groups.filter(g => g.metadata?.is_selector_active === true);
    console.log(`\n📊 Grupos Territoriais:`);
    console.log(`  Total: ${groups.length}`);
    console.log(`  Ativos no seletor: ${activeGroups.length}`);
    
    if (activeGroups.length > 0) {
      console.log(`\n🟣 Grupos ativos:\n`);
      activeGroups.forEach(g => {
        console.log(`  - ${g.name} (${g.slug})`);
      });
    }
  }
}

checkActiveStatus().catch(console.error);
