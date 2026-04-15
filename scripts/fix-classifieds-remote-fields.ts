/**
 * Script para corrigir campos faltantes nos classificados do banco REMOTO
 * - Gera public_id para cada classificado
 * - Vincula category_id e subcategory_id
 * 
 * Execute com: npx tsx scripts/fix-classifieds-remote-fields.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.remote
dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

console.log('✅ Conectando ao Supabase REMOTO:', supabaseUrl);
console.log('🔐 Usando service_role_key\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para gerar public_id (8 caracteres alfanuméricos)
function generatePublicId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para gerar slug a partir do título
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fixClassifiedsFields() {
  console.log('🔧 Iniciando correção de campos dos classificados...\n');

  // 1. Buscar todas as categorias e subcategorias
  console.log('📂 Buscando categorias...');
  const { data: categories, error: catError } = await supabase
    .from('classified_categories')
    .select('id, name, slug');

  if (catError || !categories) {
    console.error('❌ Erro ao buscar categorias:', catError);
    return;
  }

  const { data: subcategories, error: subError } = await supabase
    .from('classified_subcategories')
    .select('id, name, slug, category_id');

  if (subError || !subcategories) {
    console.error('❌ Erro ao buscar subcategorias:', subError);
    return;
  }

  console.log(`✅ ${categories.length} categorias e ${subcategories.length} subcategorias encontradas\n`);

  // 2. Buscar todos os classificados sem category_id ou subcategory_id
  console.log('🔍 Buscando classificados sem category_id ou subcategory_id...');
  const { data: classifieds, error: classError } = await supabase
    .from('classifieds')
    .select('id, title, category, public_id, slug, category_id, subcategory_id')
    .or('category_id.is.null,subcategory_id.is.null');

  if (classError) {
    console.error('❌ Erro ao buscar classificados:', classError);
    return;
  }

  if (!classifieds || classifieds.length === 0) {
    console.log('✅ Todos os classificados já possuem category_id e subcategory_id!');
    return;
  }

  console.log(`📦 Encontrados ${classifieds.length} classificados para atualizar\n`);

  // 3. Atualizar cada classificado
  let successCount = 0;
  let errorCount = 0;

  for (const classified of classifieds) {
    try {
      // Gerar public_id único se não existir
      let publicId = classified.public_id;
      if (!publicId) {
        publicId = generatePublicId();
        
        // Verificar se já existe
        let { data: existing } = await supabase
          .from('classifieds')
          .select('id')
          .eq('public_id', publicId)
          .single();

        while (existing) {
          publicId = generatePublicId();
          const check = await supabase
            .from('classifieds')
            .select('id')
            .eq('public_id', publicId)
            .single();
          existing = check.data;
        }
      }

      // Gerar slug se não existir
      const slug = classified.slug || slugify(classified.title);

      // Buscar category_id e subcategory_id baseado no nome da categoria
      const categoryName = classified.category?.toLowerCase() || '';
      const category = categories.find(c => 
        c.name.toLowerCase() === categoryName || 
        c.slug === categoryName
      );

      // Para subcategoria, usar uma padrão baseada na categoria
      const subcategory = category 
        ? subcategories.find(s => s.category_id === category.id)
        : null;

      // Atualizar o classificado
      const { error: updateError } = await supabase
        .from('classifieds')
        .update({
          public_id: publicId,
          slug: slug,
          category_id: category?.id || null,
          subcategory_id: subcategory?.id || null,
        })
        .eq('id', classified.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar "${classified.title}":`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ Atualizado: ${classified.title}`);
        console.log(`   🆔 public_id: ${publicId}`);
        console.log(`   🔗 slug: ${slug}`);
        if (category) console.log(`   📂 categoria: ${category.name} (${category.id})`);
        if (subcategory) console.log(`   📁 subcategoria: ${subcategory.name} (${subcategory.id})`);
        console.log('');
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar "${classified.title}":`, error);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Correção concluída!');
  console.log(`✅ Sucesso: ${successCount} classificados`);
  console.log(`❌ Erros: ${errorCount} classificados`);
  console.log('='.repeat(60));
}

// Executar
fixClassifiedsFields().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
