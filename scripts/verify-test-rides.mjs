#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log('🔍 Verificando corridas de teste...\n');
  
  const { data, error } = await supabase
    .from('ride_requests')
    .select('*')
    .in('id', [
      '00000000-0000-0000-0000-000000000101',
      '00000000-0000-0000-0000-000000000102',
    ]);
  
  if (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
  
  console.log(`✅ Encontradas ${data?.length || 0} corridas`);
  console.log(JSON.stringify(data, null, 2));
}

main();
