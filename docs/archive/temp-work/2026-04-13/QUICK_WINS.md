# ⚡ QUICK WINS - Melhorias Rápidas

**Tempo Total**: 2-3 horas  
**Impacto**: Alto  
**Risco**: Baixo

---

## 🎯 O QUE SÃO QUICK WINS?

Melhorias pequenas que podem ser implementadas rapidamente (15-30 min cada) com alto impacto na qualidade do código.

---

## 1️⃣ Criar Arquivo de Constantes (15 min)

### Criar `src/shared/constants/index.ts`

```typescript
// src/shared/constants/pagination.ts
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  SMALL_LIMIT: 10,
  MEDIUM_LIMIT: 50,
  LARGE_LIMIT: 100,
  DEFAULT_PAGE_SIZE: 12,
  BATCH_SIZE: 1000,
} as const;

// src/shared/constants/timeouts.ts
export const TIMEOUTS = {
  GPS_LOCATION: 15000,      // 15 segundos
  USER_LOCATION: 10000,     // 10 segundos
  IP_GEOLOCATION: 5000,     // 5 segundos
  DEFAULT_REQUEST: 30000,   // 30 segundos
} as const;

// src/shared/constants/retries.ts
export const RETRIES = {
  DEFAULT_MAX: 3,
  GPS_MAX: 3,
  API_MAX: 5,
} as const;

// src/shared/constants/index.ts
export * from './pagination';
export * from './timeouts';
export * from './retries';
```

**Impacto**: Facilita manutenção e evita magic numbers

---

## 2️⃣ Criar Enums de Status (20 min)

### Criar `src/shared/types/enums.ts`

```typescript
// src/shared/types/enums.ts

/**
 * Status de entidades no sistema
 */
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Tipos de localização territorial
 */
export enum LocationType {
  COUNTRY = 'country',
  STATE = 'state',
  CITY = 'city',
  DISTRICT = 'district',
}

/**
 * Roles de usuário
 */
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest',
}

/**
 * Tipos de perfil
 */
export enum ProfileType {
  PERSONAL = 'personal',
  BUSINESS = 'business',
  PROFESSIONAL = 'professional',
  DRIVER = 'driver',
}

/**
 * Tipos de plano
 */
export enum PlanType {
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}
```

**Impacto**: Previne typos e melhora autocomplete

---

## 3️⃣ Adicionar Helper de Type Safety (15 min)

### Criar `src/shared/utils/supabase-helpers.ts`

```typescript
// src/shared/utils/supabase-helpers.ts
import { supabase } from '@/integrations/supabase';
import type { Database } from '@/integrations/supabase/types.generated';

/**
 * Helper tipado para queries Supabase
 * Evita uso de 'as any'
 */
export function createTypedQuery<
  TableName extends keyof Database['public']['Tables']
>(tableName: TableName) {
  type Row = Database['public']['Tables'][TableName]['Row'];
  type Insert = Database['public']['Tables'][TableName]['Insert'];
  type Update = Database['public']['Tables'][TableName]['Update'];

  return {
    select: () => supabase.from(tableName).select<Row>('*'),
    insert: (data: Insert) => supabase.from(tableName).insert(data).select<Row>('*'),
    update: (id: string, data: Update) => 
      supabase.from(tableName).update(data).eq('id', id).select<Row>('*'),
    delete: (id: string) => supabase.from(tableName).delete().eq('id', id),
  };
}

// Exemplo de uso:
// const profileQuery = createTypedQuery('profiles');
// const { data } = await profileQuery.select(); // Tipado automaticamente!
```

**Impacto**: Reduz `as any` com zero esforço

---

## 4️⃣ Adicionar Warnings em Deprecated (20 min)

### Atualizar métodos deprecated

```typescript
// src/core/profiles/services/ProfileService.ts

/**
 * @deprecated Use getByUsername instead
 * Will be removed in v2.0.0
 */
async getByHandle(handle: string): Promise<Profile | null> {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️  ProfileService.getByHandle() is deprecated.\n' +
      '   Use getByUsername() instead.\n' +
      '   This method will be removed in v2.0.0'
    );
  }
  return this.getByUsername(handle);
}

/**
 * @deprecated Use isUsernameAvailable instead
 * Will be removed in v2.0.0
 */
async isHandleAvailable(handle: string): Promise<boolean> {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️  ProfileService.isHandleAvailable() is deprecated.\n' +
      '   Use isUsernameAvailable() instead.\n' +
      '   This method will be removed in v2.0.0'
    );
  }
  return this.isUsernameAvailable(handle);
}
```

**Impacto**: Desenvolvedores são alertados sobre código deprecated

---

## 5️⃣ Criar Utilitário de Validação (15 min)

