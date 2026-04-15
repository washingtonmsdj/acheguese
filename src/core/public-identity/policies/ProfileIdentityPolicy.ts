/**
 * Profile Identity Policy
 * Política para perfis pessoais: username, social-style, underscore
 */

import type { IdentityPolicy } from '../domain/IdentityPolicy';
import type { EntityType, ValidationResult } from '../domain/types';
import { getReservedForEntityType } from '../utils/reserved-names';

export class ProfileIdentityPolicy implements IdentityPolicy {
  readonly entityType: EntityType = 'profile';
  readonly identifierField = 'username';
  readonly format = 'social-style';
  readonly minLength = 3;
  readonly maxLength = 30;
  readonly cooldownDays = 30;
  readonly historyTable = 'profile_username_history';

  private readonly regex = /^[a-z][a-z0-9_]{2,29}$/;
  private readonly reservedNames: readonly string[];

  constructor() {
    this.reservedNames = getReservedForEntityType('profile');
  }

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_-]/g, '') // Remove tudo exceto letras, números, espaços, underscore e hífen
      .replace(/[\s-]+/g, '_') // Converte espaços e hífens para underscore
      .replace(/_+/g, '_') // Remove underscores duplicados
      .replace(/^_+|_+$/g, ''); // Remove underscores nas pontas
  }

  validate(identifier: string): ValidationResult {
    if (!identifier || identifier.length < this.minLength) {
      return {
        valid: false,
        error: `Mínimo ${this.minLength} caracteres`,
      };
    }

    if (identifier.length > this.maxLength) {
      return {
        valid: false,
        error: `Máximo ${this.maxLength} caracteres`,
      };
    }

    if (!/^[a-z]/.test(identifier)) {
      return {
        valid: false,
        error: 'Deve começar com letra',
      };
    }

    if (!this.regex.test(identifier)) {
      return {
        valid: false,
        error: 'Formato inválido. Use apenas letras minúsculas, números e underscore',
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

  suggest(name: string, existingUsernames: string[]): string {
    let username = this.normalize(name);

    // Se é reservado, adiciona sufixo numérico
    if (this.isReserved(username)) {
      username = `${username}1`;
    }

    if (!existingUsernames.includes(username)) {
      return username;
    }

    let counter = 1;
    while (existingUsernames.includes(`${username}${counter}`)) {
      counter++;
    }
    return `${username}${counter}`;
  }
}
