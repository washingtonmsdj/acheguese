#!/usr/bin/env node
/**
 * Script para Remover Grupos Inválidos
 * Remove grupos de teste, duplicados e inválidos
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

async function removeInvalidGroups() {
  console.log('========================================');
  console.log('REMOVENDO GRUPOS INVÁLIDOS');
  console.log('========================================\n');

  try {
    // 1. Buscar todos os grupos
    const { data: groups, error } = await supabase
      .from('territorial_groups')
      .select('*')
      .order('name');

    if (error) throw error;

    console.log(`Total de grupos encontrados: ${groups.length}\n`);

    // 2. Identificar grupos inválidos
    const invalidGroups = groups.filter(g => {
      // Grupos com nomes de teste
      const isTestGroup = 
        g.name.includes('Duplicado') ||
        g.name.includes('Inválido') ||
        g.name.includes('Tipo Inválido') ||
        g.slug.includes('dup-') ||
        g.slug.includes('invalido-') ||
        g.slug.includes('tipo-');
      
      // Grupos inativos sem membros
      const isInactiveEmpty = g.status === 'inactive' && !g.member_count;
      
      return isTestGroup || isInactiveEmpty;
    });

    if (invalidGroups.length === 0) {
      console.log('✅ Nenhum grupo inválido encontrado!\n');
      return;
    }

    console.log(`Encontrados ${invalidGroups.length} grupos inválidos:\n`);

    // 3. Remover cada grupo inválido
    for (const group of invalidGroups) {
      console.log(`🗑️  Removendo: ${group.name} (${group.slug})`);
      console.log(`   Status: ${group.status}`);
      console.log(`   Membros: ${group.member_count || 0}`);

      // Primeiro, remover membros se houver
      const { data: members } = await supabase
        .from('territorial_group_members')
        .select('id')
        .eq('group_id', group.id);

      if (members && members.length > 0) {
        console.log(`   ↳ Removendo ${members.length} membros...`);
        await supabase
          .from('territorial_group_members')
          .delete()
          .eq('group_id', group.id);
      }

      // Depois, remover o grupo
      const { error: delError } = await supabase
        .from('territorial_groups')
        .delete()
        .eq('id', group.id);

      if (delError) {
        console.log(`   ⚠️ Erro ao deletar: ${delError.message}`);
      } else {
        console.log(`   ✓ Removido com sucesso\n`);
      }
    }

    console.log('========================================');
    console.log('LIMPEZA CONCLUÍDA');
    console.log('========================================\n');

    // 4. Mostrar grupos restantes
    const { data: remaining } = await supabase
      .from('territorial_groups')
      .select('name, slug, status')
      .order('name');

    console.log(`Grupos restantes: ${remaining?.length || 0}\n`);
    
    if (remaining && remaining.length > 0) {
      remaining.forEach(g => {
        console.log(`  ✓ ${g.name} (${g.slug}) - ${g.status}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

removeInvalidGroups();
