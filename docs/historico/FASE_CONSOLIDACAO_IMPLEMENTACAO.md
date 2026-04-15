# PLANO DE IMPLEMENTAÇÃO: Consolidação de Identidade Pública

**Data**: 2026-03-29  
**Arquitetura**: Corrigida v2.0  
**Ordem de Execução**: Sequencial coordenada

---

## CORREÇÕES ARQUITETURAIS APLICADAS

✅ **Evitar God Module**: Policies + Adapters por entity type  
✅ **UI Fora do Core**: Componentes em `shared/` ou wrappers por módulo  
✅ **Histórico como SSOT**: Campos denormalizados são cache  
✅ **Reserved Names por Policy**: Escopo por entity type  
✅ **Histórico Diferenciado**: Business (público) vs Profile (interno)  

---

## ORDEM DE EXECUÇÃO

### FASE 1: Fundação Transversal (SEM UI)
1. Criar estrutura `core/public-identity/`
2. Implementar domain (entities, policies, adapters)
3. Implementar services (orquestrador + histórico SSOT)
4. Implementar repositories
5. Implementar utils (reserved names por policy, cooldown)
6. Testes unitários

### FASE 2: Migrações de Banco
1. Profile username history (SSOT)
2. Campos denormalizados de cooldown (CACHE)
3. Triggers para atualizar cache
4. Profile username unique index

### FASE 3: Integração Business
1. Criar BusinessIdentityAdapter
2. Migrar BusinessUrlService para usar adapter
3. Migrar BusinessService
4. Atualizar hooks
5. Testes

### FASE 4: Integração Profile
1. Criar ProfileIdentityAdapter
2. Migrar ProfileService
3. Remover duplicações (isUsernameAvailable)
4. Implementar rota `/u/:username`
5. Testes

### FASE 5: Limpeza de Legado
1. Remover rotas legadas
2. Remover componentes mortos
3. Remover helpers deprecated
4. Atualizar imports

### FASE 6: Reorganização Business
1. Mover componentes para modules/
2. Mover hooks para modules/
3. Atualizar barrel exports
4. Corrigir imports

### FASE 7: UI e Hooks (FORA do core)
1. Componentes genéricos em `shared/components/public-identity/`
2. Hooks em `shared/hooks/public-identity/`
3. Wrappers específicos por módulo
4. Integração em forms

### FASE 8: Testes E2E
1. Fluxos completos
2. Validação em banco real
3. Verificar cooldown calculado do histórico
4. Verificar campos cache atualizados mas não usados como SSOT

---

## ARQUIVOS DETALHADOS

### FASE 1.1: Domain Layer

#### `src/core/public-identity/domain/PublicIdentity.ts`
```typescript
/**
 * Public Identity - Entity
 * Representa uma identidade pública no sistema
 */

export interface PublicIdentity {
  identifier: string;
  entityType: EntityType;
  entityId: string;
  lastChangedAt: Date | null;
  canChangeAfter: Date | null;
  createdAt: Date;
}

export type EntityType = 'business' | 'profile' | 'professional';

export interface IdentityChangeRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  oldIdentifier: string;
  newIdentifier: string;
  reason: ChangeReason;
  changedAt: Date;
}

export type ChangeReason = 
  | 'user_requested' 
  | 'admin_action' 
  | 'policy_violation' 
  | 'territory_changed';

export interface AvailabilityResult {
  status: AvailabilityStatus;
  identifier: string;
  message?: string;
  suggestion?: string;
}

export type AvailabilityStatus = 
  | 'available' 
  | 'taken' 
  | 'invalid' 
  | 'reserved' 
  | 'cooldown_blocked';

export interface CooldownResult {
  canChange: boolean;
  reason?: 'cooldown_active' | 'first_change';
  nextAllowedDate?: Date;
  daysRemaining?: number;
}
```

