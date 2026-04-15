/**
 * GATE 2: Criar motorista de teste via API REST
 * Usa fetch direto para criar usuário via Admin API
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const TEST_DRIVER_EMAIL = 'test-driver@acheguese.local';
const TEST_DRIVER_PASSWORD = 'TestDriver123!@#';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

async function createTestDriver() {
  console.log('========================================');
  console.log('GATE 2: Criar Motorista de Teste');
  console.log('========================================\n');

  try {
    // PASSO 1: Criar usuário via Admin API
    console.log('1. Criando usuário via Admin API...');
    
    const createUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({
        email: TEST_DRIVER_EMAIL,
        password: TEST_DRIVER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Driver',
          role: 'driver'
        }
      })
    });

    if (!createUserResponse.ok) {
      const error = await createUserResponse.json();
      
      // Se usuário já existe, buscar ID
      if (error.error_code === 'email_exists' || error.code === 'user_already_exists' || error.msg?.includes('already registered')) {
        console.log('⚠️ Usuário já existe, buscando ID...');
        
        // Listar usuários para encontrar o ID
        const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          }
        });

        if (!listResponse.ok) {
          throw new Error('Erro ao listar usuários');
        }

        const listData = await listResponse.json();
        const users = listData.users || listData;
        const existingUser = users.find(u => u.email === TEST_DRIVER_EMAIL);
        
        if (!existingUser) {
          throw new Error('Usuário existe mas não foi encontrado na listagem');
        }

        console.log(`✅ Usuário encontrado: ${existingUser.id}`);
        await createProfileAndDriverData(existingUser.id);
        return;
      }
      
      throw new Error(`Erro ao criar usuário: ${JSON.stringify(error)}`);
    }

    const userData = await createUserResponse.json();
    console.log(`✅ Usuário criado: ${userData.id}`);

    // PASSO 2: Criar profile e driver_data
    await createProfileAndDriverData(userData.id);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

async function createProfileAndDriverData(userId) {
  console.log('\n2. Criando profile...');

  // Criar profile
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: userId,
      username: 'test_driver',
      name: 'Test Driver',
      profile_type: 'driver'
    })
  });

  if (!profileResponse.ok) {
    const error = await profileResponse.json();
    
    // Se profile já existe, buscar ID
    if (error.code === '23505') { // unique violation
      console.log('⚠️ Profile já existe, buscando ID...');
      
      const getProfileResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=id`,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY
          }
        }
      );

      const profiles = await getProfileResponse.json();
      if (!profiles || profiles.length === 0) {
        throw new Error('Profile existe mas não foi encontrado');
      }

      const profileId = profiles[0].id;
      console.log(`✅ Profile encontrado: ${profileId}`);
      await createDriverData(profileId, userId);
      return;
    }
    
    throw new Error(`Erro ao criar profile: ${JSON.stringify(error)}`);
  }

  const profileData = await profileResponse.json();
  const profileId = profileData[0].id;
  console.log(`✅ Profile criado: ${profileId}`);

  await createDriverData(profileId, userId);
}

async function createDriverData(profileId, userId) {
  console.log('\n3. Criando driver_data...');

  const driverDataResponse = await fetch(`${SUPABASE_URL}/rest/v1/driver_data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'apikey': SUPABASE_SERVICE_KEY,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      driver_profile_id: profileId,
      is_online: true,
      is_available: true
    })
  });

  if (!driverDataResponse.ok) {
    const error = await driverDataResponse.json();
    
    if (error.code === '23505') { // unique violation
      console.log('✅ Driver data já existe');
    } else {
      throw new Error(`Erro ao criar driver_data: ${JSON.stringify(error)}`);
    }
  } else {
    console.log('✅ Driver data criado');
  }

  // Salvar credenciais
  await saveCredentials(userId, profileId);
}

async function saveCredentials(userId, profileId) {
  console.log('\n4. Salvando credenciais...');

  const envTestContent = `# GATE 2: Credenciais de teste
# NÃO COMMITAR ESTE ARQUIVO

# Supabase
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_ANON_KEY}

# Test Driver
TEST_DRIVER_EMAIL=${TEST_DRIVER_EMAIL}
TEST_DRIVER_PASSWORD=${TEST_DRIVER_PASSWORD}
TEST_DRIVER_USER_ID=${userId}
TEST_DRIVER_PROFILE_ID=${profileId}
`;

  const fs = await import('fs');
  fs.writeFileSync(join(__dirname, '..', '.env.test'), envTestContent);
  console.log('✅ Credenciais salvas em .env.test');

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
}

createTestDriver();
