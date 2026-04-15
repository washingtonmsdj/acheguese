/**
 * HOMOLOGAÇÃO: ROTA PÚBLICA /p/:handle
 * Testar que perfil público renderiza e perfil privado retorna 404
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
  handle: string;
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
  const email = `teste-route-${timestamp}@example.com`;
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

async function criarPerfilPublico(client: any, handle: string) {
  const { data, error } = await client.rpc('create_profile_with_extension', {
    p_profile_type: 'business',
    p_handle: handle,
    p_display_name: 'Teste Rota Pública',
    p_extension_data: {
      legal_name: 'Empresa Teste LTDA',
      cnpj: `${Date.now()}000190`,
      company_type: 'ltda'
    }
  });
  
  if (error) throw error;
  return data.profile_id;
}

async function buscarPerfilPublico(handle: string) {
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // Simular o que a rota /p/:handle faz
  const { data: baseProfile, error: baseError } = await anonClient
    .from('public_profiles')
    .select('*')
    .eq('handle', handle)
    .single();
  
  if (baseError || !baseProfile) {
    return { found: false, profile: null, error: baseError };
  }
  
  // Buscar extensão business
  const { data: businessProfile, error: businessError } = await anonClient
    .from('public_business_profiles')
    .select('*')
    .eq('handle', handle)
    .single();
  
  return {
    found: true,
    profile: businessProfile || baseProfile,
    error: null
  };
}

async function tornarPerfilPrivado(client: any, profileId: string) {
  const { error } = await client
    .from('profiles')
    .update({ is_public: false })
    .eq('id', profileId);
  
  if (error) throw error;
}

async function executarTestes() {
  console.log('='.repeat(80));
  console.log('HOMOLOGAÇÃO: ROTA PÚBLICA /p/:handle');
  console.log('='.repeat(80));
  console.log('');

  // Criar usuário e perfil de teste
  console.log('Preparando ambiente de teste...');
  const { email, password } = await criarUsuarioTeste();
  const client = await loginUsuario(email, password);
  const timestamp = Date.now();
  const handle = `route-test-${timestamp}`;
  const profileId = await criarPerfilPublico(client, handle);
  console.log(`✓ Usuário criado: ${email}`);
  console.log(`✓ Perfil criado: ${profileId}`);
  console.log(`✓ Handle: ${handle}`);
  console.log('');

  // TESTE 1: Acessar perfil público via /p/:handle (DEVE RENDERIZAR)
  console.log('TESTE 1: Acessar perfil público via /p/:handle');
  console.log('-'.repeat(80));
  
  const resultado1 = await buscarPerfilPublico(handle);
  
  resultados.push({
    numero: 1,
    nome: 'Perfil público renderiza',
    handle,
    esperado: 'Perfil encontrado e renderizado',
    obtido: resultado1.found ? {
      id: resultado1.profile.id,
      handle: resultado1.profile.handle,
      display_name: resultado1.profile.display_name,
      profile_type: resultado1.profile.profile_type,
      is_public: resultado1.profile.is_public
    } : null,
    status: resultado1.found ? 'PASSOU' : 'FALHOU',
    evidencia: {
      rota: `/p/${handle}`,
      metodo: 'GET (simulado via public_profiles view)',
      response: resultado1
    }
  });
  
  console.log(`Rota: /p/${handle}`);
  console.log(`Esperado: Perfil renderizado`);
  console.log(`Obtido: ${resultado1.found ? 'Perfil encontrado' : 'null (404)'}`);
  console.log(`Status: ${resultado1.found ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log('');

  // TESTE 2: Tornar perfil privado e tentar acessar (DEVE RETORNAR 404)
  console.log('TESTE 2: Perfil privado retorna 404');
  console.log('-'.repeat(80));
  
  await tornarPerfilPrivado(client, profileId);
  console.log('✓ Perfil tornado privado (is_public=false)');
  
  const resultado2 = await buscarPerfilPublico(handle);
  
  resultados.push({
    numero: 2,
    nome: 'Perfil privado retorna 404',
    handle,
    esperado: 'null (404)',
    obtido: resultado2.found ? resultado2.profile : null,
    status: !resultado2.found ? 'PASSOU' : 'FALHOU',
    evidencia: {
      rota: `/p/${handle}`,
      metodo: 'GET (simulado via public_profiles view)',
      is_public: false,
      response: resultado2
    }
  });
  
  console.log(`Rota: /p/${handle}`);
  console.log(`Esperado: null (404)`);
  console.log(`Obtido: ${resultado2.found ? 'Perfil encontrado (ERRO!)' : 'null (404)'}`);
  console.log(`Status: ${!resultado2.found ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log('');

  // Salvar resultados
  const relatorio = {
    data: new Date().toISOString(),
    ambiente: 'Supabase Remote',
    descricao: 'Validação da rota pública /p/:handle com perfil público e privado',
    total_testes: resultados.length,
    passou: resultados.filter(r => r.status === 'PASSOU').length,
    falhou: resultados.filter(r => r.status === 'FALHOU').length,
    testes: resultados
  };

  fs.writeFileSync(
    'HOMOLOGACAO_ROTA_PUBLICA.json',
    JSON.stringify(relatorio, null, 2)
  );

  console.log('='.repeat(80));
  console.log('RESUMO');
  console.log('='.repeat(80));
  console.log(`Total: ${relatorio.total_testes} testes`);
  console.log(`Passou: ${relatorio.passou}`);
  console.log(`Falhou: ${relatorio.falhou}`);
  console.log('');
  console.log(`Arquivo gerado: HOMOLOGACAO_ROTA_PUBLICA.json`);
  console.log('');
}

executarTestes().catch(console.error);
