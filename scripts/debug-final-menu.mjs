import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function debugFinalMenu() {
  console.log('🔍 Debugando menu final da Bella Napoli...');
  
  // 1. Business e Menu
  const { data: business } = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('business_id', business.id);
    
  console.log('✅ Business ID:', business.id);
  console.log('✅ Menu ID:', menus[0].id);
  
  // 2. Verificar categorias
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id, name, is_available, display_order')
    .in('menu_id', menus.map(m => m.id))
    .order('display_order');
    
  console.log(`\n📂 Categorias (${categories?.length || 0}):`);
  categories?.forEach(cat => {
    console.log(`   - ${cat.name} (ID: ${cat.id}, ativa: ${cat.is_available})`);
  });
  
  // 3. Verificar itens por categoria
  let totalItems = 0;
  
  for (const category of categories || []) {
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name, base_price, is_available')
      .eq('category_id', category.id)
      .eq('is_available', true);
      
    if (itemsError) {
      console.log(`❌ Erro na categoria ${category.name}:`, itemsError.message);
    } else {
      console.log(`\n📋 ${category.name} (${items?.length || 0} itens):`);
      items?.forEach(item => {
        console.log(`   - ${item.name} (R$ ${item.base_price})`);
        totalItems++;
      });
      
      if (!items || items.length === 0) {
        // Verificar se há itens indisponíveis
        const { data: unavailableItems } = await supabase
          .from('menu_items')
          .select('name, is_available')
          .eq('category_id', category.id);
          
        if (unavailableItems && unavailableItems.length > 0) {
          console.log(`   ⚠️ ${unavailableItems.length} itens existem mas estão indisponíveis:`);
          unavailableItems.forEach(item => {
            console.log(`     - ${item.name} (disponível: ${item.is_available})`);
          });
        }
      }
    }
  }
  
  console.log(`\n📊 Total de itens disponíveis: ${totalItems}`);
  
  // 4. Verificar todos os itens da Bella (sem filtro de disponibilidade)
  console.log('\n🔍 Verificando todos os itens (incluindo indisponíveis)...');
  const { data: allItems } = await supabase
    .from('menu_items')
    .select('name, is_available, category:menu_categories(name)')
    .in('category_id', categories?.map(c => c.id) || []);
    
  console.log(`Total de itens no banco: ${allItems?.length || 0}`);
  
  if (allItems && allItems.length > 0) {
    console.log('Primeiros 10 itens:');
    allItems.slice(0, 10).forEach(item => {
      console.log(`   - ${item.name} (${item.category?.name}) - disponível: ${item.is_available}`);
    });
  }
  
  // 5. Ativar itens que possam estar indisponíveis
  if (allItems && allItems.some(item => !item.is_available)) {
    console.log('\n🔧 Ativando itens indisponíveis...');
    
    const unavailableIds = allItems
      .filter(item => !item.is_available)
      .map(item => item.id);
    
    if (unavailableIds.length > 0) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({ is_available: true })
        .in('id', unavailableIds);
        
      if (updateError) {
        console.log('❌ Erro ao ativar itens:', updateError.message);
      } else {
        console.log(`✅ ${unavailableIds.length} itens ativados`);
      }
    }
  }
  
  // 6. Verificação final
  console.log('\n🎯 Verificação final...');
  const { data: finalItems } = await supabase
    .from('menu_items')
    .select('name')
    .in('category_id', categories?.map(c => c.id) || [])
    .eq('is_available', true);
    
  console.log(`✅ Itens disponíveis finais: ${finalItems?.length || 0}`);
  
  if (finalItems && finalItems.length >= 50) {
    console.log('\n🎉 SUCESSO! Cardápio completo!');
    console.log('   A Bella Napoli agora deve aparecer com todos os produtos no site.');
  } else {
    console.log(`\n⚠️ Ainda faltam itens (${finalItems?.length || 0}/56 esperados)`);
  }
}

debugFinalMenu();
