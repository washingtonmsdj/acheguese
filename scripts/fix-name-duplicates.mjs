#!/usr/bin/env node
/**
 * Script para Remover Duplicados por Nome
 * Remove registros com mesmo nome mas slugs diferentes
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

async function fixNameDuplicates() {
  console.log('========================================');
  console.log('REMOVENDO DUPLICADOS POR NOME');
  console.log('========================================\n');

  try {
    // 1. Buscar todos os locations
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at');

    if (error) throw error;

    // 2. Agrupar por nome + tipo
    const nameGroups = new Map();
    locations.forEach(loc => {
      const key = `${loc.name}-${loc.type}`;
      if (!nameGroups.has(key)) {
        nameGroups.set(key, []);
      }
      nameGroups.get(key).push(loc);
    });

    // 3. Encontrar duplicados
    const duplicates = Array.from(nameGroups.entries())
      .filter(([_, locs]) => locs.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ Nenhum duplicado por nome encontrado!\n');
      return;
    }

    console.log(`Encontrados ${duplicates.length} nomes duplicados:\n`);

    for (const [key, locs] of duplicates) {
      const [name, type] = key.split('-');
      console.log(`\n📍 ${name} (${type}) - ${locs.length} registros:`);
      
      // Ordenar: geographic_path correto primeiro, depois mais antigo
      locs.sort((a, b) => {
        const aCorrect = a.geographic_path?.startsWith('/br') ? 0 : 1;
        const bCorrect = b.geographic_path?.startsWith('/br') ? 0 : 1;
        if (aCorrect !== bCorrect) return aCorrect - bCorrect;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      const canonical = locs[0];
      console.log(`   ✓ Manter: ${canonical.slug} (${canonical.geographic_path})`);

      for (let i = 1; i < locs.length; i++) {
        const dup = locs[i];
        console.log(`   ✗ Remover: ${dup.slug} (${dup.geographic_path})`);

        // Migrar dependências
        const { data: children } = await supabase
          .from('locations')
          .select('id, name')
          .eq('parent_id', dup.id);

        if (children && children.length > 0) {
          console.log(`     ↳ Migrando ${children.length} filhos...`);
          await supabase
            .from('locations')
            .update({ parent_id: canonical.id })
            .eq('parent_id', dup.id);
        }

        const { data: groups } = await supabase
          .from('territorial_groups')
          .select('id, name')
          .eq('anchor_city_id', dup.id);

        if (groups && groups.length > 0) {
          console.log(`     ↳ Migrando ${groups.length} grupos...`);
          await supabase
            .from('territorial_groups')
            .update({ anchor_city_id: canonical.id })
            .eq('anchor_city_id', dup.id);
        }

        // Migrar outras referências
        const tables = ['addresses', 'business_data', 'tourist_points_v2'];
        for (const table of tables) {
          try {
            const { data: records } = await supabase
              .from(table)
              .select('id')
              .eq('location_id', dup.id);

            if (records && records.length > 0) {
              await supabase
                .from(table)
                .update({ location_id: canonical.id })
                .eq('location_id', dup.id);
              console.log(`     ↳ Migrados ${records.length} de ${table}`);
            }
          } catch (err) {
            // Tabela pode não existir
          }
        }

        // Deletar duplicado
        const { error: delError } = await supabase
          .from('locations')
          .delete()
          .eq('id', dup.id);

        if (delError) {
          console.log(`     ⚠️ Erro ao deletar: ${delError.message}`);
        } else {
          console.log(`     ✓ Removido com sucesso`);
        }
      }
    }

    console.log('\n========================================');
    console.log('CORREÇÃO CONCLUÍDA');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

fixNameDuplicates();
