/**
 * ProfileAccountSnapshot — Estado da conta para exibição em UI
 *
 * Read model que agrega estado de moderação, verificação e plano
 * para exibição nos componentes de header e painel de saúde da conta.
 *
 * Casos de uso:
 * - ProfileHeader / ProfileHeaderCompact (badges de status)
 * - AccountHealthPanel (painel de saúde)
 * - Qualquer componente que precise exibir estado da conta
 *
 * ⚠️ NÃO usar para decisões de autorização.
 * O SSOT de autorização é core/authorization.
 *
 * @version 1.0.0
 */

/**
 * Status de verificação de residência
 * Inlined aqui para evitar dependência circular com services/types.
 */
export type ProfileVerificationStatusValue =
  | "not_requested"
  | "pending"
  | "approved"
  | "rejected";

export interface ProfileAccountSnapshot {
  /** Estado geral da conta */
  accountState: "active" | "inactive" | "suspended" | "blocked";

  /** Se a conta está bloqueada */
  isBlocked: boolean;

  /** Se a conta está suspensa */
  isSuspended: boolean;

  /** Data/hora da suspensão */
  suspendedAt?: string;

  /** Data/hora até quando a suspensão é válida */
  suspendedUntil?: string;

  /** Motivo da suspensão */
  suspensionReason?: string;

  /** Status de verificação de residência */
  verificationStatus: ProfileVerificationStatusValue;

  /** Motivo de rejeição da verificação (se aplicável) */
  verificationRejectionReason?: string;
}
