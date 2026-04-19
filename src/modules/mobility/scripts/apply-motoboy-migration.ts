/**
 * Script: apply-motoboy-migration
 * Aplica os campos de motoboy em ride_requests e driver_data
 * via Supabase RPC (executa SQL como service role).
 *
 * Uso:
 *   npx tsx src/modules/mobility/scripts/apply-motoboy-migration.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidas');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── SQL statements (cada um separado para execução individual) ──────────

const STATEMENTS = [
  // ride_mode
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS ride_mode TEXT NOT NULL DEFAULT 'ride' CHECK (ride_mode IN ('ride', 'motoboy'))`,
  // source_type
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS source_type TEXT CHECK (source_type IN ('passenger', 'business', 'gastronomy', 'service'))`,
  // source_id
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS source_id UUID`,
  // recipient_name
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS recipient_name TEXT`,
  // recipient_phone
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS recipient_phone TEXT`,
  // delivery_notes
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS delivery_notes TEXT`,
  // package_description
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS package_description TEXT`,
  // package_size
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS package_size TEXT CHECK (package_size IN ('small', 'medium', 'large'))`,
  // proof_of_delivery
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS proof_of_delivery JSONB DEFAULT NULL`,
  // pickup_confirmed_at
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS pickup_confirmed_at TIMESTAMPTZ`,
  // delivered_at
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ`,
  // failed_delivery_at
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS failed_delivery_at TIMESTAMPTZ`,
  // failed_delivery_reason
  `ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS failed_delivery_reason TEXT`,
  // index ride_mode
  `CREATE INDEX IF NOT EXISTS idx_ride_requests_ride_mode ON ride_requests(ride_mode)`,
  // index source
  `CREATE INDEX IF NOT EXISTS idx_ride_requests_source ON ride_requests(source_type, source_id) WHERE source_type IS NOT NULL`,
  // driver_data.can_do_delivery
  `ALTER TABLE driver_data ADD COLUMN IF NOT EXISTS can_do_delivery BOOLEAN NOT NULL DEFAULT true`,
];

// ── Pricing rule motoboy ────────────────────────────────────────────────

const PRICING_SQL = `
  SELECT create_active_pricing_rule(
    'motoboy',
    'Motoboy Padrão',
    3.50,
    1.80,
    0.30,
    6.00,
    NULL,
    true,
    NULL, NULL, '{}',
    'system'
  )
`;

// ── Runner ──────────────────────────────────────────────────────────────

async function run() {
  console.log("🚀 Aplicando migração motoboy...\n");

  let ok = 0;
  let fail = 0;

  for (const sql of STATEMENTS) {
    const label = sql.slice(0, 60).replace(/\s+/g, " ") + "...";
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: sql });
      if (error) throw error;
      console.log(`  ✅ ${label}`);
      ok++;
    } catch (err: any) {
      // Tentar via REST com parâmetro correto
      console.log(`  ⚠️  RPC direto falhou, tentando via fetch: ${label}`);
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: "POST",
          headers: {
            "apikey": SERVICE_KEY,
            "Authorization": `Bearer ${SERVICE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sql: sql }),
        });
        if (res.ok) {
          console.log(`  ✅ ${label}`);
          ok++;
        } else {
          const body = await res.text();
          console.log(`  ❌ ${label}\n     ${body}`);
          fail++;
        }
      } catch (fetchErr: any) {
        console.log(`  ❌ ${label}\n     ${fetchErr.message}`);
        fail++;
      }
    }
  }

  // Verificar se colunas existem via SELECT
  console.log("\n🔍 Verificando colunas...");
  const checks = [
    { table: "ride_requests", col: "ride_mode" },
    { table: "ride_requests", col: "recipient_name" },
    { table: "ride_requests", col: "proof_of_delivery" },
    { table: "driver_data",   col: "can_do_delivery" },
  ];

  for (const { table, col } of checks) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select(col)
      .limit(1);
    if (error) {
      console.log(`  ❌ ${table}.${col} — MISSING`);
    } else {
      console.log(`  ✅ ${table}.${col} — EXISTS`);
    }
  }

  // Inserir regra de pricing motoboy
  console.log("\n💰 Inserindo regra de pricing motoboy...");
  const { data: existingRule } = await (supabase as any)
    .from("pricing_rules")
    .select("id")
    .eq("mode", "motoboy")
    .eq("is_active", true)
    .maybeSingle();

  if (existingRule) {
    console.log("  ✅ Regra motoboy já existe, pulando.");
  } else {
    const { data: newRule, error: ruleErr } = await (supabase as any)
      .from("pricing_rules")
      .insert({
        mode: "motoboy",
        name: "Motoboy Padrão",
        base_fare: 3.50,
        price_per_km: 1.80,
        price_per_minute: 0.30,
        minimum_fare: 6.00,
        is_active: true,
        metadata: {},
        created_by: "system",
        updated_by: "system",
      })
      .select("id")
      .single();

    if (ruleErr) {
      console.log(`  ❌ Erro ao inserir regra: ${ruleErr.message}`);
    } else {
      console.log(`  ✅ Regra motoboy criada: ${newRule?.id}`);
    }
  }

  console.log(`\n📊 Resultado: ${ok} ok, ${fail} falhas`);
  if (fail > 0) {
    console.log("\n⚠️  Falhas provavelmente indicam que a função exec_sql não existe.");
    console.log("   Rode o SQL manualmente no Supabase Dashboard > SQL Editor.");
    console.log("   Arquivo: src/modules/mobility/migrations/add_motoboy_fields.sql");
  } else {
    console.log("\n✅ Migração concluída!");
  }
}

run().catch(console.error);