### Criar `src/shared/utils/validation.ts`

```typescript
// src/shared/utils/validation.ts

/**
 * Valida se uma string é um UUID válido
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Valida se uma string é um email válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida se uma string é um telefone brasileiro válido
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
  return phoneRegex.test(phone);
}

/**
 * Valida se uma string é um CEP válido
 */
export function isValidCEP(cep: string): boolean {
  const cepRegex = /^\d{5}-?\d{3}$/;
  return cepRegex.test(cep);
}

/**
 * Valida se um valor está dentro de um enum
 */
export function isValidEnum<T extends Record<string, string>>(
  value: string,
  enumObj: T
): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}
```

**Impacto**: Validações reutilizáveis e testáveis

---

## 6️⃣ Adicionar JSDoc aos Services Principais (30 min)

### Exemplo: ProfileService

```typescript
// src/core/profiles/services/ProfileService.ts

/**
 * ProfileService - SSOT para operações de perfil
 * 
 * @description
 * Fonte única de verdade para todas as operações relacionadas a perfis de usuário.
 * Gerencia criação, atualização, busca e validação de perfis.
 * 
 * @example
 * ```typescript
 * // Buscar perfil ativo
 * const profile = await profileService.getActiveProfile(userId);
 * 
 * // Criar novo perfil
 * const newProfile = await profileService.createProfile({
 *   profile_type: 'personal',
 *   name: 'João Silva',
 *   username: 'joaosilva',
 *   city: 'Salvador',
 * });
 * ```
 * 
 * @see {@link Profile} para estrutura de dados
 * @see {@link CreateProfileData} para dados de criação
 */
export class ProfileService {
  /**
   * Busca o perfil ativo de um usuário
   * 
   * @param userId - ID do usuário (opcional, usa usuário autenticado se não fornecido)
   * @returns Perfil ativo ou null se não encontrado
   * 
   * @example
   * ```typescript
   * const profile = await profileService.getActiveProfile('user-123');
   * if (profile) {
   *   console.log(profile.name);
   * }
   * ```
   */
  async getActiveProfile(userId?: string): Promise<Profile | null> {
    // implementação
  }
}
```

**Impacto**: Melhor documentação e autocomplete no IDE

---

## 7️⃣ Criar Script de Verificação (20 min)

### Criar `scripts/check-quality.sh`

```bash
#!/bin/bash

echo "🔍 Verificando qualidade do código..."
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de problemas
ISSUES=0

# 1. Verificar lint
echo "📋 Verificando lint..."
if npx eslint src/ --quiet; then
  echo -e "${GREEN}✅ Lint passou${NC}"
else
  echo -e "${RED}❌ Lint falhou${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 2. Verificar TypeScript
echo "🔷 Verificando TypeScript..."
if npx tsc --noEmit; then
  echo -e "${GREEN}✅ TypeScript passou${NC}"
else
  echo -e "${RED}❌ TypeScript falhou${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 3. Contar 'as any'
echo "🔍 Contando 'as any'..."
ANY_COUNT=$(grep -r "as any" src/core/ | wc -l)
if [ "$ANY_COUNT" -lt 100 ]; then
  echo -e "${GREEN}✅ 'as any': $ANY_COUNT (meta: <100)${NC}"
elif [ "$ANY_COUNT" -lt 300 ]; then
  echo -e "${YELLOW}⚠️  'as any': $ANY_COUNT (meta: <100)${NC}"
else
  echo -e "${RED}❌ 'as any': $ANY_COUNT (meta: <100)${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# 4. Contar TODOs
echo "📝 Contando TODOs..."
TODO_COUNT=$(grep -r "TODO\|FIXME" src/core/ | wc -l)
echo -e "${YELLOW}ℹ️  TODOs/FIXMEs: $TODO_COUNT${NC}"
echo ""

# 5. Verificar build
echo "🏗️  Verificando build..."
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Build passou${NC}"
else
  echo -e "${RED}❌ Build falhou${NC}"
  ISSUES=$((ISSUES + 1))
fi
echo ""

# Resultado final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ Todas as verificações passaram!${NC}"
  exit 0
else
  echo -e "${RED}❌ $ISSUES verificação(ões) falharam${NC}"
  exit 1
fi
```

**Uso**:
```bash
chmod +x scripts/check-quality.sh
./scripts/check-quality.sh
```

**Impacto**: Verificação rápida de qualidade antes de commits

---

## 8️⃣ Adicionar Pre-commit Hook (10 min)

### Criar `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Executando verificações pré-commit..."

# Lint apenas arquivos staged
npx lint-staged

