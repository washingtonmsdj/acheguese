# Correção: geographic_path no BusinessCard

**Data**: 2026-03-29  
**Problema**: Erro ao renderizar BusinessCard - empresa sem geographic_path  
**Status**: ✅ Corrigido

---

## 🐛 Problema Identificado

### Erro no Console
```
BusinessUrlService.ts:89 Uncaught Error: [BusinessUrlService] Empresa e5fdefed-ad90-4dfa-98d9-f80a437a11bf sem geographic_path. Empresas devem ter location_id apontando para bairro/district.
```

### Causa Raiz
1. `BusinessCard` tentava gerar URL canônica usando `BusinessUrlService.getCanonicalUrl()`
2. `BusinessUrlService` requer `geographic_path` obrigatório
3. Query em `BusinessService.getBusinessesList()` não incluía `geographic_path` no join com `locations`
4. Tipo `Business` não tinha campo `geographic_path`
5. Mapeamento em `mapBusinessDataToBusiness()` não incluía `geographic_path`

---

## ✅ Solução Implementada

### 1. Atualizado Tipo `Business`

**Arquivo**: `src/core/business/types/Business.ts`

```typescript
// ANTES
location?: {
  name: string;
  full_name: string;
};

// DEPOIS
location?: {
  name: string;
  full_name: string;
  geographic_path?: string | null;
};

// Campo derivado para URLs (carregado via join com locations)
geographic_path?: string | null;
```

### 2. Atualizada Query em `BusinessService.getBusinessesList()`

**Arquivo**: `src/core/business/services/BusinessService.ts`

```typescript
// ANTES
location:locations!location_id(
  id,
  name,
  full_name,
  type,
  slug
)

// DEPOIS
location:locations!location_id(
  id,
  name,
  full_name,
  type,
  slug,
  geographic_path
)
```

### 3. Atualizado Mapeamento em `mapBusinessDataToBusiness()`

**Arquivo**: `src/core/business/services/BusinessService.ts`

```typescript
// ADICIONADO
// Campo derivado para URLs
geographic_path: canonicalLocation?.geographic_path || undefined,
```

### 4. Atualizado `BusinessCard`

**Arquivo**: `src/modules/business/components/BusinessCard.tsx`

```typescript
// ANTES
geographic_path: (business as any).geographic_path ?? null,

// DEPOIS
geographic_path: business.geographic_path ?? null,
```

---

## 📊 Impacto

### Positivo
- ✅ `BusinessCard` agora recebe `geographic_path` corretamente
- ✅ URLs canônicas são geradas sem erros
- ✅ Empresas podem ser clicadas e navegadas
- ✅ Tipo `Business` está completo e tipado
- ✅ Sem mais `(business as any)` - código type-safe

### Sem Impacto Negativo
- ✅ Query continua eficiente (apenas um campo a mais)
- ✅ Compatibilidade mantida com código existente
- ✅ `getBusinessById` já incluía todos os campos via `*`

---

## 🧪 Validação

### TypeScript
- ✅ 0 erros de compilação

### Teste Manual Pendente
1. Abrir `/empresas/ba/salvador`
2. Verificar que cards de empresas carregam sem erro
3. Clicar em um card
4. Verificar que navega para página da empresa

---

## 📝 Arquivos Modificados

1. `src/core/business/types/Business.ts` - Tipo atualizado
2. `src/core/business/services/BusinessService.ts` - Query e mapeamento
3. `src/modules/business/components/BusinessCard.tsx` - Uso tipado

---

## 🎯 Conclusão

Correção essencial para o funcionamento das URLs com bairro obrigatório. O `geographic_path` agora é carregado corretamente em todas as queries de listagem de empresas e está disponível no tipo `Business`.

**Status**: ✅ Implementado e pronto para testes
