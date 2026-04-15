import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('=== VALIDANDO SQL APLICADO ===\n');

let allOk = true;
const results = [];

// 1. Verificar tabela ride_dispatch_audit
console.log('1. Verificando tabela ride_dispatch_audit...');
try {
  const { data, error } = await supabase
    .from('ride_dispatch_audit')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('   ERRO: Tabela nao encontrada -', error.message);
    results.push({ item: 'ride_dispatch_audit', status: 'ERRO', details: error.message });
    allOk = false;
  } else {
    console.log('   OK: Tabela existe');
    results.push({ item: 'ride_dispatch_audit', status: 'OK', details: 'Tabela acessivel' });
  }
} catch (err) {
  console.log('   ERRO:', err.message);
  results.push({ item: 'ride_dispatch_audit', status: 'ERRO', details: err.message });
  allOk = false;
}

// 2. Verificar find_eligible_drivers
console.log('\n2. Verificando find_eligible_drivers...');
try {
  const { data, error } = await supabase
    .rpc('find_eligible_drivers', { 
      p_origin_lat: -12.975, 
      p_origin_lng: -38.476, 
      p_max_radius_km: 10 
    });
  
  if (error) {
    console.log('   ERRO: Funcao nao encontrada -', error.message);
    results.push({ item: 'find_eligible_drivers', status: 'ERRO', details: error.message });
    allOk = false;
  } else {
    console.log('   OK: Funcao existe');
    console.log('   Motoristas encontrados:', data ? data.length : 0);
    results.push({ item: 'find_eligible_drivers', status: 'OK', details: `${data ? data.length : 0} motoristas` });
  }
} catch (err) {
  console.log('   ERRO:', err.message);
  results.push({ item: 'find_eligible_drivers', status: 'ERRO', details: err.message });
  allOk = false;
}

// 3. Verificar process_dispatch_timeouts
console.log('\n3. Verificando process_dispatch_timeouts...');
try {
  const { data, error } = await supabase.rpc('process_dispatch_timeouts');
  
  if (error) {
    console.log('   ERRO: Funcao nao encontrada -', error.message);
    results.push({ item: 'process_dispatch_timeouts', status: 'ERRO', details: error.message });
    allOk = false;
  } else {
    console.log('   OK: Funcao existe');
    console.log('   Timeouts processados:', data ? data.length : 0);
    results.push({ item: 'process_dispatch_timeouts', status: 'OK', details: `${data ? data.length : 0} timeouts` });
  }
} catch (err) {
  console.log('   ERRO:', err.message);
  results.push({ item: 'process_dispatch_timeouts', status: 'ERRO', details: err.message });
  allOk = false;
}

// 4. Verificar ride_requests
console.log('\n4. Verificando ride_requests...');
try {
  const { data, error } = await supabase
    .from('ride_requests')
    .select('id, status')
    .limit(1);
  
  if (error) {
    console.log('   ERRO:', error.message);
    results.push({ item: 'ride_requests', status: 'ERRO', details: error.message });
    allOk = false;
  } else {
    console.log('   OK: Tabela acessivel');
    results.push({ item: 'ride_requests', status: 'OK', details: 'Tabela acessivel' });
  }
} catch (err) {
  console.log('   ERRO:', err.message);
  results.push({ item: 'ride_requests', status: 'ERRO', details: err.message });
  allOk = false;
}

// 5. Verificar driver_availability
console.log('\n5. Verificando motoristas disponiveis...');
try {
  const { data, error } = await supabase
    .from('driver_availability')
    .select('profile_id')
    .eq('is_online', true)
    .eq('is_available', true)
    .not('current_lat', 'is', null)
    .not('current_lng', 'is', null);
  
  if (error) {
    console.log('   ERRO:', error.message);
    results.push({ item: 'motoristas_disponiveis', status: 'AVISO', details: error.message });
  } else {
    console.log('   OK: Motoristas disponiveis:', data ? data.length : 0);
    results.push({ item: 'motoristas_disponiveis', status: 'OK', details: `${data ? data.length : 0} motoristas` });
    if (data && data.length === 0) {
      console.log('   AVISO: Nenhum motorista disponivel para testar');
    }
  }
} catch (err) {
  console.log('   ERRO:', err.message);
  results.push({ item: 'motoristas_disponiveis', status: 'AVISO', details: err.message });
}

console.log('\n=== RESULTADO ===\n');
console.table(results);

if (allOk) {
  console.log('\nOK: SQL aplicado com sucesso!');
  console.log('\nProximo passo: node testar-dispatch-real.mjs');
} else {
  console.log('\nERRO: SQL nao foi aplicado corretamente');
  console.log('Execute o SQL manualmente no SQL Editor do Supabase');
  console.log('URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new');
}