# Verificar TypeScript
echo "🔷 Verificando TypeScript..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
  echo "❌ TypeScript falhou. Commit abortado."
  exit 1
fi

echo "✅ Verificações passaram!"
```

### Atualizar `package.json`

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

**Impacto**: Previne commits com erros

---

## 📊 RESUMO DOS QUICK WINS

| # | Tarefa | Tempo | Impacto | Arquivos |
|---|--------|-------|---------|----------|
| 1 | Constantes | 15 min | ⭐⭐⭐⭐ | 3 novos |
| 2 | Enums | 20 min | ⭐⭐⭐⭐⭐ | 1 novo |
| 3 | Type Helper | 15 min | ⭐⭐⭐⭐ | 1 novo |
| 4 | Warnings | 20 min | ⭐⭐⭐ | 2 editados |
| 5 | Validação | 15 min | ⭐⭐⭐ | 1 novo |
| 6 | JSDoc | 30 min | ⭐⭐⭐⭐ | 3 editados |
| 7 | Script Check | 20 min | ⭐⭐⭐⭐ | 1 novo |
| 8 | Pre-commit | 10 min | ⭐⭐⭐⭐⭐ | 2 editados |

**Total**: ~2h 25min  
**Impacto Geral**: ⭐⭐⭐⭐⭐

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Estrutura (45 min) ✅ CONCLUÍDA
- [x] Criar `src/shared/constants/pagination.ts`
- [x] Criar `src/shared/constants/timeouts.ts`
- [x] Criar `src/shared/constants/retries.ts`
- [x] Criar `src/shared/constants/index.ts`
- [x] Criar `src/shared/types/enums.ts`
- [x] Criar `src/shared/utils/supabase-helpers.ts`
- [x] Criar `src/shared/utils/validation.ts`

### Fase 2: Aplicação em Arquivos Existentes (50 min) 🔄 EM PROGRESSO
- [x] Aplicar enums em `TerritorialGroupService.ts` (EntityStatus, LocationType)
- [x] Aplicar constantes em `GamificationService.ts` (PAGINATION)
- [x] Aplicar enums e constantes em `TouristPointService.ts` (LocationType, PAGINATION)
- [x] Aplicar constantes em `TrackingService.ts` (TIMEOUTS)
- [x] Aplicar constantes em `GeolocationService.ts` (TIMEOUTS)
- [ ] Aplicar enums em `PostService.ts` (LocationType)
- [ ] Aplicar helpers tipados em `ProfileService.ts` (reduzir `as any`)
- [ ] Aplicar helpers tipados em `BusinessService.ts` (reduzir `as any`)
- [ ] Aplicar helpers tipados em `PostService.ts` (reduzir `as any`)

### Fase 3: Melhorias de Documentação (50 min) ⏳ PENDENTE
- [ ] Adicionar warnings em `ProfileService.getByHandle()`
- [ ] Adicionar warnings em `ProfileService.isHandleAvailable()`
- [ ] Adicionar JSDoc em `ProfileService`
- [ ] Adicionar JSDoc em `BusinessService`
- [ ] Adicionar JSDoc em `PostService`

### Fase 4: Automação (30 min) ⏳ PENDENTE
- [ ] Criar `scripts/check-quality.sh`
- [ ] Tornar executável: `chmod +x scripts/check-quality.sh`
- [ ] Atualizar `.husky/pre-commit`
- [ ] Atualizar `package.json` com `lint-staged`
- [ ] Testar pre-commit hook

### Fase 5: Validação (20 min) ⏳ PENDENTE
- [ ] Executar `./scripts/check-quality.sh`
- [ ] Fazer commit de teste
- [ ] Verificar que pre-commit funciona
- [ ] Atualizar documentação

---

## 🎉 RESULTADO ESPERADO

### Antes
```
Type Safety:     6.5/10
Manutenibilidade: 7.0/10
Documentação:    6.0/10
Automação:       5.0/10
```

### Depois (2-3 horas)
```
Type Safety:     7.5/10 (+1.0)
Manutenibilidade: 8.5/10 (+1.5)
Documentação:    8.0/10 (+2.0)
Automação:       8.5/10 (+3.5)
```

**Nota Geral**: 9.2/10 → 9.4/10 (+0.2)

---

## 🚀 PRÓXIMOS PASSOS

Após implementar estes quick wins:

1. **Usar as constantes** criadas nos arquivos existentes
2. **Usar os enums** criados para substituir strings hardcoded
3. **Usar o helper tipado** para reduzir `as any`
4. **Executar o script** de verificação regularmente
5. **Confiar no pre-commit** para manter qualidade

---

**Gerado em**: 10 de abril de 2026  
**Responsável**: Kiro AI Assistant  
**Versão**: 1.0.0
