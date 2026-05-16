/**
 * Communication Channel Identity Policy
 * Politica para canais de comunicacao: slug em kebab-case.
 */

import type { IdentityPolicy } from '../domain/IdentityPolicy';
import type { EntityType, ValidationResult } from '../domain/types';
import { getReservedForEntityType } from '../utils/reserved-names';

export class CommunicationChannelIdentityPolicy implements IdentityPolicy {
  readonly entityType: EntityType = 'communication_channel';
  readonly identifierField = 'slug';
  readonly format = 'kebab-case';
  readonly minLength = 2;
  readonly maxLength = 100;
  readonly cooldownDays = 30;
  readonly historyTable = 'communication_channel_audit';

  private readonly regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  private readonly reservedNames: readonly string[];

  constructor() {
    this.reservedNames = getReservedForEntityType('communication_channel');
  }

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  validate(identifier: string): ValidationResult {
    if (!identifier || identifier.length < this.minLength) {
      return { valid: false, error: `Minimo ${this.minLength} caracteres` };
    }

    if (identifier.length > this.maxLength) {
      return { valid: false, error: `Maximo ${this.maxLength} caracteres` };
    }

    if (!this.regex.test(identifier)) {
      return {
        valid: false,
        error: 'Formato invalido. Use apenas letras minusculas, numeros e hifen',
      };
    }

    return { valid: true };
  }

  isReserved(identifier: string): boolean {
    return this.reservedNames.includes(identifier.toLowerCase());
  }

  getReservedNames(): readonly string[] {
    return this.reservedNames;
  }

  suggest(name: string, existingIdentifiers: string[]): string {
    let slug = this.normalize(name);

    if (this.isReserved(slug)) slug = `${slug}-canal`;
    if (!existingIdentifiers.includes(slug)) return slug;

    let counter = 1;
    while (existingIdentifiers.includes(`${slug}-${counter}`)) {
      counter += 1;
    }
    return `${slug}-${counter}`;
  }
}
