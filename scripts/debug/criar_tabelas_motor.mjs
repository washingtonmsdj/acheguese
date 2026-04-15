#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 CRIANDO TABELAS DO MOTOR OPERACIONAL\n');

// Criar ride_state_audit
console.log('1. Criando ride_state_audit...');
const { error: e1 } = await supabase.rpc('exec_sql', {
  sql: `
    CREATE TABLE IF NOT EXISTS ride_state_audit (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ride_id UUID NOT NULL,
      from_state TEXT NOT NULL,
      to_state TEXT NOT NULL,
      changed_by TEXT NOT NULL,
      reason TEXT,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
});
if (e1) console.error('Erro:', e1.message);
else console.log('✅ ride_state_audit criada');

// Criar índices
console.log('\n2. Criando índices...');
await supabase.rpc('exec_sql', {
  sql: 'CREATE INDEX IF NOT EXISTS idx_ride_state_audit_ride_id ON ride_state_audit(ride_id);'
});
await supabase.rpc('exec_sql', {
  sql: 'CREATE INDEX IF NOT EXISTS idx_ride_state_audit_created_at ON ride_state_audit(created_at DESC);'
});
console.log('✅ Índices criados');

// Criar driver_availability
console.log('\n3. Criando driver_availability...');
const { error: e2 } = await supabase.rpc('exec_sql', {
  sql: `
    CREATE TABLE IF NOT EXISTS driver_availability (
      profile_id UUID PRIMARY KEY,
      is_online BOOLEAN NOT NULL DEFAULT false,
      is_available BOOLEAN NOT NULL DEFAULT false,
      current_lat DOUBLE PRECISION,
      current_lng DOUBLE PRECISION,
      last_location_update TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `
});
if (e2) console.error('Erro:', e2.message);
else console.log('✅ driver_availability criada');

// Criar índices
console.log('\n4. Criando índices de disponibilidade...');
await supabase.rpc('exec_sql', {
  sql: 'CREATE INDEX IF NOT EXISTS idx_driver_availability_online ON driver_availability(is_online, is_available);'
});
await supabase.rpc('exec_sql', {
  sql: 'CREATE INDEX IF NOT EXISTS idx_driver_availability_location ON driver_availability(current_lat, current_lng);'
});
console.log('✅ Índices criados');

// Adicionar colunas em rides
console.log('\n5. Adicionando colunas em rides...');
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ;'
});
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ;'
});
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE rides ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ;'
});
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;'
});
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;'
});
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE rides ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;'
});
console.log('✅ Colunas adicionadas');

// Habilitar RLS
console.log('\n6. Habilitando RLS...');
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE ride_state_audit ENABLE ROW LEVEL SECURITY;'
});
await supabase.rpc('exec_sql', {
  sql: 'ALTER TABLE driver_availability ENABLE ROW LEVEL SECURITY;'
});
console.log('✅ RLS habilitado');

// Verificar
console.log('\n7. Verificando tabelas...');
const { data: t1, error: v1 } = await supabase.from('ride_state_audit').select('id').limit(1);
console.log('ride_state_audit:', v1 ? '❌ ' + v1.message : '✅ EXISTE');

const { data: t2, error: v2 } = await supabase.from('driver_availability').select('profile_id').limit(1);
console.log('driver_availability:', v2 ? '❌ ' + v2.message : '✅ EXISTE');

console.log('\n🎉 CONCLUÍDO!');
