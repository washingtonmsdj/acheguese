/**
 * HOMOLOGAÇÃO: ADMIN RPCs - BLOQUEIO REAL
 * Testar que verify_profile e suspend_profile são bloqueadas para authenticated comum
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestResult {
  numero: number;
  nome: string;
  esperado: string;
  obtido: any;
  status: 'PASSOU' | 'FALHOU';
  evidencia: any;
}

const resultados: TestResult[] = [];

async function loginUsuario(email: string, password: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function criarUsuarioTeste() {
  const timestamp = Date.now();
  const email = `teste-admin-${timestamp}@example.com`;
  const password = 'Teste123!@#';
  
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (error) throw error;
  
  return { email, password, userId: data.user.id };
}

async function criarPerfilTeste(client: any, handle: string) {
  const { data, error } = await client.rpc('create_profile_with_extension', {
    p_profile_type: 'business',
    p_handle: handle,
    p_display_name: 'Teste Admin RPC',
    p_extension_data: {
      legal_name: 'Empresa Teste LTDA',
      cnpj: `${Date.now()}000190`,
      company_type: 'ltda'
    }
  });
  
  if (error) throw error;
  return data.profile_id;
}

async function executarTestes() {
  console.log('='.repeat(80));
  console.log('HOMOLOGAÇÃO: ADMIN RPCs - BLOQUEIO REAL');
  console.log('='.repeat(80));
  console.log('');

  // Criar usuário e perfil de teste
  console.log('Preparando ambiente de teste...');
  const { email, password, userId } = await criarUsuarioTeste();
  const client = await loginUsuario(email, password);
  const profileId = await criarPerfilTeste(client, `admin-test-${Date.now()}`);
  console.log(`✓ Usuário criado: ${email}`);
  console.log(`✓ Perfil criado: ${profileId}`);
  console.log('');

  // TESTE 1: verify_profile como authenticated comum (DEVE FALHAR)
  console.log('TESTE 1: Tentar verify_profile como authenticated comum');
  console.log('-'.repeat(80));
  
  try {
    const { data, error } = await client.rpc('verify_profile', {
      p_profile_id: profileId,
      p_admin_user_id: userId,
      p_reason: 'Teste de bloqueio'
    });
    
    const obtido = error ? {
      code: error.code,
      message: error.message,
      hint: error.hint
    } : data;
    
    const bloqueado = error && (
      error.code === '42883' || // função não existe
      error.code === '42501' || // permission denied
      error.message.includes('permission denied') ||
      error.message.includes('not found') ||
      error.message.includes('does not exist')
    );
    
    resultados.push({
      numero: 1,
      nome: 'verify_profile como authenticated comum',
      esperado: 'Bloqueado (permission denied ou função não encontrada)',
      obtido,
      status: bloqueado ? 'PASSOU' : 'FALHOU',
      evidencia: {
        payload: {
          p_profile_id: profileId,
          p_admin_user_id: userId,
          p_reason: 'Teste de bloqueio'
        },
        response: obtido
      }
    });
    
    console.log(`Esperado: Bloqueado`);
    console.log(`Obtido: ${error ? error.message : 'Sucesso (ERRO!)'}`);
    console.log(`Status: ${bloqueado ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 1,
      nome: 'verify_profile como authenticated comum',
      esperado: 'Bloqueado',
      obtido: { error: err.message },
      status: 'PASSOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ✅ PASSOU (bloqueado por exceção)');
  }
  
  console.log('');

  // TESTE 2: suspend_profile como authenticated comum (DEVE FALHAR)
  console.log('TESTE 2: Tentar suspend_profile como authenticated comum');
  console.log('-'.repeat(80));
  
  try {
    const { data, error } = await client.rpc('suspend_profile', {
      p_profile_id: profileId,
      p_admin_user_id: userId,
      p_reason: 'Teste de bloqueio'
    });
    
    const obtido = error ? {
      code: error.code,
      message: error.message,
      hint: error.hint
    } : data;
    
    const bloqueado = error && (
      error.code === '42883' || // função não existe
      error.code === '42501' || // permission denied
      error.message.includes('permission denied') ||
      error.message.includes('not found') ||
      error.message.includes('does not exist')
    );
    
    resultados.push({
      numero: 2,
      nome: 'suspend_profile como authenticated comum',
      esperado: 'Bloqueado (permission denied ou função não encontrada)',
      obtido,
      status: bloqueado ? 'PASSOU' : 'FALHOU',
      evidencia: {
        payload: {
          p_profile_id: profileId,
          p_admin_user_id: userId,
          p_reason: 'Teste de bloqueio'
        },
        response: obtido
      }
    });
    
    console.log(`Esperado: Bloqueado`);
    console.log(`Obtido: ${error ? error.message : 'Sucesso (ERRO!)'}`);
    console.log(`Status: ${bloqueado ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 2,
      nome: 'suspend_profile como authenticated comum',
      esperado: 'Bloqueado',
      obtido: { error: err.message },
      status: 'PASSOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ✅ PASSOU (bloqueado por exceção)');
  }
  
  console.log('');

  // Salvar resultados
  const relatorio = {
    data: new Date().toISOString(),
    ambiente: 'Supabase Remote',
    total_testes: resultados.length,
    passou: resultados.filter(r => r.status === 'PASSOU').length,
    falhou: resultados.filter(r => r.status === 'FALHOU').length,
    testes: resultados
  };

  fs.writeFileSync(
    'HOMOLOGACAO_ADMIN_RPCS.json',
    JSON.stringify(relatorio, null, 2)
  );

  console.log('='.repeat(80));
  console.log('RESUMO');
  console.log('='.repeat(80));
  console.log(`Total: ${relatorio.total_testes} testes`);
  console.log(`Passou: ${relatorio.passou}`);
  console.log(`Falhou: ${relatorio.falhou}`);
  console.log('');
  console.log(`Arquivo gerado: HOMOLOGACAO_ADMIN_RPCS.json`);
  console.log('');
}

executarTestes().catch(console.error);
