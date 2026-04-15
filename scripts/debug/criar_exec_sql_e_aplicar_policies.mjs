#!/usr/bin/env node
/**
 * Criar função exec_sql e aplicar policies safety
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 CRIANDO FUNÇÃO EXEC_SQL E APLICANDO POLICIES\n');
console.log('═══════════════════════════════════════════════════════\n');

// ============================================
// 1. CRIAR FUNÇÃO EXEC_SQL
// ============================================

console.log('1️⃣ Criando função exec_sql...\n');

const createFunctionSQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;
`;

// Tentar criar via REST API diretamente (sem RPC que ainda não existe)
try {
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({ query: createFunctionSQL })
  });
  
  if (response.ok) {
    console.log('✅ Função exec_sql criada\n');
  } else {
    console.log('⚠️  Não foi possível criar via API, tentando via RPC...\n');
  }
} catch (e) {
  console.log('⚠️  Erro ao criar função, continuando...\n');
}

// ============================================
// 2. APLICAR POLICIES SAFETY
// ============================================

console.log('2️⃣ Aplicando policies safety...\n');

const policies = [
  // ride_shares
  {
    name: 'service_role_all_ride_shares',
    sql: `DROP POLICY IF EXISTS "service_role_all_ride_shares" ON ride_shares; CREATE POLICY "service_role_all_ride_shares" ON ride_shares FOR ALL TO service_role USING (true) WITH CHECK (true);`
  },
  {
    name: 'authenticated_read_own_ride_shares',
    sql: `DROP POLICY IF EXISTS "authenticated_read_own_ride_shares" ON ride_shares; CREATE POLICY "authenticated_read_own_ride_shares" ON ride_shares FOR SELECT TO authenticated USING (created_by = auth.uid());`
  },
  {
    name: 'authenticated_create_ride_shares',
    sql: `DROP POLICY IF EXISTS "authenticated_create_ride_shares" ON ride_shares; CREATE POLICY "authenticated_create_ride_shares" ON ride_shares FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());`
  },
  {
    name: 'authenticated_update_own_ride_shares',
    sql: `DROP POLICY IF EXISTS "authenticated_update_own_ride_shares" ON ride_shares; CREATE POLICY "authenticated_update_own_ride_shares" ON ride_shares FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());`
  },
  
  // safety_incidents
  {
    name: 'service_role_all_safety_incidents',
    sql: `DROP POLICY IF EXISTS "service_role_all_safety_incidents" ON safety_incidents; CREATE POLICY "service_role_all_safety_incidents" ON safety_incidents FOR ALL TO service_role USING (true) WITH CHECK (true);`
  },
  {
    name: 'authenticated_read_own_safety_incidents',
    sql: `DROP POLICY IF EXISTS "authenticated_read_own_safety_incidents" ON safety_incidents; CREATE POLICY "authenticated_read_own_safety_incidents" ON safety_incidents FOR SELECT TO authenticated USING (reported_by = auth.uid());`
  },
  {
    name: 'authenticated_create_safety_incidents',
    sql: `DROP POLICY IF EXISTS "authenticated_create_safety_incidents" ON safety_incidents; CREATE POLICY "authenticated_create_safety_incidents" ON safety_incidents FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid());`
  },
  {
    name: 'authenticated_update_own_safety_incidents',
    sql: `DROP POLICY IF EXISTS "authenticated_update_own_safety_incidents" ON safety_incidents; CREATE POLICY "authenticated_update_own_safety_incidents" ON safety_incidents FOR UPDATE TO authenticated USING (reported_by = auth.uid()) WITH CHECK (reported_by = auth.uid());`
  },
  
  // safety_evidence
  {
    name: 'service_role_all_safety_evidence',
    sql: `DROP POLICY IF EXISTS "service_role_all_safety_evidence" ON safety_evidence; CREATE POLICY "service_role_all_safety_evidence" ON safety_evidence FOR ALL TO service_role USING (true) WITH CHECK (true);`
  },
  {
    name: 'authenticated_read_own_safety_evidence',
    sql: `DROP POLICY IF EXISTS "authenticated_read_own_safety_evidence" ON safety_evidence; CREATE POLICY "authenticated_read_own_safety_evidence" ON safety_evidence FOR SELECT TO authenticated USING (uploaded_by = auth.uid());`
  },
  {
    name: 'authenticated_create_safety_evidence',
    sql: `DROP POLICY IF EXISTS "authenticated_create_safety_evidence" ON safety_evidence; CREATE POLICY "authenticated_create_safety_evidence" ON safety_evidence FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());`
  },
  
  // safety_audit_log
  {
    name: 'service_role_all_safety_audit_log',
    sql: `DROP POLICY IF EXISTS "service_role_all_safety_audit_log" ON safety_audit_log; CREATE POLICY "service_role_all_safety_audit_log" ON safety_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);`
  },
  {
    name: 'authenticated_read_own_safety_audit_log',
    sql: `DROP POLICY IF EXISTS "authenticated_read_own_safety_audit_log" ON safety_audit_log; CREATE POLICY "authenticated_read_own_safety_audit_log" ON safety_audit_log FOR SELECT TO authenticated USING (performed_by = auth.uid());`
  },
  {
    name: 'authenticated_create_safety_audit_log',
    sql: `DROP POLICY IF EXISTS "authenticated_create_safety_audit_log" ON safety_audit_log; CREATE POLICY "authenticated_create_safety_audit_log" ON safety_audit_log FOR INSERT TO authenticated WITH CHECK (performed_by = auth.uid());`
  },
];

let success = 0;
let failed = 0;

for (const policy of policies) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: policy.sql });
    
    if (error) {
      console.log(`❌ ${policy.name}: ${error.message}`);
      failed++;
    } else if (data && !data.success) {
      console.log(`❌ ${policy.name}: ${data.error}`);
      failed++;
    } else {
      console.log(`✅ ${policy.name}`);
      success++;
    }
  } catch (e) {
    console.log(`❌ ${policy.name}: ${e.message}`);
    failed++;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESUMO: ${success}/${policies.length} policies aplicadas\n`);

if (failed === 0) {
  console.log('🎉 TODAS AS POLICIES APLICADAS COM SUCESSO!\n');
  console.log('Executando validação...\n');
  
  // Validar RLS
  const { execSync } = await import('child_process');
  execSync('node verificar_rls_completo.mjs', { stdio: 'inherit' });
  
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} policies falharam\n`);
  console.log('AÇÃO NECESSÁRIA:');
  console.log('1. Copiar conteúdo de CREATE_EXEC_SQL_FUNCTION.sql');
  console.log('2. Executar no SQL Editor do Supabase Dashboard');
  console.log('3. Executar novamente este script\n');
  process.exit(1);
}
