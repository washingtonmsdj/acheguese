/**
 * Branded Types para IDs de Autenticação e Perfil
 *
 * Previne mistura acidental de auth.user.id com profile.id
 * Enforcement em tempo de compilação
 */

/**
 * UserId — ID do usuário autenticado (auth.users.id)
 * Representa a identidade de autenticação do Supabase
 */
export type UserId = string & { readonly __brand: "UserId" };

/**
 * ProfileId — ID do perfil (profiles.id)
 * Representa um perfil específico do usuário
 */
export type ProfileId = string & { readonly __brand: "ProfileId" };

/**
 * Type guards para validação em runtime
 */
export function isUserId(value: string): value is UserId {
  // Em runtime, UserId é apenas string
  // Validação adicional pode ser adicionada aqui
  return typeof value === "string" && value.length > 0;
}

export function isProfileId(value: string): value is ProfileId {
  // Em runtime, ProfileId é apenas string
  // Validação adicional pode ser adicionada aqui
  return typeof value === "string" && value.length > 0;
}

/**
 * Construtores seguros (use com cuidado!)
 */
export function toUserId(value: string): UserId {
  if (!isUserId(value)) {
    throw new Error(`Invalid UserId: ${value}`);
  }
  return value as UserId;
}

export function toProfileId(value: string): ProfileId {
  if (!isProfileId(value)) {
    throw new Error(`Invalid ProfileId: ${value}`);
  }
  return value as ProfileId;
}

/**
 * Conversores unsafe (apenas quando necessário)
 * Use apenas em boundaries (API, banco de dados)
 */
export function unsafeToUserId(value: string): UserId {
  return value as UserId;
}

export function unsafeToProfileId(value: string): ProfileId {
  return value as ProfileId;
}
