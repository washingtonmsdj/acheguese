#!/usr/bin/env tsx
/**
 * Diagnóstico da estrutura do objeto business
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  console.log('🔍 Diagnóstico da estrutura do objeto business\n');

  // Buscar a empresa standalone do seed
  const { data: business, error } = await supabase
    .from('business_data')
    .select('*')
    .eq('slug', 'e2e-standalone-test')
    .maybeSingle();

  if (error || !business) {
    console.error('❌ Erro ao buscar empresa standalone:', error?.message);
    process.exit(1);
  }

  console.log('📊 Estrutura do objeto business:');
  console.log(JSON.stringify(business, null, 2));
  
  console.log('\n🔑 Campos relevantes para NetworkTab:');
  console.log(`- id: ${business.id}`);
  console.log(`- profile_id: ${business.profile_id}`);
  console.log(`- business_role: ${business.business_role}`);
  console.log(`- parent_business_id: ${business.parent_business_id}`);
  console.log(`- location_id: ${business.location_id}`);
  console.log(`- slug: ${business.slug}`);
  
  console.log('\n✅ Diagnóstico concluído');
}

run().catch(console.error);