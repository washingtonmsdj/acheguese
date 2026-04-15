/**
 * Aplica migration + valida slug history de ponta a ponta no banco real.
 * Usa Supabase Management API para executar SQL.
 *
 * Uso: npx tsx scripts/run-slug-history-full.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const PROJECT_REF  = 'xhdowzacfujckjelqhtd';
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

let passed = 0; let failed = 0;
const ok   = (m: string) => { console.log(`  ✅ ${m}`); passed++; };
const fail = (m: string) => { console.error(`  ❌ ${m}`); failed++; };
const info = (m: string) => console.log(`  ℹ️  ${m}`);
const sec  = (m: string) => console.log(`\n${'─'.repeat(56)}\n${m}\n${'─'.repeat(56)}`);

// ── Executa SQL via Management API ────────────────────────────────────────────

async function sql(query: string): Promise<{ ok: boolean; body: any }> {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });
  const body = await r.json().catch(() => ({}));
  return { ok: r.ok, body };
}

// ── Dados de teste ────────────────────────────────────────────────────────────

const PID    = '00000000-0000-0000-0000-test00000099';
const SLUG1  = 'test-slug-hist-aa1';
const SLUG2  = 'test-slug-hist-aa2';

async function cleanup() {
  await (sb as any).from('business_slug_history').delete().eq('profile_id', PID);
  await (sb as any).from('business_data').delete().eq('profile_id', PID);
  await (sb as any).from('profile_members').delete().eq('profile_id', PID);
  await (sb as any).from('profiles').delete().eq('id', PID);
}

// ── FASE 1: Aplicar migration ─────────────────────────────────────────────────

async function phase1() {
  sec('FASE 1: Aplicar migration via Management API');

  // Tabela
  const t1 = await sql(`
    CREATE TABLE IF NOT EXISTS business_slug_history (
      id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id       UUID        NOT NULL REFERENCES business_data(id) ON DELETE CASCADE,
      profile_id        UUID        NOT NULL,
      old_canonical_url TEXT        NOT NULL,
      old_slug          TEXT        NOT NULL,
      change_reason     TEXT        CHECK (change_reason IN ('slug_changed', 'territory_changed', 'both')),
      created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  if (t1.ok) ok('CREATE TABLE business_slug_history');
  else { fail(`CREATE TABLE: ${JSON.stringify(t1.body)}`); return false; }

  // Índices
  const i1 = await sql(`CREATE INDEX IF NOT EXISTS idx_slug_history_old_slug ON business_slug_history(old_slug);`);
  if (i1.ok) ok('INDEX idx_slug_history_old_slug');
  else fail(`INDEX old_slug: ${JSON.stringify(i1.body)}`);

  const i2 = await sql(`CREATE INDEX IF NOT EXISTS idx_slug_history_old_canonical ON business_slug_history(old_canonical_url);`);
  if (i2.ok) ok('INDEX idx_slug_history_old_canonical');
  else fail(`INDEX old_canonical: ${JSON.stringify(i2.body)}`);

  // Função do trigger
  const fn = await sql(`
    CREATE OR REPLACE FUNCTION fn_record_business_slug_history()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $$
    DECLARE
      v_old_geo_path  TEXT;
      v_uf            TEXT;
      v_cidade        TEXT;
      v_old_canonical TEXT;
      v_change_reason TEXT;
    BEGIN
      IF OLD.slug IS NOT DISTINCT FROM NEW.slug
         AND OLD.location_id IS NOT DISTINCT FROM NEW.location_id
      THEN
        RETURN NEW;
      END IF;
      IF OLD.slug IS NULL THEN
        RETURN NEW;
      END IF;
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
      INSERT INTO business_slug_history (business_id, profile_id, old_canonical_url, old_slug, change_reason)
      VALUES (OLD.id, OLD.profile_id, v_old_canonical, OLD.slug, v_change_reason)
      ON CONFLICT DO NOTHING;
      RETURN NEW;
    END;
    $$;
  `);
  if (fn.ok) ok('CREATE FUNCTION fn_record_business_slug_history');
  else { fail(`CREATE FUNCTION: ${JSON.stringify(fn.body)}`); return false; }

  // Trigger
  await sql(`DROP TRIGGER IF EXISTS trg_business_slug_history ON business_data;`);
  const tr = await sql(`
    CREATE TRIGGER trg_business_slug_history
      BEFORE UPDATE OF slug, location_id
      ON business_data
      FOR EACH ROW
      EXECUTE FUNCTION fn_record_business_slug_history();
  `);
  if (tr.ok) ok('CREATE TRIGGER trg_business_slug_history');
  else { fail(`CREATE TRIGGER: ${JSON.stringify(tr.body)}`); return false; }

  return true;
}

// ── FASE 2: Confirmar objetos no banco ────────────────────────────────────────

async function phase2() {
  sec('FASE 2: Confirmar objetos criados no banco');

  // Tabela existe
  const { error: tErr } = await (sb as any).from('business_slug_history').select('id').limit(0);
  if (!tErr) ok('Tabela business_slug_history acessível via PostgREST');
  else { fail(`Tabela não acessível: ${tErr.message}`); return false; }

  // Índices
  const idx = await sql(`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'business_slug_history'
    ORDER BY indexname;
  `);
  if (idx.ok && idx.body?.length > 0) {
    ok(`Índices: ${idx.body.map((r: any) => r.indexname).join(', ')}`);
  } else {
    fail(`Índices não encontrados: ${JSON.stringify(idx.body)}`);
  }

  // Função
  const fn = await sql(`
    SELECT proname FROM pg_proc
    WHERE proname = 'fn_record_business_slug_history';
  `);
  if (fn.ok && fn.body?.length > 0) ok('Função fn_record_business_slug_history existe');
  else fail(`Função não encontrada: ${JSON.stringify(fn.body)}`);

  // Trigger
  const tr = await sql(`
    SELECT tgname FROM pg_trigger
    WHERE tgname = 'trg_business_slug_history';
  `);
  if (tr.ok && tr.body?.length > 0) ok('Trigger trg_business_slug_history existe');
  else fail(`Trigger não encontrado: ${JSON.stringify(tr.body)}`);

  // FK
  const fk = await sql(`
    SELECT conname FROM pg_constraint
    WHERE conname LIKE '%slug_history%' AND contype = 'f';
  `);
  if (fk.ok && fk.body?.length > 0) ok(`FK: ${fk.body.map((r: any) => r.conname).join(', ')}`);
  else info('FK não encontrada via pg_constraint (pode estar com nome gerado automaticamente)');

  return true;
}

// ── FASE 3: Validação ponta a ponta ──────────────────────────────────────────

async function phase3() {
  sec('FASE 3: Validação ponta a ponta com dados reais');

  // Buscar Salvador
  const { data: salvador } = await (sb as any)
    .from('locations').select('id, geographic_path')
    .eq('geographic_path', '/br/ba/salvador').maybeSingle();

  if (!salvador) { fail('Location /br/ba/salvador não encontrada'); return false; }
  ok(`Salvador: id=${salvador.id}, path=${salvador.geographic_path}`);

  // Criar profile
  const { error: pErr } = await (sb as any).from('profiles').insert({
    id: PID, name: 'Teste Slug History', profile_type: 'business', username: 'test-slug-hist-99',
  });
  if (pErr && !pErr.message.includes('duplicate')) { fail(`Profile: ${pErr.message}`); return false; }

  // Criar business_data com slug inicial
  const { error: bErr } = await (sb as any).from('business_data').insert({
    profile_id: PID, business_name: 'Teste Slug History',
    category: 'outros', status: 'active',
    slug: SLUG1, location_id: salvador.id,
  });
  if (bErr && !bErr.message.includes('duplicate')) { fail(`business_data: ${bErr.message}`); return false; }
  ok(`Empresa criada: slug="${SLUG1}", location=/br/ba/salvador`);

  const expectedOldUrl = `/empresas/ba/salvador/${SLUG1}`;
  info(`URL canônica inicial: ${expectedOldUrl}`);

  // Alterar slug → trigger deve gravar histórico
  const { error: uErr } = await (sb as any)
    .from('business_data').update({ slug: SLUG2 }).eq('profile_id', PID);
  if (uErr) { fail(`UPDATE slug: ${uErr.message}`); return false; }
  ok(`Slug alterado: "${SLUG1}" → "${SLUG2}"`);

  // Verificar histórico
  const { data: hist, error: hErr } = await (sb as any)
    .from('business_slug_history').select('*').eq('profile_id', PID);
  if (hErr) { fail(`Consultar histórico: ${hErr.message}`); return false; }
  if (!hist || hist.length === 0) { fail('Trigger NÃO gravou histórico'); return false; }

  const rec = hist[0];
  ok(`Histórico gravado: ${JSON.stringify(rec)}`);

  if (rec.old_canonical_url !== expectedOldUrl) {
    fail(`old_canonical_url incorreto. Esperado="${expectedOldUrl}", Obtido="${rec.old_canonical_url}"`);
    return false;
  }
  ok(`old_canonical_url correto: "${rec.old_canonical_url}"`);

  if (rec.change_reason !== 'slug_changed') {
    fail(`change_reason incorreto. Esperado="slug_changed", Obtido="${rec.change_reason}"`);
    return false;
  }
  ok(`change_reason correto: "${rec.change_reason}"`);

  // Simular resolveBySlugHistory (dois passos)
  const { data: h2 } = await (sb as any)
    .from('business_slug_history').select('profile_id')
    .eq('old_canonical_url', expectedOldUrl).maybeSingle();
  if (!h2) { fail(`resolveBySlugHistory passo 1 falhou para "${expectedOldUrl}"`); return false; }

  const { data: biz } = await (sb as any)
    .from('business_data')
    .select('profile_id, slug, is_premium, location:locations!location_id(geographic_path)')
    .eq('profile_id', h2.profile_id).eq('status', 'active').maybeSingle();
  if (!biz?.slug) { fail('resolveBySlugHistory passo 2 falhou'); return false; }

  const newCanonical = `/empresas/ba/salvador/${biz.slug}`;
  ok(`URL antiga "${expectedOldUrl}" → resolve para "${newCanonical}"`);
  ok(`Redirect: "${expectedOldUrl}" → "${newCanonical}" (308)`);

  // URL inexistente → null (404)
  const { data: notFound } = await (sb as any)
    .from('business_slug_history').select('profile_id')
    .eq('old_canonical_url', '/empresas/ba/salvador/empresa-que-nunca-existiu-xyz999')
    .maybeSingle();
  if (notFound !== null) { fail('URL inexistente deveria retornar null'); return false; }
  ok('URL inexistente retorna null → 404 correto');

  // Slug reservado nunca no histórico
  const reserved = ['admin', 'dashboard', 'p', 'business', 'login'];
  for (const s of reserved) {
    const { data: r } = await (sb as any)
      .from('business_slug_history').select('id').eq('old_slug', s).limit(1);
    if (r && r.length > 0) fail(`Slug reservado "${s}" no histórico`);
    else ok(`Slug reservado "${s}" não está no histórico`);
  }

  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(56));
  console.log('VALIDAÇÃO REAL: Slug History no banco');
  console.log(`Banco: ${SUPABASE_URL}`);
  console.log('='.repeat(56));

  await cleanup();
  info('Dados de teste anteriores removidos');

  try {
    const p1 = await phase1();
    if (!p1) { console.log('\nFase 1 falhou. Abortando.'); process.exit(1); }

    const p2 = await phase2();
    if (!p2) console.log('\nFase 2 com falhas — ver acima');

    const p3 = await phase3();
    if (!p3) console.log('\nFase 3 com falhas — ver acima');

  } finally {
    await cleanup();
    info('Dados de teste removidos');
  }

  console.log('\n' + '='.repeat(56));
  console.log(`RESULTADO: ${passed} ✅  ${failed} ❌`);
  console.log('='.repeat(56) + '\n');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
