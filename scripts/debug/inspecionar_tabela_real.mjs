#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.remote' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL?.trim(),
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
);

async function run() {
  // Usar pg_attribute via RPC para ver colunas reais
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT 
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        NOT a.attnotnull as is_nullable,
        pg_get_expr(d.adbin, d.adrelid) as column_default
      FROM pg_catalog.pg_attribute a
      LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid = d.adrelid AND a.attnum = d.adnum)
      WHERE a.attrelid = 'public.ride_requests'::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum
    `
  });

  if (error) {
    console.error('Erro RPC:', error.message);
    return;
  }

  console.log('\n📋 COLUNAS REAIS da tabela ride_requests:\n');
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
