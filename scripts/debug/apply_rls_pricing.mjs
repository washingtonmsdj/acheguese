#!/usr/bin/env node

/**
 * Script para Aplicar RLS Policies - Pricing
 * Habilita RLS e cria policies de segurança
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔒 APLICANDO RLS POLICIES - PRICING\n');
console.log('=' .repeat(60));

const SQL_ENABLE_RLS = `
-- Re-habilitar RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;

-- Criar policies para pricing_rules
CREATE POLICY IF NOT EXISTS "service_role_all_pricing_rules"
  ON pricing_rules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_read_pricing_rules"
  ON pricing_rules
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar policies para pricing_peak_hour_multipliers
CREATE POLICY IF NOT EXISTS "service_role_all_pricing_multipliers"
  ON pricing_peak_hour_multipliers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_read_pricing_multipliers"
  ON pricing_peak_hour_multipliers
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar policies para pricing_additional_fees
CREATE POLICY IF NOT EXISTS "service_role_all_pricing_fees"
  ON pricing_additional_fees
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_read_pricing_fees"
  ON pricing_additional_fees
  FOR SELECT
  TO authenticated
  USING (true);

-- Criar policies para pricing_audit_log
CREATE POLICY IF NOT EXISTS "service_role_all_pricing_audit"
  ON pricing_audit_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "authenticated_read_own_pricing_audit"
  ON pricing_audit_log
  FOR SELECT
  TO authenticated
  USING (performed_by = auth.uid());
`;

async function main() {
  console.log('\n1️⃣  Aplicando RLS e Policies...\n');
  
  // Executar SQL via RPC (se disponível) ou via REST API
  try {
    // Tentar executar via função RPC personalizada (se existir)
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: SQL_ENABLE_RLS });
    
    if (rpcError) {
      console.log('   ℹ️  RPC não disponível, aplicando via REST API...\n');
      
      // Aplicar cada comando individualmente
      const commands = SQL_ENABLE_RLS.split(';').filter(cmd => cmd.trim());
      
      for (const cmd of commands) {
        if (!cmd.trim()) continue;
        
        console.log(`   Executando: ${cmd.trim().substring(0, 50)}...`);
        
        // Não podemos executar DDL via REST API diretamente
        // Precisamos usar o SQL Editor do Supabase Dashboard
      }
      
      console.log('\n   ⚠️  ATENÇÃO: RLS deve ser aplicado manualmente via SQL Editor');
      console.log('   📝 Arquivo: ENABLE_RLS_WITH_POLICIES.sql');
      console.log('   🔗 URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql');
      
    } else {
      console.log('   ✅ RLS e policies aplicados com sucesso via RPC');
    }
  } catch (err) {
    console.error('   ❌ Erro:', err.message);
    console.log('\n   ⚠️  ATENÇÃO: RLS deve ser aplicado manualmente via SQL Editor');
    console.log('   📝 Arquivo: ENABLE_RLS_WITH_POLICIES.sql');
    console.log('   🔗 URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql');
  }
  
  // Verificar se conseguimos acessar as tabelas após RLS
  console.log('\n2️⃣  Verificando acesso às tabelas...\n');
  
  const tables = ['pricing_rules', 'pricing_peak_hour_multipliers', 'pricing_additional_fees', 'pricing_audit_log'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: Acessível`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 INSTRUÇÕES MANUAIS\n');
  console.log('1. Abrir Supabase Dashboard');
  console.log('2. Ir para SQL Editor');
  console.log('3. Executar conteúdo de: ENABLE_RLS_WITH_POLICIES.sql');
  console.log('4. Verificar que policies foram criadas');
  console.log('5. Testar acesso via UI');
  console.log('\n');
}

main().catch(err => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});
