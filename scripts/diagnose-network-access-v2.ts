#!/usr/bin/env tsx
/**
 * Diagnóstico v2 - verificar duplicatas
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e.network' });
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const STANDALONE_PROFILE_ID = process.env.E2E_NETWORK_STANDALONE_PROFILE_ID!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function diagnose() {
  console.log('🔍 Verificando duplicatas em business_data\n');

  // Buscar TODOS os registros com este profile_id
  const { data: businesses, error } = await supabase
    .from('business_data')
    .select('id, profile_id, business_name, slug, business_role, created_at')
    .eq('profile_id', STANDALONE_PROFILE_ID)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  console.log(`Encontrados ${businesses?.length || 0} registros:\n`);
  businesses?.forEach((b, i) => {
    console.log(`${i + 1}. ${b.business_name} (${b.slug})`);
    console.log(`   ID: ${b.id}`);
    console.log(`   Role: ${b.business_role}`);
    console.log(`   Created: ${b.created_at}\n`);
  });

  if (businesses && businesses.length > 1) {
    console.log('⚠️  PROBLEMA: Múltiplos registros com o mesmo profile_id!');
    console.log('   Isso viola a constraint UNIQUE(profile_id) esperada.\n');
  }
}

diagnose().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
