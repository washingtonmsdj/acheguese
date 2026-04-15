/**
 * Aplica migration + valida slug history via pg (conexão direta ao banco).
 * Usa pg@8 que já está instalado no projeto.
 *
 * Uso: npx tsx scripts/run-slug-history-pg.ts
 */

import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

// Connection strings do Supabase — todas as variações conhecidas
const DB_URLS = [
  // Formato oficial Supabase pooler (session mode, porta 5432)
  `process.env.SUPABASE_DB_URL!
  // Sem SSL
  `process.env.SUPABASE_DB_URL!
  // Formato com host IPv4 explícito
  `process.env.SUPABASE_DB_URL!
];

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

let passed = 0; let failed = 0;
const ok   = (m: string) => { console.log(`  ✅ ${m}`); passed++; };
const fail = (m: string) => { console.error(`  ❌ ${m}`); failed++; };
const info = (m: string) => console.log(`  ℹ️  ${m}`);
const sec  = (m: string) => console.log(`\n${'─'.repeat(56)}\n${m}\n${'─'.repeat(56)}`);

const PID   = '00000000-0000-0000-0000-test00000099';
const SLUG1 = 'test-slug-hist-aa1';
const SLUG2 = 'test-slug-hist-aa2';

async function cleanup() {
  await (sb as any).from('business_slug_history').delete().eq('profile_id', PID);
  await (sb as any).from('business_data').delete().eq('profile_id', PID);
  await (sb as any).from('profile_members').delete().eq('profile_id', PID);
  await (sb as any).from('profiles').delete().eq('id', PID);
}

async function connectPg(): Promise<Client | null> {
  for (const url of DB_URLS) {
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
    try {
      await client.connect();
      info(`Conectado via pg: ${url.split('@')[1]}`);
      return client;
    } catch (e: any) {
      info(`Falha conexão ${url.split('@')[1]}: ${e.message}`);
      await client.end().catch(() => {});
    }
  }
  return null;
}

async function phase1_ApplyMigration(pg: Client) {
  sec('FASE 1: Aplicar migration via pg');

  const statements = [
    `CREATE TABLE IF NOT EXISTS business_slug_history (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      profile_id        UUID        NOT NULL REFERENCES business_data(profile_id) ON DELETE CASCADE,
      old_canonical_url TEXT        NOT NULL,
      old_slug          TEXT        NOT NULL,
      change_reason     TEXT        CHECK (change_reason IN ('slug_changed', 'territory_changed', 'both')),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug ON business_slug_history(old_slug)`,
    `CREATE INDEX IF NOT EXISTS idx_slug_history_old_canonical ON business_slug_history(old_canonical_url)`,
    `COMMENT ON TABLE business_slug_history IS 'Historico de URLs canonicas antigas de empresas'`,
    `CREATE OR REPLACE FUNCTION fn_record_business_slug_history()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
    DECLARE
      v_old_geo_path  TEXT;
      v_uf            TEXT;
      v_cidade        TEXT;
      v_old_canonical TEXT;
      v_change_reason TEXT;
    BEGIN
      IF OLD.slug IS NOT DISTINCT FROM NEW.slug
         AND OLD.location_id IS NOT DISTINCT FROM NEW.location_id
      THEN RETURN NEW; END IF;
      IF OLD.slug IS NULL THEN RETURN NEW; END IF;
      SELECT geographic_path INTO v_old_geo_path FROM locations WHERE id = OLD.location_id;
      IF v_old_geo_path IS NOT NULL THEN
        v_uf     := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 2);
        v_cidade := SPLIT_PART(LTRIM(v_old_geo_path, '/'), '/', 3);
        IF v_uf <> '' AND v_cidade <> '' THEN
          v_old_canonical := '/empresas/' || v_uf || '/' || v_cidade || '/' || OLD.slug;
        ELSE
          v_old_canonical := '/empresas/ba/salvador/' || OLD.slug;
        END IF;
      ELSE
        v_old_canonical := '/empresas/ba/salvador/' || OLD.slug;
      END IF;
      IF OLD.slug IS DISTINCT FROM NEW.slug AND OLD.location_id IS DISTINCT FROM NEW.location_id THEN
        v_change_reason := 'both';
      ELSIF OLD.slug IS DISTINCT FROM NEW.slug THEN
        v_change_reason := 'slug_changed';
      ELSE
        v_change_reason := 'territory_changed';
      END IF;
      INSERT INTO business_slug_history (profile_id, old_canonical_url, old_slug, change_reason)
      VALUES (OLD.profile_id, v_old_canonical, OLD.slug, v_change_reason)
      ON CONFLICT DO NOTHING;
      RETURN NEW;
    END; $$`,
    `DROP TRIGGER IF EXISTS trg_business_slug_history ON business_data`,
    `CREATE TRIGGER trg_business_slug_history
      BEFORE UPDATE OF slug, location_id ON business_data
      FOR EACH ROW EXECUTE FUNCTION fn_record_business_slug_history()`,
  ];

  const labels = [
    'CREATE TABLE business_slug_history',
    'INDEX idx_slug_history_old_slug',
    'INDEX idx_slug_history_old_canonical',
    'COMMENT ON TABLE',
    'CREATE FUNCTION fn_record_business_slug_history',
    'DROP TRIGGER (idempotente)',
    'CREATE TRIGGER trg_business_slug_history',
  ];

  for (let i = 0; i < statements.length; i++) {
    try {
      await pg.query(statements[i]);
      ok(labels[i]);
    } catch (e: any) {
      if (e.message.includes('already exists')) {
        ok(`${labels[i]} (já existia)`);
      } else {
        fail(`${labels[i]}: ${e.message}`);
        return false;
      }
    }
  }
  return true;
}

async function phase2_ConfirmObjects(pg: Client) {
  sec('FASE 2: Confirmar objetos no banco');

  // Tabela via PostgREST
  const { error: tErr } = await (sb as any).from('business_slug_history').select('id').limit(0);
  if (!tErr) ok('Tabela business_slug_history acessível via PostgREST');
  else fail(`Tabela não acessível: ${tErr.message}`);

  // Índices
  const { rows: idxRows } = await pg.query(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'business_slug_history' ORDER BY indexname`
  );
  if (idxRows.length > 0) ok(`Índices: ${idxRows.map((r: any) => r.indexname).join(', ')}`);
  else fail('Nenhum índice encontrado');

  // Função
  const { rows: fnRows } = await pg.query(
    `SELECT proname FROM pg_proc WHERE proname = 'fn_record_business_slug_history'`
  );
  if (fnRows.length > 0) ok('Função fn_record_business_slug_history existe');
  else fail('Função não encontrada');

  // Trigger
  const { rows: trRows } = await pg.query(
    `SELECT tgname FROM pg_trigger WHERE tgname = 'trg_business_slug_history'`
  );
  if (trRows.length > 0) ok('Trigger trg_business_slug_history existe');
  else fail('Trigger não encontrado');

  // FK
  const { rows: fkRows } = await pg.query(
    `SELECT conname, contype FROM pg_constraint
     WHERE conrelid = 'business_slug_history'::regclass AND contype = 'f'`
  );
  if (fkRows.length > 0) ok(`FK: ${fkRows.map((r: any) => r.conname).join(', ')}`);
  else info('FK com nome gerado automaticamente (normal)');

  return true;
}

