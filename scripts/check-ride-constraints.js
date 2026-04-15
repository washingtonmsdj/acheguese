/**
 * Verificar CHECK constraints da tabela ride_requests
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkConstraints() {
  console.log('Verificando CHECK constraints de ride_requests...\n');

  // Tentar inserir um estado válido que pode não estar no constraint
  const testStates = [
    'requested',
    'searching_driver',
    'driver_assigned',
    'driver_accepted',
    'driver_arriving',
    'passenger_boarded',
    'in_progress',
    'completed',
    'cancelled_by_passenger',
    'cancelled_by_driver',
    'expired',
    'failed',
  ];

  console.log('Estados que devem ser aceitos:');
  testStates.forEach(s => console.log(`  - ${s}`));

  console.log('\nVerificando se tabela ride_state_audit existe...');
  const auditResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/ride_state_audit?select=id&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    }
  );

  if (auditResponse.ok) {
    console.log('✅ Tabela ride_state_audit existe');
  } else {
    console.log('❌ Tabela ride_state_audit NÃO existe');
  }

  console.log('\nVerificando se tabela driver_availability tem is_available...');
  const availResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/driver_availability?select=is_available&limit=1`,
    {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    }
  );

  if (availResponse.ok) {
    console.log('✅ Tabela driver_availability existe com is_available');
  } else {
    console.log('❌ Tabela driver_availability NÃO existe ou sem is_available');
  }
}

checkConstraints().catch(console.error);