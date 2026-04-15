#!/usr/bin/env node
/**
 * Script automatizado para corrigir schema completo do ride_requests
 * Conecta ao Supabase remoto e adiciona todas as colunas necessárias
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('   Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.remote');
  process.exit(1);
}

// Usar connection string do .env se disponível, senão construir
const connectionString = process.env.SUPABASE_DB_URL || 
  `postgresql://postgres:${supabaseServiceKey}@db.${process.env.VITE_SUPABASE_PROJECT_ID || 'xhdowzacfujckjelqhtd'}.supabase.co:5432/postgres`;

console.log('🔧 CORREÇÃO AUTOMÁTICA DO SCHEMA\n');

const sql = `
-- Adicionar TODAS as colunas necessárias
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS origin TEXT,
  ADD COLUMN IF NOT EXISTS destination TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS suggested_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS observation TEXT,
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'ride',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'viagem',
  ADD COLUMN IF NOT EXISTS origin_lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS origin_lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS destination_lat DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS destination_lng DECIMAL(11,8),
  ADD COLUMN IF NOT EXISTS driver_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS driver_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS passenger_boarded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS search_radius_km INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS available_seats INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS pickup_address_id UUID,
  ADD COLUMN IF NOT EXISTS dropoff_address_id UUID,
  ADD COLUMN IF NOT EXISTS pickup_location_id UUID,
  ADD COLUMN IF NOT EXISTS dropoff_location_id UUID;

-- Notificar PostgREST
SELECT pg_notify('pgrst', 'reload schema');
`;

async function executarViaSupabaseAdmin() {
  console.log('📡 Tentando via Supabase Admin API...\n');
  
  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (response.ok) {
      console.log('✅ SQL executado via Admin API');
      return true;
    } else {
      const error = await response.text();
      console.log('⚠️  Admin API não disponível:', error);
      return false;
    }
  } catch (error) {
    console.log('⚠️  Erro ao usar Admin API:', error.message);
    return false;
  }
}

async function executarViaPG() {
  console.log('📡 Tentando via conexão direta PostgreSQL...\n');
  
  const { Client } = pg;
  const projectRef = process.env.VITE_SUPABASE_PROJECT_ID || 'xhdowzacfujckjelqhtd';
  const dbUrl = process.env.SUPABASE_DB_URL || 
    `postgresql://postgres:${supabaseServiceKey}@db.${projectRef}.supabase.co:5432/postgres`;
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    await client.query(sql);
    console.log('✅ SQL executado com sucesso');
    
    await client.end();
    return true;
  } catch (error) {
    console.log('⚠️  Erro ao conectar via PG:', error.message);
    return false;
  }
}

async function main() {
  // Tentar método 1: Admin API
  let sucesso = await executarViaSupabaseAdmin();
  
  // Tentar método 2: Conexão direta PG
  if (!sucesso) {
    sucesso = await executarViaPG();
  }
  
  if (sucesso) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ SCHEMA CORRIGIDO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('');
    console.log('Aguarde 10 segundos e teste no navegador.');
    console.log('');
    
    // Aguardar 10 segundos
    for (let i = 10; i > 0; i--) {
      process.stdout.write(`\r⏳ Aguardando cache atualizar: ${i}s `);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('\n\n✅ Pronto! Teste agora no navegador.');
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('❌ NÃO FOI POSSÍVEL EXECUTAR AUTOMATICAMENTE');
    console.log('='.repeat(60));
    console.log('');
    console.log('Execute manualmente no SQL Editor:');
    console.log('https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor');
    console.log('');
    console.log(sql);
  }
}

main().catch(console.error);
