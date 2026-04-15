#!/usr/bin/env tsx

/**
 * HOMOLOGAÇÃO: MEMBROS E LINKS
 * Testa regras de members e profile_links com evidências objetivas
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

async function criarUsuarios() {
  const user1 = await adminClient.auth.admin.createUser({
    email: `owner-${Date.now()}@example.com`,
    password: 'Teste123!@#',
    email_confirm: true
  });

  const user2 = await adminClient.auth.admin.createUser({
    email: `member-${Date.now()}@example.com`,
    password: 'Teste123!@#',
    email_confirm: true
  });

  return {
    owner: { id: user1.data.user!.id, email: user1.data.user!.email!, password: 'Teste123!@#' },
    member: { id: user2.data.user!.id, email: user2.data.user!.email!, password: 'Teste123!@#' }
  };
}

async function criarClienteAutenticado(email: string, password: string) {
  const { data: authData, error } = await adminClient.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Auth failed: ${error.message}`);

  return createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } }
  });
}

async function teste1_memberEmPersonal(ownerClient: any, personalId: string, memberId: string) {
  const { data, error } = await ownerClient
    .from('profile_members')
    .insert({ profile_id: personalId, user_id: memberId, role: 'member' });

  resultados.push({
    nome: 'TESTE 1: Adicionar member em personal (deve falhar)',
    acao: 'INSERT profile_members',
    payload: { profile_id: personalId, user_id: memberId, role: 'member' },
    esperado: 'ERRO: Personal não permite members',
    obtido: error ? `ERRO: ${error.message}` : `FALHOU: Member adicionado`,
    passou: !!error,
    evidencia: { data, error: error?.message }
  });
}

async function teste2_memberEmDriver(ownerClient: any, driverId: string, memberId: string) {
  const { data, error } = await ownerClient
    .from('profile_members')
    .insert({ profile_id: driverId, user_id: memberId, role: 'member' });

  resultados.push({
    nome: 'TESTE 2: Adicionar member em driver (deve falhar)',
    acao: 'INSERT profile_members',
    payload: { profile_id: driverId, user_id: memberId, role: 'member' },
    esperado: 'ERRO: Driver não permite members',
    obtido: error ? `ERRO: ${error.message}` : `FALHOU: Member adicionado`,
    passou: !!error,
    evidencia: { data, error: error?.message }
  });
}

async function teste3_memberEmBusiness(ownerClient: any, businessId: string, memberId: string) {
  const { data, error } = await ownerClient
    .from('profile_members')
    .insert({ profile_id: businessId, user_id: memberId, role: 'member' })
    .select();

  resultados.push({
    nome: 'TESTE 3: Adicionar member em business (deve passar)',
    acao: 'INSERT profile_members',
    payload: { profile_id: businessId, user_id: memberId, role: 'member' },
    esperado: 'SUCESSO: Member adicionado',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: Member ID ${data?.[0]?.id}`,
    passou: !error && !!data && data.length > 0,
    evidencia: { data, error: error?.message }
  });
}

async function teste4_memberEmProfessional(ownerClient: any, professionalId: string, memberId: string) {
  const { data, error } = await ownerClient
    .from('profile_members')
    .insert({ profile_id: professionalId, user_id: memberId, role: 'member' })
    .select();

  resultados.push({
    nome: 'TESTE 4: Adicionar member em professional (deve passar)',
    acao: 'INSERT profile_members',
    payload: { profile_id: professionalId, user_id: memberId, role: 'member' },
    esperado: 'SUCESSO: Member adicionado',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: Member ID ${data?.[0]?.id}`,
    passou: !error && !!data && data.length > 0,
    evidencia: { data, error: error?.message }
  });
}

async function teste5_transferOwnershipBusiness(ownerClient: any, businessId: string, newOwnerId: string) {
  const { data, error } = await ownerClient.rpc('transfer_profile_ownership', {
    p_profile_id: businessId,
    p_new_owner_user_id: newOwnerId
  });

  resultados.push({
    nome: 'TESTE 5: Transferir ownership de business',
    acao: 'transfer_profile_ownership',
    payload: { p_profile_id: businessId, p_new_owner_user_id: newOwnerId },
    esperado: 'SUCESSO: Ownership transferido',
    obtido: error ? `ERRO: ${error.message}` : data?.success ? `SUCESSO` : `ERRO RPC: ${data?.error}`,
    passou: !error && data?.success,
    evidencia: { data, error: error?.message }
  });

  return data?.success;
}

async function teste6_novoOwnerGerenciaLinks(newOwnerClient: any, ownerClient: any, businessId: string, targetId: string) {
  // CORREÇÃO: Novo owner operacional DEVE conseguir criar links
  // Arquitetura híbrida: dono estrutural OU owner/admin operacional
  const { data, error } = await newOwnerClient
    .from('profile_links')
    .insert({
      from_profile_id: businessId,
      to_profile_id: targetId,
      link_type: 'partner',
      is_public: true
    })
    .select();

  resultados.push({
    nome: 'TESTE 6: Novo owner operacional gerencia links (deve passar)',
    acao: 'INSERT profile_links',
    payload: { from_profile_id: businessId, to_profile_id: targetId, link_type: 'partner' },
    esperado: 'SUCESSO: Owner operacional pode gerenciar links',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: Link criado (ID ${data?.[0]?.id})`,
    passou: !error && !!data && data.length > 0, // Deve passar
    evidencia: { data, error: error?.message }
  });

  return !error && data && data.length > 0;
}

async function executarHomologacao() {
  console.log('🧪 HOMOLOGAÇÃO: MEMBROS E LINKS\n');

  try {
    const { owner, member } = await criarUsuarios();
    console.log(`✅ Usuários criados:`);
    console.log(`   Owner: ${owner.email} (${owner.id})`);
    console.log(`   Member: ${member.email} (${member.id})\n`);

    const ownerClient = await criarClienteAutenticado(owner.email, owner.password);
    const memberClient = await criarClienteAutenticado(member.email, member.password);

    // Criar perfis para testes
    console.log('Criando perfis de teste...');
    const personal = await ownerClient.rpc('create_profile_with_extension', {
      p_profile_type: 'personal',
      p_handle: `owner-personal-${Date.now()}`,
      p_display_name: 'Owner Personal'
    });

    const business = await ownerClient.rpc('create_profile_with_extension', {
      p_profile_type: 'business',
      p_handle: `owner-business-${Date.now()}`,
      p_display_name: 'Owner Business',
      p_extension_data: { legal_name: 'Empresa Owner LTDA' }
    });

    const professional = await ownerClient.rpc('create_profile_with_extension', {
      p_profile_type: 'professional',
      p_handle: `owner-prof-${Date.now()}`,
      p_display_name: 'Owner Professional',
      p_extension_data: { profession: 'Advogado', years_experience: 5 }
    });

    const driver = await ownerClient.rpc('create_profile_with_extension', {
      p_profile_type: 'driver',
      p_handle: `owner-driver-${Date.now()}`,
      p_display_name: 'Owner Driver',
      p_extension_data: {
        license_number: 'DRV123',
        license_category: 'B',
        license_expiry: '2028-12-31',
        license_state: 'SP'
      }
    });

    console.log(`✅ Perfis criados\n`);

    // Executar testes
    await teste1_memberEmPersonal(ownerClient, personal.data.profile_id, member.id);
    await teste2_memberEmDriver(ownerClient, driver.data.profile_id, member.id);
    await teste3_memberEmBusiness(ownerClient, business.data.profile_id, member.id);
    await teste4_memberEmProfessional(ownerClient, professional.data.profile_id, member.id);
    
    const transferSuccess = await teste5_transferOwnershipBusiness(ownerClient, business.data.profile_id, member.id);
    
    await teste6_novoOwnerGerenciaLinks(memberClient, ownerClient, business.data.profile_id, personal.data.profile_id);

    // Gerar relatório
    console.log('\n' + '='.repeat(80));
    console.log('RELATÓRIO DE HOMOLOGAÇÃO - MEMBROS E LINKS');
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
      usuarios_teste: { owner, member },
      testes: resultados,
      resumo: { total: resultados.length, passou, falhou }
    };

    fs.writeFileSync('HOMOLOGACAO_MEMBROS_LINKS.json', JSON.stringify(relatorio, null, 2), 'utf-8');
    console.log('📄 Relatório salvo em: HOMOLOGACAO_MEMBROS_LINKS.json\n');

    process.exit(falhou > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

executarHomologacao();
