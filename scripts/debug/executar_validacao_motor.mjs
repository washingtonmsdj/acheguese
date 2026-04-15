#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔥 EXECUTANDO VALIDAÇÃO REAL DO MOTOR OPERACIONAL\n');
console.log('═══════════════════════════════════════════════════════\n');

const sql = readFileSync('VALIDAR_MOTOR_MANUAL.sql', 'utf8');

// Dividir em comandos individuais
const commands = sql
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd && !cmd.startsWith('--') && cmd.length > 10);

let results = [];

for (let i = 0; i < commands.length; i++) {
  const cmd = commands[i];
  const preview = cmd.substring(0, 80).replace(/\n/g, ' ');
  
  console.log(`\n${i + 1}/${commands.length} ${preview}...`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: cmd });
    
    if (error) {
      console.log(`❌ Erro: ${error.message}`);
      results.push({ cmd: preview, success: false, error: error.message });
    } else {
      console.log(`✅ Executado`);
      if (data) {
        console.log(JSON.stringify(data, null, 2));
      }
      results.push({ cmd: preview, success: true, data });
    }
  } catch (err) {
    console.log(`❌ Exceção: ${err.message}`);
    results.push({ cmd: preview, success: false, error: err.message });
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 RESUMO\n');

const passed = results.filter(r => r.success).length;
const total = results.length;

console.log(`✅ Sucesso: ${passed}/${total}`);
console.log(`❌ Falhas: ${total - passed}/${total}\n`);

if (passed === total) {
  console.log('🎉 VALIDAÇÃO COMPLETA!\n');
} else {
  console.log('⚠️  Algumas operações falharam\n');
}

// Verificações finais
console.log('═══════════════════════════════════════════════════════');
console.log('🔍 VERIFICAÇÕES FINAIS\n');

// 1. Verificar corrida
console.log('1️⃣  Verificando corrida criada...');
const { data: ride, error: e1 } = await supabase
  .from('ride_requests')
  .select('id, status')
  .eq('id', '00000000-0000-0000-0000-000000000099')
  .maybeSingle();

if (!e1 && ride) {
  console.log(`✅ Corrida: ${ride.id}`);
  console.log(`   Status: ${ride.status}`);
} else {
  console.log('❌ Corrida não encontrada');
}

// 2. Verificar auditoria
console.log('\n2️⃣  Verificando auditoria...');
const { data: audit, error: e2 } = await supabase
  .from('ride_state_audit')
  .select('*')
  .eq('ride_id', '00000000-0000-0000-0000-000000000099')
  .order('created_at', { ascending: true });

if (!e2 && audit) {
  console.log(`✅ Auditoria: ${audit.length} registro(s)`);
  audit.forEach((a, i) => {
    console.log(`   ${i + 1}. ${a.from_state} → ${a.to_state} (${a.changed_by})`);
  });
} else {
  console.log('❌ Auditoria não encontrada');
}

// 3. Verificar disponibilidade
console.log('\n3️⃣  Verificando disponibilidade do motorista...');
const { data: avail, error: e3 } = await supabase
  .from('driver_availability')
  .select('*')
  .eq('profile_id', '00000000-0000-0000-0000-000000000002')
  .maybeSingle();

if (!e3 && avail) {
  console.log(`✅ Motorista: ${avail.profile_id.substring(0, 8)}...`);
  console.log(`   Online: ${avail.is_online}`);
  console.log(`   Disponível: ${avail.is_available}`);
} else {
  console.log('❌ Disponibilidade não encontrada');
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('✅ VALIDAÇÃO REAL CONCLUÍDA!\n');
