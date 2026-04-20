/**
 * ProfilePermissionsView — Cache de Permissões para UI
 * 
 * ⚠️ NÃO é SSOT de autorização.
 * ⚠️ NÃO usar para decisões de autorização.
 * 
 * É um cache derivado de core/authorization para uso em UI:
 * exibir/ocultar botões, menus e ações.
 * 
 * O SSOT de autorização é core/authorization.canProfilePerformAction().
 * 
 * @version 3.0.0
 */

export interface ProfilePermissionsView {
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
 * Permissões padrão para perfil ativo
 */
export function createDefaultPermissionsView(): ProfilePermissionsView {
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
 * Permissões para perfil suspenso/bloqueado
 */
export function createRestrictedPermissionsView(): ProfilePermissionsView {
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
export function createModeratorPermissionsView(): ProfilePermissionsView {
  return {
    canPost: true,
    canComment: true,
    canMessage: true,
    canCreateBusiness: true,
    canModerate: true,
    canReport: true,
  };
}
