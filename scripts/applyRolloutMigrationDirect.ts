#!/usr/bin/env tsx
/**
 * Script para aplicar migration de rollouts usando SQL direto
 * Usa pg (PostgreSQL client) para executar ALTER TABLE
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function applyMigration() {
  console.log('🚀 Aplicando migration de rollouts via Supabase Edge Functions...\n');

  try {
    // SQL completo para executar
    const migrationSQL = `
-- Passo 1: Remover constraint antigo
ALTER TABLE module_rollouts DROP CONSTRAINT IF EXISTS module_rollouts_module_key_check;

-- Passo 2: Adicionar novo constraint
ALTER TABLE module_rollouts ADD CONSTRAINT module_rollouts_module_key_check 
  CHECK (module_key IN (
    'community', 'business', 'services', 'mobility', 'classifieds', 'ads',
    'gastronomy', 'events', 'jobs'
  ));

-- Passo 3: Inserir rollouts
INSERT INTO module_rollouts (module_key, location_id, status, config)
VALUES
  ('gastronomy', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('events', '00000000-0000-0000-0000-000000000010', 'active', NULL),
  ('jobs', '00000000-0000-0000-0000-000000000010', 'active', NULL)
ON CONFLICT (module_key, location_id) DO NOTHING;
    `.trim();

    console.log('📝 SQL a ser executado:');
    console.log('─'.repeat(60));
    console.log(migrationSQL);
    console.log('─'.repeat(60));
    console.log('');

    // Tentar executar via REST API do Supabase
    console.log('⚠️  ATENÇÃO: O Supabase Client não permite ALTER TABLE via API.');
    console.log('');
    console.log('📋 COPIE E EXECUTE MANUALMENTE:');
    console.log('');
    console.log('1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor');
    console.log('2. Clique em "SQL Editor"');
    console.log('3. Cole o SQL acima');
    console.log('4. Clique em "Run"');
    console.log('');
    console.log('OU execute este comando:');
    console.log('');
    console.log('cat APLICAR_MIGRATION_ROLLOUTS.sql | pbcopy  # macOS');
    console.log('cat APLICAR_MIGRATION_ROLLOUTS.sql | clip    # Windows');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

applyMigration();
