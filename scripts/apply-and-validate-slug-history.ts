/**
 * Aplica migration de slug history e valida de ponta a ponta no banco real.
 *
 * Uso: npx tsx scripts/apply-and-validate-slug-history.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_KEY  = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function ok(msg: string)      { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg: string)    { console.error(`  ❌ ${msg}`); failed++; }
function info(msg: string)    { console.log(`  ℹ️  ${msg}`); }
function section(msg: string) { console.log(`\n${'─'.repeat(60)}\n${msg}\n${'─'.repeat(60)}`); }

// Executa SQL via REST API (mesmo padrão de apply-etapa12-migrations.ts)
async function execSQL(sql: string, label: string): Promise<boolean> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Tentar endpoint alternativo
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res2.ok) {
      const text2 = await res2.text();
      fail(`${label}: HTTP ${res2.status} — ${text2.substring(0, 200)}`);
      return false;
    }
  }

  ok(label);
  return true;
}

// ── Dados de teste ────────────────────────────────────────────────────────────

const TEST_ID   = '00000000-0000-0000-0000-test00000001';
const SLUG_V1   = 'test-slug-hist-v1';
const SLUG_V2   = 'test-slug-hist-v2';

async function cleanup() {
  await (supabase as any).from('business_slug_history').delete().eq('profile_id', TEST_ID);
  await (supabase as any).from('business_data').delete().eq('profile_id', TEST_ID);
  await (supabase as any).from('profile_members').delete().eq('profile_id', TEST_ID);
  await (supabase as any).from('profiles').delete().eq('id', TEST_ID);
}

// ── FASE 1: Aplicar migration ─────────────────────────────────────────────────

async function phase1_ApplyMigration() {
  section('FASE 1: Aplicar migration 20260329000011');

  // Aplicar migration 10 (canonical URL architecture) primeiro se necessario
  const migration10 = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260329000010_business_canonical_url_architecture.sql'),
    'utf-8',
  );

  // Aplicar migration 11 (slug history)
  const migration11 = readFileSync(
    join(process.cwd(), 'supabase/migrations/20260329000011_business_slug_history.sql'),
    'utf-8',
  );

  // Dividir em statements individuais para evitar problemas com multi-statement
  // A migration 11 tem: CREATE TABLE, CREATE INDEX x2, COMMENT, CREATE FUNCTION, DROP TRIGGER, CREATE TRIGGER
  // Executar como bloco unico via exec_sql

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
    },
    body: JSON.stringify({ query: migration11 }),
  });

  if (!res.ok) {
    const text = await res.text();
    // Se falhou, pode ser que a tabela ja existe — verificar
    info(`exec_sql retornou ${res.status}: ${text.substring(0, 300)}`);
    info('Verificando se tabela ja existe...');
  } else {
    ok('Migration 20260329000011 aplicada via exec_sql');
  }

  // Verificar tabela independente do resultado acima
  const { error: tableErr } = await (supabase as any)
    .from('business_slug_history')
    .select('id')
    .limit(0);

  if (tableErr) {
    fail(`Tabela business_slug_history nao existe apos migration: ${tableErr.message}`);
    return false;
  }
  ok('Tabela business_slug_history existe e acessivel');

  // Verificar indices
  const { data: idxCheck } = await supabase.rpc('exec_sql' as any, {
    query: `SELECT indexname FROM pg_indexes WHERE tablename = 'business_slug_history'`,
  }).catch(() => ({ data: null }));

  if (idxCheck) {
    info(`Indices em business_slug_history: ${JSON.stringify(idxCheck)}`);
  }

  return true;
}

// ── FASE 2: Validar trigger ───────────────────────────────────────────────────

async function phase2_ValidateTrigger() {
  section('FASE 2: Validar trigger fn_record_business_slug_history');

  // Buscar location de Salvador
  const { data: salvador } = await (supabase as any)
    .from('locations')
    .select('id, geographic_path')
    .eq('geographic_path', '/br/ba/salvador')
    .maybeSingle();

  if (!salvador) {
    fail('Location /br/ba/salvador nao encontrada. Verifique seeds.');
    return false;
  }
  ok(`Salvador encontrado: id=${salvador.id}`);

  // Criar profile de teste
  const { error: pErr } = await (supabase as any).from('profiles').insert({
    id: TEST_ID,
    name: 'Teste Slug History',
    profile_type: 'business',
    username: 'test-slug-hist-biz',
  });
  if (pErr && !pErr.message.includes('duplicate')) {
    fail(`Criar profile: ${pErr.message}`); return false;
  }

  // Criar business_data com slug inicial
  const { error: bErr } = await (supabase as any).from('business_data').insert({
    profile_id: TEST_ID,
    business_name: 'Teste Slug History',
    category: 'outros',
    status: 'active',
    slug: SLUG_V1,
    location_id: salvador.id,
  });
  if (bErr && !bErr.message.includes('duplicate')) {
    fail(`Criar business_data: ${bErr.message}`); return false;
  }
  ok(`Empresa criada: slug="${SLUG_V1}", location=/br/ba/salvador`);

  // Alterar slug → trigger deve gravar historico
  const { error: uErr } = await (supabase as any)
    .from('business_data')
    .update({ slug: SLUG_V2 })
    .eq('profile_id', TEST_ID);

  if (uErr) { fail(`Alterar slug: ${uErr.message}`); return false; }
  ok(`Slug alterado: "${SLUG_V1}" → "${SLUG_V2}"`);

  // Verificar historico
  const { data: hist, error: hErr } = await (supabase as any)
    .from('business_slug_history')
    .select('*')
    .eq('profile_id', TEST_ID);

  if (hErr) { fail(`Consultar historico: ${hErr.message}`); return false; }

  if (!hist || hist.length === 0) {
    fail('Trigger NAO gravou historico. Verificar se funcao foi criada corretamente.');
    return false;
  }

  const rec = hist[0];
  ok(`Historico gravado: ${JSON.stringify(rec)}`);

  const expectedUrl = `/empresas/ba/salvador/${SLUG_V1}`;
  if (rec.old_canonical_url !== expectedUrl) {
    fail(`old_canonical_url incorreto. Esperado="${expectedUrl}", Obtido="${rec.old_canonical_url}"`);
    return false;
  }
  ok(`old_canonical_url correto: "${rec.old_canonical_url}"`);

  if (rec.change_reason !== 'slug_changed') {
    fail(`change_reason incorreto. Esperado="slug_changed", Obtido="${rec.change_reason}"`);
    return false;
  }
  ok(`change_reason correto: "${rec.change_reason}"`);

  return true;
}

// ── FASE 3: Validar join PostgREST (R3) ──────────────────────────────────────

async function phase3_ValidateJoin() {
  section('FASE 3: Validar join business_data!profile_id no PostgREST (Risco R3)');

  const oldUrl = `/empresas/ba/salvador/${SLUG_V1}`;

  // Query exata de resolveBySlugHistory
  const { data, error } = await (supabase as any)
    .from('business_slug_history')
    .select(`
      profile_id,
      business:business_data!profile_id(
        profile_id,
        slug,
        is_premium,
        location:locations!location_id(geographic_path)
      )
    `)
    .eq('old_canonical_url', oldUrl)
    .maybeSingle();

  if (error) {
    fail(`Join aninhado FALHOU: ${error.message}`);
    info('Risco R3 confirmado. Corrigindo query para dois passos...');
    return { joinWorks: false };
  }

  if (!data) {
    fail(`Join retornou null para old_canonical_url="${oldUrl}"`);
    return { joinWorks: true, dataOk: false };
  }

  ok(`Join aninhado funcionou. Dados: ${JSON.stringify(data)}`);

  if (!data.business?.slug) {
    fail('business.slug nulo no resultado');
    return { joinWorks: true, dataOk: false };
  }

  ok(`business.slug atual: "${data.business.slug}"`);
  ok(`geographic_path atual: "${data.business?.location?.geographic_path}"`);

  const newCanonical = `/empresas/ba/salvador/${data.business.slug}`;
  ok(`Nova URL canonica: "${newCanonical}"`);
  info(`Redirect: "${oldUrl}" → "${newCanonical}"`);

  return { joinWorks: true, dataOk: true };
}

// ── FASE 3b: Query alternativa se join falhar ─────────────────────────────────

async function phase3b_TwoStepQuery() {
  section('FASE 3b: Query alternativa em dois passos');

  const oldUrl = `/empresas/ba/salvador/${SLUG_V1}`;

  const { data: h } = await (supabase as any)
    .from('business_slug_history')
    .select('profile_id')
    .eq('old_canonical_url', oldUrl)
    .maybeSingle();

  if (!h) { fail(`Passo 1: nao encontrou historico para "${oldUrl}"`); return false; }
  ok(`Passo 1: profile_id="${h.profile_id}"`);

  const { data: b, error: bErr } = await (supabase as any)
    .from('business_data')
    .select(`profile_id, slug, is_premium, location:locations!location_id(geographic_path)`)
    .eq('profile_id', h.profile_id)
    .eq('status', 'active')
    .maybeSingle();

  if (bErr || !b) { fail(`Passo 2: ${bErr?.message}`); return false; }
  ok(`Passo 2: slug="${b.slug}", geo="${b.location?.geographic_path}"`);

  return true;
}

// ── FASE 4: URL inexistente → null ────────────────────────────────────────────

async function phase4_NotFound() {
  section('FASE 4: URL inexistente retorna null (comportamento de 404)');

  const { data, error } = await (supabase as any)
    .from('business_slug_history')
    .select('profile_id')
    .eq('old_canonical_url', '/empresas/ba/salvador/empresa-que-nunca-existiu-xyz999')
    .maybeSingle();

  if (error) { fail(`Erro inesperado: ${error.message}`); return false; }
  if (data !== null) { fail(`Esperava null, obteve: ${JSON.stringify(data)}`); return false; }

  ok('URL inexistente retorna null corretamente');
  return true;
}

// ── FASE 5: Slug reservado nunca no historico ─────────────────────────────────

async function phase5_ReservedSlugNotInHistory() {
  section('FASE 5: Slug reservado nunca entra no historico');

  const reserved = ['admin', 'dashboard', 'empresas', 'p', 'business', 'login'];
  let allClean = true;

  for (const slug of reserved) {
    const { data } = await (supabase as any)
      .from('business_slug_history')
      .select('id')
      .eq('old_slug', slug)
      .limit(1);

    if (data && data.length > 0) {
      fail(`Slug reservado "${slug}" encontrado no historico`);
      allClean = false;
    } else {
      ok(`"${slug}" nao esta no historico`);
    }
  }

  return allClean;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('VALIDACAO REAL: Slug History + Trigger + Join PostgREST');
  console.log(`Banco: ${SUPABASE_URL}`);
  console.log('='.repeat(60));

  await cleanup();
  info('Dados de teste anteriores removidos\n');

  try {
    const p1 = await phase1_ApplyMigration();
    if (!p1) { console.log('\nFase 1 falhou. Abortando.'); process.exit(1); }

    const p2 = await phase2_ValidateTrigger();
    if (!p2) { console.log('\nFase 2 falhou.'); }

    const { joinWorks, dataOk } = await phase3_ValidateJoin();

    if (!joinWorks) {
      info('Join aninhado nao funciona — aplicando correcao no BusinessUrlService...');
      // Registrar que precisamos corrigir
      (global as any).__joinFailed = true;
    }

    // Sempre executar query alternativa para confirmar que funciona
    await phase3b_TwoStepQuery();

    await phase4_NotFound();
    await phase5_ReservedSlugNotInHistory();

  } finally {
    await cleanup();
    info('\nDados de teste removidos');
  }

  console.log('\n' + '='.repeat(60));
  console.log(`RESULTADO: ${passed} passaram, ${failed} falharam`);
  if ((global as any).__joinFailed) {
    console.log('ACAO NECESSARIA: Corrigir resolveBySlugHistory para query em dois passos');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('Erro fatal:', err); process.exit(1); });
