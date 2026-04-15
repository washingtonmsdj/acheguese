/**
 * Script para verificar categorias no banco REMOTO
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  console.log('📂 Categorias disponíveis:\n');
  
  const { data: categories } = await supabase
    .from('classified_categories')
    .select('id, name, slug')
    .order('name');

  categories?.forEach(cat => {
    console.log(`  - ${cat.name} (${cat.slug})`);
  });

  console.log('\n📁 Subcategorias disponíveis:\n');
  
  const { data: subcategories } = await supabase
    .from('classified_subcategories')
    .select('id, name, slug, category_id, classified_categories(name)')
    .order('name');

  subcategories?.forEach(sub => {
    const catName = (sub as any).classified_categories?.name || 'N/A';
    console.log(`  - ${sub.name} (${sub.slug}) → ${catName}`);
  });

  console.log('\n📦 Classificados sem category_id:\n');
  
  const { data: withoutCat } = await supabase
    .from('classifieds')
    .select('id, title, category')
    .is('category_id', null);

  withoutCat?.forEach(c => {
    console.log(`  - ${c.title} (categoria: "${c.category}")`);
  });
}

checkCategories();
