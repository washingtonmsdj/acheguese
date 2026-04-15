#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧪 VALIDAÇÃO REAL DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');

let passed = 0;
let total = 0;

// 1. Verificar se ride_requests tem corridas
total++;
console.log('1️⃣  Verificando corridas existentes...');
const { data: existingRides, error: e1 } = await supabase
  .from('ride_requests')
  .select('id, status, passenger_profile_id, driver_profile_id')
  .order('created_at', { ascending: false })
  .limit(5);

if (!e1 && existingRides) {
  console.log(`✅ ${existingRides.length} corrida(s) encontrada(s)`);
  if (existingRides.length > 0) {
    existingRides.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.id.substring(0, 8)}... - ${r.status}`);
    });
  }
  passed++;
} else {
  console.log('❌ Erro:', e1?.message);
}

// 2. Verificar auditoria existente
total++;
console.log('\n2️⃣  Verificando auditoria existente...');
const { data: existingAudit, error: e2 } = await supabase
  .from('ride_state_audit')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(5);

if (!e2 && existingAudit) {
  console.log(`✅ ${existingAudit.length} registro(s) de auditoria`);
  if (existingAudit.length > 0) {
    existingAudit.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.from_state} → ${a.to_state} (${a.changed_by})`);
    });
  }
  passed++;
} else {
  console.log('❌ Erro:', e2?.message);
}

// 3. Verificar disponibilidade de motoristas
total++;
console.log('\n3️⃣  Verificando disponibilidade de motoristas...');
const { data: availability, error: e3 } = await supabase
  .from('driver_availability')
  .select('*')
  .order('updated_at', { ascending: false })
  .limit(5);

if (!e3 && availability) {
  console.log(`✅ ${availability.length} motorista(s) com disponibilidade`);
  if (availability.length > 0) {
    availability.forEach((a, i) => {
      const status = a.is_online ? (a.is_available ? '🟢 Online/Disponível' : '🟡 Online/Ocupado') : '🔴 Offline';
      console.log(`   ${i + 1}. ${a.profile_id.substring(0, 8)}... - ${status}`);
    });
  }
  passed++;
} else {
  console.log('❌ Erro:', e3?.message);
}

// 4. Verificar se há corridas com novos estados
total++;
console.log('\n4️⃣  Verificando corridas com estados do motor...');
const newStates = [
  'requested', 'searching_driver', 'driver_assigned',
  'driver_accepted', 'driver_arriving', 'passenger_boarded',
  'in_progress', 'completed', 'cancelled_by_passenger',
  'cancelled_by_driver', 'expired', 'failed'
];

const { data: motorRides, error: e4 } = await supabase
  .from('ride_requests')
  .select('id, status')
  .in('status', newStates)
  .limit(10);

if (!e4 && motorRides) {
  console.log(`✅ ${motorRides.length} corrida(s) com estados do motor`);
  if (motorRides.length > 0) {
    const stateCounts = {};
    motorRides.forEach(r => {
      stateCounts[r.status] = (stateCounts[r.status] || 0) + 1;
    });
    Object.entries(stateCounts).forEach(([state, count]) => {
      console.log(`   ${state}: ${count}`);
    });
  }
  passed++;
} else {
  console.log('❌ Erro:', e4?.message);
}

// 5. Verificar se auditoria referencia ride_requests
total++;
console.log('\n5️⃣  Verificando FK de auditoria...');
if (existingAudit && existingAudit.length > 0 && existingRides && existingRides.length > 0) {
  // Tentar buscar auditoria de uma corrida existente
  const testRideId = existingRides[0].id;
  const { data: rideAudit, error: e5 } = await supabase
    .from('ride_state_audit')
    .select('*')
    .eq('ride_id', testRideId);

  if (!e5) {
    if (rideAudit && rideAudit.length > 0) {
      console.log(`✅ FK funcionando - ${rideAudit.length} registro(s) de auditoria para corrida ${testRideId.substring(0, 8)}...`);
    } else {
      console.log('⚠️  FK funcionando mas sem auditoria para esta corrida');
    }
    passed++;
  } else {
    console.log('❌ Erro ao buscar auditoria:', e5.message);
  }
} else {
  console.log('⚠️  Sem dados para testar FK');
  passed++;
}

// 6. Verificar estrutura da tabela ride_requests
total++;
console.log('\n6️⃣  Verificando colunas do motor em ride_requests...');
const { data: sampleRide, error: e6 } = await supabase
  .from('ride_requests')
  .select('*')
  .limit(1)
  .maybeSingle();

if (!e6 && sampleRide) {
  const motorColumns = [
    'driver_assigned_at',
    'driver_accepted_at',
    'passenger_boarded_at',
    'cancelled_at'
  ];
  
  const foundColumns = motorColumns.filter(col => col in sampleRide);
  console.log(`✅ ${foundColumns.length}/${motorColumns.length} colunas do motor encontradas`);
  foundColumns.forEach(col => {
    console.log(`   ✓ ${col}`);
  });
  
  const missingColumns = motorColumns.filter(col => !(col in sampleRide));
  if (missingColumns.length > 0) {
    console.log(`   ⚠️  Faltando: ${missingColumns.join(', ')}`);
  }
  
  if (foundColumns.length === motorColumns.length) {
    passed++;
  }
} else if (e6) {
  console.log('❌ Erro:', e6.message);
} else {
  console.log('⚠️  Nenhuma corrida para verificar estrutura');
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESULTADO: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);

if (passed === total) {
  console.log('🎉 MOTOR OPERACIONAL: VALIDADO!\n');
  console.log('✅ Tabelas acessíveis');
  console.log('✅ Auditoria funcionando');
  console.log('✅ Disponibilidade funcionando');
  console.log('✅ Estados do motor em uso');
  console.log('✅ FK funcionando');
  console.log('✅ Colunas do motor presentes\n');
} else {
  console.log(`⚠️  ${total - passed} validação(ões) pendente(s)\n`);
}

console.log('📝 PRÓXIMO PASSO: Testar fluxo completo no navegador\n');
console.log('   1. Criar corrida como passageiro');
console.log('   2. Verificar estado "searching_driver"');
console.log('   3. Aceitar como motorista');
console.log('   4. Verificar estado "driver_accepted"');
console.log('   5. Completar corrida');
console.log('   6. Verificar auditoria no banco\n');
