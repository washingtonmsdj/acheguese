#!/usr/bin/env node

import { writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

const migrations = [
  {
    name: 'create_gastronomy_subscriptions',
    sql: `
CREATE TABLE IF NOT EXISTS gastronomy_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
  plan_tier TEXT NOT NULL CHECK (plan_tier IN ('free', 'pro', 'delivery')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_end TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(business_id)
);

CREATE INDEX IF NOT EXISTS idx_gastronomy_subscriptions_business ON gastronomy_subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_gastronomy_subscriptions_status ON gastronomy_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_gastronomy_subscriptions_stripe ON gastronomy_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_gastronomy_subscriptions_period_end ON gastronomy_subscriptions(current_period_end);

ALTER TABLE gastronomy_subscriptions ENABLE ROW LEVEL SECURITY;
`
  },
  {
    name: 'create_rls_policies',
    sql: `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'gastronomy_subscriptions' 
    AND policyname = 'Empresas podem ver suas próprias assinaturas'
  ) THEN
    CREATE POLICY "Empresas podem ver suas próprias assinaturas"
      ON gastronomy_subscriptions FOR SELECT
      USING (
        business_id IN (
          SELECT business_id FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('owner', 'admin')
        )
      );
  END IF;
END $$;
`
  },
  {
    name: 'create_sync_function',
    sql: `
CREATE OR REPLACE FUNCTION sync_gastronomy_plan_tier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE gastronomy_profiles
  SET plan_tier = NEW.plan_tier
  WHERE business_id = NEW.business_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_plan_tier_on_subscription_change ON gastronomy_subscriptions;

CREATE TRIGGER sync_plan_tier_on_subscription_change
  AFTER INSERT OR UPDATE OF plan_tier ON gastronomy_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION sync_gastronomy_plan_tier();
`
  },
  {
    name: 'seed_free_subscriptions',
    sql: `
INSERT INTO gastronomy_subscriptions (
  business_id,
  plan_tier,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  business_id,
  'free' AS plan_tier,
  'active' AS status,
  now() AS current_period_start,
  now() + INTERVAL '100 years' AS current_period_end
FROM gastronomy_profiles
WHERE business_id NOT IN (
  SELECT business_id FROM gastronomy_subscriptions
)
ON CONFLICT (business_id) DO NOTHING;
`
  }
];

async function applyMigration(migration) {
  console.log(`\n📄 Aplicando: ${migration.name}`);
  
  const tempFile = `.temp-${migration.name}.sql`;
  
  try {
    // Escrever SQL em arquivo temporário
    writeFileSync(tempFile, migration.sql);
    
    // Executar via supabase db query com arquivo
    execSync(`supabase db query --file ${tempFile} --linked`, { stdio: 'inherit' });
    
    console.log(`✅ ${migration.name} aplicada com sucesso!`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao aplicar ${migration.name}`);
    return false;
  } finally {
    // Limpar arquivo temporário
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // Ignorar erro ao deletar
    }
  }
}

async function verify() {
  console.log('\n🔍 Verificando resultado...\n');
  
  const verifySQL = `
SELECT 
  COUNT(*) as total,
  plan_tier,
  status
FROM gastronomy_subscriptions
GROUP BY plan_tier, status;
`;
  
  const tempFile = '.temp-verify.sql';
  
  try {
    writeFileSync(tempFile, verifySQL);
    execSync(`supabase db query --file ${tempFile} --linked`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Não foi possível verificar');
  } finally {
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // Ignorar
    }
  }
}

async function main() {
  console.log('🚀 Aplicando migrations de Gastronomy Billing via arquivos SQL...\n');
  console.log('✅ Migration 1 já foi aplicada (plan_tier)\n');
  
  let successCount = 0;
  for (const migration of migrations) {
    const success = await applyMigration(migration);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Resultado: ${successCount}/${migrations.length} migrations aplicadas`);
  
  if (successCount > 0) {
    await verify();
  }
  
  console.log('\n🎉 Processo concluído!');
}

main();
