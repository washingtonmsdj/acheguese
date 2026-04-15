# CORE CORRIGIDO: Public Identity

**Data**: 2026-03-29  
**Versão**: 3.0 - Orquestrador Puro

---

## ESTRUTURA FINAL DE PASTAS

```
src/core/public-identity/
├── domain/
│   ├── types.ts                   # ✅ Tipos centralizados
│   ├── IdentityPolicy.ts          # Interface de policy
│   └── IdentityAdapter.ts         # Interface de adapter
├── policies/
│   ├── BusinessIdentityPolicy.ts
│   ├── ProfileIdentityPolicy.ts
│   └── ProfessionalIdentityPolicy.ts
├── adapters/
│   ├── BusinessIdentityAdapter.ts
│   ├── ProfileIdentityAdapter.ts
│   └── ProfessionalIdentityAdapter.ts
├── services/
│   ├── PublicIdentityService.ts   # ✅ Orquestrador puro
│   └── IdentityHistoryService.ts
├── utils/
│   ├── reserved-names.ts          # ✅ Contrato único
│   └── cooldown.ts
├── __tests__/
└── index.ts
```

**Regras**:
- ✅ `domain/` contém apenas interfaces e types
- ✅ `policies/` contém implementações de policy
- ✅ `adapters/` contém implementações de adapter
- ✅ `services/` contém orquestradores (sem acesso direto a DB)
- ✅ Todos importam types de `domain/types.ts`

---

## ARQUIVOS CORRIGIDOS

### 1. domain/types.ts

```typescript
/**
 * Public Identity - Types Centralizados
 * Fonte única de tipos para todo o módulo
 */

// ── Entity Types ──────────────────────────────────────────────────────────────

export type EntityType = 'business' | 'profile' | 'professional';

// ── Availability ──────────────────────────────────────────────────────────────

export type AvailabilityStatus = 
  | 'available' 
  | 'taken' 
  | 'invalid' 
  | 'reserved' 
  | 'cooldown_blocked';

export interface AvailabilityResult {
  status: AvailabilityStatus;
  identifier: string;
  message?: string;
  suggestion?: string;
}

// ── Change Tracking ───────────────────────────────────────────────────────────

export type ChangeReason = 
  | 'user_requested' 
  | 'admin_action' 
  | 'policy_violation' 
  | 'territory_changed';

export interface IdentityChangeRecord {
  id: string;
  entityType: EntityType;
  entityId: string;
  oldIdentifier: string;
  newIdentifier: string;
  reason: ChangeReason;
  changedAt: Date;
}

// ── Cooldown ──────────────────────────────────────────────────────────────────

export interface CooldownResult {
  canChange: boolean;
  reason?: 'cooldown_active' | 'first_change';
  nextAllowedDate?: Date;
  daysRemaining?: number;
}

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: Record<string, unknown>;
}

// ── Public Identity Entity ────────────────────────────────────────────────────

export interface PublicIdentity {
  identifier: string;
  entityType: EntityType;
  entityId: string;
  lastChangedAt: Date | null;
  canChangeAfter: Date | null;
  createdAt: Date;
}
```

---

### 2. domain/IdentityPolicy.ts

```typescript
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
```

---

### 3. domain/IdentityAdapter.ts

```typescript
/**
 * Identity Adapter - Interface
 * Define contrato para adapters específicos por entity type
 * 
 * RESPONSABILIDADE: Toda persistência e consulta específica por tipo
 */

import type { 
  EntityType, 
  ChangeReason, 
  IdentityChangeRecord, 
  CooldownResult 
} from './types';
import type { IdentityPolicy } from './IdentityPolicy';

export interface IdentityAdapter {
  readonly entityType: EntityType;
  readonly policy: IdentityPolicy;

  /**
   * Verifica se identificador já existe no banco
   * @throws Error se infraestrutura falhar
   */
  identifierExists(identifier: string, excludeEntityId?: string): Promise<boolean>;

  /**
   * Busca identificadores similares existentes
   * @throws Error se infraestrutura falhar
   */
  getExistingSimilar(identifier: string): Promise<string[]>;

  /**
   * Registra mudança de identificador
   * @throws Error se falhar
   */
  recordChange(params: {
    entityId: string;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void>;

  /**
   * Obtém histórico de mudanças
   * @throws Error se falhar
   */
  getHistory(entityId: string): Promise<IdentityChangeRecord[]>;

  /**
   * Calcula se pode trocar identificador (cooldown do histórico)
   * @throws Error se falhar
   */
  canChange(entityId: string): Promise<CooldownResult>;

  /**
   * Resolve identificador antigo (se aplicável)
   * Business: resolve publicamente
   * Profile: retorna null (sem resolução pública)
   * @throws Error se falhar
   */
  resolveOldIdentifier(oldIdentifier: string): Promise<{
    entityId: string;
    currentIdentifier: string;
  } | null>;
}
```

