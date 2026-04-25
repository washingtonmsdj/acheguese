import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkMenuItems() {
  console.log('🔍 Verificando itens do menu da Bella Napoli...');
  
  // 1. Business ID
  const { data: business, error: bizError } = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (bizError || !business) {
    console.log('❌ Business não encontrado');
    return;
  }
  
  console.log('✅ Business ID:', business.id);
  
  // 2. Verificar menus
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select('id, name, is_active')
    .eq('business_id', business.id);
    
  if (menusError) {
    console.log('❌ Erro menus:', menusError.message);
    return;
  }
  
  console.log(`✅ Menus: ${menus?.length || 0}`);
  menus?.forEach(m => console.log(`   - ${m.name} (ativo: ${m.is_active})`));
  
  // 3. Verificar categorias
  if (menus && menus.length > 0) {
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
    
    console.log(`✅ Categorias ativas: ${categories?.length || 0}`);
    categories?.forEach(c => console.log(`   - ${c.name} (ordem: ${c.display_order})`));
    
    // 4. Verificar itens por categoria
    if (categories && categories.length > 0) {
      let totalItems = 0;
      
      for (const category of categories) {
        const { data: items, error: itemsError } = await supabase
          .from('menu_items')
          .select('id, name, base_price, is_available, display_order')
          .eq('category_id', category.id)
          .eq('is_available', true)
          .order('display_order');
          
        if (itemsError) {
          console.log(`❌ Erro itens da categoria ${category.name}:`, itemsError.message);
        } else {
          console.log(`\n📋 ${category.name} (${items?.length || 0} itens):`);
          items?.forEach(item => {
            console.log(`   - ${item.name} (R$ ${item.base_price})`);
            totalItems++;
          });
        }
      }
      
      console.log(`\n📊 Total de itens: ${totalItems}`);
      
      // 5. Comparar com o esperado do seed
      console.log('\n🎯 Análise:');
      if (totalItems === 4) {
        console.log('⚠️ Apenas 4 itens encontrados - o seed não foi aplicado completamente');
        console.log('   Esperado: 56+ itens (pizzas, bebidas, sobremesas)');
      } else if (totalItems >= 50) {
        console.log('✅ Quantidade de itens parece correta');
      } else {
        console.log(`⚠️ Quantidade inesperada: ${totalItems} itens`);
      }
      
      // 6. Verificar se existe o item "Pizza Montável"
      console.log('\n🍕 Procurando "Pizza Montável"...');
      const { data: buildablePizza } = await supabase
        .from('menu_items')
        .select('id, name, base_price, category_id')
        .in('category_id', categories.map(c => c.id))
        .ilike('name', '%pizza%mont%');
        
      if (buildablePizza && buildablePizza.length > 0) {
        console.log('✅ Pizza Montável encontrada:');
        buildablePizza.forEach(p => console.log(`   - ${p.name} (R$ ${p.base_price})`));
      } else {
        console.log('❌ Pizza Montável NÃO encontrada');
        console.log('   Isso pode explicar por que a funcionalidade de montar pizza não aparece');
      }
      
      // 7. Verificar categorias que deveriam existir
      console.log('\n📂 Verificando categorias esperadas...');
      const expectedCategories = [
        'Pizzas Tradicionais',
        'Pizzas Especiais', 
        'Pizzas Premium',
        'Pizzas Doces',
        'Refrigerantes',
        'Sucos e Águas',
        'Cervejas',
        'Vinhos',
        'Sobremesas'
      ];
      
      const existingCategories = categories?.map(c => c.name) || [];
      const missingCategories = expectedCategories.filter(cat => !existingCategories.includes(cat));
      
      if (missingCategories.length > 0) {
        console.log(`❌ Categorias faltantes (${missingCategories.length}):`);
        missingCategories.forEach(cat => console.log(`   - ${cat}`));
      } else {
        console.log('✅ Todas as categorias esperadas existem');
      }
    }
  }
}

checkMenuItems();
