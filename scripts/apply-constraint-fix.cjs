/**
 * Script para aplicar constraint com pickup_confirmed
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🔧 Aplicando constraint com pickup_confirmed...\n');

  // Remover constraint antigo
  console.log('📋 PASSO 1: Removendo constraint antigo...');
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE ride_requests DROP CONSTRAINT IF EXISTS ride_requests_status_check;'
  });

  if (dropError) {
    console.error('❌ Erro ao remover constraint:', dropError);
    // Continuar mesmo com erro (pode não existir)
  } else {
    console.log('   ✅ Constraint antigo removido');
  }

  // Criar constraint novo
  console.log('\n📋 PASSO 2: Criando constraint novo...');
  const constraintSQL = `
    ALTER TABLE ride_requests
    ADD CONSTRAINT ride_requests_status_check CHECK (
      status IN (
        'requested', 'searching_driver',
        'driver_assigned', 'driver_accepted', 'driver_arriving',
        'passenger_boarded', 'in_progress',
        'pickup_confirmed', 'in_delivery', 'delivered', 'failed_delivery',
        'completed', 'cancelled_by_passenger', 'cancelled_by_driver', 'expired', 'failed',
        'pending', 'accepted', 'cancelled'
      )
    );
  `;

  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: constraintSQL
  });

  if (createError) {
    console.error('❌ Erro ao criar constraint:', createError);
    process.exit(1);
  }

  console.log('   ✅ Constraint criado com sucesso');

  console.log('\n🎉 CONSTRAINT APLICADO!');
  console.log('\n📝 PRÓXIMO PASSO:');
  console.log('   Execute os testes:');
  console.log('   npm test tests/operational/gate6-motoboy-runtime.test.ts');
}

main().catch(console.error);
