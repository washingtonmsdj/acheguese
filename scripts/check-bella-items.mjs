import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkBellaItems() {
  console.log('🔍 Verificando itens da Bella Napoli com schema correto...');
  
  // Business ID
  const { data: business, error: bizError } = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (bizError || !business) {
    console.log('❌ Business não encontrado');
    return;
  }
  
  // Menus
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name')
    .eq('business_id', business.id);
    
  if (!menus || menus.length === 0) {
    console.log('❌ Nenhum menu encontrado');
    return;
  }
  
  console.log('✅ Menus:', menus.length);
  menus.forEach(m => console.log(`   - ${m.name}`));
  
  // Categorias
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('id, name, is_available, display_order')
    .in('menu_id', menus.map(m => m.id))
    .eq('is_available', true)
    .order('display_order');
    
  if (catError) {
    console.log('❌ Erro categorias:', catError.message);
    return;
  }
  
  console.log('✅ Categorias ativas:', categories?.length);
  categories?.forEach(c => console.log(`   - ${c.name} (ordem: ${c.display_order})`));
  
  // Itens
  if (categories && categories.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name, base_price, is_available, display_order, category_id')
      .in('category_id', categories.map(c => c.id))
      .eq('is_available', true)
      .order('display_order');
      
    if (itemsError) {
      console.log('❌ Erro itens:', itemsError.message);
      return;
    }
    
    console.log('✅ Itens disponíveis:', items?.length);
    items?.forEach(i => console.log(`   - ${i.name} (R$ ${i.base_price})`));
    
    // Agrupar por categoria
    const itemsByCategory = {};
    items?.forEach(item => {
      const category = categories.find(c => c.id === item.category_id);
      const catName = category?.name || 'Sem categoria';
      if (!itemsByCategory[catName]) itemsByCategory[catName] = [];
      itemsByCategory[catName].push(item);
    });
    
    console.log('\n📋 Itens por categoria:');
    Object.entries(itemsByCategory).forEach(([catName, catItems]) => {
      console.log(`\n🍕 ${catName} (${catItems.length} itens):`);
      catItems.forEach(item => {
        console.log(`   - ${item.name} - R$ ${item.base_price}`);
      });
    });
  }
}

checkBellaItems();
