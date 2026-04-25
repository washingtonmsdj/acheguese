import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

async function checkBusinessRole() {
  console.log('🔍 Verificando business_role da Bella Napoli...');
  
  const { data: bella, error: bellaError } = await supabase
    .from('business_data')
    .select('id, business_name, business_role, status')
    .eq('slug', 'pizzaria-bella-napoli')
    .single();
    
  if (bellaError) {
    console.log('❌ Erro:', bellaError.message);
    return;
  }
  
  console.log('✅ Bella Napoli:');
  console.log('   - business_role:', bella.business_role);
  console.log('   - status:', bella.status);
  
  // Verificar todos os business_roles existentes
  console.log('\n📊 Todos os business_roles no sistema:');
  const { data: allRoles, error: rolesError } = await supabase
    .from('business_data')
    .select('business_role')
    .eq('status', 'active');
    
  if (!rolesError) {
    const roles = [...new Set(allRoles?.map(b => b.business_role) || [])];
    console.log('   Roles encontrados:', roles);
    
    // Contar negócios por role
    for (const role of roles) {
      const { data: businesses } = await supabase
        .from('business_data')
        .select('business_name')
        .eq('business_role', role)
        .eq('status', 'active');
      
      console.log(`   - ${role}: ${businesses?.length || 0} negócios`);
    }
  }
  
  // Verificar se Bella aparece sem o filtro de business_role
  console.log('\n🧪 Testando query sem filtro business_role...');
  const { data: withoutFilter, error: withoutError } = await supabase
    .from('business_data')
    .select('business_name, business_role')
    .eq('status', 'active')
    .eq('slug', 'pizzaria-bella-napoli');
    
  if (!withoutError && withoutFilter) {
    console.log('✅ Encontrada sem filtro:', withoutFilter[0]);
  }
  
  // Verificar se Bella aparece COM o filtro business_role
  console.log('\n🧪 Testando query COM filtro business_role...');
  const { data: withFilter, error: withError } = await supabase
    .from('business_data')
    .select('business_name, business_role')
    .eq('status', 'active')
    .in('business_role', ['standalone', 'branch'])
    .eq('slug', 'pizzaria-bella-napoli');
    
  if (!withError && withFilter) {
    console.log('✅ Encontrada com filtro:', withFilter[0]);
  } else {
    console.log('❌ NÃO encontrada com filtro business_role');
    console.log('   Isso explica por que não aparece no frontend!');
  }
  
  // Corrigir o business_role se necessário
  if (bella.business_role !== 'standalone' && bella.business_role !== 'branch') {
    console.log('\n🔧 Corrigindo business_role para "standalone"...');
    const { error: updateError } = await supabase
      .from('business_data')
      .update({ business_role: 'standalone' })
      .eq('id', bella.id);
      
    if (updateError) {
      console.log('❌ Erro ao corrigir:', updateError.message);
    } else {
      console.log('✅ business_role corrigido para "standalone"');
    }
  }
}

checkBusinessRole();
