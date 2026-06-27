/**
 * ProfileContext — Read Model de Contexto de Sessão
 *
 * Agrega os contratos de runtime (status, permissões, plano, reputação)
 * com dados de identidade do perfil logado.
 *
 * Casos de uso:
 * - useProfileContextIntegration (contexto de sessão)
 * - TrackRidePage (verificação de motorista)
 * - DriverCancellationMetrics (painel admin)
 * - admin-motoristas/sections/types (tipos de seção admin)
 *
 * @version 3.0.0
 */

// Re-exporta os contratos de runtime para que importadores de ProfileContext
// não precisem conhecer a pasta contracts/.
export type {
  PlanType,
  ProfilePlan,
  ProfileStatus,
  ProfilePermissions,
  ProfileReputation,
} from "../contracts/ProfileRuntimeContracts";

import type {
  ProfilePlan,
  ProfileStatus,
  ProfilePermissions,
  ProfileReputation,
} from "../contracts/ProfileRuntimeContracts";

/**
 * ProfileContext — Contexto completo do perfil logado
 *
 * Retornado por ProfileService.getProfileContext().
 * Usado para verificar identidade, status, permissões e plano.
 */
export interface ProfileContext {
  /** ID do perfil */
  id: string;

  /** Nome completo (campo base) */
  name: string;

  /** Nome de exibição preferido */
  displayName: string;

  /** Username para @mention e URL */
  username: string;

  /** URL do avatar */
  avatar?: string;

  /** Estado de moderação calculado */
  status: ProfileStatus;

  /** Permissões calculadas */
  permissions: ProfilePermissions;

  /** Plano ativo */
  plan: ProfilePlan;

  /** Reputação calculada */
  reputation: ProfileReputation;

  /** Se o perfil foi verificado */
  verified: boolean;
}

/**
 * Cria um ProfileContext com valores padrão
 */
export function createDefaultProfileContext(
  id: string,
  name: string,
  username: string
): ProfileContext {
  return {
    id,
    name,
    displayName: name,
    username,
    status: {
      isActive: true,
      isBlocked: false,
      isSuspended: false,
    },
    permissions: {
      canPost: true,
      canComment: true,
      canMessage: true,
      canCreateBusiness: true,
      canModerate: false,
      canReport: true,
    },
    plan: {
      type: "basic",
      isPremium: false,
    },
    reputation: {
      level: 1,
      score: 0,
    },
    verified: false,
  };
}
