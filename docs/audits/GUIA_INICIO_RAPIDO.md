# Guia de Início Rápido - Refatoração Estrutural

**Data:** 30 de Maio de 2026  
**Objetivo:** Começar a refatoração HOJE

---

## 🚀 Começando AGORA

### Passo 1: Ler Documentação (30 minutos)
1. ✅ Ler `RESUMO_EXECUTIVO_AUDITORIA.md` (5 min)
2. ✅ Ler `AUDITORIA_TECNICA_ESTRUTURAL_2026.md` - Seção "Problemas Críticos" (10 min)
3. ✅ Ler `EXEMPLOS_REFATORACAO.md` - Exemplo 1 (Desacoplamento) (15 min)

### Passo 2: Setup do Ambiente (1 hora)
```bash
# 1. Criar branch de refatoração
git checkout -b refactor/architecture-2026

# 2. Instalar dependências (se necessário)
npm install

# 3. Rodar testes para baseline
npm run test
npm run test:e2e

# 4. Criar estrutura de pastas
mkdir -p src/core/infrastructure/database/{interfaces,repositories,adapters}
mkdir -p src/core/infrastructure/database/query-builders
```

### Passo 3: Primeira Refatoração (2-3 horas)
Vamos refatorar o módulo `profiles` como piloto.

---

## 📝 Checklist Sprint 1 - Dia 1

### Manhã (4 horas)

#### ✅ Tarefa 1: Criar Interfaces (1 hora)
```typescript
// src/core/infrastructure/database/interfaces/IRepository.ts
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findByIds(ids: string[]): Promise<T[]>;
  findAll(filters?: Filter[]): Promise<T[]>;
  count(filters?: Filter[]): Promise<number>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface Filter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
  value: any;
}
```

**Commit:** `feat: add repository interfaces`

---

#### ✅ Tarefa 2: Criar BaseRepository (1.5 horas)
```typescript
// src/core/infrastructure/database/repositories/BaseRepository.ts
import { SupabaseClient } from '@supabase/supabase-js';
import { IRepository, Filter } from '../interfaces/IRepository';

export abstract class BaseRepository<T> implements IRepository<T> {
  protected abstract table: string;
  
  constructor(protected client: SupabaseClient) {}

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw new DatabaseError(error);
    return data;
  }

  async findByIds(ids: string[]): Promise<T[]> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .in('id', ids);
    
    if (error) throw new DatabaseError(error);
    return data || [];
  }

  async count(filters?: Filter[]): Promise<number> {
    let query = this.client
      .from(this.table)
      .select('id', { count: 'exact', head: true });

    if (filters) {
      filters.forEach(f => {
        query = this.applyFilter(query, f);
      });
    }

    const { count, error } = await query;
    if (error) throw new DatabaseError(error);
    return count || 0;
  }

  private applyFilter(query: any, filter: Filter) {
    switch (filter.operator) {
      case 'eq': return query.eq(filter.field, filter.value);
      case 'neq': return query.neq(filter.field, filter.value);
      case 'gt': return query.gt(filter.field, filter.value);
      case 'gte': return query.gte(filter.field, filter.value);
      case 'lt': return query.lt(filter.field, filter.value);
      case 'lte': return query.lte(filter.field, filter.value);
      case 'in': return query.in(filter.field, filter.value);
      default: return query;
    }
  }

  // Implementar outros métodos...
}

// src/core/infrastructure/database/errors/DatabaseError.ts
export class DatabaseError extends Error {
  constructor(public originalError: any) {
    super(originalError.message || 'Database error');
    this.name = 'DatabaseError';
  }
}
```

**Commit:** `feat: add base repository implementation`

---

#### ✅ Tarefa 3: Criar ProfileRepository (1 hora)
```typescript
// src/core/infrastructure/database/repositories/ProfileRepository.ts
import { BaseRepository } from './BaseRepository';
import { supabase } from '@/integrations/supabase';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  username: string;
  avatar_url?: string;
  // ... outros campos
}

export class ProfileRepository extends BaseRepository<Profile> {
  protected table = 'profiles';

  constructor() {
    super(supabase);
  }

  // Métodos específicos de Profile
  async findByUsername(username: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('username', username)
      .maybeSingle();
    
    if (error) throw new DatabaseError(error);
    return data;
  }

  async findByUserId(userId: string): Promise<Profile[]> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw new DatabaseError(error);
    return data || [];
  }
}

// src/core/infrastructure/database/repositories/index.ts
export { ProfileRepository } from './ProfileRepository';
export type { Profile } from './ProfileRepository';
```

**Commit:** `feat: add profile repository`

---

### Tarde (4 horas)

#### ✅ Tarefa 4: Refatorar ProfileService (2 horas)
```typescript
// src/core/profiles/services/ProfileService.ts
import { ProfileRepository, Profile } from '@/core/infrastructure/database/repositories';

export class ProfileService {
  constructor(private repo: ProfileRepository) {}

  async getProfileById(id: string): Promise<Profile | null> {
    return this.repo.findById(id);
  }

  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    return this.repo.findByIds(ids);
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    return this.repo.findByUsername(username);
  }

  async getProfilesByUserId(userId: string): Promise<Profile[]> {
    return this.repo.findByUserId(userId);
  }

  async getTotalProfilesCount(): Promise<number> {
    return this.repo.count();
  }

  async createProfile(data: Partial<Profile>): Promise<Profile> {
    return this.repo.create(data);
  }

  async updateProfile(id: string, data: Partial<Profile>): Promise<Profile> {
    return this.repo.update(id, data);
  }
}

// src/core/profiles/services/index.ts
import { ProfileRepository } from '@/core/infrastructure/database/repositories';
import { ProfileService } from './ProfileService';

export const profileService = new ProfileService(
  new ProfileRepository()
);
```

