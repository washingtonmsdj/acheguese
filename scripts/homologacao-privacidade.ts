#!/usr/bin/env tsx

/**
 * HOMOLOGAÇÃO: PRIVACIDADE PÚBLICA
 * Testa regras de privacidade e visibilidade pública
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

async function criarUsuario() {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: `teste-privacy-${Date.now()}@example.com`,
    password: 'Teste123!@#',
    email_confirm: true
  });

  if (error) throw new Error(`Falha ao criar usuário: ${error.message}`);
  return { userId: data.user.id, email: data.user.email!, password: 'Teste123!@#' };
}

async function criarClienteAutenticado(email: string, password: string) {
  const { data: authData, error } = await adminClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed: ${error.message}`);

  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
  });
}

async function teste1_acessarPerfilPublico(handle: string) {
  const { data, error } = await anonClient
    .from('public_profiles')
    .select('*')
    .eq('handle', handle)
    .single();

  resultados.push({
    nome: 'TESTE 1: Acessar perfil público via view',
    acao: 'SELECT public_profiles',
    payload: { handle },
    esperado: 'SUCESSO: Perfil público acessível',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: Handle ${data?.handle}`,
    passou: !error && !!data,
    evidencia: { data, error: error?.message }
  });

  return data;
}

async function teste2_tornarPrivado(userClient: any, profileId: string, handle: string) {
  const { data, error } = await userClient
    .from('profiles')
    .update({ is_public: false })
    .eq('id', profileId)
    .select();

  resultados.push({
    nome: 'TESTE 2: Tornar perfil privado',
    acao: 'UPDATE profiles SET is_public=false',
    payload: { profile_id: profileId },
    esperado: 'SUCESSO: Perfil tornado privado',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: is_public=${data?.[0]?.is_public}`,
    passou: !error && data?.[0]?.is_public === false,
    evidencia: { data, error: error?.message }
  });

  // Verificar que não aparece mais na view pública
  const { data: publicData, error: publicError } = await anonClient
    .from('public_profiles')
    .select('*')
    .eq('handle', handle)
    .maybeSingle();

  resultados.push({
    nome: 'TESTE 2B: Perfil privado não aparece em public_profiles',
    acao: 'SELECT public_profiles (após tornar privado)',
    payload: { handle },
    esperado: 'SUCESSO: Perfil não encontrado (null)',
    obtido: publicData ? `FALHOU: Perfil ainda visível` : `SUCESSO: Perfil oculto`,
    passou: !publicData,
    evidencia: { data: publicData, error: publicError?.message }
  });
}

async function teste3_ocultarContactEmail(userClient: any, profileId: string) {
  const { data, error } = await userClient
    .from('profiles')
    .update({ 
      contact_email: 'contato@empresa.com',
      show_contact_email: false 
    })
    .eq('id', profileId)
    .select();

  resultados.push({
    nome: 'TESTE 3: Ocultar contact_email',
    acao: 'UPDATE profiles SET show_contact_email=false',
    payload: { profile_id: profileId },
    esperado: 'SUCESSO: contact_email oculto',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: show_contact_email=${data?.[0]?.show_contact_email}`,
    passou: !error && data?.[0]?.show_contact_email === false,
    evidencia: { data, error: error?.message }
  });
}

async function teste4_ocultarPhone(userClient: any, profileId: string) {
  const { data, error } = await userClient
    .from('profiles')
    .update({ 
      phone: '+5511999999999',
      show_phone: false 
    })
    .eq('id', profileId)
    .select();

  resultados.push({
    nome: 'TESTE 4: Ocultar phone',
    acao: 'UPDATE profiles SET show_phone=false',
    payload: { profile_id: profileId },
    esperado: 'SUCESSO: phone oculto',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: show_phone=${data?.[0]?.show_phone}`,
    passou: !error && data?.[0]?.show_phone === false,
    evidencia: { data, error: error?.message }
  });
}

async function teste5_ocultarLinkedProfiles(userClient: any, profileId: string) {
  const { data, error } = await userClient
    .from('profiles')
    .update({ show_linked_profiles: false })
    .eq('id', profileId)
    .select();

  resultados.push({
    nome: 'TESTE 5: Ocultar linked profiles',
    acao: 'UPDATE profiles SET show_linked_profiles=false',
    payload: { profile_id: profileId },
    esperado: 'SUCESSO: linked profiles ocultos',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: show_linked_profiles=${data?.[0]?.show_linked_profiles}`,
    passou: !error && data?.[0]?.show_linked_profiles === false,
    evidencia: { data, error: error?.message }
  });
}

async function executarHomologacao() {
  console.log('🧪 HOMOLOGAÇÃO: PRIVACIDADE PÚBLICA\n');

  try {
    const { userId, email, password } = await criarUsuario();
    console.log(`✅ Usuário criado: ${email} (${userId})\n`);

    const userClient = await criarClienteAutenticado(email, password);

    // Criar perfil público
    console.log('Criando perfil público...');
    const profile = await userClient.rpc('create_profile_with_extension', {
      p_profile_type: 'business',
      p_handle: `teste-privacy-${Date.now()}`,
      p_display_name: 'Teste Privacy',
      p_extension_data: { legal_name: 'Empresa Privacy LTDA' }
    });

    if (!profile.data.success) {
      throw new Error(`Falha ao criar perfil: ${profile.data.error}`);
    }

    const profileId = profile.data.profile_id;
    const handle = profile.data.handle;

    // Tornar perfil público primeiro
    await userClient
      .from('profiles')
      .update({ is_public: true })
      .eq('id', profileId);

    console.log(`✅ Perfil criado: ${handle} (${profileId})\n`);

    // Executar testes
    await teste1_acessarPerfilPublico(handle);
    await teste2_tornarPrivado(userClient, profileId, handle);
    
    // Tornar público novamente para próximos testes
    await userClient.from('profiles').update({ is_public: true }).eq('id', profileId);
    
    await teste3_ocultarContactEmail(userClient, profileId);
    await teste4_ocultarPhone(userClient, profileId);
    await teste5_ocultarLinkedProfiles(userClient, profileId);

    // Gerar relatório
    console.log('\n' + '='.repeat(80));
    console.log('RELATÓRIO DE HOMOLOGAÇÃO - PRIVACIDADE');
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
      usuario_teste: { userId, email },
      perfil_teste: { profileId, handle },
      testes: resultados,
      resumo: { total: resultados.length, passou, falhou }
    };

    fs.writeFileSync('HOMOLOGACAO_PRIVACIDADE.json', JSON.stringify(relatorio, null, 2), 'utf-8');
    console.log('📄 Relatório salvo em: HOMOLOGACAO_PRIVACIDADE.json\n');

    process.exit(falhou > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

executarHomologacao();
