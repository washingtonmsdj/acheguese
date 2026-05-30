# Database Infrastructure Layer

**SSOT:** Single Source of Truth para operações de banco de dados  
**Versão:** 1.0.0  
**Sprint:** 1 - Repository Pattern

---

## 📋 Visão Geral

Esta camada implementa o **Repository Pattern** para desacoplar a aplicação do Supabase e centralizar toda lógica de acesso a dados.

### Benefícios
- ✅ **Testabilidade:** Services podem ser testados com mocks
- ✅ **Manutenibilidade:** Queries centralizadas em 1 lugar
- ✅ **Flexibilidade:** Fácil trocar de banco de dados
- ✅ **Consistência:** Tratamento de erros padronizado
- ✅ **DRY:** Elimina 150+ queries duplicadas

---

## 🏗️ Estrutura

```
src/core/infrastructure/database/
├── interfaces/
│   └── IRepository.ts          # Interface base para repositories
├── errors/
│   └── DatabaseError.ts        # Erro customizado para banco
├── query-builders/
│   └── QueryBuilder.ts         # Construtor genérico de queries
├── repositories/
│   ├── BaseRepository.ts       # Implementação base
│   └── ProfileRepository.ts    # Repository de profiles (exemplo)
├── index.ts                    # Barrel de exports
└── README.md                   # Esta documentação
```

---

## 🚀 Como Usar

### 1. Criar um Repository

```typescript
// src/core/infrastructure/database/repositories/MeuRepository.ts
import { BaseRepository } from '../BaseRepository';
import { supabase } from '@/integrations/supabase';

export interface MeuModel {
  id: string;
  name: string;
  // ... outros campos
}

export class MeuRepository extends BaseRepository<MeuModel> {
  protected readonly table = 'minha_tabela';

  constructor() {
    super(supabase);
  }

  // Adicionar métodos específicos do domínio
  async findByName(name: string): Promise<MeuModel | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select('*')
      .eq('name', name)
      .maybeSingle();

    if (error) {
      throw DatabaseError.fromSupabaseError(error, 'findByName', this.table);
    }

    return data as MeuModel | null;
  }
}
```

### 2. Usar no Service

```typescript
// src/core/meu-modulo/services/MeuService.ts
import { MeuRepository } from '@/core/infrastructure/database';

export class MeuService {
  constructor(private repo: MeuRepository) {}

  async getById(id: string) {
    return this.repo.findById(id);
  }

  async getByName(name: string) {
    return this.repo.findByName(name);
  }

  async getAll() {
    return this.repo.findAll();
  }

  async create(data: Partial<MeuModel>) {
    return this.repo.create(data);
  }
}

// Instância singleton
export const meuService = new MeuService(new MeuRepository());
```

### 3. Testar o Service

```typescript
// src/core/meu-modulo/services/__tests__/MeuService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MeuService } from '../MeuService';
import { MeuRepository } from '@/core/infrastructure/database';

describe('MeuService', () => {
  let service: MeuService;
  let mockRepo: MeuRepository;

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByName: vi.fn(),
      create: vi.fn(),
    } as any;

    service = new MeuService(mockRepo);
  });

  it('should get by id', async () => {
    const mockData = { id: '1', name: 'Test' };
    vi.mocked(mockRepo.findById).mockResolvedValue(mockData);

    const result = await service.getById('1');

    expect(result).toEqual(mockData);
    expect(mockRepo.findById).toHaveBeenCalledWith('1');
  });
});
```

---

## 📚 API Reference

### BaseRepository

Todos os repositories herdam estes métodos:

#### Leitura
- `findById(id: string): Promise<T | null>`
- `findByIds(ids: string[]): Promise<T[]>`
- `findAll(filters?, orderBy?): Promise<T[]>`
- `findPaginated(pagination, filters?, orderBy?): Promise<PaginatedResult<T>>`
- `count(filters?): Promise<number>`
- `exists(id: string): Promise<boolean>`

#### Escrita
- `create(data: Partial<T>): Promise<T>`
- `createMany(data: Partial<T>[]): Promise<T[]>`
- `update(id: string, data: Partial<T>): Promise<T>`
- `updateMany(filters, data): Promise<number>`
- `delete(id: string): Promise<void>`
- `deleteMany(filters): Promise<number>`

### Filtros

```typescript
const filters: Filter[] = [
  { field: 'status', operator: 'eq', value: 'active' },
  { field: 'age', operator: 'gte', value: 18 },
  { field: 'city', operator: 'in', value: ['SP', 'RJ'] },
];

const results = await repo.findAll(filters);
```