**Commit:** `refactor: decouple ProfileService from Supabase`

---

#### ✅ Tarefa 5: Criar Testes (1.5 horas)
```typescript
// src/core/profiles/services/__tests__/ProfileService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileService } from '../ProfileService';
import { ProfileRepository } from '@/core/infrastructure/database/repositories';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockRepo: ProfileRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByIds: vi.fn(),
      findByUsername: vi.fn(),
      count: vi.fn(),
    } as any;

    service = new ProfileService(mockRepo);
  });

  describe('getProfileById', () => {
    it('should return profile when found', async () => {
      const mockProfile = { id: '1', name: 'Test' };
      vi.mocked(mockRepo.findById).mockResolvedValue(mockProfile as any);

      const result = await service.getProfileById('1');

      expect(result).toEqual(mockProfile);
      expect(mockRepo.findById).toHaveBeenCalledWith('1');
    });

    it('should return null when not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      const result = await service.getProfileById('999');

      expect(result).toBeNull();
    });
  });

  describe('getTotalProfilesCount', () => {
    it('should return count from repository', async () => {
      vi.mocked(mockRepo.count).mockResolvedValue(42);

      const result = await service.getTotalProfilesCount();

      expect(result).toBe(42);
      expect(mockRepo.count).toHaveBeenCalled();
    });
  });
});
```

**Commit:** `test: add ProfileService unit tests`

---

#### ✅ Tarefa 6: Atualizar Imports (30 minutos)
Buscar e substituir todos os imports de ProfileService no projeto:

```bash
# Buscar arquivos que importam ProfileService
grep -r "from.*ProfileService" src/

# Atualizar imports para usar a nova instância
# Antes:
import { ProfileService } from '@/core/profiles/services/ProfileService';
const service = new ProfileService();

# Depois:
import { profileService } from '@/core/profiles/services';
// Usar profileService diretamente
```

**Commit:** `refactor: update ProfileService imports`

---

## 📊 Checklist de Validação

### Antes de Commitar
- [ ] Código compila sem erros
- [ ] Testes passam (`npm run test`)
- [ ] Testes E2E passam (`npm run test:e2e`)
- [ ] Lint passa (`npm run lint`)
- [ ] TypeCheck passa (`npm run typecheck`)

### Antes de Fazer PR
- [ ] Todos os commits seguem padrão conventional
- [ ] Documentação atualizada
- [ ] Cobertura de testes >70%
- [ ] Code review interno feito
- [ ] Testado manualmente

---

## 🎯 Métricas de Sucesso - Dia 1

### Objetivos
- ✅ Criar estrutura de Repository
- ✅ Refatorar 1 módulo (profiles)
- ✅ Criar testes unitários
- ✅ Documentar padrão

### Resultados Esperados
- 0 imports diretos do Supabase em ProfileService
- >70% cobertura de testes em ProfileService
- Documentação do padrão Repository criada
- Exemplo funcionando para replicar

---

## 📅 Próximos Dias

### Dia 2: Expandir para Mobility
- Criar MobilityRepository
- Refatorar MobilityService
- Testes

### Dia 3: Expandir para Business
- Criar BusinessRepository
- Refatorar BusinessService
- Testes

### Dia 4: Expandir para Classifieds
- Criar ClassifiedsRepository
- Refatorar ClassifiedsService
- Testes

### Dia 5: Review e Ajustes
- Code review
- Ajustes baseados em feedback
- Documentação final da Sprint 1

---

## 🆘 Troubleshooting

### Problema: Testes falhando
**Solução:** Verificar se mocks estão corretos
```typescript
// Mock correto do repository
const mockRepo = {
  findById: vi.fn().mockResolvedValue(mockData),
  // ... outros métodos
} as any;
```

### Problema: TypeScript reclamando
**Solução:** Verificar se interfaces estão corretas
```typescript
// Interface deve ter todos os métodos
export interface IProfileRepository extends IRepository<Profile> {
  findByUsername(username: string): Promise<Profile | null>;
}
```

### Problema: Imports circulares
**Solução:** Usar barrel apenas no final
```typescript
// ❌ Não fazer
export * from './ProfileRepository';

// ✅ Fazer
export { ProfileRepository } from './ProfileRepository';
export type { Profile } from './ProfileRepository';
```

---

## 📚 Recursos

### Documentação
- [Auditoria Completa](./AUDITORIA_TECNICA_ESTRUTURAL_2026.md)
- [Exemplos de Refatoração](./EXEMPLOS_REFATORACAO.md)
- [Lista de Arquivos Problemáticos](./LISTA_ARQUIVOS_PROBLEMATICOS.md)

### Padrões
- Repository Pattern
- Dependency Injection
- Clean Architecture

### Ferramentas
- Vitest (testes)
- ESLint (lint)
- TypeScript (type checking)

---

## ✅ Checklist Final do Dia

- [ ] Estrutura de Repository criada
- [ ] ProfileRepository implementado
- [ ] ProfileService refatorado
- [ ] Testes criados e passando
- [ ] Documentação atualizada
- [ ] Commits feitos
- [ ] PR criado (se aplicável)

---

**Próximo Passo:** Começar Dia 2 - Refatorar MobilityService

**Dúvidas?** Consultar `EXEMPLOS_REFATORACAO.md` ou pedir ajuda ao tech lead.
