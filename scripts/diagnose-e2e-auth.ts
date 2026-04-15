#!/usr/bin/env tsx
/**
 * Diagnóstico completo do problema de autenticação E2E
 * 
 * Verifica:
 * 1. Usuário existe no auth.users
 * 2. Perfil pessoal existe em profiles
 * 3. Perfil de negócio existe em profiles
 * 4. Empresa existe em business_data
 * 5. Vínculo em profile_members existe e está correto
 * 6. Role do membro está correta
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e.network' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const USER_EMAIL = process.env.E2E_NETWORK_USER_EMAIL!;
const STANDALONE_PROFILE_ID = process.env.E2E_NETWORK_STANDALONE_PROFILE_ID!;

async function diagnose() {
  console.log('🔍 Diagnóstico de autenticação E2E\n');
  console.log('═'.repeat(60));
  
  // 1. Verificar usuário
  console.log('\n1️⃣  USUÁRIO AUTH');
  console.log('─'.repeat(60));
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === USER_EMAIL);
  
  if (!user) {
    console.log('❌ Usuário não encontrado:', USER_EMAIL);
    console.log('   Execute: npx tsx scripts/seed-e2e-network.ts --reset');
    process.exit(1);
  }
  
  console.log('✅ Usuário encontrado');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
  
  // 2. Verificar perfil pessoal
  console.log('\n2️⃣  PERFIL PESSOAL');
  console.log('─'.repeat(60));
  const { data: personalProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('profile_type', 'personal')
    .maybeSingle();
  
  if (!personalProfile) {
    console.log('❌ Perfil pessoal não encontrado');
    process.exit(1);
  }
  
  console.log('✅ Perfil pessoal encontrado');
  console.log(`   ID: ${personalProfile.id}`);
  console.log(`   Nome: ${personalProfile.name}`);
  console.log(`   Tipo: ${personalProfile.profile_type}`);
  
  // 3. Verificar perfil de negócio
  console.log('\n3️⃣  PERFIL DE NEGÓCIO');
  console.log('─'.repeat(60));
  const { data: businessProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', STANDALONE_PROFILE_ID)
    .maybeSingle();
  
  if (!businessProfile) {
    console.log('❌ Perfil de negócio não encontrado');
    console.log(`   ID esperado: ${STANDALONE_PROFILE_ID}`);
    process.exit(1);
  }
  
  console.log('✅ Perfil de negócio encontrado');
  console.log(`   ID: ${businessProfile.id}`);
  console.log(`   Nome: ${businessProfile.name}`);
  console.log(`   Tipo: ${businessProfile.profile_type}`);
  console.log(`   Username: ${businessProfile.username}`);
  console.log(`   user_id: ${businessProfile.user_id}`);
  
  // 4. Verificar empresa
  console.log('\n4️⃣  EMPRESA (business_data)');
  console.log('─'.repeat(60));
  const { data: business } = await supabase
    .from('business_data')
    .select('*')
    .eq('profile_id', STANDALONE_PROFILE_ID)
    .maybeSingle();
  
  if (!business) {
    console.log('❌ Empresa não encontrada');
    console.log(`   profile_id esperado: ${STANDALONE_PROFILE_ID}`);
    process.exit(1);
  }
  
  console.log('✅ Empresa encontrada');
  console.log(`   ID: ${business.id}`);
  console.log(`   Nome: ${business.business_name}`);
  console.log(`   Slug: ${business.slug}`);
  console.log(`   profile_id: ${business.profile_id}`);
  console.log(`   Status: ${business.status}`);
  
  // 5. Verificar vínculo em profile_members
  console.log('\n5️⃣  VÍNCULO (profile_members)');
  console.log('─'.repeat(60));
  const { data: members, error: membersError } = await supabase
    .from('profile_members')
    .select('*')
    .eq('profile_id', STANDALONE_PROFILE_ID);
  
  if (membersError) {
    console.log('❌ Erro ao buscar membros:', membersError.message);
    process.exit(1);
  }
  
  if (!members || members.length === 0) {
    console.log('❌ PROBLEMA ENCONTRADO: Nenhum membro vinculado ao perfil de negócio');
    console.log(`   profile_id: ${STANDALONE_PROFILE_ID}`);
    console.log('\n   CAUSA RAIZ: O seed não está criando o registro em profile_members');
    console.log('   ou está usando o ID errado.');
    console.log('\n   CORREÇÃO NECESSÁRIA:');
    console.log('   - Verificar se o seed está inserindo em profile_members');
    console.log('   - Garantir que profile_id = ID do perfil de negócio');
    console.log('   - Garantir que user_id = ID do usuário auth');
    console.log('   - Garantir que role = "owner"');
  } else {
    console.log(`✅ ${members.length} membro(s) encontrado(s)`);
    
    for (const member of members) {
      console.log(`\n   Membro:`);
      console.log(`   - ID: ${member.id}`);
      console.log(`   - profile_id: ${member.profile_id}`);
      console.log(`   - user_id: ${member.user_id}`);
      console.log(`   - role: ${member.role}`);
      console.log(`   - created_at: ${member.created_at || member.joined_at}`);
      
      // Verificar se o user_id corresponde ao usuário de teste
      if (member.user_id === user.id) {
        console.log(`   ✅ user_id corresponde ao usuário de teste`);
        
        if (member.role === 'owner' || member.role === 'admin') {
          console.log(`   ✅ role "${member.role}" permite acesso ao dashboard`);
        } else {
          console.log(`   ⚠️  role "${member.role}" pode não ter permissões suficientes`);
          console.log(`       Roles aceitas: owner, admin`);
        }
      } else {
        console.log(`   ❌ user_id NÃO corresponde ao usuário de teste`);
        console.log(`      Esperado: ${user.id}`);
        console.log(`      Encontrado: ${member.user_id}`);
      }
    }
  }
  
  // 6. Resumo e diagnóstico final
  console.log('\n' + '═'.repeat(60));
  console.log('📋 RESUMO DO DIAGNÓSTICO');
  console.log('═'.repeat(60));
  
  const userOk = !!user;
  const personalProfileOk = !!personalProfile;
  const businessProfileOk = !!businessProfile;
  const businessOk = !!business;
  const membersOk = members && members.length > 0;
  const correctMember = members?.find(m => m.user_id === user.id && (m.role === 'owner' || m.role === 'admin'));
  
  console.log(`\n✅ Usuário auth: ${userOk ? 'OK' : 'FALHA'}`);
  console.log(`✅ Perfil pessoal: ${personalProfileOk ? 'OK' : 'FALHA'}`);
  console.log(`✅ Perfil de negócio: ${businessProfileOk ? 'OK' : 'FALHA'}`);
  console.log(`✅ Empresa: ${businessOk ? 'OK' : 'FALHA'}`);
  console.log(`${membersOk ? '✅' : '❌'} Vínculo profile_members: ${membersOk ? 'OK' : 'FALHA'}`);
  console.log(`${correctMember ? '✅' : '❌'} Vínculo correto: ${correctMember ? 'OK' : 'FALHA'}`);
  
  if (!correctMember) {
    console.log('\n🔴 CAUSA RAIZ IDENTIFICADA:');
    console.log('─'.repeat(60));
    console.log('O usuário de teste NÃO está vinculado ao perfil de negócio');
    console.log('em profile_members com role owner/admin.');
    console.log('\nO hook useDashboardAccess busca membros assim:');
    console.log('  SELECT user_id, role FROM profile_members');
    console.log(`  WHERE profile_id = '${STANDALONE_PROFILE_ID}'`);
    console.log('\nE verifica se user.id está na lista de membros.');
    console.log('Como não está, permissions.hasAccess = false');
    console.log('e o usuário é redirecionado para /perfil.');
    
    console.log('\n🔧 CORREÇÃO:');
    console.log('─'.repeat(60));
    console.log('Adicionar registro em profile_members:');
    console.log(`  profile_id: ${STANDALONE_PROFILE_ID}`);
    console.log(`  user_id: ${user.id}`);
    console.log(`  role: owner`);
  } else {
    console.log('\n✅ TUDO OK! O ambiente está configurado corretamente.');
    console.log('   Se os testes ainda falham, o problema pode estar em:');
    console.log('   - Sessão do Playwright não persistindo corretamente');
    console.log('   - Cookies não sendo salvos');
    console.log('   - Redirecionamento acontecendo antes do check de permissões');
  }
  
  console.log('\n' + '═'.repeat(60));
}

diagnose().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
