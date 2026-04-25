import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkBellaNapoliData() {
  console.log('🔍 Verificando dados da Bella Napoli...');
  
  // 1. Business principal
  const { data: business, error: bizError } = await supabase
    .from('business_data')
    .select('id, business_name, slug, status, category')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (bizError) {
    console.log('❌ Erro business:', bizError.message);
    return;
  }
  
  console.log('✅ Business:', business);
  
  // 2. Gastronomy profile
  const { data: gastroProfile, error: gastroError } = await supabase
    .from('gastronomy_profiles')
    .select('*')
    .eq('business_id', business.id)
    .single();
    
  if (gastroError) {
    console.log('❌ Erro gastronomy profile:', gastroError.message);
  } else {
    console.log('✅ Gastronomy Profile:', gastroProfile);
  }
  
  // 3. Menus
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select('id, name, is_active, business_id')
    .eq('business_id', business.id);
    
  if (menusError) {
    console.log('❌ Erro menus:', menusError.message);
  } else {
    console.log('✅ Menus:', menus?.length, 'menus encontrados');
    menus?.forEach(m => console.log(`   - ${m.name} (ativo: ${m.is_active})`));
  }
  
  // 4. Categorias
  if (menus && menus.length > 0) {
    const { data: categories, error: catError } = await supabase
      .from('menu_categories')
      .select('id, name, is_active, menu_id')
      .in('menu_id', menus.map(m => m.id));
      
    if (catError) {
      console.log('❌ Erro categorias:', catError.message);
    } else {
      console.log('✅ Categorias:', categories?.length, 'categorias encontradas');
      categories?.forEach(c => console.log(`   - ${c.name} (ativo: ${c.is_active})`));
    }
    
    // 5. Itens
    if (categories && categories.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, price, is_available, category_id')
        .in('category_id', categories.map(c => c.id))
        .eq('is_available', true);
        
      if (itemsError) {
        console.log('❌ Erro itens:', itemsError.message);
      } else {
        console.log('✅ Itens disponíveis:', items?.length, 'itens encontrados');
        items?.forEach(i => console.log(`   - ${i.name} (R$ ${i.price})`));
      }
    }
  }
}

checkBellaNapoliData();
