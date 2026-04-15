/**
 * Script executável para migração de user_residences
 * 
 * USO:
 * npx tsx src/core/residence/migrations/runMigration.ts
 */

import { migrateUserResidencesToCanonical, formatMigrationReport } from './migrateUserResidencesToCanonical';

async function main() {
  console.log('🚀 Iniciando migração de user_residences...\n');

  try {
    const result = await migrateUserResidencesToCanonical();
    const report = formatMigrationReport(result);

    console.log(report);
    console.log('\n✅ Migração concluída!');

    // Exit code baseado em sucesso
    if (result.migrated === result.total - result.skipped_already_migrated) {
      process.exit(0);
    } else {
      console.log('\n⚠️  Algumas residências não foram migradas. Revise o relatório acima.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Erro durante migração:', error);
    process.exit(1);
  }
}

main();
