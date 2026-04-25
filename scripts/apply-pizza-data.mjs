import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function applyPizzaData() {
  console.log('🍕 Aplicando dados completos da pizzaria...');
  
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
  
  const businessId = business.id;
  console.log('✅ Business ID:', businessId);
  
  // 1. Inserir tamanhos de pizza
  console.log('\n📏 Inserindo tamanhos de pizza...');
  const pizzaSizes = [
    { id: 's2222222-2222-2222-2222-222222222221', name: 'Broto', slices: 4, diameter_cm: 20, base_price: 35.00, max_flavors: 1, display_order: 0 },
    { id: 's2222222-2222-2222-2222-222222222222', name: 'Pequena', slices: 6, diameter_cm: 25, base_price: 45.00, max_flavors: 2, display_order: 1 },
    { id: 's2222222-2222-2222-2222-222222222223', name: 'Média', slices: 8, diameter_cm: 30, base_price: 55.00, max_flavors: 2, display_order: 2 },
    { id: 's2222222-2222-2222-2222-222222222224', name: 'Grande', slices: 10, diameter_cm: 35, base_price: 65.00, max_flavors: 3, display_order: 3 },
    { id: 's2222222-2222-2222-2222-222222222225', name: 'Família', slices: 12, diameter_cm: 40, base_price: 75.00, max_flavors: 4, display_order: 4 }
  ];
  
  for (const size of pizzaSizes) {
    const { error } = await supabase
      .from('pizza_sizes')
      .upsert({
        ...size,
        business_id: businessId,
        is_available: true
      }, { onConflict: 'id' });
    
    console.log(`   - ${size.name}: ${error ? '❌' : '✅'}`);
  }
  
  // 2. Inserir sabores de pizza
  console.log('\n🍕 Inserindo sabores de pizza...');
  const pizzaFlavors = [
    { id: 'f2222222-2222-2222-2222-222222222301', name: 'Margherita', description: 'Molho de tomate, mussarela e manjericão', base_price: 45.00, ingredients: ['tomate', 'mussarela', 'manjericao'], allergens: [], display_order: 0 },
    { id: 'f2222222-2222-2222-2222-222222222302', name: 'Calabresa', description: 'Molho de tomate, mussarela, calabresa e cebola', base_price: 48.00, ingredients: ['tomate', 'mussarela', 'calabresa', 'cebola'], allergens: [], display_order: 1 },
    { id: 'f2222222-2222-2222-2222-222222222303', name: 'Portuguesa', description: 'Molho de tomate, mussarela, presunto, ovo, ervilha e cebola', base_price: 52.00, ingredients: ['tomate', 'mussarela', 'presunto', 'ovo', 'ervilha', 'cebola'], allergens: ['ovo'], display_order: 2 },
    { id: 'f2222222-2222-2222-2222-222222222304', name: 'Quatro Queijos', description: 'Molho de tomate, mussarela, gorgonzola, parmesão e catupiry', base_price: 55.00, ingredients: ['tomate', 'mussarela', 'gorgonzola', 'parmesao', 'catupiry'], allergens: ['lactose'], display_order: 3 },
    { id: 'f2222222-2222-2222-2222-222222222305', name: 'Frango com Catupiry', description: 'Molho de tomate, mussarela, frango desfiado e catupiry', base_price: 50.00, ingredients: ['tomate', 'mussarela', 'frango', 'catupiry'], allergens: ['lactose'], display_order: 4 },
    { id: 'f2222222-2222-2222-2222-222222222306', name: 'Pepperoni', description: 'Molho de tomate, mussarela e pepperoni', base_price: 53.00, ingredients: ['tomate', 'mussarela', 'pepperoni'], allergens: [], display_order: 5 },
    { id: 'f2222222-2222-2222-2222-222222222307', name: 'Atum', description: 'Molho de tomate, mussarela, atum, cebola e azeitona', base_price: 49.00, ingredients: ['tomate', 'mussarela', 'atum', 'cebola', 'azeitona'], allergens: [], display_order: 6 },
    { id: 'f2222222-2222-2222-2222-222222222308', name: 'Bacon', description: 'Molho de tomate, mussarela, bacon e cebola', base_price: 54.00, ingredients: ['tomate', 'mussarela', 'bacon', 'cebola'], allergens: [], display_order: 7 },
    { id: 'f2222222-2222-2222-2222-222222222309', name: 'Palmito', description: 'Molho de tomate, mussarela, palmito e azeitona', base_price: 47.00, ingredients: ['tomate', 'mussarela', 'palmito', 'azeitona'], allergens: [], display_order: 8 },
    { id: 'f2222222-2222-2222-2222-222222222310', name: 'Milho', description: 'Molho de tomate, mussarela, milho e bacon', base_price: 48.00, ingredients: ['tomate', 'mussarela', 'milho', 'bacon'], allergens: [], display_order: 9 },
    { id: 'f2222222-2222-2222-2222-222222222311', name: 'Escarola', description: 'Molho de tomate, mussarela, escarola refogada e bacon', base_price: 46.00, ingredients: ['tomate', 'mussarela', 'escarola', 'bacon'], allergens: [], display_order: 10 },
    { id: 'f2222222-2222-2222-2222-222222222312', name: 'Lombo Canadense', description: 'Molho de tomate, mussarela, lombo canadense e abacaxi', base_price: 56.00, ingredients: ['tomate', 'mussarela', 'lombo', 'abacaxi'], allergens: [], display_order: 11 },
    { id: 'f2222222-2222-2222-2222-222222222313', name: 'Chocolate', description: 'Chocolate meio amargo, morango e chantilly', base_price: 58.00, ingredients: ['chocolate', 'morango', 'chantilly'], allergens: ['lactose'], display_order: 12 },
    { id: 'f2222222-2222-2222-2222-222222222314', name: 'Prestígio', description: 'Chocolate, coco ralado e calda de caramelo', base_price: 60.00, ingredients: ['chocolate', 'coco', 'caramelo'], allergens: ['lactose'], display_order: 13 },
    { id: 'f2222222-2222-2222-2222-222222222315', name: 'Banana com Canela', description: 'Banana, canela e açúcar mascavo', base_price: 52.00, ingredients: ['banana', 'canela', 'acucar'], allergens: [], display_order: 14 },
    { id: 'f2222222-2222-2222-2222-222222222316', name: 'Romeu e Julieta', description: 'Goiabada e queijo minas', base_price: 50.00, ingredients: ['goiabada', 'queijo_minas'], allergens: ['lactose'], display_order: 15 },
    { id: 'f2222222-2222-2222-2222-222222222317', name: 'Nutella com Morango', description: 'Nutella, morangos frescos e raspas de chocolate', base_price: 62.00, ingredients: ['nutella', 'morango', 'chocolate'], allergens: ['lactose'], display_order: 16 },
    { id: 'f2222222-2222-2222-2222-222222222318', name: 'Sensação', description: 'Chocolate branco, morango e leite ninho', base_price: 64.00, ingredients: ['chocolate_branco', 'morango', 'leite_ninho'], allergens: ['lactose'], display_order: 17 }
  ];
  
  for (const flavor of pizzaFlavors) {
    const { error } = await supabase
      .from('pizza_flavors')
      .upsert({
        ...flavor,
        business_id: businessId,
        is_available: true
      }, { onConflict: 'id' });
    
    console.log(`   - ${flavor.name}: ${error ? '❌' : '✅'}`);
  }
  
  // 3. Inserir bordas
  console.log('\n🧀 Inserindo bordas...');
  const pizzaEdges = [
    { id: 'e2222222-2222-2222-2222-222222222301', name: 'Catupiry', description: 'Borda recheada com catupiry cremoso', price: 12.00, display_order: 0 },
    { id: 'e2222222-2222-2222-2222-222222222302', name: 'Cheddar', description: 'Borda recheada com cheddar inglês', price: 12.00, display_order: 1 },
    { id: 'e2222222-2222-2222-2222-222222222303', name: 'Mussarela', description: 'Borda recheada com mussarela especial', price: 10.00, display_order: 2 },
    { id: 'e2222222-2222-2222-2222-222222222304', name: 'Nutella', description: 'Borda doce recheada com Nutella', price: 15.00, display_order: 3 },
    { id: 'e2222222-2222-2222-2222-222222222305', name: 'Chocolate', description: 'Borda doce recheada com chocolate meio amargo', price: 14.00, display_order: 4 }
  ];
  
  for (const edge of pizzaEdges) {
    const { error } = await supabase
      .from('pizza_edges')
      .upsert({
        ...edge,
        business_id: businessId,
        is_available: true
      }, { onConflict: 'id' });
    
    console.log(`   - ${edge.name}: ${error ? '❌' : '✅'}`);
  }
  
  // 4. Inserir massas
  console.log('\n🍞 Inserindo massas...');
  const pizzaDoughs = [
    { id: 'g2222222-2222-2222-2222-222222222301', name: 'Tradicional', description: 'Massa fermentada por 72h, fina e crocante', price_adjustment: 0.00, display_order: 0 },
    { id: 'g2222222-2222-2222-2222-222222222302', name: 'Fina (Napolitana)', description: 'Massa extra fina estilo Napoli', price_adjustment: 3.00, display_order: 1 },
    { id: 'g2222222-2222-2222-2222-222222222303', name: 'Pan', description: 'Massa mais grossa, estilo americano', price_adjustment: 5.00, display_order: 2 },
    { id: 'g2222222-2222-2222-2222-222222222304', name: 'Integral', description: 'Massa integral com farelo de aveia', price_adjustment: 4.00, display_order: 3 },
    { id: 'g2222222-2222-2222-2222-222222222305', name: 'Sem Glúten', description: 'Massa sem glúten especial', price_adjustment: 8.00, display_order: 4 }
  ];
  
  for (const dough of pizzaDoughs) {
    const { error } = await supabase
      .from('pizza_doughs')
      .upsert({
        ...dough,
        business_id: businessId,
        is_available: true
      }, { onConflict: 'id' });
    
    console.log(`   - ${dough.name}: ${error ? '❌' : '✅'}`);
  }
  
  // 5. Verificar resultado
  console.log('\n🔍 Verificando resultado final...');
  
  const { data: finalSizes } = await supabase
    .from('pizza_sizes')
    .select('name')
    .eq('business_id', businessId);
    
  const { data: finalFlavors } = await supabase
    .from('pizza_flavors')
    .select('name')
    .eq('business_id', businessId);
    
  const { data: finalEdges } = await supabase
    .from('pizza_edges')
    .select('name')
    .eq('business_id', businessId);
    
  const { data: finalDoughs } = await supabase
    .from('pizza_doughs')
    .select('name')
    .eq('business_id', businessId);
  
  console.log('✅ Resultado final:');
  console.log(`   - Tamanhos: ${finalSizes?.length || 0}`);
  console.log(`   - Sabores: ${finalFlavors?.length || 0}`);
  console.log(`   - Bordas: ${finalEdges?.length || 0}`);
  console.log(`   - Massas: ${finalDoughs?.length || 0}`);
  
  if (finalSizes && finalFlavors && finalEdges && finalDoughs &&
      finalSizes.length > 0 && finalFlavors.length > 0) {
    console.log('\n🎉 Dados da pizzaria aplicados com sucesso!');
    console.log('Agora a Bella Napoli deve aparecer corretamente no site.');
  } else {
    console.log('\n❌ Alguns dados não foram aplicados');
  }
}

applyPizzaData();
