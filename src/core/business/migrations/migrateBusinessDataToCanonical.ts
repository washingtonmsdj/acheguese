/**
 * migrateBusinessDataToCanonical
 *
 * Script de migração one-shot — ETAPA 6 (já executado).
 * Mantido apenas para compatibilidade de imports existentes.
 * Não deve ser executado novamente.
 */

export interface MigrationResult {
  total: number;
  location_id_already_valid: number;
  location_id_resolved: number;
  address_id_created: number;
  no_physical_address: number;
  coordinates_reused: number;
  failed_no_city: number;
  failed_no_neighborhood: number;
  failed_ambiguous: number;
  failed_no_minimum_data: number;
  failed_other: number;
  skipped_already_migrated: number;
  failures: Array<{
    business_id: string;
    business_name: string;
    reason: string;
    data?: Record<string, unknown>;
  }>;
}

/**
 * Migração já executada na ETAPA 6.
 * Todos os registros de business_data já possuem location_id canônico.
 */
export async function migrateBusinessDataToCanonical(): Promise<MigrationResult> {
  console.warn('⚠️  migrateBusinessDataToCanonical: migração já executada na ETAPA 6. Nenhuma ação necessária.');
  return {
    total: 0,
    location_id_already_valid: 0,
    location_id_resolved: 0,
    address_id_created: 0,
    no_physical_address: 0,
    coordinates_reused: 0,
    failed_no_city: 0,
    failed_no_neighborhood: 0,
    failed_ambiguous: 0,
    failed_no_minimum_data: 0,
    failed_other: 0,
    skipped_already_migrated: 0,
    failures: [],
  };
}

export function formatMigrationReport(result: MigrationResult): string {
  return [
    '=== RELATÓRIO DE MIGRAÇÃO business_data ===',
    `Total: ${result.total}`,
    `Já migrados (pulados): ${result.skipped_already_migrated}`,
    `location_id já válido: ${result.location_id_already_valid}`,
    `location_id resolvido: ${result.location_id_resolved}`,
    `address_id criado: ${result.address_id_created}`,
    `Sem endereço físico: ${result.no_physical_address}`,
    `Falhas: ${result.failed_no_city + result.failed_no_neighborhood + result.failed_ambiguous + result.failed_no_minimum_data + result.failed_other}`,
  ].join('\n');
}
