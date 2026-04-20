/**
 * Compatibilidade temporária do módulo de perfil.
 *
 * MIGRAÇÃO EM ANDAMENTO (Fase 2):
 * - Profile: migrado para src/core/profiles/domain/Profile.ts
 * - ProfileStats: ainda em services/types (sem equivalente canônico)
 * - Business: ainda em services/types (sem equivalente canônico)
 */

export type { Profile } from "@/core/profiles/domain/Profile";
export type {
  ProfileStats,
  Business,
} from "@/core/profiles/services/types";
