/**
 * Public Identity Service - Orquestrador Puro
 *
 * RESPONSABILIDADE: Coordenar adapters, SEM acesso direto a DB
 *
 * ❌ NÃO FAZ:
 * - Acesso direto a Supabase
 * - Switch/case de tabelas
 * - Query de existência fora de adapters
 * - Lógica de persistência
 *
 * ✅ FAZ:
 * - Orquestração
 * - Delegação para adapters
 * - Validação de alto nível
 * - Geração canônica de identificador disponível
 */
import { logger } from '@/shared/utils/logger';
import type {
  EntityType,
  EntityId,
  AvailabilityResult,
  ValidationResult,
} from '../domain/types';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { IdentityPolicy } from '../domain/IdentityPolicy';
import { IDENTITY_MESSAGES } from '../domain/messages';

const DEFAULT_GENERATION_MAX_ATTEMPTS = 100;

export class PublicIdentityService {
  private static adapters: Map<EntityType, IdentityAdapter> = new Map();

  /** Registra adapter para um tipo de entidade. */
  static registerAdapter(adapter: IdentityAdapter): void {
    this.adapters.set(adapter.entityType, adapter);
  }

  /** Obtém adapter para um tipo de entidade. */
  private static getAdapter(entityType: EntityType): IdentityAdapter {
    const adapter = this.adapters.get(entityType);
    if (!adapter) {
      throw new Error(`Adapter not registered for entity type: ${entityType}`);
    }
    return adapter;
  }

  /** Obtém policy para um tipo de entidade. */
  static getPolicy(entityType: EntityType): IdentityPolicy {
    const adapter = this.getAdapter(entityType);
    return adapter.policy;
  }

  /** Normaliza um nome para identificador público. */
  static normalize(name: string, entityType: EntityType): string {
    const policy = this.getPolicy(entityType);
    return policy.normalize(name);
  }

  /** Valida formato de identificador. */
  static validateFormat(identifier: string, entityType: EntityType): ValidationResult {
    const policy = this.getPolicy(entityType);
    return policy.validate(identifier);
  }

  /** Verifica se identificador é reservado. */
  static isReserved(identifier: string, entityType: EntityType): boolean {
    const policy = this.getPolicy(entityType);
    return policy.isReserved(identifier);
  }

  /**
   * Verifica disponibilidade completa de identificador.
   * Delega toda persistência para adapter.
   */
  static async checkAvailability(params: {
    identifier: string;
    entityType: EntityType;
    excludeEntityId?: EntityId;
  }): Promise<AvailabilityResult> {
    const { identifier, entityType, excludeEntityId } = params;

    try {
      const policy = this.getPolicy(entityType);
      const adapter = this.getAdapter(entityType);

      const validation = policy.validate(identifier);
      if (!validation.valid) {
        logger.info('[PublicIdentityService] checkAvailability:invalid', {
          entityType,
          identifier,
          reason: validation.error,
        });
        return {
          status: 'invalid',
          identifier,
          message: validation.error,
        };
      }

      if (policy.isReserved(identifier)) {
        logger.info('[PublicIdentityService] checkAvailability:reserved', {
          entityType,
          identifier,
        });
        const suggestion = await this.suggestAlternative(identifier, entityType);
        return {
          status: 'reserved',
          identifier,
          message: IDENTITY_MESSAGES.reserved,
          suggestion,
        };
      }

      const exists = await adapter.identifierExists(identifier, excludeEntityId);
      if (exists) {
        logger.info('[PublicIdentityService] checkAvailability:taken', {
          entityType,
          identifier,
        });
        const suggestion = await this.suggestAlternative(identifier, entityType);
        return {
          status: 'taken',
          identifier,
          message: IDENTITY_MESSAGES.taken,
          suggestion,
        };
      }

      logger.info('[PublicIdentityService] checkAvailability:available', {
        entityType,
        identifier,
      });
      return {
        status: 'available',
        identifier,
        message: IDENTITY_MESSAGES.available,
      };
    } catch (error) {
      logger.error('[PublicIdentityService] checkAvailability error:', error);
      throw error;
    }
  }

