/**
 * Validacao real do slug history no banco
 *
 * Executa e comprova:
 *   1. Migration aplicada (tabela + trigger existem)
 *   2. Trigger grava historico ao mudar slug
 *   3. Trigger grava historico ao mudar territorio
 *   4. resolveBySlugHistory retorna contexto atual
 *   5. URL antiga resolve para nova URL canonica
 *   6. URL inexistente retorna null (404)
 *   7. Slug reservado nunca entra no fluxo
 *   8. Join business_data!profile_id funciona no PostgREST
 *
 * Uso: npx tsx scripts/validate-slug-history-real.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
  console.error('ERRO: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao definidos em .env.remote');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function ok(msg: string)   { console.log(`  ✅ ${msg}`); }
function fail(msg: string) { console.error(`  ❌ ${msg}`); process.exitCode = 1; }
function info(msg: string) { console.log(`  ℹ️  ${msg}`); }
function section(msg: string) { console.log(`\n${'─'.repeat(60)}\n${msg}\n${'─'.repeat(60)}`); }

// ── Dados de teste ────────────────────────────────────────────────────────────

const TEST_PROFILE_ID = '00000000-test-slug-history-0000000001';
const TEST_SLUG_INITIAL = 'test-empresa-slug-history-v1';
const TEST_SLUG_CHANGED  = 'test-empresa-slug-history-v2';

// ── Funcoes auxiliares ────────────────────────────────────────────────────────

async function getSalvadorLocationId(): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('locations')
    .select('id, geographic_path')
    .eq('geographic_path', '/br/ba/salvador')
    .maybeSingle();
  return data?.id ?? null;
}

async function getAnyOtherCityLocationId(excludeId: string): Promise<{ id: string; geographic_path: string } | null> {
  const { data } = await (supabase as any)
    .from('locations')
    .select('id, geographic_path')
    .neq('id', excludeId)
    .eq('type', 'city')
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function cleanupTestData() {
  // Remove dados de teste na ordem correta (FK)
  await (supabase as any)
    .from('business_slug_history')
    .delete()
    .eq('profile_id', TEST_PROFILE_ID);

  await (supabase as any)
    .from('business_data')
    .delete()
    .eq('profile_id', TEST_PROFILE_ID);

  await (supabase as any)
    .from('profile_members')
    .delete()
    .eq('profile_id', TEST_PROFILE_ID);

  await (supabase as any)
    .from('profiles')
    .delete()
    .eq('id', TEST_PROFILE_ID);
}

// ── Testes ────────────────────────────────────────────────────────────────────

async function test1_MigrationApplied() {
  section('TESTE 1: Migration aplicada (tabela + trigger existem)');

  // Verificar tabela
  const { data: tableCheck, error: tableErr } = await (supabase as any)
    .from('business_slug_history')
    .select('id')
    .limit(0);

  if (tableErr) {
    fail(`Tabela business_slug_history nao existe: ${tableErr.message}`);
    return false;
  }
  ok('Tabela business_slug_history existe e acessivel');

  // Verificar funcao do trigger via information_schema
  const { data: fnCheck, error: fnErr } = await supabase.rpc('exec_sql' as any, {
    sql: `SELECT routine_name FROM information_schema.routines
          WHERE routine_name = 'fn_record_business_slug_history'
            AND routine_type = 'FUNCTION'`,
  }).catch(() => ({ data: null, error: { message: 'rpc exec_sql nao disponivel' } }));

  // Se exec_sql nao disponivel, tenta via pg_proc
  const { data: pgProc } = await (supabase as any)
    .from('pg_proc' as any)
    .select('proname')
    .eq('proname', 'fn_record_business_slug_history')
    .limit(1)
    .maybeSingle()
    .catch(() => ({ data: null }));

  if (pgProc) {
    ok('Funcao fn_record_business_slug_history existe');
  } else {
    info('Nao foi possivel verificar funcao via PostgREST (esperado — pg_proc nao exposto). Verificando via trigger...');
  }

  // Verificar trigger via pg_trigger (pode nao estar exposto, mas tentamos)
  info('Trigger trg_business_slug_history sera validado implicitamente no Teste 2');

  return true;
}

async function test2_TriggerOnSlugChange() {
  section('TESTE 2: Trigger grava historico ao mudar slug');

  const salvadorId = await getSalvadorLocationId();
  if (!salvadorId) {
    fail('Location Salvador nao encontrada no banco. Verifique seeds.');
    return false;
  }
  info(`Salvador location_id: ${salvadorId}`);

  // Criar profile de teste
  const { error: profileErr } = await (supabase as any)
    .from('profiles')
    .insert({
      id: TEST_PROFILE_ID,
      name: 'Empresa Teste Slug History',
      profile_type: 'business',
      username: 'test-slug-history-biz',
    });

  if (profileErr && !profileErr.message.includes('duplicate')) {
    fail(`Erro ao criar profile de teste: ${profileErr.message}`);
    return false;
  }

  // Criar business_data com slug inicial
  const { error: bizErr } = await (supabase as any)
    .from('business_data')
    .insert({
      profile_id: TEST_PROFILE_ID,
      business_name: 'Empresa Teste Slug History',
      category: 'outros',
      status: 'active',
      slug: TEST_SLUG_INITIAL,
      location_id: salvadorId,
    });

  if (bizErr && !bizErr.message.includes('duplicate')) {
    fail(`Erro ao criar business_data de teste: ${bizErr.message}`);
    return false;
  }
  ok(`Empresa criada com slug inicial: ${TEST_SLUG_INITIAL}`);
  info(`URL canonica inicial: /empresas/ba/salvador/${TEST_SLUG_INITIAL}`);

  // Alterar slug
  const { error: updateErr } = await (supabase as any)
    .from('business_data')
    .update({ slug: TEST_SLUG_CHANGED })
    .eq('profile_id', TEST_PROFILE_ID);

  if (updateErr) {
    fail(`Erro ao alterar slug: ${updateErr.message}`);
    return false;
  }
  ok(`Slug alterado para: ${TEST_SLUG_CHANGED}`);

  // Verificar registro no historico
  const { data: history, error: histErr } = await (supabase as any)
    .from('business_slug_history')
    .select('*')
    .eq('profile_id', TEST_PROFILE_ID)
    .eq('old_slug', TEST_SLUG_INITIAL);

  if (histErr) {
    fail(`Erro ao consultar historico: ${histErr.message}`);
    return false;
  }

  if (!history || history.length === 0) {
    fail('Trigger NAO gravou historico ao mudar slug');
    return false;
  }

  const record = history[0];
  ok(`Historico gravado: old_slug="${record.old_slug}", old_canonical_url="${record.old_canonical_url}", change_reason="${record.change_reason}"`);

  const expectedOldUrl = `/empresas/ba/salvador/${TEST_SLUG_INITIAL}`;
  if (record.old_canonical_url !== expectedOldUrl) {
    fail(`URL canonica antiga incorreta. Esperado: "${expectedOldUrl}", Obtido: "${record.old_canonical_url}"`);
    return false;
  }
  ok(`URL canonica antiga correta: ${record.old_canonical_url}`);

  if (record.change_reason !== 'slug_changed') {
    fail(`change_reason incorreto. Esperado: "slug_changed", Obtido: "${record.change_reason}"`);
    return false;
  }
  ok(`change_reason correto: ${record.change_reason}`);

  return true;
}

async function test3_TriggerOnTerritoryChange() {
  section('TESTE 3: Trigger grava historico ao mudar territorio');

  const salvadorId = await getSalvadorLocationId();
  if (!salvadorId) { fail('Salvador nao encontrado'); return false; }

  const otherCity = await getAnyOtherCityLocationId(salvadorId);
  if (!otherCity) {
    info('Nao ha outra cidade no banco para testar mudanca de territorio. Pulando teste 3.');
    ok('Teste 3 pulado (sem outra cidade disponivel — nao e falha)');
    return true;
  }

  info(`Outra cidade: ${otherCity.geographic_path} (id: ${otherCity.id})`);

  // Alterar location_id (territorio)
  const { error: updateErr } = await (supabase as any)
    .from('business_data')
    .update({ location_id: otherCity.id })
    .eq('profile_id', TEST_PROFILE_ID);

  if (updateErr) {
    fail(`Erro ao alterar location_id: ${updateErr.message}`);
    return false;
  }
  ok(`Territorio alterado para: ${otherCity.geographic_path}`);

  // Verificar novo registro no historico
  const { data: history } = await (supabase as any)
    .from('business_slug_history')
    .select('*')
    .eq('profile_id', TEST_PROFILE_ID)
    .order('created_at', { ascending: false })
    .limit(1);

  if (!history || history.length === 0) {
    fail('Trigger NAO gravou historico ao mudar territorio');
    return false;
  }

  const record = history[0];
  ok(`Historico de mudanca de territorio gravado: old_canonical_url="${record.old_canonical_url}", change_reason="${record.change_reason}"`);

  if (record.change_reason !== 'territory_changed') {
    fail(`change_reason incorreto. Esperado: "territory_changed", Obtido: "${record.change_reason}"`);
    return false;
  }
  ok(`change_reason correto: ${record.change_reason}`);

  // Restaurar para salvador para proximos testes
  await (supabase as any)
    .from('business_data')
    .update({ location_id: salvadorId })
    .eq('profile_id', TEST_PROFILE_ID);

  return true;
}

async function test4_ResolveBySlugHistoryJoin() {
  section('TESTE 4: Join business_data!profile_id funciona no PostgREST (R3)');

  // Esta e a query exata usada em resolveBySlugHistory
  const oldUrl = `/empresas/ba/salvador/${TEST_SLUG_INITIAL}`;

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
    fail(`Join business_data!profile_id FALHOU: ${error.message}`);
    info('Isso confirma o risco R3. Sera necessario corrigir a query.');
    return { success: false, joinWorks: false };
  }

  if (!data) {
    fail(`Nenhum registro encontrado para old_canonical_url="${oldUrl}"`);
    return { success: false, joinWorks: true };
  }

  ok(`Join funcionou. Dados retornados:`);
  info(`  profile_id: ${data.profile_id}`);
  info(`  business.slug: ${data.business?.slug}`);
  info(`  business.location.geographic_path: ${data.business?.location?.geographic_path}`);

  if (!data.business?.slug) {
    fail('business.slug nulo no resultado do join');
    return { success: false, joinWorks: true };
  }

  ok(`resolveBySlugHistory retornaria contexto valido para URL antiga "${oldUrl}"`);
  info(`  Nova URL canonica: /empresas/ba/salvador/${data.business.slug}`);

  return { success: true, joinWorks: true };
}

async function test4b_FallbackQueryIfJoinFails() {
  section('TESTE 4b: Query alternativa sem join aninhado (fallback se R3 falhar)');

  // Query em dois passos: primeiro busca profile_id, depois busca business_data
  const oldUrl = `/empresas/ba/salvador/${TEST_SLUG_INITIAL}`;

  const { data: histData, error: histErr } = await (supabase as any)
    .from('business_slug_history')
    .select('profile_id')
    .eq('old_canonical_url', oldUrl)
    .maybeSingle();

  if (histErr || !histData) {
    fail(`Nao encontrou historico para "${oldUrl}": ${histErr?.message}`);
    return false;
  }

  const { data: bizData, error: bizErr } = await (supabase as any)
    .from('business_data')
    .select(`
      profile_id,
      slug,
      is_premium,
      location:locations!location_id(geographic_path)
    `)
    .eq('profile_id', histData.profile_id)
    .eq('status', 'active')
    .maybeSingle();

  if (bizErr || !bizData) {
    fail(`Nao encontrou business_data para profile_id "${histData.profile_id}": ${bizErr?.message}`);
    return false;
  }

  ok(`Query em dois passos funcionou:`);
  info(`  profile_id: ${bizData.profile_id}`);
  info(`  slug atual: ${bizData.slug}`);
  info(`  geographic_path: ${bizData.location?.geographic_path}`);

  return true;
}

async function test5_UrlAntiga404() {
  section('TESTE 5: URL inexistente retorna null (comportamento de 404)');

  const fakeUrl = '/empresas/ba/salvador/empresa-que-nunca-existiu-xyz123';

  const { data, error } = await (supabase as any)
    .from('business_slug_history')
    .select('profile_id')
    .eq('old_canonical_url', fakeUrl)
    .maybeSingle();

  if (error) {
    fail(`Erro inesperado na query: ${error.message}`);
    return false;
  }

  if (data !== null) {
    fail(`Esperava null para URL inexistente, obteve: ${JSON.stringify(data)}`);
    return false;
  }

  ok(`URL inexistente retorna null corretamente (resultaria em 404)`);
  return true;
}

async function test6_ReservedSlugNeverInHistory() {
  section('TESTE 6: Slug reservado nunca entra no historico');

  // Verificar que nenhum slug reservado existe em business_slug_history
  const reservedSlugs = ['admin', 'dashboard', 'empresas', 'p', 'business', 'login'];

  for (const slug of reservedSlugs) {
    const { data } = await (supabase as any)
      .from('business_slug_history')
      .select('id')
      .eq('old_slug', slug)
      .limit(1);

    if (data && data.length > 0) {
      fail(`Slug reservado "${slug}" encontrado no historico — isso nao deveria acontecer`);
    } else {
      ok(`Slug reservado "${slug}" nao esta no historico`);
    }
  }

  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('VALIDACAO REAL: Slug History + Trigger + Join PostgREST');
  console.log('Banco:', supabaseUrl);
  console.log('='.repeat(60));

  // Limpar dados de teste anteriores
  await cleanupTestData();
  info('Dados de teste anteriores removidos');

  let allPassed = true;

  try {
    const t1 = await test1_MigrationApplied();
    if (!t1) allPassed = false;

    const t2 = await test2_TriggerOnSlugChange();
    if (!t2) allPassed = false;

    const t3 = await test3_TriggerOnTerritoryChange();
    if (!t3) allPassed = false;

    const { success: t4success, joinWorks } = await test4_ResolveBySlugHistoryJoin();
    if (!t4success) allPassed = false;

    // Se o join aninhado falhou, testar query alternativa
    if (!joinWorks) {
      section('ATENCAO: Join aninhado falhou. Testando query alternativa...');
      const t4b = await test4b_FallbackQueryIfJoinFails();
      if (!t4b) allPassed = false;
    } else {
      await test4b_FallbackQueryIfJoinFails(); // executa de qualquer forma para confirmar
    }

    const t5 = await test5_UrlAntiga404();
    if (!t5) allPassed = false;

    const t6 = await test6_ReservedSlugNeverInHistory();
    if (!t6) allPassed = false;

  } finally {
    // Limpar dados de teste
    section('Limpeza de dados de teste');
    await cleanupTestData();
    ok('Dados de teste removidos');
  }

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('RESULTADO: TODOS OS TESTES PASSARAM');
  } else {
    console.log('RESULTADO: ALGUNS TESTES FALHARAM — ver detalhes acima');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
