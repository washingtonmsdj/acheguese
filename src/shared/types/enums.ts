/**
 * Enums compartilhados do sistema
 * 
 * Centraliza todos os enums para prevenir typos e melhorar type safety.
 * Usar enums ao invés de strings hardcoded garante:
 * - Autocomplete no IDE
 * - Detecção de erros em compile-time
 * - Refatoração segura
 * 
 * @module shared/types/enums
 */

/**
 * Status de entidades no sistema
 * 
 * @example
 * ```typescript
 * if (user.status === EntityStatus.ACTIVE) {
 *   // usuário está ativo
 * }
 * ```
 */
export enum EntityStatus {
  /** Entidade ativa e operacional */
  ACTIVE = 'active',
  
  /** Entidade inativa (desabilitada temporariamente) */
  INACTIVE = 'inactive',
  
  /** Entidade pendente de aprovação */
  PENDING = 'pending',
  
  /** Entidade suspensa (por moderação) */
  SUSPENDED = 'suspended',
  
  /** Entidade deletada (soft delete) */
  DELETED = 'deleted',
  
  /** Entidade expirada (para promoções, cupons, etc) */
  EXPIRED = 'expired',
  
  /** Entidade cancelada (para assinaturas, pedidos, etc) */
  CANCELLED = 'cancelled',
}

/**
 * Tipos de localização territorial
 * 
 * @example
 * ```typescript
 * if (location.type === LocationType.CITY) {
 *   // é uma cidade
 * }
 * ```
 */
export enum LocationType {
  /** País */
  COUNTRY = 'country',
  
  /** Estado/Província */
  STATE = 'state',
  
  /** Cidade/Município */
  CITY = 'city',
  
  /** Bairro/Distrito */
  DISTRICT = 'district',
}

/**
 * Roles de usuário no sistema
 * 
 * @example
 * ```typescript
 * if (user.role === UserRole.ADMIN) {
 *   // usuário é admin
 * }
 * ```
 */
export enum UserRole {
  /** Administrador do sistema */
  ADMIN = 'admin',
  
  /** Moderador de conteúdo */
  MODERATOR = 'moderator',
  
  /** Usuário comum */
  USER = 'user',
  
  /** Visitante não autenticado */
  GUEST = 'guest',
}

/**
 * Tipos de perfil de usuário
 * 
 * @example
 * ```typescript
 * if (profile.type === ProfileType.BUSINESS) {
 *   // é um perfil de empresa
 * }
 * ```
 */
export enum ProfileType {
  /** Perfil pessoal */
  PERSONAL = 'personal',
  
  /** Perfil de empresa */
  BUSINESS = 'business',
  
  /** Perfil de profissional */
  PROFESSIONAL = 'professional',
  
  /** Perfil de motorista */
  DRIVER = 'driver',
}

/**
 * Tipos de plano de assinatura
 * 
 * @example
 * ```typescript
 * if (subscription.plan === PlanType.PREMIUM) {
 *   // usuário tem plano premium
 * }
 * ```
 */
export enum PlanType {
  /** Plano básico (gratuito) */
  BASIC = 'basic',
  
  /** Plano premium (pago) */
  PREMIUM = 'premium',
  
  /** Plano enterprise (corporativo) */
  ENTERPRISE = 'enterprise',
}

/**
 * Tipos de verificação
 * 
 * @example
 * ```typescript
 * if (verification.type === VerificationType.RESIDENT) {
 *   // verificação de residência
 * }
 * ```
 */
export enum VerificationType {
  /** Verificação de residência */
  RESIDENT = 'resident',
  
  /** Verificação de identidade */
  IDENTITY = 'identity',
  
  /** Verificação de empresa */
  BUSINESS = 'business',
  
  /** Verificação de profissional */
  PROFESSIONAL = 'professional',
  
  /** Verificação de motorista */
  DRIVER = 'driver',
}

/**
 * Status de verificação
 * 
 * @example
 * ```typescript
 * if (verification.status === VerificationStatus.APPROVED) {
 *   // verificação aprovada
 * }
 * ```
 */
export enum VerificationStatus {
  /** Verificação não solicitada */
  NOT_REQUESTED = 'not_requested',
  
  /** Verificação pendente de análise */
  PENDING = 'pending',
  
  /** Verificação aprovada */
  APPROVED = 'approved',
  
  /** Verificação rejeitada */
  REJECTED = 'rejected',
  
  /** Verificação expirada */
  EXPIRED = 'expired',
}

/**
 * Tipos de notificação
 * 
 * @example
 * ```typescript
 * if (notification.type === NotificationType.COMMENT) {
 *   // notificação de comentário
 * }
 * ```
 */
export enum NotificationType {
  /** Comentário em post */
  COMMENT = 'comment',
  
  /** Curtida em post */
  LIKE = 'like',
  
  /** Menção em post ou comentário */
  MENTION = 'mention',
  
  /** Novo seguidor */
  FOLLOW = 'follow',
  
  /** Mensagem direta */
  MESSAGE = 'message',
  
  /** Alerta da comunidade */
  ALERT = 'alert',
  
  /** Sistema/Administrativo */
  SYSTEM = 'system',
}

/**
 * Helper para verificar se um valor é um enum válido
 * 
 * @param value - Valor a verificar
 * @param enumObj - Objeto enum
 * @returns true se o valor é válido
 * 
 * @example
 * ```typescript
 * if (isValidEnum(status, EntityStatus)) {
 *   // status é válido
 * }
 * ```
 */
export function isValidEnum<T extends Record<string, string>>(
  value: string,
  enumObj: T
): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}

/**
 * Helper para obter todos os valores de um enum
 * 
 * @param enumObj - Objeto enum
 * @returns Array com todos os valores
 * 
 * @example
 * ```typescript
 * const statuses = getEnumValues(EntityStatus);
 * // ['active', 'inactive', 'pending', ...]
 * ```
 */
export function getEnumValues<T extends Record<string, string>>(
  enumObj: T
): T[keyof T][] {
  return Object.values(enumObj) as T[keyof T][];
}

/**
 * Helper para obter todas as chaves de um enum
 * 
 * @param enumObj - Objeto enum
 * @returns Array com todas as chaves
 * 
 * @example
 * ```typescript
 * const keys = getEnumKeys(EntityStatus);
 * // ['ACTIVE', 'INACTIVE', 'PENDING', ...]
 * ```
 */
export function getEnumKeys<T extends Record<string, string>>(
  enumObj: T
): (keyof T)[] {
  return Object.keys(enumObj) as (keyof T)[];
}
