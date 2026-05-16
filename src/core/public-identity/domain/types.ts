/**
 * Public Identity - Types Centralizados
 * Fonte única de tipos para todo o módulo
 */

// ── Entity Types ──────────────────────────────────────────────────────────────

export type EntityType = 'business' | 'profile' | 'professional' | 'communication_channel';

/**
 * Entity ID Canônico por Tipo
 *
 * business → business_data.id (PK da tabela)
 * profile → profiles.id (PK da tabela)
 * professional → professional_data.id (PK da tabela)
 *
 * NOTA: profile_id de business é relacionamento, não identidade canônica
 */
export type EntityId = string;

// ── Availability ──────────────────────────────────────────────────────────────

export type AvailabilityStatus =
  | 'available'
  | 'taken'
  | 'invalid'
  | 'reserved'
  | 'cooldown_blocked';

export interface AvailabilityResult {
  status: AvailabilityStatus;
  identifier: string;
  message?: string;
  suggestion?: string;
}

// ── Change Tracking ───────────────────────────────────────────────────────────

export type ChangeReason =
  | 'user_requested'
  | 'admin_action'
  | 'policy_violation'
  | 'territory_changed';

export interface IdentityChangeRecord {
  id: string;
  entityType: EntityType;
  entityId: EntityId;
  oldIdentifier: string;
  newIdentifier: string;
  reason: ChangeReason;
  changedAt: Date;
}

// ── Cooldown ──────────────────────────────────────────────────────────────────

export interface CooldownResult {
  canChange: boolean;
  reason?: 'cooldown_active' | 'first_change';
  nextAllowedDate?: Date;
  daysRemaining?: number;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

// ── Public Identity Entity ────────────────────────────────────────────────────

export interface PublicIdentity {
  identifier: string;
  entityType: EntityType;
  entityId: EntityId;
  lastChangedAt: Date | null;
  canChangeAfter: Date | null;
  createdAt: Date;
}
