/**
 * Identity Policy - Interface
 * Define contrato para políticas de identidade por tipo de entidade
 */

import type { EntityType, ValidationResult } from './types';

export interface IdentityPolicy {
  readonly entityType: EntityType;
  readonly identifierField: string;
  readonly format: string;
  readonly minLength: number;
  readonly maxLength: number;
  readonly cooldownDays: number;
  readonly historyTable: string;

  /**
   * Normaliza um nome para o formato do identificador
   */
  normalize(name: string): string;

  /**
   * Valida se um identificador está no formato correto
   */
  validate(identifier: string): ValidationResult;

  /**
   * Verifica se um nome é reservado para este tipo de entidade
   */
  isReserved(identifier: string): boolean;

  /**
   * Retorna lista de nomes reservados para este tipo
   */
  getReservedNames(): readonly string[];

  /**
   * Gera sugestão de identificador a partir de um nome
   */
  suggest(name: string, existingIdentifiers: string[]): string;
}
