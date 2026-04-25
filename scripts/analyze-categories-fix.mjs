import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function analyzeCategoriesFix() {
  console.log('🔍 ANALISANDO E CORRIGINDO CATEGORIAS DO CARDÁPIO...');
  
  const businessId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  
  // 1. Buscar menu e categorias
  console.log('\n1️⃣ Buscando estrutura do cardápio...');
  
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('is_active', true);
  
  if (!menus || menus.length === 0) {
    console.log('❌ Nenhum menu encontrado');
    return;
  }
  
  console.log(`✅ Menu: ${menus[0].name}`);
  
  const { data: categories, error: catError } = await supabase
    .from('menu_categories')
    .select('id, name, display_order, is_available')
    .eq('menu_id', menus[0].id)
    .order('display_order');
  
  if (catError) {
    console.log('❌ Erro ao buscar categorias:', catError.message);
    return;
  }
  
  console.log(`✅ ${categories?.length || 0} categorias encontradas`);
  
  // 2. Analisar itens por categoria
  console.log('\n2️⃣ Analisando itens por categoria...');
  
  const categoryAnalysis = [];
  
  for (const category of categories || []) {
    const { data: items, error: itemsError } = await supabase
      .from('menu_items')
      .select('id, name, base_price, is_available')
      .eq('category_id', category.id)
      .eq('is_available', true);
    
    const itemCount = items?.length || 0;
    const availableItems = items?.filter(item => item.is_available) || [];
    
    categoryAnalysis.push({
      categoryId: category.id,
      categoryName: category.name,
      displayOrder: category.display_order,
      isAvailable: category.is_available,
      totalItems: itemCount,
      availableItems: availableItems.length,
      items: availableItems
    });
    
    console.log(`${category.isAvailable ? '✅' : '❌'} ${category.name} (${itemCount} itens)`);
    
    if (itemCount === 0 && category.isAvailable) {
      console.log(`   ⚠️ Categoria ativa mas sem itens!`);
    } else if (itemCount > 0) {
      availableItems.slice(0, 3).forEach(item => {
        console.log(`   - ${item.name} (R$ ${item.base_price})`);
      });
      if (availableItems.length > 3) {
        console.log(`   ... e mais ${availableItems.length - 3} itens`);
      }
    }
  }
  
  // 3. Identificar o problema específico
  console.log('\n3️⃣ Identificando problemas...');
  
  const problems = [];
  
  categoryAnalysis.forEach(cat => {
    if (cat.isAvailable && cat.availableItems === 0) {
      problems.push({
        type: 'empty_category',
        category: cat.categoryName,
        categoryId: cat.categoryId,
        displayOrder: cat.displayOrder
      });
    }
    
    // Verificar se há categorias com nomes similares que poderiam ser consolidadas
    if (cat.categoryName.toLowerCase().includes('bebida')) {
      console.log(`🔍 Categoria de bebidas encontrada: ${cat.categoryName} (${cat.availableItems} itens)`);
    }
  });
  
  console.log(`\n📊 Problemas encontrados: ${problems.length}`);
  problems.forEach(problem => {
    console.log(`   - ${problem.category}: ${problem.availableItems} itens (ordem: ${problem.displayOrder})`);
  });
  
  // 4. Verificar se há itens em categorias erradas
  console.log('\n4️⃣ Verificando distribuição de bebidas...');
  
  // Buscar todos os itens que poderiam ser bebidas
  const drinkKeywords = ['refrigerante', 'suco', 'água', 'cerveja', 'vinho', 'coca', 'guaraná', 'fanta', 'sprite', 'heineken', 'budweiser'];
  
  const { data: allItems } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      base_price,
      category_id,
      category:menu_categories(name, display_order)
    `)
    .in('category_id', categories.map(c => c.id))
    .eq('is_available', true);
  
  const misplacedDrinks = [];
  const correctlyPlacedDrinks = [];
  
  allItems?.forEach(item => {
    const isDrink = drinkKeywords.some(keyword => 
      item.name.toLowerCase().includes(keyword)
    );
    
    if (isDrink) {
      if (item.category?.name.toLowerCase().includes('bebida') || 
          item.category?.name.toLowerCase().includes('refrigerante') ||
          item.category?.name.toLowerCase().includes('suco') ||
          item.category?.name.toLowerCase().includes('cerveja') ||
          item.category?.name.toLowerCase().includes('vinho')) {
        correctlyPlacedDrinks.push(item);
      } else {
        misplacedDrinks.push(item);
      }
    }
  });
  
  console.log(`✅ Bebidas bem posicionadas: ${correctlyPlacedDrinks.length}`);
  console.log(`⚠️ Bebidas mal posicionadas: ${misplacedDrinks.length}`);
  
  if (misplacedDrinks.length > 0) {
    console.log('Bebidas que precisam ser movidas:');
    misplacedDrinks.forEach(item => {
      console.log(`   - ${item.name} (está em: ${item.category?.name})`);
    });
  }
  
  // 5. Corrigir os problemas
  console.log('\n5️⃣ Corrigindo problemas...');
  
  // Encontrar a categoria "Bebidas" que está vazia
  const emptyBebidasCategory = categoryAnalysis.find(cat => 
    cat.categoryName === 'Bebidas' && cat.availableItems === 0
  );
  
  if (emptyBebidasCategory && misplacedDrinks.length > 0) {
    console.log(`🔧 Movendo bebidas para categoria "Bebidas"...`);
    
    let movedCount = 0;
    for (const drink of misplacedDrinks) {
      const { error: moveError } = await supabase
        .from('menu_items')
        .update({ category_id: emptyBebidasCategory.categoryId })
        .eq('id', drink.id);
      
      if (moveError) {
        console.log(`❌ Erro ao mover ${drink.name}:`, moveError.message);
      } else {
        console.log(`✅ ${drink.name} movido para Bebidas`);
        movedCount++;
      }
    }
    
    console.log(`📊 Total movido: ${movedCount} bebidas`);
  } else {
    console.log('ℹ️ Nenhuma correção necessária ou possível');
  }
  
  // 6. Verificação final
  console.log('\n6️⃣ Verificação final...');
  
  // Recarregar dados após correção
  const { data: finalCategories } = await supabase
    .from('menu_categories')
    .select('id, name')
    .eq('menu_id', menus[0].id)
    .eq('is_available', true)
    .order('display_order');
  
  const finalAnalysis = [];
  
  for (const cat of finalCategories || []) {
    const { data: items } = await supabase
      .from('menu_items')
      .select('id')
      .eq('category_id', cat.id)
      .eq('is_available', true);
    
    finalAnalysis.push({
      name: cat.name,
      count: items?.length || 0
    });
  }
  
  console.log('📋 Distribuição final:');
  finalAnalysis.forEach(cat => {
    const status = cat.count > 0 ? '✅' : '❌';
    console.log(`${status} ${cat.name}: ${cat.count} itens`);
  });
  
  const totalFinal = finalAnalysis.reduce((sum, cat) => sum + cat.count, 0);
  const emptyCategories = finalAnalysis.filter(cat => cat.count === 0).length;
  
  console.log(`\n📊 Total final: ${totalFinal} itens`);
  console.log(`📊 Categorias vazias: ${emptyCategories}`);
  
  if (emptyCategories === 0) {
    console.log('\n🎉 SUCESSO! Todas as categorias agora têm itens!');
  } else {
    console.log(`\n⚠️ Ainda ${emptyCategories} categorias vazias`);
  }
}

analyzeCategoriesFix();
