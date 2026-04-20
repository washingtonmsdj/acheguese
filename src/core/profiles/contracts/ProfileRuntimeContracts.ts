/**
 * ProfileRuntimeContracts — Contratos de runtime do domínio Profile
 *
 * ── ESCOPO PERMITIDO ─────────────────────────────────────────────────────
 *
 * Este arquivo contém APENAS tipos que descrevem o estado calculado
 * de um perfil em runtime: status de moderação, permissões, plano e reputação.
 *
 * Critério de inclusão — um tipo pertence aqui se:
 * 1. É calculado por ProfileService a partir de dados do banco
 * 2. É compartilhado entre service, views e camadas de admin
 * 3. NÃO é entidade de domínio (não tem identidade própria)
 * 4. NÃO é read model de UI (não depende de componentes)
 * 5. NÃO é tipo de operação (input/output de service)
 *
 * ── ESCOPO PROIBIDO ──────────────────────────────────────────────────────
 *
 * NÃO adicionar aqui:
 * - Entidades de domínio → domain/Profile.ts
 * - Read models de UI → views/
 * - Tipos de operação (inputs, stats, snapshots) → services/ProfileOperationTypes.ts
 * - Tipos de negócios associados → services/ProfileBusinessTypes.ts
 * - Tipos de atividade → views/ProfileActivityRecords.ts
 *
 * ── CONSUMIDORES AUTORIZADOS ─────────────────────────────────────────────
 *
 * - ProfileService (calcula e retorna esses contratos)
 * - AdminProfileGovernanceService (agrega para painéis admin)
 * - views/ProfileContext (compõe ProfileContext com esses contratos)
 * - useProfileContextIntegration (consome ProfileContext)
 *
 * @version 1.0.0
 */

// ── Plano ────────────────────────────────────────────────────────────────

export type PlanType = "basic" | "premium" | "enterprise";

/**
 * Plano/assinatura ativo do perfil.
 * Calculado por ProfileService._calculatePlan() a partir de user_subscriptions.
 */
export interface ProfilePlan {
  type: PlanType;
  isPremium: boolean;
  expiresAt?: string;
}

// ── Status de moderação ──────────────────────────────────────────────────

/**
 * Estado de moderação calculado do perfil.
 * Calculado por ProfileService._calculateProfileStatus() a partir de
 * is_active, is_suspended e banned_users.
 */
export interface ProfileStatus {
  isActive: boolean;
  isBlocked: boolean;
  isSuspended: boolean;
  suspendedAt?: string;
  suspensionReason?: string;
  suspendedUntil?: string;
}

// ── Permissões calculadas ────────────────────────────────────────────────

/**
 * Permissões calculadas do perfil.
 * Calculado por ProfileService._calculatePermissions() a partir de
 * ProfileStatus + roles do usuário.
 *
 * ⚠️ Cache de permissões para contexto de sessão e exibição em UI.
 * NÃO usar para decisões de autorização em tempo real.
 * O SSOT de autorização é core/authorization.canProfilePerformAction().
 */
export interface ProfilePermissions {
  canPost: boolean;
  canComment: boolean;
  canMessage: boolean;
  canCreateBusiness: boolean;
  canModerate: boolean;
  canReport?: boolean;
}

// ── Reputação ────────────────────────────────────────────────────────────

/**
 * Reputação calculada do perfil.
 * Calculado por ProfileService._calculateReputation() a partir do
 * campo `reputation` do banco.
 */
export interface ProfileReputation {
  level: number;
  score: number;
  rank?: string;
}
