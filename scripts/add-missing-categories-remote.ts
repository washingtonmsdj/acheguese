/**
 * Script para adicionar categorias faltantes no banco REMOTO
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingCategories() {
  console.log('📂 Adicionando categorias faltantes...\n');

  // 1. Adicionar categoria "Games"
  const { data: gamesCategory, error: gamesError } = await supabase
    .from('classified_categories')
    .insert({
      name: 'Games',
      slug: 'games',
      icon: '🎮',
    })
    .select()
    .single();

  if (gamesError) {
    console.error('❌ Erro ao criar categoria Games:', gamesError.message);
  } else {
    console.log(`✅ Categoria Games criada: ${gamesCategory.id}`);
  }

  // 2. Adicionar categoria "Roupas" (ou usar "Moda e Beleza")
  const { data: modaCategory } = await supabase
    .from('classified_categories')
    .select('id, name, slug')
    .eq('slug', 'moda')
    .single();

  let roupasCategory = modaCategory;

  if (!modaCategory) {
    const { data: newCategory, error: roupasError } = await supabase
      .from('classified_categories')
      .insert({
        name: 'Moda e Acessórios',
        slug: 'moda',
        icon: '👗',
      })
      .select()
      .single();

    if (roupasError) {
      console.error('❌ Erro ao criar categoria Moda:', roupasError.message);
    } else {
      console.log(`✅ Categoria Moda criada: ${newCategory.id}`);
      roupasCategory = newCategory;
    }
  } else {
    console.log(`✅ Categoria Moda já existe: ${modaCategory.id}`);
  }

  // 3. Adicionar subcategorias
  if (gamesCategory) {
    const { error: subError } = await supabase
      .from('classified_subcategories')
      .insert([
        {
          name: 'Consoles',
          slug: 'consoles',
          category_id: gamesCategory.id,
        },
        {
          name: 'Jogos',
          slug: 'jogos',
          category_id: gamesCategory.id,
        },
        {
          name: 'Acessórios',
          slug: 'acessorios-games',
          category_id: gamesCategory.id,
        },
      ]);

    if (subError) {
      console.error('❌ Erro ao criar subcategorias de Games:', subError.message);
    } else {
      console.log('✅ Subcategorias de Games criadas');
    }
  }

  if (roupasCategory) {
    const { error: subError } = await supabase
      .from('classified_subcategories')
      .insert([
        {
          name: 'Roupas Femininas',
          slug: 'roupas-femininas',
          category_id: roupasCategory.id,
        },
        {
          name: 'Roupas Masculinas',
          slug: 'roupas-masculinas',
          category_id: roupasCategory.id,
        },
        {
          name: 'Calçados',
          slug: 'calcados',
          category_id: roupasCategory.id,
        },
        {
          name: 'Acessórios',
          slug: 'acessorios-moda',
          category_id: roupasCategory.id,
        },
      ]);

    if (subError) {
      console.error('❌ Erro ao criar subcategorias de Moda:', subError.message);
    } else {
      console.log('✅ Subcategorias de Moda criadas');
    }
  }

  // 4. Atualizar classificados sem category_id
  console.log('\n📦 Atualizando classificados...\n');

  // Buscar subcategorias criadas
  const { data: consolesSubcat } = await supabase
    .from('classified_subcategories')
    .select('id')
    .eq('slug', 'consoles')
    .single();

  const { data: calcadosSubcat } = await supabase
    .from('classified_subcategories')
    .select('id')
    .eq('slug', 'calcados')
    .single();

  const { data: roupasFemSubcat } = await supabase
    .from('classified_subcategories')
    .select('id')
    .eq('slug', 'roupas-femininas')
    .single();

  // Atualizar classificados de games
  if (gamesCategory && consolesSubcat) {
    const { error } = await supabase
      .from('classifieds')
      .update({
        category_id: gamesCategory.id,
        subcategory_id: consolesSubcat.id,
      })
      .eq('category', 'games');

    if (error) {
      console.error('❌ Erro ao atualizar classificados de games:', error.message);
    } else {
      console.log('✅ Classificados de games atualizados');
    }
  }

  // Atualizar classificados de roupas
  if (roupasCategory) {
    // Tênis → Calçados
    if (calcadosSubcat) {
      const { error } = await supabase
        .from('classifieds')
        .update({
          category_id: roupasCategory.id,
          subcategory_id: calcadosSubcat.id,
        })
        .ilike('title', '%tênis%');

      if (error) {
        console.error('❌ Erro ao atualizar tênis:', error.message);
      } else {
        console.log('✅ Tênis atualizado');
      }
    }

    // Vestido → Roupas Femininas
    if (roupasFemSubcat) {
      const { error } = await supabase
        .from('classifieds')
        .update({
          category_id: roupasCategory.id,
          subcategory_id: roupasFemSubcat.id,
        })
        .ilike('title', '%vestido%');

      if (error) {
        console.error('❌ Erro ao atualizar vestido:', error.message);
      } else {
        console.log('✅ Vestido atualizado');
      }
    }
  }

  console.log('\n🎉 Categorias e classificados atualizados!');
}

addMissingCategories();
