#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 APLICANDO POLICIES SAFETY DIRETAMENTE\n');

const policies = [
  // ride_shares
  {
    name: 'service_role_all_ride_shares',
    table: 'ride_shares',
    sql: `CREATE POLICY IF NOT EXISTS "service_role_all_ride_shares" ON ride_shares FOR ALL TO service_role USING (true) WITH CHECK (true)`
  },
  {
    name: 'authenticated_read_own_ride_shares',
    table: 'ride_shares',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_read_own_ride_shares" ON ride_shares FOR SELECT TO authenticated USING (created_by = auth.uid())`
  },
  {
    name: 'authenticated_create_ride_shares',
    table: 'ride_shares',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_create_ride_shares" ON ride_shares FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid())`
  },
  {
    name: 'authenticated_update_own_ride_shares',
    table: 'ride_shares',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_update_own_ride_shares" ON ride_shares FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid())`
  },
  
  // safety_incidents
  {
    name: 'service_role_all_safety_incidents',
    table: 'safety_incidents',
    sql: `CREATE POLICY IF NOT EXISTS "service_role_all_safety_incidents" ON safety_incidents FOR ALL TO service_role USING (true) WITH CHECK (true)`
  },
  {
    name: 'authenticated_read_own_safety_incidents',
    table: 'safety_incidents',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_read_own_safety_incidents" ON safety_incidents FOR SELECT TO authenticated USING (reported_by = auth.uid())`
  },
  {
    name: 'authenticated_create_safety_incidents',
    table: 'safety_incidents',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_create_safety_incidents" ON safety_incidents FOR INSERT TO authenticated WITH CHECK (reported_by = auth.uid())`
  },
  {
    name: 'authenticated_update_own_safety_incidents',
    table: 'safety_incidents',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_update_own_safety_incidents" ON safety_incidents FOR UPDATE TO authenticated USING (reported_by = auth.uid()) WITH CHECK (reported_by = auth.uid())`
  },
  
  // safety_evidence
  {
    name: 'service_role_all_safety_evidence',
    table: 'safety_evidence',
    sql: `CREATE POLICY IF NOT EXISTS "service_role_all_safety_evidence" ON safety_evidence FOR ALL TO service_role USING (true) WITH CHECK (true)`
  },
  {
    name: 'authenticated_read_own_safety_evidence',
    table: 'safety_evidence',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_read_own_safety_evidence" ON safety_evidence FOR SELECT TO authenticated USING (uploaded_by = auth.uid())`
  },
  {
    name: 'authenticated_create_safety_evidence',
    table: 'safety_evidence',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_create_safety_evidence" ON safety_evidence FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid())`
  },
  
  // safety_audit_log
  {
    name: 'service_role_all_safety_audit_log',
    table: 'safety_audit_log',
    sql: `CREATE POLICY IF NOT EXISTS "service_role_all_safety_audit_log" ON safety_audit_log FOR ALL TO service_role USING (true) WITH CHECK (true)`
  },
  {
    name: 'authenticated_read_own_safety_audit_log',
    table: 'safety_audit_log',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_read_own_safety_audit_log" ON safety_audit_log FOR SELECT TO authenticated USING (performed_by = auth.uid())`
  },
  {
    name: 'authenticated_create_safety_audit_log',
    table: 'safety_audit_log',
    sql: `CREATE POLICY IF NOT EXISTS "authenticated_create_safety_audit_log" ON safety_audit_log FOR INSERT TO authenticated WITH CHECK (performed_by = auth.uid())`
  },
];

let success = 0;
let failed = 0;

for (const policy of policies) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`⚠️  ${policy.name}: já existe`);
        success++;
      } else {
        console.log(`❌ ${policy.name}: ${error.message}`);
        failed++;
      }
    } else {
      console.log(`✅ ${policy.name}: criada`);
      success++;
    }
  } catch (e) {
    console.log(`❌ ${policy.name}: ${e.message}`);
    failed++;
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(`📊 RESUMO: ${success}/${policies.length} sucesso\n`);

if (failed === 0) {
  console.log('🎉 TODAS AS POLICIES APLICADAS!\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${failed} policies falharam\n`);
  process.exit(1);
}
