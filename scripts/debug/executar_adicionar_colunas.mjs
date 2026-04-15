#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

console.log('🔄 Executando SQL para adicionar colunas faltantes...\n');

const sql = `
-- Adicionar colunas básicas
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS observation TEXT,
  ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
`;

// Supabase client não suporta ALTER TABLE diretamente
// Precisamos usar a API REST do PostgREST ou executar via SQL Editor

console.log('❌ Não é possível executar ALTER TABLE via Supabase client JavaScript');
console.log('');
console.log('📋 VOCÊ PRECISA EXECUTAR MANUALMENTE:');
console.log('');
console.log('1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor');
console.log('2. Cole e execute o SQL abaixo:');
console.log('');
console.log('─'.repeat(80));
console.log(sql);
console.log('─'.repeat(80));
console.log('');
console.log('3. Após executar, aguarde 30 segundos');
console.log('4. Execute: NOTIFY pgrst, \'reload schema\';');
console.log('5. Teste novamente no navegador');
console.log('');
console.log('💡 O arquivo ADICIONAR_COLUNAS_FALTANTES.sql contém o SQL completo');
