/**
 * Public Identity Service - Orquestrador Puro
 * 
 * RESPONSABILIDADE: Coordenar adapters, SEM acesso direto a DB
 * 
 * ❌ NÃO FAZ:
 * - Acesso direto a Supabase
 * - Switch/case de tabelas
 * - Query de existência
 * - Lógica de persistência
 * 
 * ✅ FAZ:
 * - Orquestração
 * - Delegação para adapters
 * - Validação de alto nível
 */

import type { 
  EntityType,
  EntityId,
  AvailabilityResult,
  ValidationResult 
} from '../domain/types';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { IdentityPolicy } from '../domain/IdentityPolicy';
import { IDENTITY_MESSAGES } from '../domain/messages';
import { logger } from '@/shared/utils/logger';

export class PublicIdentityService {
  private static adapters: Map<EntityType, IdentityAdapter> = new Map();

  /**
   * Registra adapter para um tipo de entidade
   */
  static registerAdapter(adapter: IdentityAdapter): void {
    this.adapters.set(adapter.entityType, adapter);
  }

  /**
   * Obtém adapter para um tipo de entidade
   */
  private static getAdapter(entityType: EntityType): IdentityAdapter {
    const adapter = this.adapters.get(entityType);
    if (!adapter) {
      throw new Error(`Adapter not registered for entity type: ${entityType}`);
    }
    return adapter;
  }

  /**
   * Obtém policy para um tipo de entidade
   */
  static getPolicy(entityType: EntityType): IdentityPolicy {
    const adapter = this.getAdapter(entityType);
    return adapter.policy;
  }

  /**
   * Normaliza um nome para identificador público
   */
  static normalize(name: string, entityType: EntityType): string {
    const policy = this.getPolicy(entityType);
    return policy.normalize(name);
  }

  /**
   * Valida formato de identificador
   */
  static validateFormat(identifier: string, entityType: EntityType): ValidationResult {
    const policy = this.getPolicy(entityType);
    return policy.validate(identifier);
  }

  /**
   * Verifica se identificador é reservado
   */
  static isReserved(identifier: string, entityType: EntityType): boolean {
    const policy = this.getPolicy(entityType);
    return policy.isReserved(identifier);
  }

  /**
   * Verifica disponibilidade completa de identificador
   * Delega toda persistência para adapter
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

      // 1. Validar formato
      const validation = policy.validate(identifier);
      if (!validation.valid) {
        logger.info('[PublicIdentityService] checkAvailability:invalid', { entityType, identifier, reason: validation.error });
        return {
          status: 'invalid',
          identifier,
          message: validation.error,
        };
      }

      // 2. Verificar reserved
      if (policy.isReserved(identifier)) {
        logger.info('[PublicIdentityService] checkAvailability:reserved', { entityType, identifier });
        const suggestion = await this.suggestAlternative(identifier, entityType);
        return {
          status: 'reserved',
          identifier,
          message: IDENTITY_MESSAGES.reserved,
          suggestion,
        };
      }

      // 3. Verificar se já existe (DELEGA para adapter - checagem exata)
      const exists = await adapter.identifierExists(identifier, excludeEntityId);
      if (exists) {
        logger.info('[PublicIdentityService] checkAvailability:taken', { entityType, identifier });
        const suggestion = await this.suggestAlternative(identifier, entityType);
        return {
          status: 'taken',
          identifier,
          message: IDENTITY_MESSAGES.taken,
          suggestion,
        };
      }

      logger.info('[PublicIdentityService] checkAvailability:available', { entityType, identifier });
      return {
        status: 'available',
        identifier,
        message: IDENTITY_MESSAGES.available,
      };
    } catch (error) {
      logger.error('[PublicIdentityService] checkAvailability error:', error);
      throw error; // Propaga erro de infraestrutura
    }
  }

  /**
   * Sugere alternativa para identificador
   * Delega busca de similares para adapter (busca frouxa)
   */
  private static async suggestAlternative(
    identifier: string,
    entityType: EntityType
  ): Promise<string> {
    try {
      const policy = this.getPolicy(entityType);
      const adapter = this.getAdapter(entityType);
      
      // DELEGA busca frouxa para adapter
      const existing = await adapter.getExistingSimilar(identifier);
      return policy.suggest(identifier, existing);
    } catch (error) {
      logger.error('[PublicIdentityService] suggestAlternative error:', error);
      // Se falhar sugestão, retorna identificador original
      return identifier;
    }
  }

  /**
   * Valida se pode trocar identificador (cooldown)
   * Delega para adapter
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
   * Obtém histórico de mudanças de identificador
   * Delega para adapter
   */
  static async getIdentifierHistory(params: {
    entityType: EntityType;
    entityId: EntityId;
  }) {
    const adapter = this.getAdapter(params.entityType);
    return adapter.getHistory(params.entityId);
  }
}
