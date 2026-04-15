/**
 * Professional Identity Policy
 * Política preparada para profissionais (não implementada UI final)
 */

import type { IdentityPolicy } from '../domain/IdentityPolicy';
import type { EntityType, ValidationResult } from '../domain/types';
import { getReservedForEntityType } from '../utils/reserved-names';

export class ProfessionalIdentityPolicy implements IdentityPolicy {
  readonly entityType: EntityType = 'professional';
  readonly identifierField = 'slug';
  readonly format = 'kebab-case';
  readonly minLength = 2;
  readonly maxLength = 100;
  readonly cooldownDays = 30;
  readonly historyTable = 'professional_slug_history';

  private readonly regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  private readonly reservedNames: readonly string[];

  constructor() {
    this.reservedNames = getReservedForEntityType('professional');
  }

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-+|-+$/g, '');
  }

  validate(identifier: string): ValidationResult {
    if (!identifier || identifier.length < this.minLength) {
      return { valid: false, error: `Mínimo ${this.minLength} caracteres` };
    }

    if (identifier.length > this.maxLength) {
      return { valid: false, error: `Máximo ${this.maxLength} caracteres` };
    }

    if (!this.regex.test(identifier)) {
      return { valid: false, error: 'Formato inválido' };
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
    
    if (this.isReserved(slug)) {
      slug = `${slug}-profissional`;
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
