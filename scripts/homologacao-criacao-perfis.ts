#!/usr/bin/env tsx

/**
 * HOMOLOGAÇÃO: CRIAÇÃO DE PERFIS
 * Testa todos os fluxos de criação com evidências objetivas
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceKey, {
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

async function criarUsuarioTeste() {
  // Criar usuário de teste para os testes
  const email = `teste-${Date.now()}@example.com`;
  const password = 'Teste123!@#';
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) throw new Error(`Falha ao criar usuário: ${error.message}`);
  return { userId: data.user.id, email, password };
}

async function teste1_criarPersonal(userId: string, userClient: any) {
  const payload = {
    p_profile_type: 'personal',
    p_handle: `teste-personal-${Date.now()}`,
    p_display_name: 'Teste Personal',
    p_extension_data: {}
  };

  const { data, error } = await userClient.rpc('create_profile_with_extension', payload);

  resultados.push({
    nome: 'TESTE 1: Criar perfil personal',
    acao: 'create_profile_with_extension',
    payload,
    esperado: 'Perfil personal criado com sucesso',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: ID ${data}`,
    passou: !error && data,
    evidencia: { data, error: error?.message }
  });

  return { profileId: data, error };
}

async function teste2_criarBusiness(userId: string, userClient: any) {
  const payload = {
    p_profile_type: 'business',
    p_handle: `teste-business-${Date.now()}`,
    p_display_name: 'Teste Business',
    p_extension_data: {
      legal_name: 'Empresa Teste LTDA',
      cnpj: '12345678000190',
      company_type: 'ltda',
      industry: 'Tecnologia'
    }
  };

  const { data, error } = await userClient.rpc('create_profile_with_extension', payload);

  resultados.push({
    nome: 'TESTE 2: Criar perfil business com extensão',
    acao: 'create_profile_with_extension',
    payload,
    esperado: 'Perfil business criado com extensão business_data',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: ID ${data}`,
    passou: !error && data,
    evidencia: { data, error: error?.message }
  });

  return { profileId: data, error };
}

async function teste3_criarProfessional(userId: string, userClient: any) {
  const payload = {
    p_profile_type: 'professional',
    p_handle: `teste-prof-${Date.now()}`,
    p_display_name: 'Teste Professional',
    p_extension_data: {
      profession: 'Médico',
      specialties: 'Cardiologia,Clínica Geral',
      years_experience: 10
    }
  };

  const { data, error } = await userClient.rpc('create_profile_with_extension', payload);

  resultados.push({
    nome: 'TESTE 3: Criar perfil professional com extensão',
    acao: 'create_profile_with_extension',
    payload,
    esperado: 'Perfil professional criado com extensão professional_data',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: ID ${data}`,
    passou: !error && data,
    evidencia: { data, error: error?.message }
  });

  return { profileId: data, error };
}

async function teste4_criarDriver(userId: string, userClient: any) {
  const payload = {
    p_profile_type: 'driver',
    p_handle: `teste-driver-${Date.now()}`,
    p_display_name: 'Teste Driver',
    p_extension_data: {
      license_number: 'ABC123456',
      license_category: 'B',
      license_expiry: '2028-12-31',
      license_state: 'SP',
      vehicle_type: 'car',
      vehicle_model: 'Honda Civic 2020',
      vehicle_plate: 'ABC-1234'
    }
  };

  const { data, error } = await userClient.rpc('create_profile_with_extension', payload);

  resultados.push({
    nome: 'TESTE 4: Criar perfil driver com extensão',
    acao: 'create_profile_with_extension',
    payload,
    esperado: 'Perfil driver criado com extensão driver_data',
    obtido: error ? `ERRO: ${error.message}` : `SUCESSO: ID ${data}`,
    passou: !error && data,
    evidencia: { data, error: error?.message }
  });

  return { profileId: data, error };
}

async function teste5_segundoPersonal(userId: string, userClient: any) {
  const payload = {
    p_profile_type: 'personal',
    p_handle: `teste-personal2-${Date.now()}`,
    p_display_name: 'Teste Personal 2',
    p_extension_data: {}
  };

  const { data, error } = await userClient.rpc('create_profile_with_extension', payload);

  resultados.push({
    nome: 'TESTE 5: Tentar criar segundo personal (deve falhar)',
    acao: 'create_profile_with_extension',
    payload,
    esperado: 'ERRO: Usuário já possui perfil personal',
    obtido: error ? `ERRO: ${error.message}` : data?.error ? `ERRO RPC: ${data.error}` : `FALHOU: Criou segundo personal (ID ${data})`,
    passou: !!error || (data && !data.success), // Deve dar erro
    evidencia: { data, error: error?.message }
  });

  return { error };
}

async function teste6_segundoDriver(userId: string, userClient: any) {
  const payload = {
    p_profile_type: 'driver',
    p_handle: `teste-driver2-${Date.now()}`,
    p_display_name: 'Teste Driver 2',
    p_extension_data: {
      license_number: 'XYZ789012',
      license_category: 'B',
      license_expiry: '2028-12-31',
      license_state: 'RJ',
      vehicle_type: 'car',
      vehicle_model: 'Toyota Corolla 2021',
      vehicle_plate: 'XYZ-5678'
    }
  };

  const { data, error } = await userClient.rpc('create_profile_with_extension', payload);

  resultados.push({
    nome: 'TESTE 6: Tentar criar segundo driver (deve falhar)',
    acao: 'create_profile_with_extension',
    payload,
    esperado: 'ERRO: Usuário já possui perfil driver',
    obtido: error ? `ERRO: ${error.message}` : data?.error ? `ERRO RPC: ${data.error}` : `FALHOU: Criou segundo driver (ID ${data})`,
    passou: !!error || (data && !data.success), // Deve dar erro
    evidencia: { data, error: error?.message }
  });

  return { error };
}

async function executarHomologacao() {
  console.log('🧪 HOMOLOGAÇÃO: CRIAÇÃO DE PERFIS\n');
  console.log('Criando usuário de teste...');

  try {
    const { userId, email, password } = await criarUsuarioTeste();
    console.log(`✅ Usuário criado: ${email} (${userId})\n`);

    // Criar cliente autenticado como o usuário de teste
    console.log('Autenticando como usuário de teste...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      throw new Error(`Falha ao autenticar: ${authError.message}`);
    }

    // Criar cliente com sessão do usuário
    const userClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_PUBLISHABLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

    console.log('✅ Autenticado com sucesso\n');

    // Executar testes
    await teste1_criarPersonal(userId, userClient);
    await teste2_criarBusiness(userId, userClient);
    await teste3_criarProfessional(userId, userClient);
    await teste4_criarDriver(userId, userClient);
    await teste5_segundoPersonal(userId, userClient);
    await teste6_segundoDriver(userId, userClient);

    // Gerar relatório
    console.log('\n' + '='.repeat(80));
    console.log('RELATÓRIO DE HOMOLOGAÇÃO - CRIAÇÃO DE PERFIS');
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

    // Salvar relatório em JSON
    const relatorio = {
      data: new Date().toISOString(),
      usuario_teste: { userId, email },
      testes: resultados,
      resumo: { total: resultados.length, passou, falhou }
    };

    const fs = await import('fs');
    fs.writeFileSync('HOMOLOGACAO_CRIACAO_PERFIS.json', JSON.stringify(relatorio, null, 2), 'utf-8');
    console.log('📄 Relatório salvo em: HOMOLOGACAO_CRIACAO_PERFIS.json\n');

    process.exit(falhou > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

executarHomologacao();
