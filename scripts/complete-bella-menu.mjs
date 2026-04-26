import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function completeBellaMenu() {
  console.log('🍕 Completando cardápio da Bella Napoli...');
  
  // 1. Buscar dados existentes
  const { data: business, error: bizError } = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (bizError || !business) {
    console.log('❌ Business não encontrado');
    return;
  }
  
  const businessId = business.id;
  console.log('✅ Business ID:', businessId);
  
  // 2. Buscar menu existente
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('business_id', businessId);
    
  if (!menus || menus.length === 0) {
    console.log('❌ Menu não encontrado');
    return;
  }
  
  const menuId = menus[0].id;
  console.log('✅ Menu ID:', menuId);
  
  // 3. Criar categorias faltantes
  console.log('\n📂 Criando categorias faltantes...');
  
  const existingCategories = await supabase
    .from('menu_categories')
    .select('name')
    .in('menu_id', [menuId])
    .then(({ data }) => data?.map(c => c.name) || []);
  
  const newCategories = [
    { name: 'Pizzas Premium', display_order: 2 },
    { name: 'Pizzas Doces', display_order: 3 },
    { name: 'Refrigerantes', display_order: 4 },
    { name: 'Sucos e Águas', display_order: 5 },
    { name: 'Cervejas', display_order: 6 },
    { name: 'Vinhos', display_order: 7 },
    { name: 'Sobremesas', display_order: 8 }
  ].filter(cat => !existingCategories.includes(cat.name));
  
  const categoryMap = {};
  
  for (const cat of newCategories) {
    const categoryId = generateUUID();
    const { error } = await supabase
      .from('menu_categories')
      .insert({
        id: categoryId,
        menu_id: menuId,
        name: cat.name,
        description: `Itens da categoria ${cat.name}`,
        display_order: cat.display_order,
        is_available: true
      });
    
    console.log(`   - ${cat.name}: ${error ? '❌' : '✅'}`);
    if (!error) {
      categoryMap[cat.name] = categoryId;
    }
  }
  
  // 4. Buscar categorias existentes para mapeamento
  const { data: allCategories } = await supabase
    .from('menu_categories')
    .select('id, name')
    .in('menu_id', [menuId])
    .order('display_order');
    
  allCategories?.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });
  
  // 5. Adicionar itens às categorias existentes
  console.log('\n🍕 Adicionando pizzas às categorias existentes...');
  
  // Pizzas Tradicionais - adicionar mais itens
  const traditionalPizzas = [
    { name: 'Portuguesa', price: 52.00, description: 'Molho de tomate, mussarela, presunto, ovo, ervilha e cebola' },
    { name: 'Frango com Catupiry', price: 50.00, description: 'Molho de tomate, mussarela, frango desfiado e catupiry' },
    { name: 'Atum', price: 49.00, description: 'Molho de tomate, mussarela, atum, cebola e azeitona' },
    { name: 'Bacon', price: 54.00, description: 'Molho de tomate, mussarela, bacon e cebola' },
    { name: 'Palmito', price: 47.00, description: 'Molho de tomate, mussarela, palmito e azeitona' },
    { name: 'Milho', price: 48.00, description: 'Molho de tomate, mussarela, milho e bacon' }
  ];
  
  for (const pizza of traditionalPizzas) {
    const { error } = await supabase
      .from('menu_items')
      .insert({
        id: generateUUID(),
        category_id: categoryMap['Pizzas Tradicionais'],
        name: pizza.name,
        description: pizza.description,
        base_price: pizza.price,
        is_available: true,
        display_order: traditionalPizzas.indexOf(pizza) + 2, // depois dos 2 existentes
        is_vegetarian: pizza.name.includes('Palmito') || pizza.name.includes('Milho'),
        is_vegan: false,
        is_spicy: false,
        ingredients: ['tomate', 'mussarela'],
        allergens: []
      });
    
    console.log(`   - ${pizza.name}: ${error ? '❌' : '✅'}`);
  }
  
  // Pizzas Especiais - adicionar mais itens
  const specialPizzas = [
    { name: 'Pepperoni', price: 53.00, description: 'Molho de tomate, mussarela e pepperoni' },
    { name: 'Escarola', price: 46.00, description: 'Molho de tomate, mussarela, escarola refogada e bacon' },
    { name: 'Lombo Canadense', price: 56.00, description: 'Molho de tomate, mussarela, lombo canadense e abacaxi' }
  ];
  
  for (const pizza of specialPizzas) {
    const { error } = await supabase
      .from('menu_items')
      .insert({
        id: generateUUID(),
        category_id: categoryMap['Pizzas Especiais'],
        name: pizza.name,
        description: pizza.description,
        base_price: pizza.price,
        is_available: true,
        display_order: specialPizzas.indexOf(pizza) + 2, // depois dos 2 existentes
        is_vegetarian: false,
        is_vegan: false,
        is_spicy: pizza.name.includes('Pepperoni'),
        ingredients: ['tomate', 'mussarela'],
        allergens: []
      });
    
    console.log(`   - ${pizza.name}: ${error ? '❌' : '✅'}`);
  }
  
  // 6. Adicionar Pizzas Premium
  if (categoryMap['Pizzas Premium']) {
    console.log('\n👑 Adicionando Pizzas Premium...');
    const premiumPizzas = [
      { name: 'Pizza Trufada', price: 89.00, description: 'Molho especial, mussarela de búfala, cogumelos trufados e rúcula' },
      { name: 'Carpaccio', price: 85.00, description: 'Molho de azeite, carpaccio de carne, parmesão e rúcula' },
      { name: 'Salmão Defumado', price: 87.00, description: 'Molho cream cheese, mussarela, salmão defumado e capim limão' },
      { name: 'Pato com Laranja', price: 92.00, description: 'Molho de laranja, mussarela, pato desfiado e cebola roxa' }
    ];
    
    for (const pizza of premiumPizzas) {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          id: generateUUID(),
          category_id: categoryMap['Pizzas Premium'],
          name: pizza.name,
          description: pizza.description,
          base_price: pizza.price,
          is_available: true,
          display_order: premiumPizzas.indexOf(pizza),
          is_vegetarian: false,
          is_vegan: false,
          is_spicy: false,
          ingredients: [],
          allergens: []
        });
      
      console.log(`   - ${pizza.name}: ${error ? '❌' : '✅'}`);
    }
  }
  
  // 7. Adicionar Pizzas Doces
  if (categoryMap['Pizzas Doces']) {
    console.log('\n🍪 Adicionando Pizzas Doces...');
    const sweetPizzas = [
      { name: 'Chocolate', price: 58.00, description: 'Chocolate meio amargo, morango e chantilly' },
      { name: 'Prestígio', price: 60.00, description: 'Chocolate, coco ralado e calda de caramelo' },
      { name: 'Banana com Canela', price: 52.00, description: 'Banana, canela e açúcar mascavo' },
      { name: 'Romeu e Julieta', price: 50.00, description: 'Goiabada e queijo minas' },
      { name: 'Nutella com Morango', price: 62.00, description: 'Nutella, morangos frescos e raspas de chocolate' },
      { name: 'Sensação', price: 64.00, description: 'Chocolate branco, morango e leite ninho' }
    ];
    
    for (const pizza of sweetPizzas) {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          id: generateUUID(),
          category_id: categoryMap['Pizzas Doces'],
          name: pizza.name,
          description: pizza.description,
          base_price: pizza.price,
          is_available: true,
          display_order: sweetPizzas.indexOf(pizza),
          is_vegetarian: true,
          is_vegan: false,
          is_spicy: false,
          ingredients: [],
          allergens: ['lactose']
        });
      
      console.log(`   - ${pizza.name}: ${error ? '❌' : '✅'}`);
    }
  }
  
  // 8. Adicionar Bebidas
  const drinks = [
    // Refrigerantes
    { category: 'Refrigerantes', items: [
      { name: 'Coca-Cola 350ml', price: 8.00 },
      { name: 'Coca-Cola 600ml', price: 12.00 },
      { name: 'Guaraná 350ml', price: 7.00 },
      { name: 'Guaraná 600ml', price: 10.00 },
      { name: 'Fanta Laranja 350ml', price: 7.00 },
      { name: 'Fanta Uva 350ml', price: 7.00 },
      { name: 'Sprite 350ml', price: 7.00 },
      { name: 'Schweppes 350ml', price: 8.00 }
    ]},
    // Sucos e Águas
    { category: 'Sucos e Águas', items: [
      { name: 'Suco de Laranja 500ml', price: 12.00 },
      { name: 'Suco de Limão 500ml', price: 12.00 },
      { name: 'Suco de Maracujá 500ml', price: 14.00 },
      { name: 'Suco de Morango 500ml', price: 15.00 },
      { name: 'Água Mineral 500ml', price: 5.00 },
      { name: 'Água com Gás 500ml', price: 6.00 },
      { name: 'Água de Coco 300ml', price: 8.00 }
    ]},
    // Cervejas
    { category: 'Cervejas', items: [
      { name: 'Brahma 600ml', price: 15.00 },
      { name: 'Skol 600ml', price: 15.00 },
      { name: 'Antarctica 600ml', price: 15.00 },
      { name: 'Heineken 330ml', price: 18.00 },
      { name: 'Budweiser 330ml', price: 17.00 },
      { name: 'Stella Artois 330ml', price: 19.00 }
    ]},
    // Vinhos
    { category: 'Vinhos', items: [
      { name: 'Vinho Tinto Seco 750ml', price: 65.00 },
      { name: 'Vinho Branco Seco 750ml', price: 60.00 },
      { name: 'Vinho Rosé 750ml', price: 58.00 },
      { name: 'Espumante 750ml', price: 85.00 }
    ]}
  ];
  
  for (const drinkCategory of drinks) {
    if (categoryMap[drinkCategory.category]) {
      console.log(`\n🥤 Adicionando ${drinkCategory.category}...`);
      
      for (const drink of drinkCategory.items) {
        const { error } = await supabase
          .from('menu_items')
          .insert({
            id: generateUUID(),
            category_id: categoryMap[drinkCategory.category],
            name: drink.name,
            description: null,
            base_price: drink.price,
            is_available: true,
            display_order: drinkCategory.items.indexOf(drink),
            is_vegetarian: true,
            is_vegan: true,
            is_spicy: false,
            ingredients: [],
            allergens: []
          });
        
        console.log(`   - ${drink.name}: ${error ? '❌' : '✅'}`);
      }
    }
  }
  
  // 9. Adicionar Sobremesas
  if (categoryMap['Sobremesas']) {
    console.log('\n🍰 Adicionando Sobremesas...');
    const desserts = [
      { name: 'Tiramisu', price: 28.00, description: 'Tradicional sobremesa italiana com café e mascarpone' },
      { name: 'Panna Cotta', price: 24.00, description: 'Creme de leite cozido com calda de frutas vermelhas' },
      { name: 'Gelato Italiano', price: 18.00, description: 'Sorvete artesanal italiano (2 bolas)' },
      { name: 'Cannoli', price: 22.00, description: 'Tubos crocantes com recheio de ricota doce' },
      { name: 'Lemon Pie', price: 26.00, description: 'Torta de limão sicilano com merengue' },
      { name: 'Brownie com Sorvete', price: 25.00, description: 'Brownie quente com sorvete de creme' }
    ];
    
    for (const dessert of desserts) {
      const { error } = await supabase
        .from('menu_items')
        .insert({
          id: generateUUID(),
          category_id: categoryMap['Sobremesas'],
          name: dessert.name,
          description: dessert.description,
          base_price: dessert.price,
          is_available: true,
          display_order: desserts.indexOf(dessert),
          is_vegetarian: true,
          is_vegan: false,
          is_spicy: false,
          ingredients: [],
          allergens: ['lactose', 'gluten']
        });
      
      console.log(`   - ${dessert.name}: ${error ? '❌' : '✅'}`);
    }
  }
  
  // 10. Adicionar Pizza Montável
  console.log('\n🍕 Adicionando Pizza Montável...');
  const { error: buildableError } = await supabase
    .from('menu_items')
    .insert({
      id: generateUUID(),
      category_id: categoryMap['Pizzas Especiais'], // ou criar categoria específica
      name: 'Monte sua Pizza',
      description: 'Escolha até 4 sabores e personalize sua pizza',
      base_price: 45.00,
      is_available: true,
      display_order: 99,
      is_featured: true,
      is_vegetarian: false,
      is_vegan: false,
      is_spicy: false,
      ingredients: [],
      allergens: [],
      metadata: {
        is_buildable: true,
        max_flavors: 4
      }
    });
  
  console.log(`   - Monte sua Pizza: ${buildableError ? '❌' : '✅'}`);
  
  // 11. Verificar resultado final
  console.log('\n🔍 Verificando resultado final...');
  
  const { data: finalCategories } = await supabase
    .from('menu_categories')
    .select('name')
    .in('menu_id', [menuId])
    .eq('is_available', true)
    .order('display_order');
    
  let totalItems = 0;
  for (const cat of finalCategories || []) {
    const { data: items } = await supabase
      .from('menu_items')
      .select('name')
      .eq('category_id', cat.id)
      .eq('is_available', true);
    
    console.log(`   - ${cat.name}: ${items?.length || 0} itens`);
    totalItems += items?.length || 0;
  }
  
  console.log(`\n📊 Total final: ${totalItems} itens`);
  
  if (totalItems >= 50) {
    console.log('\n🎉 SUCESSO! Cardápio completo da Bella Napoli!');
    console.log('   ✓ Todas as categorias criadas');
    console.log(`   ✓ ${totalItems} itens disponíveis`);
    console.log('   ✓ Pizza Montável disponível');
    console.log('\n📱 Agora a Bella Napoli deve aparecer com todos os produtos no site!');
  } else {
    console.log(`\n⚠️ Ainda faltam itens (${totalItems}/56 esperados)`);
  }
}

completeBellaMenu();
