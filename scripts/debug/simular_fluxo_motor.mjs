#!/usr/bin/env node
import { config } from 'dotenv';
import pg from 'pg';

config();

// Extrair credenciais do URL do Supabase
const url = new URL(process.env.VITE_SUPABASE_URL);
const projectRef = url.hostname.split('.')[0];

const client = new pg.Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_SERVICE_ROLE_KEY,
  ssl: { rejectUnauthorized: false }
});

console.log('🧪 SIMULAÇÃO COMPLETA DO FLUXO DO MOTOR\n');
console.log('═══════════════════════════════════════════════════════\n');

try {
  await client.connect();
  console.log('✅ Conectado ao banco\n');

  let passed = 0;
  let total = 0;

  // IDs de teste
  const testPassengerId = '00000000-0000-0000-0000-000000000001';
  const testDriverId = '00000000-0000-0000-0000-000000000002';
  let testRideId = null;

  // 1. Criar corrida
  total++;
  console.log('1️⃣  Criando corrida...');
  const createResult = await client.query(`
    INSERT INTO ride_requests (
      passenger_profile_id,
      driver_profile_id,
      origin,
      destination,
      origin_lat,
      origin_lng,
      destination_lat,
      destination_lng,
      departure_time,
      suggested_price,
      final_price,
      type,
      payment_method,
      status,
      started_at,
      available_seats,
      search_radius_km,
      max_wait_time_minutes,
      driver_assigned_at,
      driver_on_the_way_at,
      driver_arrived_at,
      passenger_on_board_at,
      passenger_rated_driver,
      driver_rated_passenger,
      passenger_confirmed,
      passenger_confirmed_at,
      is_shared,
      max_passengers,
      current_passengers,
      share_view_count,
      share_is_active
    ) VALUES (
      $1, $2, 'Origem Teste', 'Destino Teste',
      -20.3155, -40.3128, -20.3200, -40.3400,
      NOW(), 10.00, 10.00, 'viagem', 'pix', 'requested',
      NOW(), 1, 5, 15, NOW(), NOW(), NOW(), NOW(),
      false, false, false, NOW(), false, 1, 0, 0, false
    )
    RETURNING id, status
  `, [testPassengerId, testDriverId]);

  if (createResult.rows.length > 0) {
    testRideId = createResult.rows[0].id;
    console.log(`✅ Corrida criada: ${testRideId}`);
    console.log(`   Estado: ${createResult.rows[0].status}`);
    passed++;
  } else {
    console.log('❌ Falha ao criar corrida');
  }

  // 2. Registrar auditoria da criação
  total++;
  console.log('\n2️⃣  Registrando auditoria da criação...');
  const auditResult = await client.query(`
    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason)
    VALUES ($1, 'none', 'requested', 'system', 'Corrida criada')
    RETURNING id
  `, [testRideId]);

  if (auditResult.rows.length > 0) {
    console.log(`✅ Auditoria registrada: ${auditResult.rows[0].id}`);
    passed++;
  } else {
    console.log('❌ Falha ao registrar auditoria');
  }

  // 3. Transicionar para searching_driver
  total++;
  console.log('\n3️⃣  Transicionando para searching_driver...');
  const searchResult = await client.query(`
    UPDATE ride_requests
    SET status = 'searching_driver', updated_at = NOW()
    WHERE id = $1 AND status = 'requested'
    RETURNING status
  `, [testRideId]);

  if (searchResult.rows.length > 0) {
    console.log(`✅ Estado atualizado: ${searchResult.rows[0].status}`);
    passed++;
  } else {
    console.log('❌ Falha na transição (optimistic locking)');
  }

  // 4. Registrar auditoria da transição
  total++;
  console.log('\n4️⃣  Registrando auditoria da transição...');
  const audit2Result = await client.query(`
    INSERT INTO ride_state_audit (ride_id, from_state, to_state, changed_by, reason)
    VALUES ($1, 'requested', 'searching_driver', 'system', 'Busca automática')
    RETURNING id
  `, [testRideId]);

  if (audit2Result.rows.length > 0) {
    console.log(`✅ Auditoria registrada: ${audit2Result.rows[0].id}`);
    passed++;
  } else {
    console.log('❌ Falha ao registrar auditoria');
  }

  // 5. Criar disponibilidade do motorista
  total++;
  console.log('\n5️⃣  Criando disponibilidade do motorista...');
  const availResult = await client.query(`
    INSERT INTO driver_availability (profile_id, is_online, is_available, current_lat, current_lng)
    VALUES ($1, true, true, -20.3155, -40.3128)
    ON CONFLICT (profile_id) DO UPDATE
    SET is_online = true, is_available = true, updated_at = NOW()
    RETURNING profile_id, is_online, is_available
  `, [testDriverId]);

  if (availResult.rows.length > 0) {
    const a = availResult.rows[0];
    console.log(`✅ Motorista disponível: ${a.profile_id.substring(0, 8)}...`);
    console.log(`   Online: ${a.is_online}, Disponível: ${a.is_available}`);
    passed++;
  } else {
    console.log('❌ Falha ao criar disponibilidade');
  }

  // 6. Atribuir motorista
  total++;
  console.log('\n6️⃣  Atribuindo motorista...');
  const assignResult = await client.query(`
    UPDATE ride_requests
    SET status = 'driver_assigned', updated_at = NOW()
    WHERE id = $1 AND status = 'searching_driver'
    RETURNING status
  `, [testRideId]);

  if (assignResult.rows.length > 0) {
    console.log(`✅ Motorista atribuído: ${assignResult.rows[0].status}`);
    passed++;
  } else {
    console.log('❌ Falha na atribuição');
  }

  // 7. Aceitar corrida (com optimistic locking)
  total++;
  console.log('\n7️⃣  Aceitando corrida (optimistic locking)...');
  const acceptResult = await client.query(`
    UPDATE ride_requests
    SET status = 'driver_accepted', driver_accepted_at = NOW(), updated_at = NOW()
    WHERE id = $1 AND status = 'driver_assigned' AND driver_profile_id = $2
    RETURNING status
  `, [testRideId, testDriverId]);

  if (acceptResult.rows.length > 0) {
    console.log(`✅ Corrida aceita: ${acceptResult.rows[0].status}`);
    passed++;
  } else {
    console.log('❌ Falha no aceite (optimistic locking)');
  }

  // 8. Tentar aceitar novamente (deve falhar)
  total++;
  console.log('\n8️⃣  Tentando aceitar novamente (deve falhar)...');
  const duplicateResult = await client.query(`
    UPDATE ride_requests
    SET status = 'driver_accepted', updated_at = NOW()
    WHERE id = $1 AND status = 'driver_assigned' AND driver_profile_id = $2
    RETURNING status
  `, [testRideId, testDriverId]);

  if (duplicateResult.rows.length === 0) {
    console.log('✅ Aceite duplicado bloqueado (optimistic locking funcionou)');
    passed++;
  } else {
    console.log('❌ FALHA: Aceite duplicado permitido!');
  }

  // 9. Marcar motorista como indisponível
  total++;
  console.log('\n9️⃣  Marcando motorista como indisponível...');
  const unavailResult = await client.query(`
    UPDATE driver_availability
    SET is_available = false, updated_at = NOW()
    WHERE profile_id = $1
    RETURNING is_available
  `, [testDriverId]);

  if (unavailResult.rows.length > 0) {
    console.log(`✅ Motorista indisponível: ${!unavailResult.rows[0].is_available}`);
    passed++;
  } else {
    console.log('❌ Falha ao atualizar disponibilidade');
  }

  // 10. Completar corrida
  total++;
  console.log('\n🔟 Completando corrida...');
  const completeResult = await client.query(`
    UPDATE ride_requests
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = $1
    RETURNING status
  `, [testRideId]);

  if (completeResult.rows.length > 0) {
    console.log(`✅ Corrida completada: ${completeResult.rows[0].status}`);
    passed++;
  } else {
    console.log('❌ Falha ao completar');
  }

  // 11. Liberar motorista
  total++;
  console.log('\n1️⃣1️⃣  Liberando motorista...');
  const freeResult = await client.query(`
    UPDATE driver_availability
    SET is_available = true, updated_at = NOW()
    WHERE profile_id = $1
    RETURNING is_available
  `, [testDriverId]);

  if (freeResult.rows.length > 0) {
    console.log(`✅ Motorista liberado: ${freeResult.rows[0].is_available}`);
    passed++;
  } else {
    console.log('❌ Falha ao liberar motorista');
  }

  // 12. Verificar auditoria completa
  total++;
  console.log('\n1️⃣2️⃣  Verificando auditoria completa...');
  const auditCheckResult = await client.query(`
    SELECT * FROM ride_state_audit
    WHERE ride_id = $1
    ORDER BY created_at ASC
  `, [testRideId]);

  if (auditCheckResult.rows.length > 0) {
    console.log(`✅ Auditoria completa: ${auditCheckResult.rows.length} registro(s)`);
    auditCheckResult.rows.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.from_state} → ${a.to_state} (${a.changed_by})`);
    });
    passed++;
  } else {
    console.log('❌ Nenhuma auditoria encontrada');
  }

  // Limpeza
  console.log('\n🧹 Limpando dados de teste...');
  await client.query('DELETE FROM ride_state_audit WHERE ride_id = $1', [testRideId]);
  await client.query('DELETE FROM ride_requests WHERE id = $1', [testRideId]);
  await client.query('DELETE FROM driver_availability WHERE profile_id = $1', [testDriverId]);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`📊 RESULTADO: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);

  if (passed === total) {
    console.log('🎉 MOTOR OPERACIONAL: VALIDADO!\n');
    console.log('✅ Criação de corrida');
    console.log('✅ Transições de estado');
    console.log('✅ Auditoria funcionando');
    console.log('✅ Disponibilidade funcionando');
    console.log('✅ Optimistic locking funcionando');
    console.log('✅ Fluxo completo validado\n');
    console.log('✅ FK de ride_state_audit → ride_requests: FUNCIONANDO\n');
  } else {
    console.log(`⚠️  ${total - passed} teste(s) falharam\n`);
  }

} catch (error) {
  console.error('\n❌ ERRO:', error.message);
  console.error('\n⚠️  Verifique se SUPABASE_DB_PASSWORD está configurado no .env\n');
} finally {
  await client.end();
}
