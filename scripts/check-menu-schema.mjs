import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkMenuSchema() {
  console.log('🔍 Verificando schema das tabelas de menu...');
  
  // 1. Verificar colunas de menu_categories
  const { data: categoriesColumns, error: catError } = await supabase
    .from('menu_categories')
    .select('*')
    .limit(1);
    
  if (catError) {
    console.log('❌ Erro menu_categories:', catError.message);
  } else {
    console.log('✅ Colunas menu_categories:', Object.keys(categoriesColumns?.[0] || {}));
  }
  
  // 2. Verificar colunas de menu_items
  const { data: itemsColumns, error: itemsError } = await supabase
    .from('menu_items')
    .select('*')
    .limit(1);
    
  if (itemsError) {
    console.log('❌ Erro menu_items:', itemsError.message);
  } else {
    console.log('✅ Colunas menu_items:', Object.keys(itemsColumns?.[0] || {}));
  }
  
  // 3. Buscar categorias da Bella Napoli sem is_active
  const { data: business, error: bizError } = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (!bizError && business) {
    const { data: menus } = await supabase
      .from('menus')
      .select('id')
      .eq('business_id', business.id);
      
    if (menus && menus.length > 0) {
      const { data: categories, error: catError2 } = await supabase
        .from('menu_categories')
        .select('id, name, menu_id')
        .in('menu_id', menus.map(m => m.id));
        
      if (catError2) {
        console.log('❌ Erro categorias:', catError2.message);
      } else {
        console.log('✅ Categorias da Bella:', categories?.length);
        categories?.forEach(c => console.log(`   - ${c.name}`));
        
        // 4. Buscar itens
        if (categories && categories.length > 0) {
          const { data: items, error: itemsError2 } = await supabase
            .from('menu_items')
            .select('id, name, price, category_id')
            .in('category_id', categories.map(c => c.id))
            .eq('is_available', true);
            
          if (itemsError2) {
            console.log('❌ Erro itens:', itemsError2.message);
          } else {
            console.log('✅ Itens disponíveis:', items?.length);
            items?.forEach(i => console.log(`   - ${i.name} (R$ ${i.price})`));
          }
        }
      }
    }
  }
}

checkMenuSchema();
