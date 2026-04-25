import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkSeedVsDB() {
  console.log('🔍 Comparando seed esperado vs dados no banco...');
  
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
  
  console.log('✅ Business ID:', business.id);
  
  // Verificar se o niche_key está correto
  const { data: gastroProfile } = await supabase
    .from('gastronomy_profiles')
    .select('niche_key, cuisine_type')
    .eq('business_id', business.id)
    .single();
    
  console.log('✅ Gastronomy Profile:');
  console.log(`   - niche_key: ${gastroProfile?.niche_key}`);
  console.log(`   - cuisine_type: ${gastroProfile?.cuisine_type}`);
  
  // Verificar dados de pizzaria
  const { data: pizzaSizes } = await supabase
    .from('pizza_sizes')
    .select('id, name, display_order')
    .eq('business_id', business.id)
    .order('display_order');
    
  console.log('✅ Pizza Sizes:', pizzaSizes?.length);
  pizzaSizes?.forEach(s => console.log(`   - ${s.name} (ordem: ${s.display_order})`));
    
  const { data: pizzaFlavors } = await supabase
    .from('pizza_flavors')
    .select('id, name, display_order')
    .eq('business_id', business.id)
    .order('display_order');
    
  console.log('✅ Pizza Flavors:', pizzaFlavors?.length);
  pizzaFlavors?.forEach(f => console.log(`   - ${f.name} (ordem: ${f.display_order})`));
    
  const { data: pizzaEdges } = await supabase
    .from('pizza_edges')
    .select('id, name, display_order')
    .eq('business_id', business.id)
    .order('display_order');
    
  console.log('✅ Pizza Edges:', pizzaEdges?.length);
  pizzaEdges?.forEach(e => console.log(`   - ${e.name} (ordem: ${e.display_order})`));
    
  const { data: pizzaDoughs } = await supabase
    .from('pizza_doughs')
    .select('id, name, display_order')
    .eq('business_id', business.id)
    .order('display_order');
    
  console.log('✅ Pizza Doughs:', pizzaDoughs?.length);
  pizzaDoughs?.forEach(d => console.log(`   - ${d.name} (ordem: ${d.display_order})`));
  
  // Verificar se o item "Pizza Montável" existe
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('business_id', business.id);
    
  if (menus && menus.length > 0) {
    const { data: buildablePizza } = await supabase
      .from('menu_items')
      .select('id, name, base_price')
      .in('category_id', 
        (await supabase.from('menu_categories').select('id').in('menu_id', menus.map(m => m.id))).data?.map(c => c.id) || []
      )
      .ilike('name', '%pizza%mont%');
      
    console.log('✅ Pizza Montável:', buildablePizza?.length || 0);
    buildablePizza?.forEach(p => console.log(`   - ${p.name} (R$ ${p.base_price})`));
  }
  
  // Resumo do problema
  console.log('\n🚨 ANÁLISE DO PROBLEMA:');
  console.log('- Business existe e está ativo');
  console.log(`- Gastronomy profile: niche_key = ${gastroProfile?.niche_key} (deveria ser 'pizza')`);
  console.log(`- Menu items: 4 itens (deveria ser 56+)`);
  console.log('- Pizza niche data:', pizzaSizes?.length || 0, 'tamanhos,', pizzaFlavors?.length || 0, 'sabores');
  
  if (!gastroProfile?.niche_key || gastroProfile.niche_key !== 'pizza') {
    console.log('\n❌ PROVÁVEL CAUSA: niche_key não está como "pizza"');
    console.log('   Sem niche_key="pizza", o frontend não mostra os dados da pizzaria');
  }
}

checkSeedVsDB();
