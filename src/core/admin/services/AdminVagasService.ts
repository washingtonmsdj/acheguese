/**
 * Legacy compatibility facade.
 * Canonical implementation moved to core/vagas.
 */

export {
  AdminVagasService,
  AdminVagasService as adminVagasService,
} from "@/core/vagas/services/AdminVagasService";

export type {
  AdminVaga,
  GetVagasParams,
  VagaStats,
} from "@/core/vagas/services/AdminVagasService";
