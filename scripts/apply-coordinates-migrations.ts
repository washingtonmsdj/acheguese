/**
 * Aplica as migrations de coordenadas geográficas para events e community_alerts.
 *
 * Estratégia: criar função exec_sql temporária via fetch direto,
 * depois usá-la para aplicar as migrations completas.
 *
 * Uso: npx tsx scripts/apply-coordinates-migrations.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Cria a função exec_sql no banco (necessária para executar DDL via REST)
const CREATE_EXEC_SQL = `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
`;

const MIGRATIONS = [
  '20260403000001_add_coordinates_to_events.sql',
  '20260403000002_add_coordinates_to_community_alerts.sql',
  '20260403000003_update_create_community_alert_rpc.sql',
];

const BACKFILL_EVENTS = `
UPDATE events e
SET latitude = l.canonical_lat, longitude = l.canonical_lng, coordinate_source = 'approximate'
FROM locations l
WHERE e.location_id = l.id AND l.canonical_lat IS NOT NULL AND l.canonical_lng IS NOT NULL AND e.latitude IS NULL;
`;

const BACKFILL_ALERTS = `
UPDATE community_alerts ca
SET latitude = l.canonical_lat, longitude = l.canonical_lng, coordinate_source = 'approximate'
FROM locations l
WHERE ca.location_id = l.id AND l.canonical_lat IS NOT NULL AND l.canonical_lng IS NOT NULL AND ca.latitude IS NULL;
`;

// Tenta múltiplos endpoints para executar SQL
async function execSQL(sql: string, label: string): Promise<void> {
  // Tentar exec_sql com parâmetro 'sql'
  const { error } = await (supabase as any).rpc('exec_sql', { sql });
  if (!error) return;

  // Tentar exec_sql com parâmetro 'query'
  const { error: error2 } = await (supabase as any).rpc('exec_sql', { query: sql });
  if (!error2) return;

  // Tentar exec com parâmetro 'sql'
  const { error: error3 } = await (supabase as any).rpc('exec', { sql });
  if (!error3) return;

  throw new Error(`${label}: ${error?.message || error2?.message || error3?.message}`);
}

// Cria exec_sql via fetch direto ao endpoint de funções do Supabase
async function bootstrapExecSQL(): Promise<boolean> {
  console.log('  Criando função exec_sql via supabase.rpc...');

  // Tentar criar via uma função que já existe — usar pg_catalog diretamente
  // Supabase permite executar SQL via endpoint especial de migrations
  const endpoints = [
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`, body: { sql: CREATE_EXEC_SQL } },
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec_sql`, body: { query: CREATE_EXEC_SQL } },
    { url: `${SUPABASE_URL}/rest/v1/rpc/exec`, body: { sql: CREATE_EXEC_SQL } },
  ];

  for (const ep of endpoints) {
    const r = await fetch(ep.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify(ep.body),
    });
    if (r.ok) {
      console.log(`  ✅ exec_sql criada via ${ep.url}`);
      return true;
    }
  }

  // Último recurso: usar supabase.from para INSERT em tabela de controle
  // que dispara trigger com EXECUTE — não disponível aqui
  console.log('  ⚠️  Não foi possível criar exec_sql automaticamente.');
  console.log('  Tentando aplicar migrations statement por statement...');
  return false;
}

// Aplica migration quebrando em statements individuais via supabase client
async function applyMigrationByStatements(sql: string, label: string): Promise<void> {
  // Remover comentários de linha e bloco
  const cleaned = sql
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  // Dividir por ; mas preservar blocos $$ ... $$
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  const lines = cleaned.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detectar início/fim de dollar quoting
    const dollarMatch = trimmed.match(/\$\$|\$[a-zA-Z_][a-zA-Z0-9_]*\$/g);
    if (dollarMatch) {
      for (const tag of dollarMatch) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
      }
    }

    current += line + '\n';

    if (!inDollarQuote && trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 1) statements.push(stmt);
      current = '';
    }
  }
  if (current.trim().length > 1) statements.push(current.trim());

  console.log(`  ${statements.length} statements encontrados`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
    try {
      await execSQL(stmt, `${label} [${i + 1}/${statements.length}]`);
      console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}...`);
    } catch (e: any) {
      // Ignorar erros de "já existe" (idempotência)
      const msg = e.message || '';
      if (msg.includes('already exists') || msg.includes('duplicate') || msg.includes('já existe')) {
        console.log(`  ⚠️  [${i + 1}/${statements.length}] Já existe (OK): ${preview}...`);
      } else {
        console.error(`  ❌ [${i + 1}/${statements.length}] ${preview}...`);
        console.error(`     Erro: ${msg.substring(0, 200)}`);
      }
    }
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  MIGRATIONS: Coordenadas Geográficas para Maps');
  console.log('═══════════════════════════════════════════════════\n');

  // ── Fase 1: Diagnóstico ──────────────────────────────────────────────────
  console.log('── Fase 1: Diagnóstico ─────────────────────────────');

  const { data: locData } = await supabase
    .from('locations')
    .select('type, canonical_lat')
    .limit(2000);

  if (locData) {
    const byType: Record<string, { total: number; withCoords: number }> = {};
    locData.forEach((r: any) => {
      if (!byType[r.type]) byType[r.type] = { total: 0, withCoords: 0 };
      byType[r.type].total++;
      if (r.canonical_lat) byType[r.type].withCoords++;
    });
    console.log('\nCobertura de coordenadas em locations:');
    Object.entries(byType).forEach(([type, s]) =>
      console.log(`  ${type}: ${s.withCoords}/${s.total}`)
    );
    const totalWithCoords = Object.values(byType).reduce((a, b) => a + b.withCoords, 0);
    if (totalWithCoords === 0) {
      console.log('\n  ⚠️  Nenhuma location tem canonical_lat/lng.');
      console.log('  O backfill não produzirá resultados até que locations sejam populadas.');
    }
  }

  // ── Fase 2: Bootstrap exec_sql ───────────────────────────────────────────
  console.log('\n── Fase 2: Bootstrap exec_sql ──────────────────────');
  await bootstrapExecSQL();

  // ── Fase 3: Migrations ───────────────────────────────────────────────────
  console.log('\n── Fase 3: Migrations ──────────────────────────────');

  for (const filename of MIGRATIONS) {
    const filepath = join(process.cwd(), 'supabase', 'migrations', filename);
    const sql = readFileSync(filepath, 'utf-8');
    console.log(`\n  Aplicando: ${filename}`);
    await applyMigrationByStatements(sql, filename);
  }

  // ── Fase 4: Smoke test da view ───────────────────────────────────────────
  console.log('\n── Fase 4: Smoke test da view ──────────────────────');

  const { data: viewData, error: viewErr } = await supabase
    .from('community_alerts_public')
    .select('id, title, latitude, longitude, coordinate_source')
    .limit(3);

  if (viewErr) {
    console.error('  ❌ View com erro:', viewErr.message);
  } else {
    console.log(`  ✅ View retorna campos esperados (${viewData?.length ?? 0} registros)`);
    if (viewData && viewData.length > 0) {
      console.log('  Campos disponíveis:', Object.keys(viewData[0]));
    }
  }

  // ── Fase 5: Backfill ─────────────────────────────────────────────────────
  console.log('\n── Fase 5: Backfill ────────────────────────────────');

  try {
    await execSQL(BACKFILL_EVENTS, 'backfill events');
    console.log('  ✅ events: backfill executado');
  } catch (e: any) {
    console.error('  ❌ events backfill:', e.message);
  }

  try {
    await execSQL(BACKFILL_ALERTS, 'backfill alerts');
    console.log('  ✅ community_alerts: backfill executado');
  } catch (e: any) {
    console.error('  ❌ alerts backfill:', e.message);
  }

  // ── Fase 6: Verificação final ─────────────────────────────────────────────
  console.log('\n── Fase 6: Verificação final ───────────────────────');

  const { data: eventsRow, error: eventsColErr } = await supabase
    .from('events')
    .select('latitude, longitude, coordinate_source')
    .limit(1);

  if (eventsColErr) {
    console.error('  ❌ Colunas events:', eventsColErr.message);
  } else {
    console.log('  ✅ events: latitude, longitude, coordinate_source — OK');
  }

  const { data: alertsRow, error: alertsColErr } = await supabase
    .from('community_alerts')
    .select('latitude, longitude, coordinate_source')
    .limit(1);

  if (alertsColErr) {
    console.error('  ❌ Colunas community_alerts:', alertsColErr.message);
  } else {
    console.log('  ✅ community_alerts: latitude, longitude, coordinate_source — OK');
  }

  const { data: eventsWithCoords } = await supabase
    .from('events').select('id').not('latitude', 'is', null).limit(1000);
  console.log(`  events com coordenada: ${eventsWithCoords?.length ?? 0}`);

  const { data: alertsWithCoords } = await supabase
    .from('community_alerts').select('id').not('latitude', 'is', null).limit(1000);
  console.log(`  community_alerts com coordenada: ${alertsWithCoords?.length ?? 0}`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Execução concluída.');
  console.log('═══════════════════════════════════════════════════\n');
}

main();
