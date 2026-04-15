# CORREÇÕES V3: Orquestrador Puro

**Data**: 2026-03-29  
**Versão**: 3.0 - Core Fundamentais Corrigidos

---

## PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### ❌ Problema 1: PublicIdentityService virando God Service

**Sintoma**:
```typescript
// ❌ ERRADO: Service acessando Supabase diretamente
const { data } = await supabase
  .from(table)  // Switch/case de tabela
  .select(field) // Switch/case de campo
```

**Correção**:
```typescript
// ✅ CORRETO: Service delega para adapter
const exists = await adapter.identifierExists(identifier, excludeEntityId);
```

---

### ❌ Problema 2: Estrutura de pastas inconsistente

**Antes**:
```
domain/
  ├── PublicIdentity.ts
  ├── IdentityPolicy.ts
  ├── BusinessIdentityPolicy.ts  ❌ Implementação em domain/
  └── ProfileIdentityPolicy.ts   ❌ Implementação em domain/
```

**Depois**:
```
domain/
  ├── types.ts                   ✅ Tipos centralizados
  ├── IdentityPolicy.ts          ✅ Interface
  └── IdentityAdapter.ts         ✅ Interface
policies/
  ├── BusinessIdentityPolicy.ts  ✅ Implementação
  └── ProfileIdentityPolicy.ts   ✅ Implementação
adapters/
  ├── BusinessIdentityAdapter.ts ✅ Implementação
  └── ProfileIdentityAdapter.ts  ✅ Implementação
```

---

### ❌ Problema 3: Types espalhados

**Antes**:
- `EntityType` em `IdentityPolicy.ts`
- `AvailabilityStatus` em `PublicIdentity.ts`
- `ChangeReason` em `IdentityAdapter.ts`

**Depois**:
```typescript
// ✅ CORRETO: Tudo em domain/types.ts
export type EntityType = 'business' | 'profile' | 'professional';
export type AvailabilityStatus = 'available' | 'taken' | ...;
export type ChangeReason = 'user_requested' | ...;
```

---

### ❌ Problema 4: Reserved names sem contrato único

**Antes**:
```typescript
// utils/reserved-names.ts
export const RESERVED_NAMES = [...]; // Lista plana

// Policies não sabiam como usar
```

**Depois**:
```typescript
// ✅ CORRETO: Contrato único
export function getReservedForEntityType(entityType: EntityType): readonly string[];
export function isReservedForEntityType(identifier: string, entityType: EntityType): boolean;

// Policies usam o contrato
class BusinessIdentityPolicy {
  private readonly reservedNames = getReservedForEntityType('business');
}
```

---

### ❌ Problema 5: identifierExists() no service

**Antes**:
```typescript
// ❌ ERRADO: Service conhece tabelas
class PublicIdentityService {
  private static async identifierExists(identifier, entityType) {
    const table = entityType === 'business' ? 'business_data' : 'profiles';
    const field = entityType === 'business' ? 'slug' : 'username';
    const { data } = await supabase.from(table).select(field)...
  }
}
```

**Depois**:
```typescript
// ✅ CORRETO: Adapter conhece tabelas
class BusinessIdentityAdapter {
  async identifierExists(slug: string, excludeEntityId?: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('business_data')
      .select('profile_id')
      .ilike('slug', slug)...
    
    if (error) throw new Error(...); // Não engole erro
    return !!data;
  }
}

// Service apenas delega
class PublicIdentityService {
  static async checkAvailability(...) {
    const adapter = this.getAdapter(entityType);
    const exists = await adapter.identifierExists(identifier);
  }
}
```

---

### ❌ Problema 6: Uso de `any`

**Antes**:
```typescript
details?: Record<string, any>  ❌
```

**Depois**:
```typescript
details?: Record<string, unknown>  ✅
```

---

### ❌ Problema 7: Engolir erros de infraestrutura

**Antes**:
```typescript
// ❌ ERRADO: Retorna false em erro
try {
  const { data, error } = await supabase...
  if (error) {
    logger.error(error);
    return false; // Sistema assume que está livre!
  }
} catch (err) {
  return false; // Perigoso!
}
```

**Depois**:
```typescript
// ✅ CORRETO: Propaga erro
try {
  const { data, error } = await supabase...
  if (error) {
    logger.error(error);
    throw new Error(`Failed to check: ${error.message}`);
  }
  return !!data;
} catch (error) {
  if (error instanceof Error && error.message.startsWith('Failed')) {
    throw error; // Propaga erro conhecido
  }
  throw new Error('Infrastructure error'); // Encapsula erro desconhecido
}
```

---

## ARQUITETURA FINAL CORRIGIDA

### Hierarquia de Responsabilidades

```
PublicIdentityService (orquestrador)
    ↓ delega
Adapters (persistência específica)
    ↓ usa
Policies (regras de formato)
    ↓ consulta
Reserved Names (contrato único)
```

### Fluxo de Disponibilidade

```
1. UI chama PublicIdentityService.checkAvailability()
2. Service valida formato via Policy
3. Service verifica reserved via Policy
4. Service delega existência para Adapter
5. Adapter consulta banco específico
6. Adapter retorna resultado ou lança exceção
7. Service retorna AvailabilityResult
```

### Separação de Concerns

| Camada | Responsabilidade | Acesso a DB |
|--------|------------------|-------------|
| Service | Orquestração | ❌ Não |
| Adapter | Persistência | ✅ Sim |
| Policy | Regras de formato | ❌ Não |
| Utils | Helpers puros | ❌ Não |

---

## VALIDAÇÃO

### Testes de Conformidade

```typescript
describe('PublicIdentityService - Orquestrador Puro', () => {
  it('não deve acessar Supabase diretamente', () => {
    const source = fs.readFileSync('PublicIdentityService.ts', 'utf-8');
    expect(source).not.toContain('supabase.from');
  });

  it('não deve ter switch/case de entityType com lógica', () => {
    const source = fs.readFileSync('PublicIdentityService.ts', 'utf-8');
    const switches = source.match(/switch.*entityType/g) || [];
    // Apenas getAdapter() pode ter switch
    expect(switches.length).toBeLessThanOrEqual(1);
  });

  it('deve propagar erros de infraestrutura', async () => {
    mockAdapter.identifierExists.mockRejectedValue(new Error('DB error'));
    
    await expect(
      PublicIdentityService.checkAvailability({
        identifier: 'test',
        entityType: 'business'
      })
    ).rejects.toThrow();
  });
});
```

---

## CHECKLIST FINAL

- [x] PublicIdentityService é orquestrador puro
- [x] Sem acesso direto a Supabase no service
- [x] Sem switch/case de tabelas
- [x] Sem switch/case de campos
- [x] identifierExists() nos adapters
- [x] getExistingSimilar() nos adapters
- [x] Estrutura de pastas consistente
- [x] Types centralizados
- [x] Reserved names com contrato único
- [x] Sem `any`
- [x] Erros propagados (não engolidos)
- [x] Adapters lançam exceções em falhas

---

**Status**: Core fundamentais corrigidos e validados  
**Próximo passo**: Aguardando aprovação para continuar implementação