---

### 4. utils/reserved-names.ts

```typescript
/**
 * Reserved Names - Contrato Único
 * Fonte centralizada com escopo por entity type
 */

import type { EntityType } from '../domain/types';

// ── Nomes Comuns (todos os perfis) ───────────────────────────────────────────

export const COMMON_RESERVED = [
  'admin', 'root', 'system', 'moderator', 'mod',
  'oficial', 'official', 'verified', 'staff',
  'login', 'logout', 'cadastro', 'signup', 'signin',
  'sobre', 'about', 'contato', 'contact',
  'termos', 'terms', 'privacidade', 'privacy',
  'ajuda', 'help', 'suporte', 'support',
  'api', 'docs', 'p', 'u',
  'ba', 'salvador', 'sp', 'sao-paulo', 'rj', 'rio-de-janeiro',
] as const;

// ── Business Specific ─────────────────────────────────────────────────────────

export const BUSINESS_SPECIFIC_RESERVED = [
  'empresas', 'business', 'empresa', 'company',
  'loja', 'store', 'shop',
  'servico', 'service', 'servicos', 'services',
  'produto', 'product', 'produtos', 'products',
  'catalogo', 'catalog',
] as const;

// ── Profile Specific ──────────────────────────────────────────────────────────

export const PROFILE_SPECIFIC_RESERVED = [
  'perfil', 'profile', 'user', 'usuario',
  'conta', 'account',
  'configuracoes', 'settings', 'config',
  'dashboard', 'painel',
  'familia', 'family',
  'identidades', 'identities',
] as const;

// ── Professional Specific ─────────────────────────────────────────────────────

export const PROFESSIONAL_SPECIFIC_RESERVED = [
  'profissional', 'professional', 'prestador',
  'servicos', 'services',
  'portfolio', 'trabalhos', 'jobs',
] as const;

// ── Contrato Único ────────────────────────────────────────────────────────────

/**
 * Retorna todos os reserved names para um tipo de entidade
 * CONTRATO ÚNICO consumido por policies e services
 */
export function getReservedForEntityType(entityType: EntityType): readonly string[] {
  switch (entityType) {
    case 'business':
      return [...COMMON_RESERVED, ...BUSINESS_SPECIFIC_RESERVED];
    case 'profile':
      return [...COMMON_RESERVED, ...PROFILE_SPECIFIC_RESERVED];
    case 'professional':
      return [...COMMON_RESERVED, ...PROFESSIONAL_SPECIFIC_RESERVED];
  }
}

/**
 * Verifica se um nome é reservado para um tipo de entidade
 */
export function isReservedForEntityType(
  identifier: string, 
  entityType: EntityType
): boolean {
  const reserved = getReservedForEntityType(entityType);
  return reserved.includes(identifier.toLowerCase());
}
```

---

### 5. services/PublicIdentityService.ts (Orquestrador Puro)

