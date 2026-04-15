#!/usr/bin/env tsx
/**
 * Diagnóstico de acesso ao dashboard da empresa de rede
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e.network' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STANDALONE_PROFILE_ID = process.env.E2E_NETWORK_STANDALONE_PROFILE_ID!;
const USER_EMAIL = process.env.E2E_NETWORK_USER_EMAIL!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function diagnose() {
  console.log('🔍 Diagnóstico de acesso ao dashboard\n');
  console.log(`Profile ID: ${STANDALONE_PROFILE_ID}`);
  console.log(`User Email: ${USER_EMAIL}\n`);

  // 1. Buscar o usuário
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find(u => u.email === USER_EMAIL);
  
  if (!user) {
    console.error('❌ Usuário não encontrado');
    return;
  }
  console.log(`✅ Usuário encontrado: ${user.id}\n`);

  // 2. Verificar profile_members
  const { data: members, error: membersErr } = await supabase
    .from('profile_members')
    .select('*')
    .eq('profile_id', STANDALONE_PROFILE_ID);

  console.log('📋 profile_members:');
  if (membersErr) {
    console.error('❌ Erro:', membersErr.message);
  } else if (!members || members.length === 0) {
    console.error('❌ Nenhum membro encontrado para este profile_id');
  } else {
    console.log(JSON.stringify(members, null, 2));
    const userMember = members.find(m => m.user_id === user.id);
    if (userMember) {
      console.log(`\n✅ Usuário é membro com role: ${userMember.role}`);
    } else {
      console.log(`\n❌ Usuário NÃO é membro deste perfil`);
      console.log(`   User ID esperado: ${user.id}`);
      console.log(`   User IDs encontrados: ${members.map(m => m.user_id).join(', ')}`);
    }
  }

  // 3. Verificar profiles
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', STANDALONE_PROFILE_ID)
    .maybeSingle();

  console.log('\n📋 profiles:');
  if (profileErr) {
    console.error('❌ Erro:', profileErr.message);
  } else if (!profile) {
    console.error('❌ Perfil não encontrado');
  } else {
    console.log(JSON.stringify(profile, null, 2));
  }

  // 4. Verificar business_data
  const { data: business, error: businessErr } = await supabase
    .from('business_data')
    .select('*')
    .eq('profile_id', STANDALONE_PROFILE_ID)
    .maybeSingle();

  console.log('\n📋 business_data:');
  if (businessErr) {
    console.error('❌ Erro:', businessErr.message);
  } else if (!business) {
    console.error('❌ Empresa não encontrada');
  } else {
    console.log(JSON.stringify(business, null, 2));
  }
}

diagnose().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
