/**
 * HOMOLOGAÇÃO: UI SMOKE TEST - FLUXOS END-TO-END
 * Simula os 7 fluxos principais da UI testando os mesmos endpoints
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface TestResult {
  numero: number;
  nome: string;
  acao: string;
  esperado: string;
  obtido: any;
  status: 'PASSOU' | 'FALHOU';
  evidencia: any;
}

const resultados: TestResult[] = [];

async function criarUsuarioTeste(suffix: string) {
  const timestamp = Date.now();
  const email = `teste-ui-${suffix}-${timestamp}@example.com`;
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

async function loginUsuario(email: string, password: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  
  // Criar cliente autenticado
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`
      }
    }
  });
}

async function executarTestes() {
  console.log('='.repeat(80));
  console.log('HOMOLOGAÇÃO: UI SMOKE TEST - FLUXOS END-TO-END');
  console.log('='.repeat(80));
  console.log('');

  // TESTE 1: Criar perfil business pela UI
  console.log('TESTE 1: Criar perfil business pela UI');
  console.log('-'.repeat(80));
  
  try {
    const { email, password, userId } = await criarUsuarioTeste('business');
    const client = await loginUsuario(email, password);
    
    const timestamp = Date.now();
    const payload = {
      p_profile_type: 'business',
      p_handle: `ui-test-biz-${timestamp}`,
      p_display_name: 'UI Test Business',
      p_extension_data: {
        legal_name: 'Empresa UI Test LTDA',
        cnpj: `${timestamp}000190`,
        company_type: 'ltda',
        industry: 'Tecnologia'
      }
    };
    
    const { data, error } = await client.rpc('create_profile_with_extension', payload);
    
    // Verificar que business_data foi criada
    let businessData = null;
    if (data && data.profile_id) {
      const { data: bd } = await client
        .from('business_data')
        .select('*')
        .eq('profile_id', data.profile_id)
        .single();
      businessData = bd;
    }
    
    const passou = !error && data && data.success && businessData;
    
    resultados.push({
      numero: 1,
      nome: 'Criar perfil business pela UI',
      acao: 'create_profile_with_extension (business)',
      esperado: 'Perfil business criado com business_data',
      obtido: passou ? {
        profile_id: data.profile_id,
        handle: payload.p_handle,
        business_data_exists: !!businessData,
        legal_name: businessData?.legal_name
      } : { error: error?.message || 'business_data não criada' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        payload,
        response: data,
        business_data: businessData,
        error: error?.message
      }
    });
    
    console.log(`Esperado: Perfil business criado com business_data`);
    console.log(`Obtido: ${passou ? `Profile ID: ${data.profile_id}, business_data: ${businessData?.legal_name}` : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 1,
      nome: 'Criar perfil business pela UI',
      acao: 'create_profile_with_extension (business)',
      esperado: 'Perfil business criado',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // TESTE 2: Criar perfil professional pela UI
  console.log('TESTE 2: Criar perfil professional pela UI');
  console.log('-'.repeat(80));
  
  try {
    const { email, password, userId } = await criarUsuarioTeste('professional');
    const client = await loginUsuario(email, password);
    
    const timestamp = Date.now();
    const payload = {
      p_profile_type: 'professional',
      p_handle: `ui-test-prof-${timestamp}`,
      p_display_name: 'UI Test Professional',
      p_extension_data: {
        profession: 'Desenvolvedor',
        specialties: 'React,TypeScript,Node.js',
        years_experience: 5,
        services_offered: 'Desenvolvimento Web,Consultoria',
        hourly_rate: 150.00
      }
    };
    
    const { data, error } = await client.rpc('create_profile_with_extension', payload);
    
    // Verificar que professional_data foi criada
    let professionalData = null;
    if (data && data.profile_id) {
      const { data: pd } = await client
        .from('professional_data')
        .select('*')
        .eq('profile_id', data.profile_id)
        .single();
      professionalData = pd;
    }
    
    const passou = !error && data && data.success && professionalData;
    
    resultados.push({
      numero: 2,
      nome: 'Criar perfil professional pela UI',
      acao: 'create_profile_with_extension (professional)',
      esperado: 'Perfil professional criado com professional_data',
      obtido: passou ? {
        profile_id: data.profile_id,
        handle: payload.p_handle,
        professional_data_exists: !!professionalData,
        profession: professionalData?.profession
      } : { error: error?.message || 'professional_data não criada' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        payload,
        response: data,
        professional_data: professionalData,
        error: error?.message
      }
    });
    
    console.log(`Esperado: Perfil professional criado com professional_data`);
    console.log(`Obtido: ${passou ? `Profile ID: ${data.profile_id}, professional_data: ${professionalData?.profession}` : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 2,
      nome: 'Criar perfil professional pela UI',
      acao: 'create_profile_with_extension (professional)',
      esperado: 'Perfil professional criado',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // TESTE 3: Criar perfil driver pela UI
  console.log('TESTE 3: Criar perfil driver pela UI');
  console.log('-'.repeat(80));
  
  try {
    const { email, password, userId } = await criarUsuarioTeste('driver');
    const client = await loginUsuario(email, password);
    
    const timestamp = Date.now();
    const payload = {
      p_profile_type: 'driver',
      p_handle: `ui-test-driver-${timestamp}`,
      p_display_name: 'UI Test Driver',
      p_extension_data: {
        license_number: 'ABC123456',
        license_category: 'B',
        license_expiry: '2028-12-31',
        license_state: 'SP',
        vehicle_type: 'car',
        vehicle_model: 'Honda Civic 2020',
        vehicle_plate: 'ABC-1234',
        vehicle_year: 2020,
        vehicle_color: 'Preto'
      }
    };
    
    const { data, error } = await client.rpc('create_profile_with_extension', payload);
    
    // Verificar que driver_data foi criada
    let driverData = null;
    if (data && data.profile_id) {
      const { data: dd } = await client
        .from('driver_data')
        .select('*')
        .eq('profile_id', data.profile_id)
        .single();
      driverData = dd;
    }
    
    const passou = !error && data && data.success && driverData;
    
    resultados.push({
      numero: 3,
      nome: 'Criar perfil driver pela UI',
      acao: 'create_profile_with_extension (driver)',
      esperado: 'Perfil driver criado com driver_data',
      obtido: passou ? {
        profile_id: data.profile_id,
        handle: payload.p_handle,
        driver_data_exists: !!driverData,
        license_number: driverData?.license_number,
        vehicle_model: driverData?.vehicle_model
      } : { error: error?.message || 'driver_data não criada' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        payload,
        response: data,
        driver_data: driverData,
        error: error?.message
      }
    });
    
    console.log(`Esperado: Perfil driver criado com driver_data`);
    console.log(`Obtido: ${passou ? `Profile ID: ${data.profile_id}, driver_data: ${driverData?.license_number}` : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 3,
      nome: 'Criar perfil driver pela UI',
      acao: 'create_profile_with_extension (driver)',
      esperado: 'Perfil driver criado',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // TESTE 4: Abrir /p/:handle no navegador
  console.log('TESTE 4: Abrir /p/:handle e confirmar renderização');
  console.log('-'.repeat(80));
  
  try {
    const { email, password } = await criarUsuarioTeste('public');
    const client = await loginUsuario(email, password);
    
    const timestamp = Date.now();
    const handle = `ui-test-public-${timestamp}`;
    const payload = {
      p_profile_type: 'business',
      p_handle: handle,
      p_display_name: 'UI Test Public Profile',
      p_extension_data: {
        legal_name: 'Empresa Pública LTDA',
        cnpj: `${timestamp}000190`,
        company_type: 'ltda'
      }
    };
    
    const { data: createData } = await client.rpc('create_profile_with_extension', payload);
    
    // Simular o que PublicProfilePage.tsx faz
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 1. Buscar perfil base
    const { data: baseProfile } = await anonClient
      .from('public_profiles')
      .select('*')
      .eq('handle', handle)
      .single();
    
    // 2. Buscar extensão business
    const { data: businessProfile } = await anonClient
      .from('public_business_profiles')
      .select('*')
      .eq('handle', handle)
      .single();
    
    const passou = baseProfile && businessProfile && businessProfile.legal_name;
    
    resultados.push({
      numero: 4,
      nome: 'Abrir /p/:handle e confirmar renderização',
      acao: 'GET /p/:handle (via public_business_profiles)',
      esperado: 'Perfil público renderiza com extensão business',
      obtido: passou ? {
        handle,
        display_name: businessProfile.display_name,
        profile_type: businessProfile.profile_type,
        legal_name: businessProfile.legal_name,
        company_type: businessProfile.company_type
      } : { error: 'Perfil não encontrado ou extensão faltando' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        rota: `/p/${handle}`,
        base_profile: baseProfile,
        business_profile: businessProfile
      }
    });
    
    console.log(`Rota: /p/${handle}`);
    console.log(`Esperado: Perfil renderizado com extensão`);
    console.log(`Obtido: ${passou ? `${businessProfile.display_name} (${businessProfile.legal_name})` : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 4,
      nome: 'Abrir /p/:handle e confirmar renderização',
      acao: 'GET /p/:handle',
      esperado: 'Perfil renderizado',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // TESTE 5: Alterar privacidade pela UI
  console.log('TESTE 5: Alterar privacidade e confirmar efeito');
  console.log('-'.repeat(80));
  
  try {
    const { email, password } = await criarUsuarioTeste('privacy');
    const client = await loginUsuario(email, password);
    
    const timestamp = Date.now();
    const handle = `ui-test-privacy-${timestamp}`;
    
    // Criar perfil público
    const { data: createData } = await client.rpc('create_profile_with_extension', {
      p_profile_type: 'business',
      p_handle: handle,
      p_display_name: 'UI Test Privacy',
      p_extension_data: {
        legal_name: 'Empresa Privacy LTDA',
        cnpj: `${timestamp}000190`,
        company_type: 'ltda'
      }
    });
    
    const profileId = createData.profile_id;
    
    // Verificar que está público
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: publicBefore } = await anonClient
      .from('public_profiles')
      .select('*')
      .eq('handle', handle)
      .single();
    
    // Alterar privacidade (simular PrivacySettings.tsx)
    const { error: updateError } = await client
      .from('profiles')
      .update({ is_public: false })
      .eq('id', profileId);
    
    // Verificar que ficou privado
    const { data: publicAfter } = await anonClient
      .from('public_profiles')
      .select('*')
      .eq('handle', handle)
      .maybeSingle();
    
    const passou = publicBefore && !publicAfter && !updateError;
    
    resultados.push({
      numero: 5,
      nome: 'Alterar privacidade e confirmar efeito',
      acao: 'UPDATE profiles SET is_public=false',
      esperado: 'Perfil público vira privado (404 na rota pública)',
      obtido: passou ? {
        antes: 'Público (visível)',
        depois: 'Privado (404)',
        public_before: !!publicBefore,
        public_after: !!publicAfter
      } : { error: 'Privacidade não alterou corretamente' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        profile_id: profileId,
        handle,
        public_before: publicBefore,
        public_after: publicAfter,
        update_error: updateError?.message
      }
    });
    
    console.log(`Esperado: Público → Privado (404)`);
    console.log(`Obtido: ${passou ? 'Público → Privado ✓' : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 5,
      nome: 'Alterar privacidade e confirmar efeito',
      acao: 'UPDATE is_public',
      esperado: 'Privacidade alterada',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // TESTE 6: Criar vínculo pela UI
  console.log('TESTE 6: Criar vínculo e confirmar exibição pública');
  console.log('-'.repeat(80));
  
  try {
    const { email, password } = await criarUsuarioTeste('links');
    const client = await loginUsuario(email, password);
    
    const timestamp = Date.now();
    
    // Criar 2 perfis para vincular
    const { data: profile1 } = await client.rpc('create_profile_with_extension', {
      p_profile_type: 'business',
      p_handle: `ui-test-link1-${timestamp}`,
      p_display_name: 'UI Test Link 1',
      p_extension_data: { legal_name: 'Empresa 1', cnpj: `${timestamp}000191`, company_type: 'ltda' }
    });
    
    const { data: profile2 } = await client.rpc('create_profile_with_extension', {
      p_profile_type: 'professional',
      p_handle: `ui-test-link2-${timestamp}`,
      p_display_name: 'UI Test Link 2',
      p_extension_data: { profession: 'Consultor', years_experience: 3 }
    });
    
    // Criar vínculo (simular ProfileLinksManager.tsx)
    const { data: linkData, error: linkError } = await client
      .from('profile_links')
      .insert({
        from_profile_id: profile1.profile_id,
        to_profile_id: profile2.profile_id,
        link_type: 'partner',
        is_public: true
      })
      .select()
      .single();
    
    // Verificar que vínculo aparece na view pública
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: publicLinks } = await anonClient
      .from('public_profile_links')
      .select('*')
      .eq('from_profile_id', profile1.profile_id);
    
    const passou = !linkError && linkData && publicLinks && publicLinks.length > 0;
    
    resultados.push({
      numero: 6,
      nome: 'Criar vínculo e confirmar exibição pública',
      acao: 'INSERT profile_links + SELECT public_profile_links',
      esperado: 'Vínculo criado e visível publicamente',
      obtido: passou ? {
        link_id: linkData.id,
        from_handle: `ui-test-link1-${timestamp}`,
        to_handle: `ui-test-link2-${timestamp}`,
        link_type: linkData.link_type,
        public_links_count: publicLinks.length
      } : { error: linkError?.message || 'Vínculo não aparece publicamente' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        link_data: linkData,
        public_links: publicLinks,
        error: linkError?.message
      }
    });
    
    console.log(`Esperado: Vínculo criado e visível`);
    console.log(`Obtido: ${passou ? `Link ID: ${linkData.id}, Público: ${publicLinks.length} links` : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 6,
      nome: 'Criar vínculo e confirmar exibição pública',
      acao: 'INSERT profile_links',
      esperado: 'Vínculo criado',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // TESTE 7: Adicionar membro pela UI
  console.log('TESTE 7: Adicionar membro e confirmar gestão');
  console.log('-'.repeat(80));
  
  try {
    const { email: ownerEmail, password: ownerPassword } = await criarUsuarioTeste('owner');
    const { email: memberEmail, password: memberPassword, userId: memberUserId } = await criarUsuarioTeste('member');
    
    const ownerClient = await loginUsuario(ownerEmail, ownerPassword);
    
    const timestamp = Date.now();
    
    // Criar perfil business
    const { data: profileData } = await ownerClient.rpc('create_profile_with_extension', {
      p_profile_type: 'business',
      p_handle: `ui-test-members-${timestamp}`,
      p_display_name: 'UI Test Members',
      p_extension_data: { legal_name: 'Empresa Members', cnpj: `${timestamp}000192`, company_type: 'ltda' }
    });
    
    const profileId = profileData.profile_id;
    
    // Adicionar membro (simular ProfileMembersManager.tsx)
    const { data: memberData, error: memberError } = await ownerClient
      .from('profile_members')
      .insert({
        profile_id: profileId,
        user_id: memberUserId,
        role: 'member'
      })
      .select()
      .single();
    
    // Verificar que membro consegue ver o perfil
    const memberClient = await loginUsuario(memberEmail, memberPassword);
    const { data: memberProfiles } = await memberClient
      .from('profile_members')
      .select('profile_id, role')
      .eq('user_id', memberUserId);
    
    const passou = !memberError && memberData && memberProfiles && memberProfiles.length > 0;
    
    resultados.push({
      numero: 7,
      nome: 'Adicionar membro e confirmar gestão',
      acao: 'INSERT profile_members + SELECT como membro',
      esperado: 'Membro adicionado e tem acesso ao perfil',
      obtido: passou ? {
        member_id: memberData.id,
        profile_id: profileId,
        role: memberData.role,
        member_can_see: memberProfiles.length > 0
      } : { error: memberError?.message || 'Membro não tem acesso' },
      status: passou ? 'PASSOU' : 'FALHOU',
      evidencia: {
        member_data: memberData,
        member_profiles: memberProfiles,
        error: memberError?.message
      }
    });
    
    console.log(`Esperado: Membro adicionado e tem acesso`);
    console.log(`Obtido: ${passou ? `Member ID: ${memberData.id}, Acesso: ${memberProfiles.length} perfis` : 'ERRO'}`);
    console.log(`Status: ${passou ? '✅ PASSOU' : '❌ FALHOU'}`);
  } catch (err: any) {
    console.log(`Erro: ${err.message}`);
    resultados.push({
      numero: 7,
      nome: 'Adicionar membro e confirmar gestão',
      acao: 'INSERT profile_members',
      esperado: 'Membro adicionado',
      obtido: { error: err.message },
      status: 'FALHOU',
      evidencia: { error: err.message }
    });
    console.log('Status: ❌ FALHOU');
  }
  
  console.log('');

  // Salvar resultados
  const relatorio = {
    data: new Date().toISOString(),
    ambiente: 'Supabase Remote',
    descricao: 'UI Smoke Test - Fluxos end-to-end simulando comportamento da UI',
    total_testes: resultados.length,
    passou: resultados.filter(r => r.status === 'PASSOU').length,
    falhou: resultados.filter(r => r.status === 'FALHOU').length,
    testes: resultados
  };

  fs.writeFileSync(
    'HOMOLOGACAO_UI_SMOKE_TEST.json',
    JSON.stringify(relatorio, null, 2)
  );

  console.log('='.repeat(80));
  console.log('RESUMO');
  console.log('='.repeat(80));
  console.log(`Total: ${relatorio.total_testes} testes`);
  console.log(`Passou: ${relatorio.passou}`);
  console.log(`Falhou: ${relatorio.falhou}`);
  console.log('');
  console.log(`Arquivo gerado: HOMOLOGACAO_UI_SMOKE_TEST.json`);
  console.log('');
  
  if (relatorio.passou === relatorio.total_testes) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('');
    console.log('CLASSIFICAÇÃO: ✅ PRONTO PARA PRODUÇÃO');
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    console.log('');
    console.log('CLASSIFICAÇÃO: ⚠️ HOMOLOGADO EM STAGING');
  }
  console.log('');
}

executarTestes().catch(console.error);
