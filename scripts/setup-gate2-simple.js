/**
 * GATE 2: Setup simplificado - apenas criar profile e driver_data
 * Assume que o usuário f68e2893-6893-40e1-96b2-e3b16b238957 já foi criado
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
const USER_ID = 'f68e2893-6893-40e1-96b2-e3b16b238957'; // Usuário já criado

async function setup() {
  console.log('========================================');
  console.log('GATE 2: Setup Motorista de Teste');
  console.log('========================================\n');
  console.log(`User ID: ${USER_ID}`);
  console.log(`Email: ${TEST_DRIVER_EMAIL}\n`);

  try {
    // PASSO 1: Criar ou buscar profile
    console.log('1. Verificando profile...');
    
    let getProfileResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${USER_ID}&select=id`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      }
    );

    let profiles = await getProfileResponse.json();
    let profileId;

    if (profiles && profiles.length > 0) {
      profileId = profiles[0].id;
      console.log(`✅ Profile já existe: ${profileId}`);
    } else {
      console.log('2. Criando profile...');
      
      const createProfileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          user_id: USER_ID,
          username: 'test_driver',
          name: 'Test Driver',
          profile_type: 'driver'
        })
      });

      if (!createProfileResponse.ok) {
        const error = await createProfileResponse.json();
        throw new Error(`Erro ao criar profile: ${JSON.stringify(error)}`);
      }

      const profileData = await createProfileResponse.json();
      profileId = profileData[0].id;
      console.log(`✅ Profile criado: ${profileId}`);
    }

    // PASSO 2: Criar ou verificar driver_data
    console.log('\n3. Verificando driver_data...');
    
    const getDriverDataResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/driver_data?profile_id=eq.${profileId}&select=id`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        }
      }
    );

    const driverDataList = await getDriverDataResponse.json();

    if (driverDataList && driverDataList.length > 0) {
      console.log('✅ Driver data já existe');
    } else {
      console.log('4. Criando driver_data...');
      
      const createDriverDataResponse = await fetch(`${SUPABASE_URL}/rest/v1/driver_data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          profile_id: profileId,
          is_online: true
        })
      });

      if (!createDriverDataResponse.ok) {
        const error = await createDriverDataResponse.json();
        throw new Error(`Erro ao criar driver_data: ${JSON.stringify(error)}`);
      }

      console.log('✅ Driver data criado');
    }

    // PASSO 3: Salvar credenciais
    console.log('\n5. Salvando credenciais...');

    const envTestContent = `# GATE 2: Credenciais de teste
# NÃO COMMITAR ESTE ARQUIVO

# Supabase
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_ANON_KEY}

# Test Driver
TEST_DRIVER_EMAIL=${TEST_DRIVER_EMAIL}
TEST_DRIVER_PASSWORD=${TEST_DRIVER_PASSWORD}
TEST_DRIVER_USER_ID=${USER_ID}
TEST_DRIVER_PROFILE_ID=${profileId}
`;

    const fs = await import('fs');
    fs.writeFileSync(join(__dirname, '..', '.env.test'), envTestContent);
    console.log('✅ Credenciais salvas em .env.test');

    console.log('\n========================================');
    console.log('✅ SETUP COMPLETO');
    console.log('========================================');
    console.log(`User ID: ${USER_ID}`);
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

setup();