  /**
   * Gera um identificador normalizado e confirma sua disponibilidade exata.
   *
   * Esta é a autoridade para geração única de business/profile/professional/etc.
   * Consumers não devem consultar suas tabelas diretamente para inventar sufixos.
   *
   * A lista de similares do adapter é apenas uma otimização. Cada sugestão é
   * confirmada com identifierExists antes de ser devolvida; colisões omitidas por
   * limites de paginação são incorporadas localmente e a policy sugere novamente.
   */
  static async generateAvailableIdentifier(params: {
    name: string;
    entityType: EntityType;
    excludeEntityId?: EntityId;
    maxAttempts?: number;
  }): Promise<string> {
    const {
      name,
      entityType,
      excludeEntityId,
      maxAttempts = DEFAULT_GENERATION_MAX_ATTEMPTS,
    } = params;

    if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
      throw new Error('maxAttempts must be a positive integer');
    }

    const policy = this.getPolicy(entityType);
    const adapter = this.getAdapter(entityType);
    const baseIdentifier = policy.normalize(name);
    const baseValidation = policy.validate(baseIdentifier);

    if (!baseValidation.valid) {
      throw new Error(
        baseValidation.error || `Invalid normalized identifier for ${entityType}`,
      );
    }

    if (
      !policy.isReserved(baseIdentifier) &&
      !(await adapter.identifierExists(baseIdentifier, excludeEntityId))
    ) {
      return baseIdentifier;
    }

    const knownIdentifiers = new Set(
      await adapter.getExistingSimilar(baseIdentifier),
    );

    // Ensure the occupied/reserved base participates in policy suggestion even
    // when a bounded similarity query omitted it.
    knownIdentifiers.add(baseIdentifier);

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const candidate = policy.suggest(baseIdentifier, [...knownIdentifiers]);
      const validation = policy.validate(candidate);

      if (!validation.valid) {
        throw new Error(
          validation.error || `Generated invalid identifier for ${entityType}`,
        );
      }

      if (policy.isReserved(candidate)) {
        knownIdentifiers.add(candidate);
        continue;
      }

      const exists = await adapter.identifierExists(candidate, excludeEntityId);
      if (!exists) {
        logger.info('[PublicIdentityService] generateAvailableIdentifier:available', {
          entityType,
          baseIdentifier,
          identifier: candidate,
          attempt: attempt + 1,
        });
        return candidate;
      }

      knownIdentifiers.add(candidate);
    }

    throw new Error(
      `Unable to generate available identifier for ${entityType} after ${maxAttempts} attempts`,
    );
  }

  /**
   * Sugere alternativa para identificador.
   * Delega busca de similares para adapter (busca frouxa).
   */
  private static async suggestAlternative(
    identifier: string,
    entityType: EntityType,
  ): Promise<string> {
    try {
      const policy = this.getPolicy(entityType);
      const adapter = this.getAdapter(entityType);

      const existing = await adapter.getExistingSimilar(identifier);
      return policy.suggest(identifier, existing);
    } catch (error) {
      logger.error('[PublicIdentityService] suggestAlternative error:', error);
      // Availability remains useful even if suggestion infrastructure fails.
      return identifier;
    }
  }

  /**
   * Valida se pode trocar identificador (cooldown).
   * Delega para adapter.
   */
  static async canChangeIdentifier(params: {
    entityType: EntityType;
    entityId: EntityId;
  }) {
    const adapter = this.getAdapter(params.entityType);
    const result = await adapter.canChange(params.entityId);
    if (!result.canChange) {
      logger.info('[PublicIdentityService] canChangeIdentifier:blocked', {
        entityType: params.entityType,
        entityId: params.entityId,
        reason: result.reason,
        daysRemaining: result.daysRemaining,
      });
    }
    return result;
  }

  /**
   * Obtém histórico de mudanças de identificador.
   * Delega para adapter.
   */
  static async getIdentifierHistory(params: {
    entityType: EntityType;
    entityId: EntityId;
  }) {
    const adapter = this.getAdapter(params.entityType);
    return adapter.getHistory(params.entityId);
  }
}
