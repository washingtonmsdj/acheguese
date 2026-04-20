/**
 * ProfileModerationState — Estado de Moderação do Perfil
 * 
 * Dados completos de moderação: quando foi suspenso, por quê, até quando.
 * 
 * ⚠️ NÃO confundir com ProfileStatus de core/authorization.
 * - core/authorization/ProfileStatus: subset para decisões de autorização (isActive, isSuspended, isBlocked)
 * - core/profiles/ProfileModerationState: superset com dados de auditoria de moderação
 * 
 * @version 3.0.0
 */

export interface ProfileModerationState {
  /** Se o perfil está ativo (não deletado) */
  isActive: boolean;
  
  /** Se o perfil está bloqueado permanentemente */
  isBlocked: boolean;
  
  /** Se o perfil está suspenso temporariamente */
  isSuspended: boolean;
  
  /** Data/hora da suspensão */
  suspendedAt?: string;
  
  /** Motivo da suspensão */
  suspensionReason?: string;
  
  /** Data/hora até quando a suspensão é válida (undefined = permanente) */
  suspendedUntil?: string;
}

/**
 * Cria um ProfileModerationState ativo (padrão)
 */
export function createActiveModerationState(): ProfileModerationState {
  return {
    isActive: true,
    isBlocked: false,
    isSuspended: false,
  };
}

/**
 * Cria um ProfileModerationState suspenso
 */
export function createSuspendedModerationState(
  reason: string,
  until?: string
): ProfileModerationState {
  return {
    isActive: true,
    isBlocked: false,
    isSuspended: true,
    suspendedAt: new Date().toISOString(),
    suspensionReason: reason,
    suspendedUntil: until,
  };
}

/**
 * Cria um ProfileModerationState bloqueado
 */
export function createBlockedModerationState(reason: string): ProfileModerationState {
  return {
    isActive: false,
    isBlocked: true,
    isSuspended: false,
    suspensionReason: reason,
  };
}

/**
 * Verifica se o perfil pode realizar ações
 */
export function canPerformActions(state: ProfileModerationState): boolean {
  return state.isActive && !state.isBlocked && !state.isSuspended;
}

/**
 * Verifica se a suspensão expirou
 */
export function isSuspensionExpired(state: ProfileModerationState): boolean {
  if (!state.isSuspended || !state.suspendedUntil) {
    return false;
  }
  return new Date(state.suspendedUntil) < new Date();
}
