/**
 * Business Identity Policy
 * PolÃ­tica para empresas: slug, kebab-case, hÃ­fen
 */

import type { IdentityPolicy } from '../domain/IdentityPolicy';
import type { EntityType, ValidationResult } from '../domain/types';
import { getReservedForEntityType } from '../utils/reserved-names';

export class BusinessIdentityPolicy implements IdentityPolicy {
  readonly entityType: EntityType = 'business';
  readonly identifierField = 'slug';
  readonly format = 'kebab-case';
  readonly minLength = 3;
  readonly maxLength = 60;
  readonly cooldownDays = 0;
  readonly historyTable = 'business_data';


  private readonly regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  private readonly reservedNames: readonly string[];

  constructor() {
    this.reservedNames = getReservedForEntityType('business');
  }

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-') // Remove hÃ­fens duplicados
      .replace(/^-+|-+$/g, '');
  }

  validate(identifier: string): ValidationResult {
    if (!identifier || identifier.length < this.minLength) {
      return {
        valid: false,
        error: `MÃ­nimo ${this.minLength} caracteres`,
      };
    }

    if (identifier.length > this.maxLength) {
      return {
        valid: false,
        error: `MÃ¡ximo ${this.maxLength} caracteres`,
      };
    }

    if (!this.regex.test(identifier)) {
      return {
        valid: false,
        error: 'Formato invÃ¡lido. Use apenas letras minÃºsculas, nÃºmeros e hÃ­fen',
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

  suggest(name: string, existingSlugs: string[]): string {
    let slug = this.normalize(name);

    // Se Ã© reservado, adiciona sufixo
    if (this.isReserved(slug)) {
      slug = `${slug}-empresa`;
    }

    if (!existingSlugs.includes(slug)) {
      return slug;
    }

    let counter = 1;
    while (existingSlugs.includes(`${slug}-${counter}`)) {
      counter++;
    }
    return `${slug}-${counter}`;
  }
}
