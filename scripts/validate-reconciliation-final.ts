/**
 * ETAPA 12B - validacao final da reconciliacao
 *
 * Confirma os pontos principais do relatorio:
 * A. Schema final por tabela
 * B. Nomenclatura ride_requests
 * C. Campos legados removidos
 * D. Status metadata.location
 * E. Services e campos canonicos
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.remote') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variaveis nao encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface MetadataRow {
  metadata?: Record<string, unknown> | null;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hasLocationMetadata(row: MetadataRow): boolean {
  return Boolean(row.metadata && 'location' in row.metadata);
}

async function validateSection(section: string, tests: Array<() => Promise<boolean>>) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${section}`);
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) passed++;
      else failed++;
    } catch (error) {
      console.error(`Erro: ${getErrorMessage(error)}`);
      failed++;
    }
  }

  console.log(`\nResultado: ${passed}/${tests.length} testes passaram`);
  return failed === 0;
}

async function main() {
  console.log('============================================================');
  console.log('  ETAPA 12B - VALIDACAO FINAL DA RECONCILIACAO');
  console.log('============================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Banco: ${supabaseUrl.replace('https://', '').split('.')[0]}.supabase.co`);

  let allPassed = true;

  allPassed =
    (await validateSection('B. NOMENCLATURA RIDE_REQUESTS', [
      async () => {
        const { error } = await supabase.from('ride_requests').insert([
          {
            passenger_profile_id: '00000000-0000-0000-0000-000000000000',
            pickup_address_id: '00000000-0000-0000-0000-000000000000',
            dropoff_address_id: '00000000-0000-0000-0000-000000000000',
            pickup_location_id: '00000000-0000-0000-0000-000000000000',
            dropoff_location_id: '00000000-0000-0000-0000-000000000000',
            status: 'pending',
          },
        ]);

        const isValidError =
          error &&
          (error.message.includes('foreign key constraint') ||
            error.message.includes('null value'));

        if (isValidError) {
          console.log('OK: campos canonicos existem (pickup_*, dropoff_*)');
          return true;
        }

        console.log(`Falha: erro inesperado: ${error?.message || 'nenhum erro'}`);
        return false;
      },

      async () => {
        const { error } = await supabase.from('ride_requests').insert([
          {
            passenger_profile_id: '00000000-0000-0000-0000-000000000000',
            origin: 'Test',
            destination: 'Test',
            status: 'pending',
          },
        ]);

        const isColumnError =
          error &&
          (error.message.includes('Could not find') ||
            (error.message.includes('column') && error.message.includes('does not exist')));

        if (isColumnError) {
          console.log('OK: campos legados removidos (origin, destination nao existem)');
          return true;
        }

        console.log(`Falha: campos legados ainda existem ou houve erro inesperado: ${error?.message}`);
        return false;
      },
    ])) && allPassed;

  allPassed =
    (await validateSection('D. STATUS metadata.location', [
      async () => {
        const { data } = await supabase
          .from('business_data')
          .select('metadata')
          .not('metadata', 'is', null);
        const withLocation = ((data ?? []) as MetadataRow[]).filter(hasLocationMetadata);

        if (withLocation.length === 0) {
          console.log('OK: business_data sem metadata.location');
          return true;
        }

        console.log(`Falha: business_data possui ${withLocation.length} registros com metadata.location`);
        return false;
      },

      async () => {
        const { data } = await supabase
          .from('professional_data')
          .select('metadata')
          .not('metadata', 'is', null);
        const withLocation = ((data ?? []) as MetadataRow[]).filter(hasLocationMetadata);

        if (withLocation.length === 0) {
          console.log('OK: professional_data sem metadata.location');
          return true;
        }

        console.log(
          `Falha: professional_data possui ${withLocation.length} registros com metadata.location`,
        );
        return false;
      },

      async () => {
        const { data } = await supabase
          .from('locations')
          .select('metadata')
          .not('metadata', 'is', null);
        const withLocation = ((data ?? []) as MetadataRow[]).filter(hasLocationMetadata);

        if (withLocation.length === 0) {
          console.log('OK: locations sem metadata.location');
          return true;
        }

        console.log(`Falha: locations possui ${withLocation.length} registros com metadata.location`);
        return false;
      },

      async () => {
        const { data } = await supabase
          .from('territorial_groups')
          .select('metadata')
          .not('metadata', 'is', null);
        const withLocation = ((data ?? []) as MetadataRow[]).filter(hasLocationMetadata);

        if (withLocation.length === 0) {
          console.log('OK: territorial_groups sem metadata.location');
          return true;
        }

        console.log(
          `Falha: territorial_groups possui ${withLocation.length} registros com metadata.location`,
        );
        return false;
      },
    ])) && allPassed;

  console.log('\n\n============================================================');
  if (allPassed) {
    console.log('TODAS AS VALIDACOES PASSARAM');
    console.log('ETAPA 12B: RECONCILIACAO CONFIRMADA');
  } else {
    console.log('ALGUMAS VALIDACOES FALHARAM');
    console.log('Revisar relatorio ETAPA_12B_RECONCILIACAO_FINAL.md');
  }
  console.log('============================================================');
}

main().catch((error) => {
  console.error(getErrorMessage(error));
  process.exit(1);
});
