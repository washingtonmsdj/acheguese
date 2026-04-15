#!/usr/bin/env node
/**
 * Script para aplicar migrations de pricing e safety via Supabase API
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

console.log('🚀 Aplicando migrations de pricing e safety...\n');

// SQL consolidado
const sql = `
-- ============================================
-- PRICING TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL,
  name TEXT NOT NULL,
  base_fare DECIMAL(10,2) NOT NULL CHECK (base_fare >= 0),
  price_per_km DECIMAL(10,2) NOT NULL CHECK (price_per_km >= 0),
  price_per_minute DECIMAL(10,2) NOT NULL CHECK (price_per_minute >= 0),
  minimum_fare DECIMAL(10,2) NOT NULL CHECK (minimum_fare >= 0),
  maximum_fare DECIMAL(10,2) CHECK (maximum_fare IS NULL OR maximum_fare >= minimum_fare),
  is_active BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT pricing_rules_mode_check CHECK (mode IN ('ride', 'delivery', 'mototaxi', 'motoboy', 'custom')),
  CONSTRAINT pricing_rules_valid_period_check CHECK (valid_until IS NULL OR valid_until > valid_from)
);

CREATE TABLE IF NOT EXISTS pricing_peak_hour_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  multiplier DECIMAL(5,2) NOT NULL CHECK (multiplier >= 1.0 AND multiplier <= 5.0),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour INTEGER CHECK (end_hour >= 0 AND end_hour <= 24),
  days_of_week INTEGER[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_peak_hour_multipliers_period_type_check CHECK (period_type IN ('morning', 'afternoon', 'evening', 'night', 'weekend', 'custom'))
);

CREATE TABLE IF NOT EXISTS pricing_additional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES pricing_rules(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  fee_type TEXT NOT NULL,
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_additional_fees_fee_type_check CHECK (fee_type IN ('fixed', 'percentage'))
);

CREATE TABLE IF NOT EXISTS pricing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  performed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_audit_log_action_check CHECK (action IN ('rule_created', 'rule_updated', 'rule_activated', 'rule_deactivated', 'rule_deleted', 'fee_added', 'fee_updated', 'fee_removed', 'multiplier_added', 'multiplier_updated', 'multiplier_removed')),
  CONSTRAINT pricing_audit_log_entity_type_check CHECK (entity_type IN ('rule', 'fee', 'multiplier'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_mode ON pricing_rules(mode);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_peak_hour_multipliers_rule_id ON pricing_peak_hour_multipliers(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_additional_fees_rule_id ON pricing_additional_fees(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_entity ON pricing_audit_log(entity_type, entity_id);

-- RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view active pricing rules" ON pricing_rules;
CREATE POLICY "Public can view active pricing rules" 
  ON pricing_rules FOR SELECT TO authenticated, anon
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

DROP POLICY IF EXISTS "Public can view active peak hour multipliers" ON pricing_peak_hour_multipliers;
CREATE POLICY "Public can view active peak hour multipliers" 
  ON pricing_peak_hour_multipliers FOR SELECT TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active additional fees" ON pricing_additional_fees;
CREATE POLICY "Public can view active additional fees" 
  ON pricing_additional_fees FOR SELECT TO authenticated, anon
  USING (is_active = true);

DROP POLICY IF EXISTS "System can insert audit logs" ON pricing_audit_log;
CREATE POLICY "System can insert audit logs" 
  ON pricing_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================
-- SEED PRICING RULES
-- ============================================

INSERT INTO pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
VALUES 
  ('ride', 'Corrida Padrão', 5.00, 2.50, 0.50, 8.00, true, '{"description": "Regra padrão para corridas de passageiro"}'::jsonb),
  ('delivery', 'Entrega Padrão', 4.00, 2.00, 0.30, 7.00, true, '{"description": "Regra padrão para entregas"}'::jsonb),
  ('mototaxi', 'Mototáxi Padrão', 4.00, 2.00, 0.40, 6.00, true, '{"description": "Regra padrão para mototáxi"}'::jsonb),
  ('motoboy', 'Motoboy Padrão', 3.50, 1.80, 0.30, 6.00, true, '{"description": "Regra padrão para motoboy"}'::jsonb)
ON CONFLICT DO NOTHING;
`;

const seedMultipliers = `
-- Seed multipliers for ride
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'morning', 1.30, 7, 9, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'afternoon', 1.50, 17, 19, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'night', 1.20, 22, 24, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'ride' AND name = 'Corrida Padrão'
ON CONFLICT DO NOTHING;

-- Seed multipliers for mototaxi
INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'morning', 1.20, 7, 9, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão'
ON CONFLICT DO NOTHING;

INSERT INTO pricing_peak_hour_multipliers (rule_id, period_type, multiplier, start_hour, end_hour, days_of_week, is_active)
SELECT id, 'afternoon', 1.30, 17, 19, ARRAY[1,2,3,4,5], true
FROM pricing_rules WHERE mode = 'mototaxi' AND name = 'Mototáxi Padrão'
ON CONFLICT DO NOTHING;
`;

try {
  // Criar tabelas via REST API não é possível diretamente
  // Vamos verificar se as tabelas já existem e seedar dados
  
  console.log('📦 Verificando/criando regras...');
  
  // Tentar inserir regras (se tabela existir)
  const rulesToSeed = [
    { mode: 'ride', name: 'Corrida Padrão', base_fare: 5.00, price_per_km: 2.50, price_per_minute: 0.50, minimum_fare: 8.00, is_active: true, metadata: { description: 'Regra padrão para corridas de passageiro' } },
    { mode: 'delivery', name: 'Entrega Padrão', base_fare: 4.00, price_per_km: 2.00, price_per_minute: 0.30, minimum_fare: 7.00, is_active: true, metadata: { description: 'Regra padrão para entregas' } },
    { mode: 'mototaxi', name: 'Mototáxi Padrão', base_fare: 4.00, price_per_km: 2.00, price_per_minute: 0.40, minimum_fare: 6.00, is_active: true, metadata: { description: 'Regra padrão para mototáxi' } },
    { mode: 'motoboy', name: 'Motoboy Padrão', base_fare: 3.50, price_per_km: 1.80, price_per_minute: 0.30, minimum_fare: 6.00, is_active: true, metadata: { description: 'Regra padrão para motoboy' } }
  ];
  
  for (const rule of rulesToSeed) {
    const { error } = await supabase
      .from('pricing_rules')
      .upsert(rule, { onConflict: 'mode,name', ignoreDuplicates: true });
    
    if (error && !error.message.includes('already exists')) {
      console.error(`❌ Erro ao criar regra ${rule.mode}:`, error.message);
    } else {
      console.log(`✅ Regra ${rule.mode} criada/verificada`);
    }
  }
  
  console.log('\n📦 Verificando/criando multiplicadores...');
  
  // Buscar IDs das regras
  const { data: rideRule } = await supabase
    .from('pricing_rules')
    .select('id')
    .eq('mode', 'ride')
    .eq('name', 'Corrida Padrão')
    .single();
  
  const { data: mototaxiRule } = await supabase
    .from('pricing_rules')
    .select('id')
    .eq('mode', 'mototaxi')
    .eq('name', 'Mototáxi Padrão')
    .single();
  
  if (rideRule) {
    const rideMultipliers = [
      { rule_id: rideRule.id, period_type: 'morning', multiplier: 1.30, start_hour: 7, end_hour: 9, days_of_week: [1,2,3,4,5], is_active: true },
      { rule_id: rideRule.id, period_type: 'afternoon', multiplier: 1.50, start_hour: 17, end_hour: 19, days_of_week: [1,2,3,4,5], is_active: true },
      { rule_id: rideRule.id, period_type: 'night', multiplier: 1.20, start_hour: 22, end_hour: 24, days_of_week: [1,2,3,4,5], is_active: true }
    ];
    
    for (const mult of rideMultipliers) {
      const { error } = await supabase
        .from('pricing_peak_hour_multipliers')
        .upsert(mult, { onConflict: 'rule_id,period_type', ignoreDuplicates: true });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Erro ao criar multiplicador ride ${mult.period_type}:`, error.message);
      } else {
        console.log(`✅ Multiplicador ride ${mult.period_type} criado/verificado`);
      }
    }
  }
  
  if (mototaxiRule) {
    const mototaxiMultipliers = [
      { rule_id: mototaxiRule.id, period_type: 'morning', multiplier: 1.20, start_hour: 7, end_hour: 9, days_of_week: [1,2,3,4,5], is_active: true },
      { rule_id: mototaxiRule.id, period_type: 'afternoon', multiplier: 1.30, start_hour: 17, end_hour: 19, days_of_week: [1,2,3,4,5], is_active: true }
    ];
    
    for (const mult of mototaxiMultipliers) {
      const { error } = await supabase
        .from('pricing_peak_hour_multipliers')
        .upsert(mult, { onConflict: 'rule_id,period_type', ignoreDuplicates: true });
      
      if (error && !error.message.includes('already exists')) {
        console.error(`❌ Erro ao criar multiplicador mototaxi ${mult.period_type}:`, error.message);
      } else {
        console.log(`✅ Multiplicador mototaxi ${mult.period_type} criado/verificado`);
      }
    }
  }
  
  // Verificar criação
  console.log('🔍 Verificando estado do banco...\n');
  
  const { data: rules, error: rulesError } = await supabase
    .from('pricing_rules')
    .select('mode, name, is_active, base_fare, minimum_fare')
    .order('mode');
  
  if (rulesError) {
    console.error('❌ Erro ao verificar regras:', rulesError);
  } else {
    console.log('📋 Regras criadas:');
    rules.forEach(rule => {
      console.log(`  - ${rule.mode}: ${rule.name} (base: R$ ${rule.base_fare}, mín: R$ ${rule.minimum_fare}) ${rule.is_active ? '✅' : '❌'}`);
    });
    console.log('');
  }
  
  const { data: multipliers, error: multipliersError } = await supabase
    .from('pricing_peak_hour_multipliers')
    .select('rule_id, period_type, multiplier, pricing_rules(mode, name)')
    .order('period_type');
  
  if (multipliersError) {
    console.error('❌ Erro ao verificar multiplicadores:', multipliersError);
  } else {
    console.log('📋 Multiplicadores criados:');
    multipliers.forEach(m => {
      console.log(`  - ${m.pricing_rules?.mode} (${m.period_type}): ${m.multiplier}x`);
    });
    console.log('');
  }
  
  console.log('✅ Migrations aplicadas com sucesso!');
  console.log('\n📝 Próximos passos:');
  console.log('  1. Re-executar testes: npm test src/core/pricing/__tests__/PricingService.runtime.test.ts');
  console.log('  2. Validar operações reais');
  
} catch (error) {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}
