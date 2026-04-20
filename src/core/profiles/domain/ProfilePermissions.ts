/**
 * ProfilePermissions — Value Object de Permissões
 * 
 * Define o que um perfil pode fazer no sistema.
 * Regras de domínio específicas ficam nos respectivos módulos.
 * 
 * @version 2.0.0
 */

export interface ProfilePermissions {
  /** Pode criar posts */
  canPost: boolean;
  
  /** Pode comentar em posts */
  canComment: boolean;
  
  /** Pode enviar mensagens diretas */
  canMessage: boolean;
  
  /** Pode criar perfis de negócio */
  canCreateBusiness: boolean;
  
  /** Pode moderar conteúdo */
  canModerate: boolean;
  
  /** Pode reportar conteúdo */
  canReport: boolean;
}

/**
 * Permissões padrão para perfil novo
 */
export function createDefaultPermissions(): ProfilePermissions {
  return {
    canPost: true,
    canComment: true,
    canMessage: true,
    canCreateBusiness: true,
    canModerate: false,
    canReport: true,
  };
}

/**
 * Permissões para perfil suspenso
 */
export function createSuspendedPermissions(): ProfilePermissions {
  return {
    canPost: false,
    canComment: false,
    canMessage: false,
    canCreateBusiness: false,
    canModerate: false,
    canReport: false,
  };
}

/**
 * Permissões para moderador
 */
export function createModeratorPermissions(): ProfilePermissions {
  return {
    canPost: true,
    canComment: true,
    canMessage: true,
    canCreateBusiness: true,
    canModerate: true,
    canReport: true,
  };
}

/**
 * Verifica se tem alguma permissão de ação
 */
export function hasAnyActionPermission(permissions: ProfilePermissions): boolean {
  return permissions.canPost || permissions.canComment || permissions.canMessage;
}