#### `src/core/public-identity/domain/IdentityPolicy.ts`
```typescript
/**
 * Identity Policy - Interface
 * Define contrato para políticas de identidade por tipo de entidade
 */

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
  suggest(name: string, existingSlugs: string[]): string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, any>;
}

export type EntityType = 'business' | 'profile' | 'professional';
```

#### `src/core/public-identity/domain/IdentityAdapter.ts`
```typescript
/**
 * Identity Adapter - Interface
 * Define contrato para adapters específicos por entity type
 */

export interface IdentityAdapter {
  readonly entityType: EntityType;
  readonly policy: IdentityPolicy;

  /**
   * Verifica se identificador já existe
   */
  identifierExists(identifier: string, excludeEntityId?: string): Promise<boolean>;

  /**
   * Busca identificadores similares existentes
   */
  getExistingSimilar(identifier: string): Promise<string[]>;

  /**
   * Registra mudança de identificador
   */
  recordChange(params: {
    entityId: string;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void>;

  /**
   * Obtém histórico de mudanças
   */
  getHistory(entityId: string): Promise<IdentityChangeRecord[]>;

  /**
   * Calcula se pode trocar identificador (cooldown)
   */
  canChange(entityId: string): Promise<CooldownResult>;

  /**
   * Resolve identificador antigo (se aplicável)
   * Business: resolve publicamente
   * Profile: retorna null (sem resolução pública)
   */
  resolveOldIdentifier(oldIdentifier: string): Promise<{
    entityId: string;
    currentIdentifier: string;
  } | null>;
}

export type EntityType = 'business' | 'profile' | 'professional';
export type ChangeReason = 'user_requested' | 'admin_action' | 'policy_violation' | 'territory_changed';
```

#### `src/core/public-identity/policies/BusinessIdentityPolicy.ts`
```typescript
/**
 * Business Identity Policy
 * Política para empresas: slug, kebab-case, hífen
 */

import { IdentityPolicy, ValidationResult, EntityType } from '../domain/IdentityPolicy';
import { COMMON_RESERVED, BUSINESS_SPECIFIC_RESERVED } from '../utils/reserved-names';

export class BusinessIdentityPolicy implements IdentityPolicy {
  readonly entityType: EntityType = 'business';
  readonly identifierField = 'slug';
  readonly format = 'kebab-case';
  readonly minLength = 2;
  readonly maxLength = 100;
  readonly cooldownDays = 30;
  readonly historyTable = 'business_slug_history';

  private readonly regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
  private readonly reservedNames: readonly string[];

  constructor() {
    this.reservedNames = [...COMMON_RESERVED, ...BUSINESS_SPECIFIC_RESERVED];
  }

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

    if (!this.regex.test(identifier)) {
      return {
        valid: false,
        error: 'Formato inválido. Use apenas letras minúsculas, números e hífen',
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

    // Se é reservado, adiciona sufixo
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
```

#### `src/core/public-identity/policies/ProfileIdentityPolicy.ts`
```typescript
/**
 * Profile Identity Policy
 * Política para perfis pessoais: username, social-style, underscore
 */

import { IdentityPolicy, ValidationResult, EntityType } from '../domain/IdentityPolicy';
import { COMMON_RESERVED, PROFILE_SPECIFIC_RESERVED } from '../utils/reserved-names';

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
    this.reservedNames = [...COMMON_RESERVED, ...PROFILE_SPECIFIC_RESERVED];
  }

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/[\s-]+/g, '_')
      .replace(/^_+|_+$/g, '');
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
```