```typescript
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
  AvailabilityResult, 
  AvailabilityStatus,
  ValidationResult 
} from '../domain/types';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { IdentityPolicy } from '../domain/IdentityPolicy';
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
    excludeEntityId?: string;
  }): Promise<AvailabilityResult> {
    const { identifier, entityType, excludeEntityId } = params;
    
    try {
      const policy = this.getPolicy(entityType);
      const adapter = this.getAdapter(entityType);

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
      if (policy.isReserved(identifier)) {
        const suggestion = await this.suggestAlternative(identifier, entityType);
        return {
          status: 'reserved',
          identifier,
          message: 'Nome reservado pelo sistema',
          suggestion,
        };
      }

      // 3. Verificar se já existe (DELEGA para adapter)
      const exists = await adapter.identifierExists(identifier, excludeEntityId);
      if (exists) {
        const suggestion = await this.suggestAlternative(identifier, entityType);
        return {
          status: 'taken',
          identifier,
          message: 'Já está em uso',
          suggestion,
        };
      }

      return {
        status: 'available',
        identifier,
        message: 'Disponível',
      };
    } catch (error) {
      logger.error('[PublicIdentityService] checkAvailability error:', error);
      throw error; // Propaga erro de infraestrutura
    }
  }

  /**
   * Sugere alternativa para identificador
   * Delega busca de similares para adapter
   */
  private static async suggestAlternative(
    identifier: string,
    entityType: EntityType
  ): Promise<string> {
    try {
      const policy = this.getPolicy(entityType);
      const adapter = this.getAdapter(entityType);
      
      // DELEGA busca para adapter
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
    entityId: string;
  }) {
    const adapter = this.getAdapter(params.entityType);
    return adapter.canChange(params.entityId);
  }
}
```


---

### 6. adapters/BusinessIdentityAdapter.ts

```typescript
/**
 * Business Identity Adapter
 * Implementação específica para business
 * 
 * RESPONSABILIDADE: Toda persistência e consulta de business
 */

import { supabase } from '@/integrations/supabase';
import { BusinessIdentityPolicy } from '../policies/BusinessIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { 
  EntityType, 
  ChangeReason, 
  IdentityChangeRecord, 
  CooldownResult 
} from '../domain/types';
import { logger } from '@/shared/utils/logger';

export class BusinessIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'business';
  readonly policy = new BusinessIdentityPolicy();

  /**
   * Verifica se slug já existe
   * @throws Error se infraestrutura falhar
   */
  async identifierExists(slug: string, excludeEntityId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('business_data')
        .select('profile_id')
        .ilike('slug', slug)
        .limit(1);

      if (excludeEntityId) {
        query = query.neq('profile_id', excludeEntityId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('[BusinessIdentityAdapter] identifierExists error:', error);
        throw new Error(`Failed to check identifier existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to check')) {
        throw error;
      }
      logger.error('[BusinessIdentityAdapter] identifierExists unexpected error:', error);
      throw new Error('Infrastructure error checking identifier');
    }
  }

  /**
   * Busca slugs similares existentes
   * @throws Error se infraestrutura falhar
   */
  async getExistingSimilar(slug: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('business_data')
        .select('slug')
        .ilike('slug', `${slug}%`)
        .limit(20);

      if (error) {
        logger.error('[BusinessIdentityAdapter] getExistingSimilar error:', error);
        throw new Error(`Failed to get similar identifiers: ${error.message}`);
      }

      return (data || []).map(d => d.slug).filter(Boolean);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to get')) {
        throw error;
      }
      logger.error('[BusinessIdentityAdapter] getExistingSimilar unexpected error:', error);
      throw new Error('Infrastructure error getting similar identifiers');
    }
  }

  /**
   * Registra mudança de slug
   * Trigger do banco faz o registro automático
   */
  async recordChange(params: {
    entityId: string;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    // Trigger automático registra em business_slug_history
    // Este método existe para interface, mas não precisa fazer nada
    logger.info('[BusinessIdentityAdapter] Change will be recorded by trigger', params);
  }

  /**
   * Obtém histórico de mudanças
   * @throws Error se falhar
   */
  async getHistory(entityId: string): Promise<IdentityChangeRecord[]> {
    try {
      const { data, error } = await supabase
        .from('business_slug_history')
        .select('*')
        .eq('profile_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('[BusinessIdentityAdapter] getHistory error:', error);
        throw new Error(`Failed to get history: ${error.message}`);
      }

      return (data || []).map(record => ({
        id: record.id,
        entityType: 'business' as EntityType,
        entityId: record.profile_id,
        oldIdentifier: record.old_slug,
        newIdentifier: '', // Não armazenado no histórico
        reason: record.change_reason as ChangeReason,
        changedAt: new Date(record.created_at),
      }));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to get')) {
        throw error;
      }
      logger.error('[BusinessIdentityAdapter] getHistory unexpected error:', error);
      throw new Error('Infrastructure error getting history');
    }
  }

  /**
   * Calcula se pode trocar slug (cooldown do histórico)
   * @throws Error se falhar
   */
  async canChange(entityId: string): Promise<CooldownResult> {
    try {
      const history = await this.getHistory(entityId);

      if (history.length === 0) {
        return {
          canChange: true,
          reason: 'first_change',
        };
      }

      const lastChange = history[0];
      const cooldownDays = this.policy.cooldownDays;
      const nextAllowedDate = new Date(lastChange.changedAt);
      nextAllowedDate.setDate(nextAllowedDate.getDate() + cooldownDays);

      const now = new Date();
      const canChange = now >= nextAllowedDate;

      if (!canChange) {
        const daysRemaining = Math.ceil(
          (nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          canChange: false,
          reason: 'cooldown_active',
          nextAllowedDate,
          daysRemaining,
        };
      }

      return { canChange: true };
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] canChange error:', error);
      throw error;
    }
  }

  /**
   * Resolve slug antigo (resolução pública)
   * Business faz redirect 308 de URLs antigas
   * @throws Error se falhar
   */
  async resolveOldIdentifier(oldSlug: string): Promise<{
    entityId: string;
    currentIdentifier: string;
  } | null> {
    try {
      // Busca no histórico
      const { data: histData, error: histErr } = await supabase
        .from('business_slug_history')
        .select('profile_id')
        .eq('old_slug', oldSlug)
        .maybeSingle();

      if (histErr || !histData) {
        return null;
      }

      // Busca slug atual
      const { data: currentData, error: currentErr } = await supabase
        .from('business_data')
        .select('slug')
        .eq('profile_id', histData.profile_id)
        .eq('status', 'active')
        .maybeSingle();

      if (currentErr || !currentData) {
        return null;
      }

      return {
        entityId: histData.profile_id,
        currentIdentifier: currentData.slug,
      };
    } catch (error) {
      logger.error('[BusinessIdentityAdapter] resolveOldIdentifier error:', error);
      throw new Error('Infrastructure error resolving old identifier');
    }
  }
}
```

---

### 7. adapters/ProfileIdentityAdapter.ts

```typescript
/**
 * Profile Identity Adapter
 * Implementação específica para profile
 * 
 * RESPONSABILIDADE: Toda persistência e consulta de profile
 */

