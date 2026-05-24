/**
 * Script executável para migração de business_data
 * 
 * USO:
 * npx tsx src/core/business/migrations/runMigration.ts
 */

import { migrateBusinessDataToCanonical, formatMigrationReport } from './migrateBusinessDataToCanonical';

async function main() {
  console.log(' Iniciando migração de business_data...\n');

  try {
    const result = await migrateBusinessDataToCanonical();
    const report = formatMigrationReport(result);

    console.log(report);
    console.log('\n Migração concluída!');

    // Exit code baseado em sucesso
    const successCount = result.location_id_already_valid + result.location_id_resolved;
    if (successCount === result.total - result.skipped_already_migrated) {
      process.exit(0);
    } else {
      console.log('\n  Algumas empresas não foram migradas. Revise o relatório acima.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n Erro durante migração:', error);
    process.exit(1);
  }
}

main();
