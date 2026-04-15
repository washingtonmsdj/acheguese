/**
 * Territorial — Tipos de disponibilidade por grupo
 *
 * Contrato central para rollout e coverage em contexto de grupo territorial.
 * Nunca inferir availability em componentes — usar GroupAvailabilityService.
 */

import type { ModuleKey } from '@/core/rollout/types';
import type { Location } from '@/core/location/types';

// ── Availability ─────────────────────────────────────────────────────────────

/**
 * Estado de disponibilidade de um módulo em um grupo territorial.
 *
 * full    — todos os membros ativos têm o módulo ativo
 * partial — pelo menos um membro ativo tem o módulo ativo (OR)
 * none    — nenhum membro ativo tem o módulo ativo
 */
export type GroupModuleAvailability = 'full' | 'partial' | 'none';

export interface MemberRolloutStatus {
  location: Location;
  is_active: boolean;
}

export interface GroupAvailabilityResult {
  module_key: ModuleKey;
  group_id: string;
  availability: GroupModuleAvailability;
  /** Membros com rollout ativo — usados para construir o TerritoryFilter real */
  active_member_ids: string[];
  /** Todos os membros avaliados */
  member_statuses: MemberRolloutStatus[];
  /** Total de membros ativos no grupo */
  total_active_members: number;
  /** Membros com o módulo ativo */
  active_module_members: number;
}

// ── Operações administrativas ─────────────────────────────────────────────────

export interface ActivateRolloutForGroupInput {
  group_id: string;
  module_key: ModuleKey;
  /** Status a aplicar em cada membro */
  status: import('@/core/rollout/types').RolloutStatus;
  /** Config opcional — aplicada igualmente a todos os membros */
  config?: Record<string, unknown>;
}

export interface ActivateRolloutForGroupOutput {
  group_id: string;
  module_key: ModuleKey;
  applied_to: string[];   // location_ids que receberam o rollout
  skipped: string[];      // location_ids ignorados (inativo ou erro)
}

export interface ReconcileGroupRolloutInput {
  group_id: string;
  module_key: ModuleKey;
  /** Status a aplicar nos membros que ainda não têm rollout explícito */
  default_status: import('@/core/rollout/types').RolloutStatus;
}

export interface ReconcileGroupRolloutOutput {
  group_id: string;
  module_key: ModuleKey;
  /** Membros que receberam rollout novo (eram novos no grupo) */
  newly_applied: string[];
  /** Membros que já tinham rollout explícito (não alterados) */
  already_configured: string[];
}
