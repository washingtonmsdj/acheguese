/**
 * ProfileStatus — Value Object de Status
 * 
 * Encapsula o estado de ativação/suspensão de um perfil.
 * 
 * @version 2.0.0
 */

export interface ProfileStatus {
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
  
  /** Data/hora até quando a suspensão é válida (null = permanente) */
  suspendedUntil?: string;
}

/**
 * Cria um ProfileStatus ativo (padrão)
 */
export function createActiveStatus(): ProfileStatus {
  return {
    isActive: true,
    isBlocked: false,
    isSuspended: false,
  };
}

/**
 * Cria um ProfileStatus suspenso
 */
export function createSuspendedStatus(
  reason: string,
  until?: string
): ProfileStatus {
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
 * Cria um ProfileStatus bloqueado
 */
export function createBlockedStatus(reason: string): ProfileStatus {
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
export function canPerformActions(status: ProfileStatus): boolean {
  return status.isActive && !status.isBlocked && !status.isSuspended;
}

/**
 * Verifica se a suspensão expirou
 */
export function isSuspensionExpired(status: ProfileStatus): boolean {
  if (!status.isSuspended || !status.suspendedUntil) {
    return false;
  }
  
  return new Date(status.suspendedUntil) < new Date();
}
