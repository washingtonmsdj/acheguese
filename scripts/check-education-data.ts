/**
 * Script para verificar dados existentes de education e criar seed de analytics
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log('🔍 Verificando dados existentes...\n');
  
  // 1. Verificar profiles
  const { data: profiles, error: pError } = await supabase
    .from('education_profiles')
    .select('id, business_id, niche_key, institution_type, status')
    .limit(10);
    
  if (pError) {
    console.error('❌ Erro ao buscar profiles:', pError.message);
    return;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('⚠️ Nenhum education_profile encontrado no banco.');
    console.log('   Crie um profile primeiro via interface ou admin.');
    return;
  }
  
  console.log('📋 Profiles encontrados:');
  profiles.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.id} - ${p.institution_type} (${p.niche_key}) - ${p.status}`);
  });
  
  // 2. Verificar programs para o primeiro profile
  const firstProfile = profiles[0];
  console.log(`\n📚 Verificando programs para profile: ${firstProfile.id}`);
  
  const { data: programs, error: progError } = await supabase
    .from('education_programs')
    .select('id, name')
    .eq('education_profile_id', firstProfile.id)
    .limit(5);
    
  if (progError) {
    console.log('   Erro:', progError.message);
  } else {
    console.log(`   ${programs?.length || 0} programs encontrados`);
    programs?.forEach(p => console.log(`     - ${p.name}`));
  }
  
  // 3. Verificar events
  console.log(`\n📅 Verificando events para profile: ${firstProfile.id}`);
  
  const { data: events, error: evtError } = await supabase
    .from('education_events')
    .select('id, title')
    .eq('education_profile_id', firstProfile.id)
    .limit(5);
    
  if (evtError) {
    console.log('   Erro:', evtError.message);
  } else {
    console.log(`   ${events?.length || 0} events encontrados`);
    events?.forEach(e => console.log(`     - ${e.title}`));
  }
  
  // 4. Verificar enum de status
  console.log('\n🔍 Verificando enum education_lead_status...');
  
  // Tentar inserir um lead com status 'visited' para ver se é válido
  const { error: enumError } = await supabase
    .from('education_leads')
    .insert({
      education_profile_id: firstProfile.id,
      full_name: 'Test Enum',
      email: 'test@enum.com',
      status: 'visited',
      desired_grade: '1º Ano'
    })
    .select();
    
  if (enumError) {
    console.log('   Status "visited" não é válido:', enumError.message);
    
    // Tentar com status válidos
    const validStatuses = ['new', 'contacted', 'proposal_sent', 'enrolled', 'lost'];
    console.log('   Statuses válidos prováveis:', validStatuses.join(', '));
  } else {
    console.log('   ✅ Status "visited" é válido');
    // Remover o lead de teste
    await supabase.from('education_leads').delete().eq('email', 'test@enum.com');
  }
  
  console.log('\n💡 Para aplicar o seed de analytics:');
  console.log(`   1. Use o profile ID: ${firstProfile.id}`);
  console.log(`   2. Use o business ID: ${firstProfile.business_id}`);
  console.log('   3. Atualize o seed script com esses IDs');
}

main().catch(console.error);
