import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function fixBellaNiche() {
  console.log('🔧 Corrigindo niche_key da Bella Napoli...');
  
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
  
  // 1. Atualizar niche_key para 'pizza'
  const { error: updateError } = await supabase
    .from('gastronomy_profiles')
    .update({ niche_key: 'pizza' })
    .eq('business_id', business.id);
    
  if (updateError) {
    console.log('❌ Erro ao atualizar niche_key:', updateError.message);
  } else {
    console.log('✅ niche_key atualizado para "pizza"');
  }
  
  // 2. Verificar se dados da pizzaria já existem
  const { data: pizzaSizes } = await supabase
    .from('pizza_sizes')
    .select('count')
    .eq('business_id', business.id);
    
  if (!pizzaSizes || pizzaSizes.length === 0) {
    console.log('⚠️ Dados da pizzaria não encontrados - necessário executar seed completo');
    
    // 3. Buscar o conteúdo do seed SQL para executar apenas a parte da pizzaria
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const seedPath = path.join(__dirname, '..', 'supabase', 'seed_bella_napoli_mock.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');
    
    // Extrair apenas a parte dos dados da pizzaria (do 16) em diante
    const pizzaDataSection = sql.split('-- 16)')[1] || '';
    
    if (pizzaDataSection) {
      console.log('🍕 Executando dados da pizzaria...');
      
      // Dividir em comandos individuais
      const statements = pizzaDataSection
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      console.log(`📄 Executando ${statements.length} comandos SQL da pizzaria...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        const preview = statement.substring(0, 60).replace(/\s+/g, ' ');
        process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Tentar método alternativo
            const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({ sql: statement })
            });
            
            if (response.ok) {
              console.log('✅');
            } else {
              console.log('❌');
              console.log('   Erro:', await response.text());
            }
          } else {
            console.log('✅');
          }
        } catch (err) {
          console.log('❌');
          console.log('   Erro:', err.message);
        }
      }
    }
  } else {
    console.log('✅ Dados da pizzaria já existem');
  }
  
  // 4. Verificar resultado final
  console.log('\n🔍 Verificando resultado final...');
  
  const { data: finalProfile } = await supabase
    .from('gastronomy_profiles')
    .select('niche_key')
    .eq('business_id', business.id)
    .single();
    
  const { data: finalSizes } = await supabase
    .from('pizza_sizes')
    .select('name')
    .eq('business_id', business.id);
    
  const { data: finalFlavors } = await supabase
    .from('pizza_flavors')
    .select('name')
    .eq('business_id', business.id);
    
  console.log('✅ Resultado final:');
  console.log(`   - niche_key: ${finalProfile?.niche_key}`);
  console.log(`   - Tamanhos: ${finalSizes?.length || 0}`);
  console.log(`   - Sabores: ${finalFlavors?.length || 0}`);
  
  if (finalProfile?.niche_key === 'pizza' && finalSizes && finalSizes.length > 0) {
    console.log('\n🎉 Bella Napoli pronta para aparecer no site!');
  } else {
    console.log('\n❌ Ainda há problemas a resolver');
  }
}

fixBellaNiche();