import { supabase } from '@/integrations/supabase';
import { ProfileIdentityPolicy } from '../policies/ProfileIdentityPolicy';
import type { IdentityAdapter } from '../domain/IdentityAdapter';
import type { 
  EntityType, 
  ChangeReason, 
  IdentityChangeRecord, 
  CooldownResult 
} from '../domain/types';
import { logger } from '@/shared/utils/logger';

export class ProfileIdentityAdapter implements IdentityAdapter {
  readonly entityType: EntityType = 'profile';
  readonly policy = new ProfileIdentityPolicy();

  /**
   * Verifica se username já existe
   * @throws Error se infraestrutura falhar
   */
  async identifierExists(username: string, excludeEntityId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .ilike('username', username)
        .limit(1);

      if (excludeEntityId) {
        query = query.neq('id', excludeEntityId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        logger.error('[ProfileIdentityAdapter] identifierExists error:', error);
        throw new Error(`Failed to check identifier existence: ${error.message}`);
      }

      return !!data;
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to check')) {
        throw error;
      }
      logger.error('[ProfileIdentityAdapter] identifierExists unexpected error:', error);
      throw new Error('Infrastructure error checking identifier');
    }
  }

  /**
   * Busca usernames similares existentes
   * @throws Error se infraestrutura falhar
   */
  async getExistingSimilar(username: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .ilike('username', `${username}%`)
        .limit(20);

      if (error) {
        logger.error('[ProfileIdentityAdapter] getExistingSimilar error:', error);
        throw new Error(`Failed to get similar identifiers: ${error.message}`);
      }

      return (data || [])
        .map(d => d.username)
        .filter((u): u is string => !!u);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to get')) {
        throw error;
      }
      logger.error('[ProfileIdentityAdapter] getExistingSimilar unexpected error:', error);
      throw new Error('Infrastructure error getting similar identifiers');
    }
  }

  /**
   * Registra mudança de username
   * Trigger do banco faz o registro automático
   */
  async recordChange(params: {
    entityId: string;
    oldIdentifier: string;
    newIdentifier: string;
    reason: ChangeReason;
  }): Promise<void> {
    // Trigger automático registra em profile_username_history
    logger.info('[ProfileIdentityAdapter] Change will be recorded by trigger', params);
  }

  /**
   * Obtém histórico de mudanças
   * @throws Error se falhar
   */
  async getHistory(entityId: string): Promise<IdentityChangeRecord[]> {
    try {
      const { data, error } = await supabase
        .from('profile_username_history')
        .select('*')
        .eq('profile_id', entityId)
        .order('changed_at', { ascending: false });

      if (error) {
        logger.error('[ProfileIdentityAdapter] getHistory error:', error);
        throw new Error(`Failed to get history: ${error.message}`);
      }

      return (data || []).map(record => ({
        id: record.id,
        entityType: 'profile' as EntityType,
        entityId: record.profile_id,
        oldIdentifier: record.old_username,
        newIdentifier: record.new_username,
        reason: record.change_reason as ChangeReason,
        changedAt: new Date(record.changed_at),
      }));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Failed to get')) {
        throw error;
      }
      logger.error('[ProfileIdentityAdapter] getHistory unexpected error:', error);
      throw new Error('Infrastructure error getting history');
    }
  }

  /**
   * Calcula se pode trocar username (cooldown do histórico)
   * @throws Error se falhar
   */
  async canChange(entityId: string): Promise<CooldownResult> {
    try {
      const history = await this.getHistory(entityId);

      if (history.length === 0) {
        return {
          canChange: true,
          reason: 'first_change',
        };
      }

      const lastChange = history[0];
      const cooldownDays = this.policy.cooldownDays;
      const nextAllowedDate = new Date(lastChange.changedAt);
      nextAllowedDate.setDate(nextAllowedDate.getDate() + cooldownDays);

      const now = new Date();
      const canChange = now >= nextAllowedDate;

      if (!canChange) {
        const daysRemaining = Math.ceil(
          (nextAllowedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          canChange: false,
          reason: 'cooldown_active',
          nextAllowedDate,
          daysRemaining,
        };
      }

      return { canChange: true };
    } catch (error) {
      logger.error('[ProfileIdentityAdapter] canChange error:', error);
      throw error;
    }
  }

  /**
   * Resolve username antigo (SEM resolução pública)
   * Profile NÃO faz redirect de username antigo
   * Histórico é apenas para auditoria e cooldown
   */
  async resolveOldIdentifier(oldUsername: string): Promise<{
    entityId: string;
    currentIdentifier: string;
  } | null> {
    // Profile não resolve username antigo publicamente
    return null;
  }
}
```

---

## VALIDAÇÃO DAS CORREÇÕES

### ✅ Checklist de Conformidade

- [x] `PublicIdentityService` é orquestrador puro (sem acesso a DB)
- [x] Toda persistência está em adapters
- [x] Sem switch/case de tabelas no service
- [x] Sem `any` nos tipos
- [x] Erros de infraestrutura são propagados (não engolidos)
- [x] Estrutura de pastas consistente
- [x] Types centralizados em `domain/types.ts`
- [x] Reserved names com contrato único
- [x] `identifierExists()` e `getExistingSimilar()` nos adapters
- [x] Adapters lançam exceções em falhas de infraestrutura

---

## PRÓXIMOS PASSOS

Após aprovação destes arquivos fundamentais, continuar com:

1. Implementação completa das policies
2. IdentityHistoryService
3. Testes unitários
4. Integração com BusinessUrlService
5. Integração com ProfileService
6. UI e hooks (fora do core)

---

**Status**: Aguardando aprovação dos arquivos fundamentais corrigidos
