/**
 * Script final para criar usuário admin
 * Execute com: node scripts/create_admin_final.js
 */

import { createClient } from '@supabase/supabase-js';

// Credenciais diretas do arquivo .env.remote
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = "process.env.SUPABASE_SERVICE_ROLE_KEY!";

console.log('🔄 Conectando ao Supabase...');
console.log(`URL: ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ ADMIN_EMAIL e ADMIN_PASSWORD são obrigatórios.');
    console.error('   Configure em .env.local antes de executar este script.');
    process.exit(1);
  }

  console.log('\n🔄 Criando usuário admin...');
  console.log(`📧 Email: ${email}`);

  try {
    // 1. Criar usuário via Admin API
    console.log('Tentando criar usuário...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: 'Admin',
      }
    });

    if (userError) {
      if (userError.message.includes('already registered') || userError.message.includes('already been registered')) {
        console.log('⚠️  Usuário já existe, buscando ID...');
        
        // Buscar usuário existente
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
          console.error('Erro ao listar usuários:', listError);
          throw listError;
        }
        
        const existingUser = users.users.find(u => u.email === email);
        if (!existingUser) {
          throw new Error('Usuário não encontrado na lista');
        }
        
        console.log(`✅ Usuário encontrado: ${existingUser.id}`);
        
        // Adicionar role de admin
        await addAdminRole(existingUser.id);
        
        console.log('');
        console.log('🎉 Sucesso! Role de admin adicionada ao usuário existente:');
        console.log(`   Email: ${email}`);
        console.log(`   ID: ${existingUser.id}`);
        return;
      }
      throw userError;
    }

    if (!userData.user) {
      throw new Error('Usuário não foi criado');
    }

    console.log(`✅ Usuário criado: ${userData.user.id}`);

    // 2. Adicionar role de admin
    await addAdminRole(userData.user.id);

    console.log('');
    console.log('🎉 Sucesso! Usuário admin criado:');
    console.log(`   Email: ${email}`);
    console.log(`   ID: ${userData.user.id}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.details) console.error('Detalhes:', error.details);
    if (error.hint) console.error('Dica:', error.hint);
    process.exit(1);
  }
}

async function addAdminRole(userId) {
  console.log('🔄 Adicionando role de admin...');

  const { error } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      role: 'admin',
      granted_at: new Date().toISOString(),
      is_active: true,
    }, {
      onConflict: 'user_id,role'
    });

  if (error) {
    console.error('Erro ao adicionar role:', error);
    throw error;
  }

  console.log('✅ Role de admin adicionada');
}

// Executar
createAdminUser();