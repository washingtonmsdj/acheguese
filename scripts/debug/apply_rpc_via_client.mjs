#!/usr/bin/env node

/**
 * Aplica funções RPC via Supabase Client
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🚀 Aplicando funções RPC...\n');
console.log('⚠️  Supabase não permite executar SQL via API por segurança.');
console.log('📋 Copie o SQL abaixo e execute no SQL Editor:\n');
console.log('🔗 https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new\n');
console.log('─'.repeat(80));
console.log(readFileSync('ADD_PRICING_RPC_FUNCTIONS.sql', 'utf-8'));
console.log('─'.repeat(80));
console.log('\n✅ Após executar, teste criar uma regra ativa duplicada.');
console.log('   Deve funcionar sem erro 409 Conflict!\n');
