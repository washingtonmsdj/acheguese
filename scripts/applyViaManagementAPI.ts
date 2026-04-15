#!/usr/bin/env tsx
/**
 * Aplica migration usando Supabase Management API
 */

async function applyMigration() {
  console.log('🚀 Tentando aplicar migration via Management API...\n');
  
  const sql = `
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community', 'business', 'services', 'mobility', 'classifieds', 'ads',
    'gastronomy', 'events', 'jobs'
  ));

INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs', '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;
  `.trim();

  console.log('❌ LIMITAÇÃO: Supabase não permite ALTER TABLE via API por segurança.\n');
  console.log('✅ SOLUÇÃO: Execute manualmente no Supabase Studio\n');
  console.log('─'.repeat(70));
  console.log('📋 INSTRUÇÕES:');
  console.log('─'.repeat(70));
  console.log('');
  console.log('1. Abra: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd');
  console.log('2. Vá em: SQL Editor (menu lateral)');
  console.log('3. Clique em: New Query');
  console.log('4. Cole o SQL abaixo:');
  console.log('');
  console.log('─'.repeat(70));
  console.log(sql);
  console.log('─'.repeat(70));
  console.log('');
  console.log('5. Clique em: Run (ou Ctrl+Enter)');
  console.log('');
  console.log('✅ Resultado esperado: "Success. No rows returned"');
  console.log('');
  console.log('📁 O SQL também está em: APLICAR_MIGRATION_ROLLOUTS.sql');
  console.log('');
}

applyMigration();