Operadores disponíveis:
- `eq` - igual
- `neq` - diferente
- `gt` - maior que
- `gte` - maior ou igual
- `lt` - menor que
- `lte` - menor ou igual
- `in` - está em
- `like` - like (case sensitive)
- `ilike` - like (case insensitive)

### Ordenação

```typescript
const orderBy: OrderBy[] = [
  { field: 'created_at', direction: 'desc' },
  { field: 'name', direction: 'asc' },
];

const results = await repo.findAll(undefined, orderBy);
```

### Paginação

```typescript
const pagination: PaginationOptions = {
  page: 1,
  pageSize: 20,
};

const result = await repo.findPaginated(pagination);
// result.data - registros da página
// result.total - total de registros
// result.totalPages - total de páginas
```

---

## ⚠️ Tratamento de Erros

Todos os erros são encapsulados em `DatabaseError`:

```typescript
try {
  const profile = await profileRepo.findById('123');
} catch (error) {
  if (error instanceof DatabaseError) {
    console.log(error.code); // DatabaseErrorCode
    console.log(error.message); // Mensagem amigável
    console.log(error.table); // Tabela afetada
    console.log(error.operation); // Operação que falhou
    
    if (error.isNotFound()) {
      // Tratar registro não encontrado
    }
    
    if (error.isDuplicate()) {
      // Tratar duplicação
    }
  }
}
```

---

## 🎯 Padrões e Boas Práticas

### ✅ DO

```typescript
// ✅ Usar repository no service
class ProfileService {
  constructor(private repo: ProfileRepository) {}
  
  async getProfile(id: string) {
    return this.repo.findById(id);
  }
}

// ✅ Criar métodos específicos do domínio
class ProfileRepository extends BaseRepository<Profile> {
  async findByUsername(username: string) {
    // Implementação específica
  }
}

// ✅ Usar filtros tipados
const filters: Filter[] = [
  repo.createFilter('status', 'eq', 'active'),
];
```

### ❌ DON'T

```typescript
// ❌ Não importar supabase diretamente no service
import { supabase } from '@/integrations/supabase';

class ProfileService {
  async getProfile(id: string) {
    return supabase.from('profiles').select('*').eq('id', id);
  }
}

// ❌ Não duplicar queries
// Use os métodos do BaseRepository

// ❌ Não expor cliente do banco
class MyRepository extends BaseRepository<T> {
  getClient() {
    return this.client; // ❌ Não fazer isso
  }
}
```

---

## 📊 Métricas de Sucesso

### Antes da Refatoração
- ❌ 200+ imports diretos do Supabase
- ❌ 150+ queries duplicadas
- ❌ 0% de cobertura de testes em services
- ❌ Impossível trocar de banco

### Depois da Refatoração
- ✅ 0 imports diretos do Supabase em services
- ✅ 15 métodos genéricos no QueryBuilder
- ✅ >70% de cobertura de testes
- ✅ Fácil trocar de banco (só mudar adapter)

---

## 🔄 Migração Gradual

### Fase 1: Criar Repository (✅ Completo)
- [x] Interfaces
- [x] Errors
- [x] QueryBuilder
- [x] BaseRepository
- [x] ProfileRepository (piloto)

### Fase 2: Refatorar Services (Em Andamento)
- [ ] ProfileService
- [ ] MobilityService
- [ ] BusinessService
- [ ] ClassifiedsService

### Fase 3: Remover Imports Diretos
- [ ] Buscar e remover imports do Supabase
- [ ] Atualizar para usar repositories
- [ ] Validar testes

---

## 🆘 Troubleshooting

### Erro: "Cannot find module '@/core/infrastructure/database'"

**Solução:** Verificar se o path alias está configurado no `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Erro: "Table 'xxx' does not exist"

**Solução:** Verificar se a propriedade `table` está definida corretamente no repository.

### Erro: Testes falhando com "supabase is not defined"

**Solução:** Mockar o repository, não o Supabase:
```typescript
const mockRepo = {
  findById: vi.fn().mockResolvedValue(mockData),
} as any;
```

---

## 📞 Suporte

- **Documentação:** Este arquivo
- **Exemplos:** Ver `ProfileRepository.ts`
- **Dúvidas:** Abrir issue ou falar com Tech Lead

---

**Última atualização:** 30/05/2026  
**Próxima revisão:** Após Sprint 2
