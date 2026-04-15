#!/usr/bin/env tsx

/**
 * HOMOLOGAÇÃO: SEGURANÇA E RLS
 * Testa políticas de segurança e Row Level Security
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const anonClient = createClient(supabaseUrl, anonKey);

interface TestResult {
  nome: string;
  acao: string;
  payload: any;
  esperado: string;
  obtido: string;
  passou: boolean;
  evidencia: any;
}

const resultados: TestResult[] = [];

async function teste1_anonNaoAcessaProfiles() {
  const { data, error } = await anonClient
    .from('profiles')
    .select('*')
    .limit(1);

  resultados.push({
    nome: 'TESTE 1: Anon não acessa tabela profiles',
    acao: 'SELECT profiles (anon)',
    payload: {},
    esperado: 'ERRO: Permission denied ou vazio',
    obtido: error ? `ERRO: ${error.message}` : data && data.length > 0 ? `FALHOU: ${data.length} registros` : `SUCESSO: Vazio`,
    passou: !!error || !data || data.length === 0,
    evidencia: { data, error: error?.message }
  });
}

async function teste2_anonAcessaPublicViews() {
  const { data, error } = await anonClient
    .from('public_profiles')
    .select('*')
    .limit(5);

  resultados.push({
    nome: 'TESTE 2: Anon acessa public_profiles view',
    acao: 'SELECT public_profiles (anon)',
    payload: {},
    esperado: 'SUCESSO: View acessível',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: ${data?.length || 0} perfis públicos`,
    passou: !error,
    evidencia: { count: data?.length, error: error?.message }
  });
}

async function teste3_authenticatedApenasPropriosPerfis(userClient: any, userId: string) {
  // Tentar acessar perfis de outro usuário
  const { data, error } = await userClient
    .from('profiles')
    .select('*')
    .neq('user_id', userId)
    .limit(1);

  resultados.push({
    nome: 'TESTE 3: Authenticated vê apenas próprios perfis',
    acao: 'SELECT profiles WHERE user_id != auth.uid()',
    payload: { user_id_neq: userId },
    esperado: 'SUCESSO: Vazio (não vê perfis de outros)',
    obtido: error ? `ERRO: ${error.message}` : data && data.length > 0 ? `FALHOU: Viu ${data.length} perfis de outros` : `SUCESSO: Vazio`,
    passou: !error && (!data || data.length === 0),
    evidencia: { data, error: error?.message }
  });
}

async function teste4_ownerVeMembros(ownerClient: any, profileId: string) {
  const { data, error } = await ownerClient
    .from('profile_members')
    .select('*')
    .eq('profile_id', profileId);

  resultados.push({
    nome: 'TESTE 4: Owner vê membros do perfil',
    acao: 'SELECT profile_members',
    payload: { profile_id: profileId },
    esperado: 'SUCESSO: Membros visíveis',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: ${data?.length || 0} membros`,
    passou: !error,
    evidencia: { count: data?.length, error: error?.message }
  });
}

async function teste5_usuarioSemPermissaoNaoAltera(otherClient: any, profileId: string) {
  const { data, error } = await otherClient
    .from('profiles')
    .update({ display_name: 'HACKED' })
    .eq('id', profileId);

  resultados.push({
    nome: 'TESTE 5: Usuário sem permissão não altera perfil de outro',
    acao: 'UPDATE profiles (outro usuário)',
    payload: { profile_id: profileId, display_name: 'HACKED' },
    esperado: 'ERRO: Permission denied ou 0 rows',
    obtido: error ? `ERRO: ${error.message}` : data && data.length > 0 ? `FALHOU: Alterou perfil` : `SUCESSO: Bloqueado`,
    passou: !!error || !data || data.length === 0,
    evidencia: { data, error: error?.message }
  });
}

async function teste6_rpcsAdminNaoAcessiveisParaAuth(userClient: any) {
  const { data, error } = await userClient.rpc('admin_verify_profile', {
    p_profile_id: '00000000-0000-0000-0000-000000000000'
  });

  resultados.push({
    nome: 'TESTE 6: RPCs admin não acessíveis para authenticated',
    acao: 'admin_verify_profile (authenticated)',
    payload: { p_profile_id: '00000000-0000-0000-0000-000000000000' },
    esperado: 'ERRO: Permission denied',
    obtido: error ? `ERRO: ${error.message}` : `FALHOU: RPC executou`,
    passou: !!error,
    evidencia: { data, error: error?.message }
  });
}

async function executarHomologacao() {
  console.log('🧪 HOMOLOGAÇÃO: SEGURANÇA E RLS\n');

  try {
    // Criar dois usuários
    const user1 = await adminClient.auth.admin.createUser({
      email: `user1-${Date.now()}@example.com`,
      password: 'Teste123!@#',
      email_confirm: true
    });

    const user2 = await adminClient.auth.admin.createUser({
      email: `user2-${Date.now()}@example.com`,
      password: 'Teste123!@#',
      email_confirm: true
    });

    console.log(`✅ Usuários criados\n`);

    const user1Client = await criarClienteAutenticado(user1.data.user!.email!, 'Teste123!@#');
    const user2Client = await criarClienteAutenticado(user2.data.user!.email!, 'Teste123!@#');

    // Criar perfil para user1
    const profile = await user1Client.rpc('create_profile_with_extension', {
      p_profile_type: 'business',
      p_handle: `user1-business-${Date.now()}`,
      p_display_name: 'User1 Business',
      p_extension_data: { legal_name: 'Empresa User1 LTDA' }
    });

    const profileId = profile.data.profile_id;
    console.log(`✅ Perfil criado: ${profileId}\n`);

    // Executar testes
    await teste1_anonNaoAcessaProfiles();
    await teste2_anonAcessaPublicViews();
    await teste3_authenticatedApenasPropriosPerfis(user1Client, user1.data.user!.id);
    await teste4_ownerVeMembros(user1Client, profileId);
    await teste5_usuarioSemPermissaoNaoAltera(user2Client, profileId);
    await teste6_rpcsAdminNaoAcessiveisParaAuth(user1Client);

    // Gerar relatório
    console.log('\n' + '='.repeat(80));
    console.log('RELATÓRIO DE HOMOLOGAÇÃO - SEGURANÇA E RLS');
    console.log('='.repeat(80) + '\n');

    let passou = 0;
    let falhou = 0;

    for (const resultado of resultados) {
      console.log(`\n${resultado.nome}`);
      console.log(`Ação: ${resultado.acao}`);
      console.log(`Payload: ${JSON.stringify(resultado.payload, null, 2)}`);
      console.log(`Esperado: ${resultado.esperado}`);
      console.log(`Obtido: ${resultado.obtido}`);
      console.log(`Status: ${resultado.passou ? '✅ PASSOU' : '❌ FALHOU'}`);
      console.log(`Evidência: ${JSON.stringify(resultado.evidencia, null, 2)}`);
      console.log('-'.repeat(80));

      if (resultado.passou) passou++;
      else falhou++;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`RESULTADO FINAL: ${passou}/${resultados.length} testes passaram`);
    console.log(`✅ Passou: ${passou}`);
    console.log(`❌ Falhou: ${falhou}`);
    console.log('='.repeat(80) + '\n');

    const fs = await import('fs');
    const relatorio = {
      data: new Date().toISOString(),
      testes: resultados,
      resumo: { total: resultados.length, passou, falhou }
    };

    fs.writeFileSync('HOMOLOGACAO_SEGURANCA_RLS.json', JSON.stringify(relatorio, null, 2), 'utf-8');
    console.log('📄 Relatório salvo em: HOMOLOGACAO_SEGURANCA_RLS.json\n');

    process.exit(falhou > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

async function criarClienteAutenticado(email: string, password: string) {
  const { data: authData, error } = await adminClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed: ${error.message}`);

  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
  });
}

executarHomologacao();
