import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

// Gerar UUIDs válidos
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function applyPizzaDataWithValidUUIDs() {
  console.log('🔧 Aplicando dados da pizzaria com UUIDs válidos...');
  
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
  
  // 1. Inserir tamanhos de pizza com UUIDs válidos
  console.log('\n📏 Inserindo tamanhos de pizza...');
  
  const pizzaSizes = [
    { name: 'Broto', slug: 'broto', slices: 4, diameter_cm: 20, base_price: 35.00, max_flavors: 1, display_order: 0 },
    { name: 'Pequena', slug: 'pequena', slices: 6, diameter_cm: 25, base_price: 45.00, max_flavors: 2, display_order: 1 },
    { name: 'Média', slug: 'media', slices: 8, diameter_cm: 30, base_price: 55.00, max_flavors: 2, display_order: 2 },
    { name: 'Grande', slug: 'grande', slices: 10, diameter_cm: 35, base_price: 65.00, max_flavors: 3, display_order: 3 },
    { name: 'Família', slug: 'familia', slices: 12, diameter_cm: 40, base_price: 75.00, max_flavors: 4, display_order: 4 }
  ];
  
  for (const size of pizzaSizes) {
    const validId = generateUUID();
    const { error } = await supabase
      .from('pizza_sizes')
      .insert({
        id: validId,
        business_id: businessId,
        ...size,
        is_available: true
      });
    
    console.log(`   - ${size.name}: ${error ? '❌ ' + error.message : '✅'}`);
  }
  
  // 2. Verificar se pizza_doughs existe e inserir massas
  console.log('\n🍞 Inserindo massas...');
  
  try {
    // Testar se a tabela existe
    await supabase.from('pizza_doughs').select('*').limit(1);
    
    const pizzaDoughs = [
      { name: 'Tradicional', description: 'Massa fermentada por 72h, fina e crocante', price_adjustment: 0.00, display_order: 0 },
      { name: 'Fina (Napolitana)', description: 'Massa extra fina estilo Napoli', price_adjustment: 3.00, display_order: 1 },
      { name: 'Pan', description: 'Massa mais grossa, estilo americano', price_adjustment: 5.00, display_order: 2 },
      { name: 'Integral', description: 'Massa integral com farelo de aveia', price_adjustment: 4.00, display_order: 3 },
      { name: 'Sem Glúten', description: 'Massa sem glúten especial', price_adjustment: 8.00, display_order: 4 }
    ];
    
    for (const dough of pizzaDoughs) {
      const validId = generateUUID();
      const { error } = await supabase
        .from('pizza_doughs')
        .insert({
          id: validId,
          business_id: businessId,
          ...dough,
          is_available: true
        });
      
      console.log(`   - ${dough.name}: ${error ? '❌ ' + error.message : '✅'}`);
    }
  } catch (err) {
    console.log('⚠️ Tabela pizza_doughs não existe ou não acessível:', err.message);
  }
  
  // 3. Verificar resultado final
  console.log('\n🔍 Verificando resultado final...');
  
  const { data: finalSizes } = await supabase
    .from('pizza_sizes')
    .select('name, display_order')
    .eq('business_id', businessId)
    .order('display_order');
    
  const { data: finalFlavors } = await supabase
    .from('pizza_flavors')
    .select('name, display_order')
    .eq('business_id', businessId)
    .order('display_order');
    
  const { data: finalEdges } = await supabase
    .from('pizza_edges')
    .select('name, display_order')
    .eq('business_id', businessId)
    .order('display_order');
    
  let finalDoughs = null;
  try {
    const { data: doughs } = await supabase
      .from('pizza_doughs')
      .select('name, display_order')
      .eq('business_id', businessId)
      .order('display_order');
    finalDoughs = doughs;
  } catch (err) {
    finalDoughs = [];
  }
  
  console.log('✅ Resultado final:');
  console.log(`   - Tamanhos: ${finalSizes?.length || 0}`);
  finalSizes?.forEach(s => console.log(`     * ${s.name} (ordem: ${s.display_order})`));
  
  console.log(`   - Sabores: ${finalFlavors?.length || 0}`);
  finalFlavors?.forEach(f => console.log(`     * ${f.name} (ordem: ${f.display_order})`));
  
  console.log(`   - Bordas: ${finalEdges?.length || 0}`);
  finalEdges?.forEach(e => console.log(`     * ${e.name} (ordem: ${e.display_order})`));
  
  console.log(`   - Massas: ${finalDoughs?.length || 0}`);
  finalDoughs?.forEach(d => console.log(`     * ${d.name} (ordem: ${d.display_order})`));
  
  // 4. Verificar se a Bella Napoli agora aparece corretamente
  const { data: profile } = await supabase
    .from('gastronomy_profiles')
    .select('niche_key')
    .eq('business_id', businessId)
    .single();
    
  console.log(`\n✅ Niche key: ${profile?.niche_key}`);
  
  if (finalSizes && finalFlavors && finalEdges && 
      finalSizes.length > 0 && finalFlavors.length > 0 && finalEdges.length > 0 &&
      profile?.niche_key === 'pizza') {
    console.log('\n🎉 SUCESSO! Bella Napoli está completa!');
    console.log('   ✓ niche_key = "pizza"');
    console.log(`   ✓ ${finalSizes.length} tamanhos de pizza`);
    console.log(`   ✓ ${finalFlavors.length} sabores de pizza`);
    console.log(`   ✓ ${finalEdges.length} opções de borda`);
    if (finalDoughs && finalDoughs.length > 0) {
      console.log(`   ✓ ${finalDoughs.length} tipos de massa`);
    }
    console.log('\n📱 Agora a Bella Napoli deve aparecer corretamente no site com todas as funcionalidades de pizzaria!');
  } else {
    console.log('\n❌ Ainda há problemas:');
    if (!profile?.niche_key || profile.niche_key !== 'pizza') console.log('   - niche_key não está como "pizza"');
    if (!finalSizes || finalSizes.length === 0) console.log('   - Sem tamanhos de pizza');
    if (!finalFlavors || finalFlavors.length === 0) console.log('   - Sem sabores de pizza');
    if (!finalEdges || finalEdges.length === 0) console.log('   - Sem bordas de pizza');
  }
}

applyPizzaDataWithValidUUIDs();
