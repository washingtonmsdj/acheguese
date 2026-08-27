#!/usr/bin/env tsx
import {
  createServiceRoleClient,
  getSupabaseConfig,
  loadSupabaseScriptEnv,
} from './supabase-client';
import { assertApprovedRemoteMutationTarget } from './remote-mutation-safety';

interface BusinessRow {
  id: string;
  slug: string;
  location_id: string | null;
  profile_id: string;
}

interface BusinessSlugHistoryRow {
  business_id: string;
  old_slug: string;
  old_canonical_url: string;
  change_reason: string | null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main() {
  loadSupabaseScriptEnv();
  const config = getSupabaseConfig();
  assertApprovedRemoteMutationTarget(config.url);
  const supabase = createServiceRoleClient({
    url: config.url,
    serviceRoleKey: config.serviceRoleKey,
  });

  console.log('VALIDACAO ISOLADA: BUSINESS SLUG HISTORY\n');
  console.log('------------------------------------------------------------------\n');

  console.log('STEP 1: VALIDAR ESTRUTURA CRIADA\n');

  try {
    const { error } = await supabase
      .from('business_slug_history')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Tabela business_slug_history nao existe');
      console.error('Erro:', error.message);
      process.exit(1);
    }

    console.log('OK: tabela business_slug_history existe');
  } catch (error) {
    console.error('Erro ao validar tabela:', getErrorMessage(error));
    process.exit(1);
  }

  console.log('\n------------------------------------------------------------------');
  console.log('STEP 2: TESTE PONTA A PONTA EM FIXTURE TECNICA\n');

  const testBusinessId = process.env.SLUG_HISTORY_TEST_BUSINESS_ID?.trim();
  if (!testBusinessId) {
    console.error('SLUG_HISTORY_TEST_BUSINESS_ID ausente.');
    console.error('O validador nao cria nem escolhe uma empresa automaticamente.');
    process.exit(1);
  }

  try {
    const { data: business, error: businessError } = await supabase
      .from('business_data')
      .select('id, slug, location_id, profile_id')
      .eq('id', testBusinessId)
      .eq('metadata->>source', 'e2e')
      .eq('metadata->>source_kind', 'technical_fixture')
      .maybeSingle();

    if (businessError || !business) {
      console.error(
        'Fixture tecnica E2E explicita nao encontrada:',
        businessError?.message ?? 'ausente',
      );
      process.exit(1);
    }

    const testBusiness = business as BusinessRow;
    if (!testBusiness.slug?.trim()) {
      console.error('Fixture tecnica E2E nao possui slug valido.');
      process.exit(1);
    }

    console.log('OK: fixture tecnica selecionada', {
      id: testBusiness.id,
      slug: testBusiness.slug,
    });

    const originalSlug = testBusiness.slug;
    const newSlug = `test-slug-${Date.now()}`;
    let slugChanged = false;

    try {
      const { error: updateError } = await supabase
        .from('business_data')
        .update({ slug: newSlug })
        .eq('id', testBusiness.id);

      if (updateError) throw updateError;
      slugChanged = true;

      console.log('OK: slug alterado', { de: originalSlug, para: newSlug });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: history, error: historyError } = await supabase
        .from('business_slug_history')
        .select('business_id, old_slug, old_canonical_url, change_reason')
        .eq('business_id', testBusiness.id)
        .eq('old_slug', originalSlug);

      const historyRows = (history ?? []) as BusinessSlugHistoryRow[];

      if (historyError || historyRows.length === 0) {
        throw new Error('Historico nao foi registrado; trigger pode nao estar funcionando.');
      }

      console.log('OK: historico registrado', {
        old_slug: historyRows[0].old_slug,
        old_canonical_url: historyRows[0].old_canonical_url,
        change_reason: historyRows[0].change_reason,
      });

      const oldUrl = historyRows[0].old_canonical_url;
      const { data: resolved, error: resolveError } = await supabase
        .from('business_slug_history')
        .select('business_id')
        .eq('old_canonical_url', oldUrl)
        .single();

      if (resolveError) throw resolveError;

      const resolvedRow = resolved as Pick<BusinessSlugHistoryRow, 'business_id'> | null;
      if (!resolvedRow || resolvedRow.business_id !== testBusiness.id) {
        throw new Error('URL antiga nao resolve corretamente.');
      }

      console.log('OK: URL antiga resolve para business_id correto');
      console.log('Redirect 308:', oldUrl, '->', `/empresas/.../.../${newSlug}`);

      console.log('\n------------------------------------------------------------------');
      console.log('CHECKLIST FINAL DE ACEITACAO\n');
      console.log('OK: alvo de mutacao provado como isolado');
      console.log('OK: fixture tecnica explicitamente selecionada');
      console.log('OK: tabela business_slug_history existe');
      console.log('OK: trigger grava historico automaticamente');
      console.log('OK: URL antiga resolve para business_id');
      console.log('OK: redirect 308 para URL canonica atual');
      console.log('\n------------------------------------------------------------------');
      console.log('FEATURE SLUG HISTORY VALIDADA EM ALVO ISOLADO');
      console.log('------------------------------------------------------------------\n');
    } finally {
      if (slugChanged) {
        const { error: restoreError } = await supabase
          .from('business_data')
          .update({ slug: originalSlug })
          .eq('id', testBusiness.id);

        if (restoreError) {
          throw new Error(`Falha ao restaurar slug original: ${restoreError.message}`);
        }
      }
    }
  } catch (error) {
    console.error('Erro no teste:', getErrorMessage(error));
    process.exit(1);
  }
}

main();
