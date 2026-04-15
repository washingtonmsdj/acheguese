/**
 * Identity Adapter - Interface
 * Define contrato para adapters específicos por entity type
 * 
 * RESPONSABILIDADE: Boundary específica por entidade
 * - Persistência e consulta específica
 * - Sem repository adicional (não há reutilização concreta)
 */

import type { 
  EntityType,
  EntityId,
  ChangeReason, 
  IdentityChangeRecord, 
  CooldownResult 
} from './types';
import type { IdentityPolicy } from './IdentityPolicy';

export interface IdentityAdapter {
  readonly entityType: EntityType;
  readonly policy: IdentityPolicy;

  /**
   * Verifica se identificador já existe (checagem exata de unicidade)
   * Compatível com constraint real do banco
   * @throws Error se infraestrutura falhar
   */
  identifierExists(identifier: string, excludeEntityId?: EntityId): Promise<boolean>;

  /**
   * Busca identificadores similares para sugestão (busca frouxa)
   * Usado apenas para gerar sugestões, não para decisão de disponibilidade
   * @throws Error se infraestrutura falhar
   */
  getExistingSimilar(identifier: string): Promise<string[]>;

  /**
   * Registra mudança de identificador
   * @throws Error se falhar
   */
  recordChange(params: {
    entityId: EntityId;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void>;

  /**
   * Obtém histórico de mudanças
   * @throws Error se falhar
   */
  getHistory(entityId: EntityId): Promise<IdentityChangeRecord[]>;

  /**
   * Calcula se pode trocar identificador (cooldown do histórico)
   * @throws Error se falhar
   */
  canChange(entityId: EntityId): Promise<CooldownResult>;

  /**
   * Resolve identificador antigo (se aplicável)
   * Business: resolve publicamente
   * Profile: retorna null (sem resolução pública)
   * @throws Error se falhar
   */
  resolveOldIdentifier(oldIdentifier: string): Promise<{
    entityId: EntityId;
    currentIdentifier: string;
  } | null>;
}
