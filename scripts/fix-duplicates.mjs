#!/usr/bin/env node
/**
 * Script de Correção de Duplicados - SSOT
 * Executa diretamente no banco de dados Supabase
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

async function fixDuplicates() {
  console.log('========================================');
  console.log('INICIANDO CORREÇÃO SSOT');
  console.log('========================================\n');

  try {
    // 1. Identificar duplicados
    console.log('1. Identificando duplicados...');
    const { data: duplicates, error: dupError } = await supabase
      .from('locations')
      .select('slug, id, name, geographic_path, created_at')
      .order('slug')
      .order('created_at');

    if (dupError) throw dupError;

    const slugMap = new Map();
    duplicates.forEach(loc => {
      if (!slugMap.has(loc.slug)) {
        slugMap.set(loc.slug, []);
      }
      slugMap.get(loc.slug).push(loc);
    });

    const duplicatedSlugs = Array.from(slugMap.entries())
      .filter(([_, locs]) => locs.length > 1);

    console.log(`   Encontrados ${duplicatedSlugs.length} slugs duplicados`);
    
    if (duplicatedSlugs.length > 0) {
      duplicatedSlugs.forEach(([slug, locs]) => {
        console.log(`   - ${slug}: ${locs.length} registros`);
      });
    }
    console.log('');

    if (duplicatedSlugs.length === 0) {
      console.log('✅ Nenhum duplicado encontrado. Sistema já está correto.\n');
      
      // Mesmo sem duplicados, ativar Salvador e Complexo
      await activateTerritories();
      return;
    }

    // 2. Para cada slug duplicado, escolher o canônico
    const canonicalIds = new Map();
    const toRemove = [];

    for (const [slug, locs] of duplicatedSlugs) {
      console.log(`2. Processando slug: ${slug} (${locs.length} registros)`);
      
      // Ordenar: geographic_path correto primeiro, depois mais antigo
      locs.sort((a, b) => {
        const aCorrect = a.geographic_path?.startsWith('/br') ? 0 : 1;
        const bCorrect = b.geographic_path?.startsWith('/br') ? 0 : 1;
        if (aCorrect !== bCorrect) return aCorrect - bCorrect;
        return new Date(a.created_at) - new Date(b.created_at);
      });

      const canonical = locs[0];
      canonicalIds.set(slug, canonical.id);
      
      console.log(`   ✓ Canônico: ${canonical.name} (${canonical.geographic_path})`);
      
      for (let i = 1; i < locs.length; i++) {
        toRemove.push({ id: locs[i].id, slug, name: locs[i].name });
        console.log(`   ✗ Remover: ${locs[i].name} (${locs[i].geographic_path})`);
      }
      console.log('');
    }

    console.log(`   Total a remover: ${toRemove.length} registros\n`);

    // 3. Migrar dependências - parent_id e remover filhos duplicados
    console.log('3. Processando filhos (parent_id)...');
    let parentUpdated = 0;
    let childrenRemoved = 0;
    
    for (const remove of toRemove) {
      const canonical = canonicalIds.get(remove.slug);
      
      const { data: children } = await supabase
        .from('locations')
        .select('id, name, geographic_path, slug')
        .eq('parent_id', remove.id);

      if (children && children.length > 0) {
        for (const child of children) {
          // Verificar se já existe um filho com o mesmo slug no parent canônico
          const { data: existing } = await supabase
            .from('locations')
            .select('id, name')
            .eq('slug', child.slug)
            .eq('parent_id', canonical)
            .single();
          
          if (existing) {
            // Filho duplicado - deletar
            console.log(`   ✗ Removendo filho duplicado: ${child.name} (${child.slug})`);
            
            // Primeiro, verificar se este filho tem seus próprios filhos
            const { data: grandchildren } = await supabase
              .from('locations')
              .select('id')
              .eq('parent_id', child.id);
            
            if (grandchildren && grandchildren.length > 0) {
              // Migrar netos para o filho canônico
              await supabase
                .from('locations')
                .update({ parent_id: existing.id })
                .eq('parent_id', child.id);
              console.log(`     ↳ Migrados ${grandchildren.length} netos para ${existing.name}`);
            }
            
            // Agora deletar o filho duplicado
            await supabase.from('locations').delete().eq('id', child.id);
            childrenRemoved++;
          } else {
            // Migrar normalmente
            const { error } = await supabase
              .from('locations')
              .update({ parent_id: canonical })
              .eq('id', child.id);

            if (error) {
              console.log(`   ⚠️ Erro ao migrar ${child.name}: ${error.message}`);
            } else {
              parentUpdated++;
              console.log(`   ✓ Migrado: ${child.name}`);
            }
          }
        }
      }
    }
    console.log(`   Total parent_id migrados: ${parentUpdated}`);
    console.log(`   Total filhos duplicados removidos: ${childrenRemoved}\n`);

    // 4. Migrar dependências - anchor_city_id
    console.log('4. Migrando anchor_city_id...');
    let anchorUpdated = 0;
    
    for (const remove of toRemove) {
      const canonical = canonicalIds.get(remove.slug);
      
      const { data: groups } = await supabase
        .from('territorial_groups')
        .select('id, name')
        .eq('anchor_city_id', remove.id);

      if (groups && groups.length > 0) {
        const { error } = await supabase
          .from('territorial_groups')
          .update({ anchor_city_id: canonical })
          .eq('anchor_city_id', remove.id);

        if (error) throw error;
        anchorUpdated += groups.length;
        console.log(`   ✓ Migrados ${groups.length} grupos de ${remove.name}`);
      }
    }
    console.log(`   Total anchor_city_id migrados: ${anchorUpdated}\n`);

    // 5. Verificar que duplicados não têm mais dependências
    console.log('5. Verificando dependências...');
    for (const remove of toRemove) {
      const { data: children } = await supabase
        .from('locations')
        .select('id')
        .eq('parent_id', remove.id);

      const { data: groups } = await supabase
        .from('territorial_groups')
        .select('id')
        .eq('anchor_city_id', remove.id);

      if ((children && children.length > 0) || (groups && groups.length > 0)) {
        throw new Error(`ERRO: ${remove.name} ainda tem dependências!`);
      }
    }
    console.log('   ✓ Nenhuma dependência encontrada\n');

    // 6. Migrar referências de outras tabelas antes de deletar
    console.log('6. Migrando referências de outras tabelas...');
    
    const tablesToMigrate = [
      'addresses',
      'business_data',
      'tourist_points_v2',
      'classifieds',
      'services',
      'jobs',
      'events',
      'posts',
      'user_profiles'
    ];
    
    let totalMigrated = 0;
    
    for (const remove of toRemove) {
      const canonical = canonicalIds.get(remove.slug);
      
      for (const table of tablesToMigrate) {
        try {
          const { data: records } = await supabase
            .from(table)
            .select('id')
            .eq('location_id', remove.id);
          
          if (records && records.length > 0) {
            const { error } = await supabase
              .from(table)
              .update({ location_id: canonical })
              .eq('location_id', remove.id);
            
            if (error) {
              console.log(`   ⚠️ Erro ao migrar ${table} de ${remove.name}: ${error.message}`);
            } else {
              totalMigrated += records.length;
              console.log(`   ✓ Migrados ${records.length} registros de ${table} (${remove.name})`);
            }
          }
        } catch (err) {
          // Tabela pode não existir ou não ter coluna location_id
        }
      }
    }
    console.log(`   Total de registros migrados: ${totalMigrated}\n`);

    // 7. Remover duplicados
    console.log('7. Removendo duplicados...');
    for (const remove of toRemove) {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', remove.id);

      if (error) throw error;
      console.log(`   ✓ Removido: ${remove.name}`);
    }
    console.log(`   Total removidos: ${toRemove.length}\n`);

    // 8. Verificação final
    console.log('8. Verificação final...');
    const { data: finalCheck } = await supabase
      .from('locations')
      .select('slug')
      .order('slug');

    const finalSlugMap = new Map();
    finalCheck.forEach(loc => {
      finalSlugMap.set(loc.slug, (finalSlugMap.get(loc.slug) || 0) + 1);
    });

    const stillDuplicated = Array.from(finalSlugMap.entries())
      .filter(([_, count]) => count > 1);

    if (stillDuplicated.length > 0) {
      console.log(`   ⚠️ Ainda existem ${stillDuplicated.length} duplicados!`);
    } else {
      console.log('   ✓ Nenhum duplicado encontrado. SSOT garantido!\n');
    }

    console.log('========================================');
    console.log('CORREÇÃO CONCLUÍDA COM SUCESSO');
    console.log('========================================\n');

    // 9. Ativar Salvador e Complexo
    await activateTerritories();

  } catch (error) {
    console.error('\n❌ Erro durante a correção:', error.message);
    console.error(error);
    process.exit(1);
  }
}

async function activateTerritories() {
  console.log('9. Ativando Salvador e Complexo no seletor...');
  
  // Ativar Salvador
  const { data: salvador } = await supabase
    .from('locations')
    .select('id, name, metadata')
    .eq('geographic_path', '/br/ba/salvador')
    .eq('status', 'active')
    .single();

  if (salvador) {
    const { error: salvadorError } = await supabase
      .from('locations')
      .update({ 
        metadata: { ...salvador.metadata, is_selector_active: true }
      })
      .eq('id', salvador.id);

    if (salvadorError) {
      console.log(`   ⚠️ Erro ao ativar Salvador: ${salvadorError.message}`);
    } else {
      console.log('   ✓ Salvador ativado no seletor');
    }
  } else {
    console.log('   ⚠️ Salvador não encontrado');
  }

  // Ativar Complexo
  const { data: complexo } = await supabase
    .from('territorial_groups')
    .select('id, name, metadata')
    .eq('slug', 'complexo-do-nordeste-de-amaralina')
    .eq('status', 'active')
    .single();

  if (complexo) {
    const { error: complexoError } = await supabase
      .from('territorial_groups')
      .update({ 
        metadata: { ...complexo.metadata, is_selector_active: true }
      })
      .eq('id', complexo.id);

    if (complexoError) {
      console.log(`   ⚠️ Erro ao ativar Complexo: ${complexoError.message}`);
    } else {
      console.log('   ✓ Complexo do Nordeste de Amaralina ativado no seletor');
    }
  } else {
    console.log('   ⚠️ Complexo do Nordeste de Amaralina não encontrado');
  }

  console.log('\n✅ Tudo pronto! Recarregue a página /admin/territory-management');
}

fixDuplicates();