#### `src/core/public-identity/domain/ProfessionalIdentityPolicy.ts`
```typescript
/**
 * Professional Identity Policy
 * Política preparada para profissionais (não implementada UI final)
 */

import { IdentityPolicy, ValidationResult, EntityType } from './IdentityPolicy';

export class ProfessionalIdentityPolicy implements IdentityPolicy {
  readonly entityType: EntityType = 'professional';
  readonly identifierField = 'slug';
  readonly format = 'kebab-case';
  readonly minLength = 2;
  readonly maxLength = 100;
  readonly cooldownDays = 30;
  readonly historyTable = 'professional_slug_history';

  private readonly regex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

  normalize(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
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

  suggest(name: string, existingSlugs: string[]): string {
    let slug = this.normalize(name);
    if (!existingSlugs.includes(slug)) return slug;

    let counter = 1;
    while (existingSlugs.includes(`${slug}-${counter}`)) counter++;
    return `${slug}-${counter}`;
  }
}
```

---

### FASE 1.2: Utils Layer

#### `src/core/public-identity/utils/reserved-names.ts`
```typescript
/**
 * Reserved Names - Por Policy/Entity Type
 * Fonte única mas com escopo por tipo de entidade
 */

// ── Nomes Comuns Reservados (todos os perfis) ────────────────────────────────

export const COMMON_RESERVED = [
  // Sistema
  'admin', 'root', 'system', 'moderator', 'mod',
  'oficial', 'official', 'verified', 'staff',
  // Rotas
  'login', 'logout', 'cadastro', 'signup', 'signin',
  'sobre', 'about', 'contato', 'contact',
  'termos', 'terms', 'privacidade', 'privacy',
  'ajuda', 'help', 'suporte', 'support',
  'api', 'docs', 'p', 'u',
  // Territoriais principais
  'ba', 'salvador', 'sp', 'sao-paulo', 'rj', 'rio-de-janeiro',
] as const;

// ── Business Specific Reserved ────────────────────────────────────────────────

export const BUSINESS_SPECIFIC_RESERVED = [
  'empresas', 'business', 'empresa', 'company',
  'loja', 'store', 'shop',
  'servico', 'service', 'servicos', 'services',
  'produto', 'product', 'produtos', 'products',
  'catalogo', 'catalog',
] as const;

// ── Profile Specific Reserved ─────────────────────────────────────────────────

export const PROFILE_SPECIFIC_RESERVED = [
  'perfil', 'profile', 'user', 'usuario',
  'conta', 'account',
  'configuracoes', 'settings', 'config',
  'dashboard', 'painel',
  'familia', 'family',
  'identidades', 'identities',
] as const;

// ── Professional Specific Reserved ────────────────────────────────────────────

export const PROFESSIONAL_SPECIFIC_RESERVED = [
  'profissional', 'professional', 'prestador',
  'servicos', 'services',
  'portfolio', 'trabalhos', 'jobs',
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Verifica se um nome é reservado comum (todos os perfis)
 */
export function isCommonReserved(name: string): boolean {
  return COMMON_RESERVED.includes(name.toLowerCase() as any);
}

/**
 * Retorna todos os reserved names para um tipo de entidade
 */
export function getReservedForEntityType(entityType: 'business' | 'profile' | 'professional'): readonly string[] {
  switch (entityType) {
    case 'business':
      return [...COMMON_RESERVED, ...BUSINESS_SPECIFIC_RESERVED];
    case 'profile':
      return [...COMMON_RESERVED, ...PROFILE_SPECIFIC_RESERVED];
    case 'professional':
      return [...COMMON_RESERVED, ...PROFESSIONAL_SPECIFIC_RESERVED];
  }
}
```

---

### FASE 1.3: Services Layer

