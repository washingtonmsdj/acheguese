import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkPizzaSchema() {
  console.log('🔍 Verificando schema das tabelas de pizza...');
  
  // Verificar se as tabelas existem
  const tables = ['pizza_sizes', 'pizza_flavors', 'pizza_edges', 'pizza_doughs'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Erro tabela ${table}:`, error.message);
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠️ Tabela ${table} não existe!`);
        }
      } else {
        console.log(`✅ Colunas ${table}:`, Object.keys(data?.[0] || {}));
      }
    } catch (err) {
      console.log(`❌ Erro tabela ${table}:`, err.message);
    }
  }
  
  // Tentar inserir um tamanho de pizza manualmente para ver o erro exato
  console.log('\n🧪 Testando inserção manual...');
  
  const { data: business } = await supabase
    .from('business_data')
    .select('id')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (business) {
    const testSize = {
      business_id: business.id,
      name: 'Teste',
      slug: 'teste',
      slices: 4,
      diameter_cm: 20,
      base_price: 35.00,
      max_flavors: 1,
      display_order: 0,
      is_available: true
    };
    
    const { error: insertError } = await supabase
      .from('pizza_sizes')
      .insert(testSize);
      
    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('   Details:', insertError.details);
      console.log('   Hint:', insertError.hint);
    } else {
      console.log('✅ Inserção bem-sucedida');
    }
  }
}

checkPizzaSchema();