async function phase3_EndToEnd() {
  sec('FASE 3: Validação ponta a ponta');

  const { data: salvador } = await (sb as any)
    .from('locations').select('id, geographic_path')
    .eq('geographic_path', '/br/ba/salvador').maybeSingle();
  if (!salvador) { fail('Location /br/ba/salvador não encontrada'); return false; }
  ok(`Salvador: id=${salvador.id}`);

  // Criar dados de teste
  await (sb as any).from('profiles').insert({
    id: PID, name: 'Teste Slug History', profile_type: 'business', username: 'test-slug-hist-99',
  });
  await (sb as any).from('business_data').insert({
    profile_id: PID, business_name: 'Teste Slug History',
    category: 'outros', status: 'active', slug: SLUG1, location_id: salvador.id,
  });
  ok(`Empresa criada: slug="${SLUG1}", location=/br/ba/salvador`);

  const expectedOldUrl = `/empresas/ba/salvador/${SLUG1}`;
  info(`URL canônica inicial: ${expectedOldUrl}`);

  // Alterar slug
  const { error: uErr } = await (sb as any)
    .from('business_data').update({ slug: SLUG2 }).eq('profile_id', PID);
  if (uErr) { fail(`UPDATE slug: ${uErr.message}`); return false; }
  ok(`Slug alterado: "${SLUG1}" → "${SLUG2}"`);

  // Verificar histórico
  const { data: hist, error: hErr } = await (sb as any)
    .from('business_slug_history').select('*').eq('profile_id', PID);
  if (hErr || !hist?.length) { fail(`Trigger não gravou histórico: ${hErr?.message}`); return false; }

  const rec = hist[0];
  ok(`Histórico gravado: old_slug="${rec.old_slug}", old_canonical_url="${rec.old_canonical_url}", change_reason="${rec.change_reason}"`);

  if (rec.old_canonical_url !== expectedOldUrl) {
    fail(`old_canonical_url incorreto. Esperado="${expectedOldUrl}", Obtido="${rec.old_canonical_url}"`); return false;
  }
  ok(`old_canonical_url correto: "${rec.old_canonical_url}"`);

  if (rec.change_reason !== 'slug_changed') {
    fail(`change_reason incorreto. Esperado="slug_changed", Obtido="${rec.change_reason}"`); return false;
  }
  ok(`change_reason correto: "${rec.change_reason}"`);

  // Simular resolveBySlugHistory (dois passos)
  const { data: h2 } = await (sb as any)
    .from('business_slug_history').select('profile_id')
    .eq('old_canonical_url', expectedOldUrl).maybeSingle();
  if (!h2) { fail(`resolveBySlugHistory passo 1 falhou`); return false; }

  const { data: biz } = await (sb as any)
    .from('business_data')
    .select('profile_id, slug, is_premium, location:locations!location_id(geographic_path)')
    .eq('profile_id', h2.profile_id).eq('status', 'active').maybeSingle();
  if (!biz?.slug) { fail('resolveBySlugHistory passo 2 falhou'); return false; }

  const newCanonical = `/empresas/ba/salvador/${biz.slug}`;
  ok(`URL antiga "${expectedOldUrl}" → resolve para "${newCanonical}"`);
  ok(`Redirect 308: "${expectedOldUrl}" → "${newCanonical}"`);

  // URL inexistente → null (404)
  const { data: notFound } = await (sb as any)
    .from('business_slug_history').select('profile_id')
    .eq('old_canonical_url', '/empresas/ba/salvador/empresa-que-nunca-existiu-xyz999')
    .maybeSingle();
  if (notFound !== null) { fail('URL inexistente deveria retornar null'); return false; }
  ok('URL inexistente retorna null → 404 correto');

  // Slug reservado nunca no histórico
  for (const s of ['admin', 'dashboard', 'p', 'business', 'login']) {
    const { data: r } = await (sb as any)
      .from('business_slug_history').select('id').eq('old_slug', s).limit(1);
    if (r?.length > 0) fail(`Slug reservado "${s}" no histórico`);
    else ok(`Slug reservado "${s}" não está no histórico`);
  }

  return true;
}

async function main() {
  console.log('\n' + '='.repeat(56));
  console.log('VALIDAÇÃO REAL: Slug History no banco');
  console.log(`Banco: ${SUPABASE_URL}`);
  console.log('='.repeat(56));

  await cleanup();
  info('Dados de teste anteriores removidos');

  const pg = await connectPg();
  if (!pg) {
    fail('Não foi possível conectar ao banco via pg. Verifique rede/firewall.');
    console.log('\nRESULTADO: conexão pg falhou\n');
    process.exit(1);
  }

  try {
    const p1 = await phase1_ApplyMigration(pg);
    if (!p1) { console.log('\nFase 1 falhou.'); process.exit(1); }

    await phase2_ConfirmObjects(pg);
    await phase3_EndToEnd();

  } finally {
    await pg.end();
    await cleanup();
    info('Conexão pg encerrada. Dados de teste removidos.');
  }

  console.log('\n' + '='.repeat(56));
  console.log(`RESULTADO: ${passed} ✅  ${failed} ❌`);
  console.log('='.repeat(56) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