#### `src/core/public-identity/services/PublicIdentityService.ts`
```typescript
/**
 * Public Identity Service - Engine Central
 * Serviço transversal para identidade pública
 */

import { supabase } from '@/integrations/supabase';
import { 
  BusinessIdentityPolicy, 
  ProfileIdentityPolicy,
  ProfessionalIdentityPolicy,
  IdentityPolicy 
} from '../domain';
import { isReservedName } from '../utils/reserved-names';
import { IdentityCooldownService } from './IdentityCooldownService';
import { logger } from '@/shared/utils/logger';
import type { 
  EntityType, 
  AvailabilityResult, 
  AvailabilityStatus 
} from '../domain/PublicIdentity';

export class PublicIdentityService {
  private static policies: Record<EntityType, IdentityPolicy> = {
    business: new BusinessIdentityPolicy(),
    profile: new ProfileIdentityPolicy(),
    professional: new ProfessionalIdentityPolicy(),
  };

  /**
   * Obtém policy para um tipo de entidade
   */
  static getPolicy(entityType: EntityType): IdentityPolicy {
    return this.policies[entityType];
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
  static validateFormat(identifier: string, entityType: EntityType) {
    const policy = this.getPolicy(entityType);
    return policy.validate(identifier);
  }

  /**
   * Verifica disponibilidade completa de identificador
   */
  static async checkAvailability(params: {
    identifier: string;
    entityType: EntityType;
    excludeEntityId?: string;
  }): Promise<AvailabilityResult> {
    const { identifier, entityType, excludeEntityId } = params;
    const policy = this.getPolicy(entityType);

    // 1. Validar formato
    const validation = policy.validate(identifier);
    if (!validation.valid) {
      return {
        status: 'invalid',
        identifier,
        message: validation.error,
      };
    }

    // 2. Verificar reserved
    if (isReservedName(identifier)) {
      return {
        status: 'reserved',
        identifier,
        message: 'Nome reservado pelo sistema',
        suggestion: await this.suggestAlternative(identifier, entityType),
      };
    }

    // 3. Verificar se já existe
    const exists = await this.identifierExists(identifier, entityType, excludeEntityId);
    if (exists) {
      return {
        status: 'taken',
        identifier,
        message: 'Já está em uso',
        suggestion: await this.suggestAlternative(identifier, entityType),
      };
    }

    return {
      status: 'available',
      identifier,
      message: 'Disponível',
    };
  }

  /**
   * Verifica se identificador já existe no banco
   */
  private static async identifierExists(
    identifier: string,
    entityType: EntityType,
    excludeEntityId?: string
  ): Promise<boolean> {
    try {
      const policy = this.getPolicy(entityType);
      const table = entityType === 'business' ? 'business_data' : 
                    entityType === 'profile' ? 'profiles' : 
                    'professional_data';
      const field = policy.identifierField;

      let query = supabase
        .from(table)
        .select('id')
        .ilike(field, identifier)
        .limit(1);

      if (excludeEntityId) {
        const idField = entityType === 'business' ? 'profile_id' : 'id';
        query = query.neq(idField, excludeEntityId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('[PublicIdentityService] Error checking existence:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      logger.error('[PublicIdentityService] identifierExists error:', err);
      return false;
    }
  }

  /**
   * Sugere alternativa para identificador
   */
  private static async suggestAlternative(
    identifier: string,
    entityType: EntityType
  ): Promise<string> {
    const policy = this.getPolicy(entityType);
    const existing = await this.getExistingSimilar(identifier, entityType);
    return policy.suggest(identifier, existing);
  }

  /**
   * Busca identificadores similares existentes
   */
  private static async getExistingSimilar(
    identifier: string,
    entityType: EntityType
  ): Promise<string[]> {
    try {
      const policy = this.getPolicy(entityType);
      const table = entityType === 'business' ? 'business_data' : 
                    entityType === 'profile' ? 'profiles' : 
                    'professional_data';
      const field = policy.identifierField;

      const { data } = await supabase
        .from(table)
        .select(field)
        .ilike(field, `${identifier}%`)
        .limit(20);

      return (data || []).map((d: any) => d[field]).filter(Boolean);
    } catch (err) {
      logger.error('[PublicIdentityService] getExistingSimilar error:', err);
      return [];
    }
  }

  /**
   * Valida se pode trocar identificador (cooldown)
   */
  static async canChangeIdentifier(params: {
    entityType: EntityType;
    entityId: string;
  }) {
    return IdentityCooldownService.canChange(params);
  }
}
```

Continuo com os próximos arquivos?
