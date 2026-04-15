import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

async function criarUsuarioTeste(email: string, password: string) {
  console.log(`  Criando usuário: ${email}`);
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (error) {
    console.error(`  ❌ Erro:`, error);
    throw error;
  }
  console.log(`  ✅ Criado: ${data.user.id}`);
  return data.user;
}

async function loginUsuario(email: string, password: string) {
  console.log(`  Login: ${email}`);
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(`  ❌ Erro no login:`, error);
    throw error;
  }
  console.log(`  ✅ Autenticado`);
  return client;
}

async function executarTestes() {
  console.log('🧪 TESTE DE OWNERSHIP E PROFILE_LINKS\n');
  console.log('=' .repeat(80) + '\n');
  
  const timestamp = Date.now();
  
  // Criar usuários de teste
  console.log('📝 Criando usuários de teste...');
  const ownerEmail = `owner-links-${timestamp}@example.com`;
  const memberEmail = `member-links-${timestamp}@example.com`;
  const password = 'Teste123!@#';
  
  const ownerUser = await criarUsuarioTeste(ownerEmail, password);
  const memberUser = await criarUsuarioTeste(memberEmail, password);
  
  console.log(`✅ Owner: ${ownerUser.id}`);
  console.log(`✅ Member: ${memberUser.id}\n`);
  
  // Login como owner
  const ownerClient = await loginUsuario(ownerEmail, password);
  
  // TESTE A: Criar perfil business como owner estrutural
  console.log('TESTE A: Criar perfil business (owner estrutural)');
  const handleBusiness = `teste-biz-${timestamp}`;
  const { data: profileData, error: profileError } = await ownerClient.rpc('create_profile_with_extension', {
    p_profile_type: 'business',
    p_handle: handleBusiness,
    p_display_name: 'Teste Business Ownership',
    p_extension_data: {
      legal_name: 'Empresa Teste LTDA',
      cnpj: `${timestamp}000190`,
      company_type: 'ltda',
      industry: 'Tecnologia'
    }
  });
  
  if (profileError) {
    console.error('❌ Erro ao criar perfil:', profileError);
    return;
  }
  
  const businessProfileId = profileData.profile_id;
  console.log(`✅ Business criado: ${businessProfileId}`);
  console.log(`   Handle: ${handleBusiness}\n`);
  
  resultados.push({
    nome: 'TESTE A: Criar perfil business',
    acao: 'create_profile_with_extension',
    payload: { p_profile_type: 'business', p_handle: handleBusiness },
    esperado: 'Perfil business criado com sucesso',
    obtido: `Profile ID: ${businessProfileId}`,
    passou: true,
    evidencia: profileData
  });
  
  // Criar segundo perfil professional para link (mesma conta)
  console.log('Criando perfil professional para link...');
  const handleProfessional = `teste-prof-${timestamp}`;
  const { data: professionalData } = await ownerClient.rpc('create_profile_with_extension', {
    p_profile_type: 'professional',
    p_handle: handleProfessional,
    p_display_name: 'Teste Professional',
    p_extension_data: {
      profession: 'Consultor',
      specialties: 'TI',
      years_experience: 5
    }
  });
  
  const professionalProfileId = professionalData.profile_id;
  console.log(`✅ Professional criado: ${professionalProfileId}\n`);
  
  // TESTE B: Transferir ownership operacional para member
  console.log('TESTE B: Transferir ownership operacional');
  
  // Primeiro adicionar member
  const { data: memberData, error: memberError } = await serviceClient
    .from('profile_members')
    .insert({
      profile_id: businessProfileId,
      user_id: memberUser.id,
      role: 'member'
    })
    .select()
    .single();
  
  if (memberError) {
    console.error('❌ Erro ao adicionar member:', memberError);
    return;
  }
  
  console.log(`✅ Member adicionado: ${memberData.id}`);
  
  // Transferir ownership
  const { data: transferData, error: transferError } = await ownerClient.rpc('transfer_profile_ownership', {
    p_profile_id: businessProfileId,
    p_new_owner_user_id: memberUser.id
  });
  
  if (transferError) {
    console.error('❌ Erro ao transferir ownership:', transferError);
    return;
  }
  
  console.log(`✅ Ownership transferido para: ${memberUser.id}\n`);
  
  resultados.push({
    nome: 'TESTE B: Transferir ownership operacional',
    acao: 'transfer_profile_ownership',
    payload: { p_profile_id: businessProfileId, p_new_owner_user_id: memberUser.id },
    esperado: 'Ownership transferido com sucesso',
    obtido: 'Success: true',
    passou: true,
    evidencia: transferData
  });
  
  // Login como novo owner operacional
  const newOwnerClient = await loginUsuario(memberEmail, password);
  
  // TESTE C: Novo owner operacional cria profile_link
  console.log('TESTE C: Novo owner operacional cria profile_link');
  const { data: linkData, error: linkError } = await newOwnerClient
    .from('profile_links')
    .insert({
      from_profile_id: businessProfileId,
      to_profile_id: professionalProfileId,
      link_type: 'partner',
      is_public: true
    })
    .select()
    .single();
  
  if (linkError) {
    console.error('❌ FALHOU: Novo owner operacional NÃO conseguiu criar link');
    console.error('   Erro:', linkError.message);
    console.error('   Code:', linkError.code);
    
    resultados.push({
      nome: 'TESTE C: Novo owner operacional cria link',
      acao: 'INSERT profile_links',
      payload: { from_profile_id: businessProfileId, to_profile_id: professionalProfileId, link_type: 'partner' },
      esperado: 'Link criado com sucesso (owner operacional pode gerenciar)',
      obtido: `ERRO: ${linkError.message}`,
      passou: false,
      evidencia: { error: linkError }
    });
    
    console.log('\n🐛 BUG CONFIRMADO: Policy RLS não permite owner operacional gerenciar links\n');
  } else {
    console.log(`✅ PASSOU: Link criado com sucesso`);
    console.log(`   Link ID: ${linkData.id}\n`);
    
    resultados.push({
      nome: 'TESTE C: Novo owner operacional cria link',
      acao: 'INSERT profile_links',
      payload: { from_profile_id: businessProfileId, to_profile_id: professionalProfileId, link_type: 'partner' },
      esperado: 'Link criado com sucesso',
      obtido: `Link ID: ${linkData.id}`,
      passou: true,
      evidencia: linkData
    });
    
    // TESTE D: Editar profile_link
    console.log('TESTE D: Novo owner operacional edita profile_link');
    const { data: updateData, error: updateError } = await newOwnerClient
      .from('profile_links')
      .update({ display_order: 10 })
      .eq('id', linkData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ FALHOU: Não conseguiu editar link');
      console.error('   Erro:', updateError.message);
      
      resultados.push({
        nome: 'TESTE D: Novo owner operacional edita link',
        acao: 'UPDATE profile_links',
        payload: { id: linkData.id, display_order: 10 },
        esperado: 'Link editado com sucesso',
        obtido: `ERRO: ${updateError.message}`,
        passou: false,
        evidencia: { error: updateError }
      });
    } else {
      console.log(`✅ PASSOU: Link editado`);
      console.log(`   Display order: ${updateData.display_order}\n`);
      
      resultados.push({
        nome: 'TESTE D: Novo owner operacional edita link',
        acao: 'UPDATE profile_links',
        payload: { id: linkData.id, display_order: 10 },
        esperado: 'Link editado com sucesso',
        obtido: `Display order: ${updateData.display_order}`,
        passou: true,
        evidencia: updateData
      });
    }
    
    // TESTE E: Deletar profile_link
    console.log('TESTE E: Novo owner operacional deleta profile_link');
    const { error: deleteError } = await newOwnerClient
      .from('profile_links')
      .delete()
      .eq('id', linkData.id);
    
    if (deleteError) {
      console.error('❌ FALHOU: Não conseguiu deletar link');
      console.error('   Erro:', deleteError.message);
      
      resultados.push({
        nome: 'TESTE E: Novo owner operacional deleta link',
        acao: 'DELETE profile_links',
        payload: { id: linkData.id },
        esperado: 'Link deletado com sucesso',
        obtido: `ERRO: ${deleteError.message}`,
        passou: false,
        evidencia: { error: deleteError }
      });
    } else {
      console.log(`✅ PASSOU: Link deletado\n`);
      
      resultados.push({
        nome: 'TESTE E: Novo owner operacional deleta link',
        acao: 'DELETE profile_links',
        payload: { id: linkData.id },
        esperado: 'Link deletado com sucesso',
        obtido: 'Link deletado',
        passou: true,
        evidencia: { success: true }
      });
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMO DOS TESTES\n');
  
  const passou = resultados.filter(r => r.passou).length;
  const falhou = resultados.filter(r => !r.passou).length;
  
  console.log(`Total: ${resultados.length}`);
  console.log(`✅ Passou: ${passou}`);
  console.log(`❌ Falhou: ${falhou}`);
  console.log(`Taxa: ${((passou / resultados.length) * 100).toFixed(1)}%\n`);
  
  // Salvar evidências
  const fs = await import('fs/promises');
  await fs.writeFile(
    'TESTE_OWNERSHIP_LINKS.json',
    JSON.stringify({
      data: new Date().toISOString(),
      usuarios: {
        owner_estrutural: { id: ownerUser.id, email: ownerEmail },
        novo_owner_operacional: { id: memberUser.id, email: memberEmail }
      },
      perfis: {
        business: { id: businessProfileId, handle: handleBusiness },
        professional: { id: professionalProfileId, handle: handleProfessional }
      },
      testes: resultados,
      resumo: {
        total: resultados.length,
        passou,
        falhou,
        taxa_sucesso: `${((passou / resultados.length) * 100).toFixed(1)}%`
      }
    }, null, 2)
  );
  
  console.log('💾 Evidências salvas em: TESTE_OWNERSHIP_LINKS.json\n');
  
  if (falhou > 0) {
    console.log('🐛 BUG DETECTADO: Policies RLS não permitem owner operacional gerenciar links');
    console.log('   Correção necessária na migration de RLS profile_links\n');
  }
}


executarTestes().catch((error) => {
  console.error('❌ ERRO FATAL:', error);
  process.exit(1);
});
