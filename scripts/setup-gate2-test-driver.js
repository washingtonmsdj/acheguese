/**
 * GATE 2: Setup completo do motorista de teste
 * Cria usuário, profile e driver_data via código
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TEST_DRIVER_EMAIL = 'test-driver@acheguese.local';
const TEST_DRIVER_PASSWORD = 'TestDriver123!@#';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Verifique VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env');
  process.exit(1);
}

// Cliente com service role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestDriver() {
  console.log('========================================');
  console.log('GATE 2: Setup Motorista de Teste');
  console.log('========================================\n');

  try {
    // PASSO 1: Verificar se usuário já existe
    console.log('1. Verificando se usuário já existe...');
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === TEST_DRIVER_EMAIL);

    let userId;

    if (existingUser) {
      userId = existingUser.id;
      console.log(`✅ Usuário já existe: ${userId}`);
    } else {
      // PASSO 2: Criar usuário
      console.log('2. Criando usuário...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_DRIVER_EMAIL,
        password: TEST_DRIVER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Driver',
          role: 'driver'
        }
      });

      if (createError) {
        throw new Error(`Erro ao criar usuário: ${createError.message}`);
      }

      userId = newUser.user.id;
      console.log(`✅ Usuário criado: ${userId}`);
    }

    // PASSO 3: Verificar se profile já existe
    console.log('\n3. Verificando profile...');
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let profileId;

    if (existingProfile) {
      profileId = existingProfile.id;
      console.log(`✅ Profile já existe: ${profileId}`);
    } else {
      // PASSO 4: Criar profile
      console.log('4. Criando profile...');
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          username: 'test_driver',
          full_name: 'Test Driver',
          profile_type: 'driver'
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`Erro ao criar profile: ${profileError.message}`);
      }

      profileId = newProfile.id;
      console.log(`✅ Profile criado: ${profileId}`);
    }

    // PASSO 5: Verificar se driver_data já existe
    console.log('\n5. Verificando driver_data...');
    const { data: existingDriverData } = await supabase
      .from('driver_data')
      .select('id')
      .eq('driver_profile_id', profileId)
      .single();

    if (existingDriverData) {
      console.log('✅ Driver data já existe');
    } else {
      // PASSO 6: Criar driver_data
      console.log('6. Criando driver_data...');
      const { error: driverDataError } = await supabase
        .from('driver_data')
        .insert({
          driver_profile_id: profileId,
          is_online: true,
          is_available: true
        });

      if (driverDataError) {
        throw new Error(`Erro ao criar driver_data: ${driverDataError.message}`);
      }

      console.log('✅ Driver data criado');
    }

    // PASSO 7: Salvar credenciais em .env.test
    console.log('\n7. Salvando credenciais...');
    const envTestContent = `# GATE 2: Credenciais de teste
# NÃO COMMITAR ESTE ARQUIVO

# Supabase
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_PUBLISHABLE_KEY=${process.env.VITE_SUPABASE_PUBLISHABLE_KEY}

# Test Driver
TEST_DRIVER_EMAIL=${TEST_DRIVER_EMAIL}
TEST_DRIVER_PASSWORD=${TEST_DRIVER_PASSWORD}
TEST_DRIVER_USER_ID=${userId}
TEST_DRIVER_PROFILE_ID=${profileId}
`;

    const fs = await import('fs');
    fs.writeFileSync(join(__dirname, '..', '.env.test'), envTestContent);
    console.log('✅ Credenciais salvas em .env.test');

    // PASSO 8: Resumo
    console.log('\n========================================');
    console.log('✅ SETUP COMPLETO');
    console.log('========================================');
    console.log(`User ID: ${userId}`);
    console.log(`Profile ID: ${profileId}`);
    console.log(`Email: ${TEST_DRIVER_EMAIL}`);
    console.log(`Password: ${TEST_DRIVER_PASSWORD}`);
    console.log('\nPróximo passo:');
    console.log('npm run test tests/operational/gate2-real-auth-validation.test.ts');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

setupTestDriver();
