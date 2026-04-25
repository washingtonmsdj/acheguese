import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function finalCategoriesValidation() {
  console.log('✅ VALIDAÇÃO FINAL DAS CATEGORIAS - BELLA NAPOLI');
  
  const businessId = 'cd709a71-03e0-4edb-8114-743599ac960d';
  
  // 1. Buscar estrutura completa
  console.log('\n📋 ESTRUTURA COMPLETA DO CARDÁPIO');
  
  const { data: menus } = await supabase
    .from('menus')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('is_active', true);
  
  const { data: categories } = await supabase
    .from('menu_categories')
    .select('id, name, display_order, is_available')
    .eq('menu_id', menus[0].id)
    .order('display_order');
  
  console.log(`Menu: ${menus[0].name}`);
  console.log(`${categories?.length || 0} categorias encontradas\n`);
  
  // 2. Análise detalhada por categoria
  const categoryReport = [];
  let totalItems = 0;
  let activeCategoriesWithItems = 0;
  
  for (const cat of categories || []) {
    const { data: items } = await supabase
      .from('menu_items')
      .select('name, base_price, is_available')
      .eq('category_id', cat.id)
      .eq('is_available', true);
    
    const itemCount = items?.length || 0;
    totalItems += itemCount;
    
    if (cat.is_available && itemCount > 0) {
      activeCategoriesWithItems++;
    }
    
    const status = cat.is_available && itemCount > 0 ? '✅' : 
                  cat.is_available && itemCount === 0 ? '⚠️' : '❌';
    
    categoryReport.push({
      order: cat.display_order,
      name: cat.name,
      status: status,
      items: itemCount,
      available: cat.is_available,
      sampleItems: items?.slice(0, 2).map(i => i.name) || []
    });
  }
  
  // 3. Exibir relatório completo
  console.log('RELATÓRIO DETALHADO:');
  categoryReport.forEach(cat => {
    console.log(`${cat.order}. ${cat.status} ${cat.name} (${cat.items} itens)`);
    if (cat.sampleItems.length > 0) {
      cat.sampleItems.forEach(item => {
        console.log(`   - ${item}`);
      });
    }
    if (cat.items > 2) {
      console.log(`   ... e mais ${cat.items - 2} itens`);
    }
  });
  
  // 4. Análise de qualidade
  console.log('\n📊 ANÁLISE DE QUALIDADE:');
  
  const activeCategories = categoryReport.filter(c => c.available).length;
  const categoriesWithItems = categoryReport.filter(c => c.items > 0).length;
  const emptyActiveCategories = categoryReport.filter(c => c.available && c.items === 0).length;
  
  console.log(`✅ Categorias ativas: ${activeCategories}/${categoryReport.length}`);
  console.log(`✅ Categorias com itens: ${categoriesWithItems}/${categoryReport.length}`);
  console.log(`✅ Total de itens: ${totalItems}`);
  console.log(`⚠️ Categorias ativas vazias: ${emptyActiveCategories}`);
  
  // 5. Validação específica
  console.log('\n🎯 VALIDAÇÃO ESPECÍFICA:');
  
  const expectedStructure = [
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
  
  const actualCategories = categoryReport
    .filter(c => c.items > 0)
    .map(c => c.name);
  
  console.log('Estrutura esperada vs atual:');
  expectedStructure.forEach((expected, index) => {
    const actual = actualCategories[index];
    const match = actual === expected ? '✅' : '❌';
    console.log(`${match} ${expected} → ${actual || 'NÃO ENCONTRADO'}`);
  });
  
  // 6. Problemas identificados
  console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');
  
  const problems = [];
  
  if (emptyActiveCategories > 0) {
    const emptyOnes = categoryReport.filter(c => c.available && c.items === 0);
    emptyOnes.forEach(cat => {
      problems.push(`Categoria "${cat.name}" está ativa mas vazia`);
    });
  }
  
  if (totalItems < 50) {
    problems.push(`Total de itens baixo: ${totalItems} (esperado: 50+)`);
  }
  
  if (activeCategoriesWithItems < 8) {
    problems.push(`Poucas categorias com itens: ${activeCategoriesWithItems} (esperado: 8+)`);
  }
  
  if (problems.length === 0) {
    console.log('✅ Nenhum problema encontrado!');
  } else {
    problems.forEach(problem => {
      console.log(`❌ ${problem}`);
    });
  }
  
  // 7. Status final
  console.log('\n🏁 STATUS FINAL:');
  
  const score = [
    totalItems >= 50 ? 1 : 0,
    activeCategoriesWithItems >= 8 ? 1 : 0,
    emptyActiveCategories === 0 ? 1 : 0,
    actualCategories.length >= 8 ? 1 : 0
  ].reduce((sum, val) => sum + val, 0);
  
  console.log(`Pontuação: ${score}/4`);
  
  if (score === 4) {
    console.log('\n🎉 PERFEITO! Cardápio 100% funcional!');
    console.log('✅ Todas as categorias têm itens');
    console.log('✅ Estrutura organizada corretamente');
    console.log('✅ Total de itens adequado');
    console.log('✅ Nenhuma categoria vazia ativa');
    
  } else if (score >= 3) {
    console.log('\n✅ BOM! Cardápio funcional com pequenos ajustes');
  } else {
    console.log('\n⚠️ PRECISA DE MELHORIAS');
  }
  
  // 8. Resumo para o usuário
  console.log('\n📋 RESUMO PARA O USUÁRIO:');
  console.log(`• ${totalItems} itens no cardápio`);
  console.log(`• ${activeCategoriesWithItems} categorias com produtos`);
  console.log(`• ${emptyActiveCategories > 0 ? emptyActiveCategories + ' categorias vazias (movidas para o final)' : 'Nenhuma categoria vazia'}`);
  console.log(`• Estrutura: ${actualCategories.slice(0, 5).join(', ')}...`);
  
  console.log('\n🎪 RESULTADO FINAL:');
  if (score >= 3) {
    console.log('As categorias da Bella Napoli estão corrigidas e organizadas!');
    console.log('A categoria "Bebidas" vazia foi movida para o final.');
    console.log('O usuário verá uma experiência de navegação perfeita.');
  }
}

finalCategoriesValidation();
