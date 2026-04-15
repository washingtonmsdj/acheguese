/**
 * Script para aplicar e validar migration profile_username_history
 * 
 * Aplica migration 20260329000012 e valida:
 * - Tabela criada
 * - Trigger funcionando
 * - Índices criados
 * - RLS configurado
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying migration 20260329000012_profile_username_history.sql...\n');

  const migrationPath = path.join(
    process.cwd(),
    'supabase/migrations/20260329000012_profile_username_history.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error applying migration:', error);
      return false;
    }

    console.log('✅ Migration applied successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    return false;
  }
}

async function validateTable() {
  console.log('🔍 Validating table profile_username_history...\n');

  // Verificar se tabela existe
  const { data: tableExists, error: tableError } = await supabase
    .from('profile_username_history')
    .select('id')
    .limit(0);

  if (tableError) {
    console.error('❌ Table does not exist:', tableError.message);
    return false;
  }

  console.log('✅ Table profile_username_history exists');

  // Verificar colunas
  const { data: columns, error: columnsError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profile_username_history'
        ORDER BY ordinal_position;
      `
    });

  if (columnsError) {
    console.error('❌ Error checking columns:', columnsError.message);
    return false;
  }

  console.log('✅ Columns:', columns);

  return true;
}

async function validateIndexes() {
  console.log('\n🔍 Validating indexes...\n');

  const { data: indexes, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'profile_username_history'
        ORDER BY indexname;
      `
    });

  if (error) {
    console.error('❌ Error checking indexes:', error.message);
    return false;
  }

  console.log('✅ Indexes found:', indexes?.length || 0);
  indexes?.forEach((idx: any) => {
    console.log(`  - ${idx.indexname}`);
  });

  const expectedIndexes = [
    'idx_profile_username_history_profile_id',
    'idx_profile_username_history_changed_at',
    'idx_profile_username_history_old_username',
  ];

  const foundIndexes = indexes?.map((idx: any) => idx.indexname) || [];
  const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx));

  if (missingIndexes.length > 0) {
    console.error('❌ Missing indexes:', missingIndexes);
    return false;
  }

  console.log('✅ All expected indexes found');
  return true;
}

async function validateTrigger() {
  console.log('\n🔍 Validating trigger...\n');

  const { data: triggers, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT trigger_name, event_manipulation, action_statement
        FROM information_schema.triggers
        WHERE event_object_table = 'profiles'
          AND trigger_name = 'trg_record_profile_username_history';
      `
    });

  if (error) {
    console.error('❌ Error checking trigger:', error.message);
    return false;
  }

  if (!triggers || triggers.length === 0) {
    console.error('❌ Trigger trg_record_profile_username_history not found');
    return false;
  }

  console.log('✅ Trigger found:', triggers[0].trigger_name);
  console.log('  Event:', triggers[0].event_manipulation);

  return true;
}

async function validateRLS() {
  console.log('\n🔍 Validating RLS...\n');

  const { data: rls, error } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename = 'profile_username_history';
      `
    });

  if (error) {
    console.error('❌ Error checking RLS:', error.message);
    return false;
  }

  if (!rls || rls.length === 0 || !rls[0].rowsecurity) {
    console.error('❌ RLS not enabled on profile_username_history');
    return false;
  }

  console.log('✅ RLS enabled on profile_username_history');

  // Verificar policies
  const { data: policies, error: policiesError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd
        FROM pg_policies
        WHERE tablename = 'profile_username_history'
        ORDER BY policyname;
      `
    });

  if (policiesError) {
    console.error('❌ Error checking policies:', policiesError.message);
    return false;
  }

  console.log('✅ Policies found:', policies?.length || 0);
  policies?.forEach((policy: any) => {
    console.log(`  - ${policy.policyname} (${policy.cmd})`);
  });

  return true;
}

async function testTrigger() {
  console.log('\n🧪 Testing trigger functionality...\n');

  // Criar profile de teste
  const testUsername = `test_trigger_${Date.now()}`;
  const { data: profile, error: createError } = await supabase
    .from('profiles')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // UUID fake para teste
      profile_type: 'personal',
      name: 'Test User',
      username: testUsername,
      city: 'Test City',
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Error creating test profile:', createError.message);
    return false;
  }

  console.log('✅ Test profile created:', profile.id);

  // Atualizar username
  const newUsername = `${testUsername}_updated`;
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ username: newUsername })
    .eq('id', profile.id);

  if (updateError) {
    console.error('❌ Error updating username:', updateError.message);
    return false;
  }

  console.log('✅ Username updated');

  // Verificar histórico
  const { data: history, error: historyError } = await supabase
    .from('profile_username_history')
    .select('*')
    .eq('profile_id', profile.id);

  if (historyError) {
    console.error('❌ Error checking history:', historyError.message);
    return false;
  }

  if (!history || history.length === 0) {
    console.error('❌ No history record found');
    return false;
  }

  console.log('✅ History record found:', history[0]);
  console.log(`  Old username: ${history[0].old_username}`);
  console.log(`  New username: ${history[0].new_username}`);
  console.log(`  Change reason: ${history[0].change_reason}`);

  // Limpar teste
  await supabase.from('profiles').delete().eq('id', profile.id);
  console.log('✅ Test profile cleaned up');

  return true;
}

async function main() {
  console.log('🚀 Starting profile_username_history migration and validation\n');
  console.log('='.repeat(60));
  console.log('\n');

  // Aplicar migration
  const migrationApplied = await applyMigration();
  if (!migrationApplied) {
    console.error('\n❌ Migration failed');
    process.exit(1);
  }

  // Validar tabela
  const tableValid = await validateTable();
  if (!tableValid) {
    console.error('\n❌ Table validation failed');
    process.exit(1);
  }

  // Validar índices
  const indexesValid = await validateIndexes();
  if (!indexesValid) {
    console.error('\n❌ Indexes validation failed');
    process.exit(1);
  }

  // Validar trigger
  const triggerValid = await validateTrigger();
  if (!triggerValid) {
    console.error('\n❌ Trigger validation failed');
    process.exit(1);
  }

  // Validar RLS
  const rlsValid = await validateRLS();
  if (!rlsValid) {
    console.error('\n❌ RLS validation failed');
    process.exit(1);
  }

  // Testar trigger
  const triggerTest = await testTrigger();
  if (!triggerTest) {
    console.error('\n❌ Trigger test failed');
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ ALL VALIDATIONS PASSED\n');
  console.log('Migration 20260329000012_profile_username_history.sql applied and validated successfully');
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
