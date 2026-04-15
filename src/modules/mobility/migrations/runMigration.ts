/**
 * Script de execução da migração de ride_requests
 * 
 * Uso:
 * npx tsx src/core/ride/migrations/runMigration.ts
 */

import { migrateRideRequestsToCanonical, formatMigrationReport } from './migrateRideRequestsToCanonical';

async function main() {
  console.log('🚀 Iniciando migração de ride_requests...\n');

  try {
    const result = await migrateRideRequestsToCanonical();
    
    console.log(formatMigrationReport(result));
    
    console.log('\n✅ Migração concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  }
}

main();
