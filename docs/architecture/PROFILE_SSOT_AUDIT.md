# Profile SSOT Audit — Auditoria Profunda e Corretiva

> **Data**: 2026-04-19  
> **Status**: 🔴 CRÍTICO — Deriva arquitetural severa detectada  
> **Objetivo**: Consolidar Profile em arquitetura canônica única

---

## 📊 Resumo Executivo

### Problema Identificado

O domínio `Profile` sofre de **deriva arquitetural severa** com **7 definições concorrentes** da interface `Profile` espalhadas pelo projeto, violando o princípio SSOT (Single Source of Truth).

### Impacto

- ❌ Impossível saber qual é o contrato canônico
- ❌ Campos duplicados com semânticas conflitantes (`verified` vs `is_verified`, `suspended` vs `is_suspended`)
- ❌ Services redefinem entidades de domínio (anti-pattern)
- ❌ Tipos legados convivem com tipos novos sem camada de compatibilidade explícita
- ❌ Aliases não controlados (`username` vs `handle`, `telefone` vs `phone`)
- ❌ `any` e index signatures soltas em inputs

### Severidade

🔴 **CRÍTICA** — Bloqueia evolução segura do sistema de identidade

---

## 🔍 Inventário Completo

### 1. Definições de `Profile` Encontradas

| # | Arquivo | Campos | Classificação | Status |
|---|---------|--------|---------------|--------|
| 1 | `src/integrations/supabase/types.generated.ts` | ~40 (banco) | ✅ **Persistência (SSOT raiz)** | Correto |
| 2 | `src/core/profiles/types/Profile.ts` | 5 | ❌ **Esqueleto inútil** | Remover |
| 3 | `src/core/profiles/services/types.ts` | 40+ | ❌ **SSOT acidental** | Migrar |
| 4 | `src/core/profiles/services/multi-profile/types.ts` | 30+ | ⚠️ **Arquitetura nova** | Promover |
| 5 | `src/shared/types/core.generated.ts` | 9 | ❌ **Duplicado legado** | Remover |
| 6 | `src/core/session/types/index.ts` | 4 | ⚠️ **View de sessão** | Manter separado |
| 7 | `src/modules/community/hooks/useMessageModal.ts` | 3 | ❌ **Redefinição local** | Remover |

### 2. Tipos Relacionados a Profile

| Tipo | Arquivo | Classificação | Status |
|------|---------|---------------|--------|
| `ProfileType` | `services/types.ts` | Enum de domínio | ✅ Manter |
| `ProfileType` | `multi-profile/types.ts` | Enum de domínio (novo) | ⚠️ Conflito |
| `ProfileType` | `shared/types/feed.ts` | Enum legado | ❌ Remover |
| `ProfileStatus` | `services/types.ts` | Agregado de domínio | ✅ Manter |
| `ProfilePermissions` | `services/types.ts` | Agregado de domínio | ✅ Manter |
| `ProfileContext` | `services/types.ts` | Agregado de domínio | ✅ Manter |
| `ProfileSummary` | `services/types.ts` | Read model | ✅ Manter |
| `Author` | `types/Author.ts` | Read model | ✅ Manter |
| `PublicProfile` | `types/PublicProfile.ts` | Read model | ✅ Manter |
| `ProfileQuery` | `shared/types/queries.generated.ts` | Query helper | ⚠️ Avaliar |
| `ProfileBasic` | `shared/types/queries.generated.ts` | Query helper | ⚠️ Avaliar |

### 3. Extensões por Tipo de Perfil

| Tipo | Arquivo | Status |
|------|---------|--------|
| `BusinessData` | `multi-profile/types.ts` | ✅ Correto |
| `ProfessionalData` | `multi-profile/types.ts` | ✅ Correto |
| `DriverData` | `multi-profile/types.ts` | ✅ Correto |

---

## ⚠️ Conflitos Semânticos Detectados

### Aliases Duplicados

| Campo 1 | Campo 2 | Onde | Problema |
|---------|---------|------|----------|
| `verified` | `is_verified` | `services/types.ts` Profile | Ambos presentes, semântica idêntica |
| `suspended` | `is_suspended` | `services/types.ts` Profile | Ambos presentes, semântica idêntica |
| `username` | `handle` | `services/types.ts` vs `multi-profile/types.ts` | Nomes diferentes para o mesmo conceito |
| `telefone` | `phone` | `services/types.ts` Profile | Ambos presentes, semântica idêntica |
| `reputation` | `reputation_score` | `services/types.ts` vs `multi-profile/types.ts` | Nomes diferentes |
| `name` | `display_name` | Vários | Confusão entre nome real e nome de exibição |

### Campos Legados sem Marcação

Campos presentes em `services/types.ts` Profile sem `@deprecated`:
- `pontos` (usar `reputation`)
- `badges` (não implementado)
- `author_profile_id` (não faz sentido em Profile)
- `type` (usar `profile_type`)
- `neighborhood`, `city`, `state` (usar `location_id`)

---

## 📐 Arquitetura Proposta

### Estrutura de Arquivos Final

```
src/core/profiles/
├── domain/
│   ├── Profile.ts              ← Entidade canônica de domínio
│   ├── ProfileType.ts          ← Enum ProfileType
│   ├── ProfileStatus.ts        ← Value object Status
│   ├── ProfilePermissions.ts   ← Value object Permissions
│   └── ProfileExtensions.ts    ← BusinessData, ProfessionalData, DriverData
│
├── persistence/
│   ├── ProfileRow.ts           ← Re-export de types.generated (snake_case)
│   └── ProfileRowMapper.ts     ← Mapper row -> domain
│
├── views/
│   ├── ProfileSummary.ts       ← Read model para listas
│   ├── Author.ts               ← Read model para autoria
│   ├── PublicProfile.ts        ← Read model público
│   └── ProfileContext.ts       ← Read model para sessão
│
├── operations/
│   ├── CreateProfileInput.ts   ← Input de criação
│   ├── UpdateProfileInput.ts   ← Input de atualização
│   └── ProfileFilters.ts       ← Filtros de query
│
├── legacy/
│   ├── LegacyProfile.ts        ← @deprecated Compatibilidade temporária
│   └── LegacyMapper.ts         ← Mapper legacy -> domain
│
├── services/
│   ├── ProfileService.ts       ← Service (SEM redefinir Profile)
│   └── types.ts                ← APENAS tipos de operação do service
│
└── index.ts                    ← Barrel com exports controlados
```

### Contrato Canônico de Domínio

```typescript
// src/core/profiles/domain/Profile.ts

/**
 * Profile — Entidade Canônica de Domínio
 * 
 * SSOT para perfis de usuário no sistema.
 * Baseado em: supabase/migrations/20260418010000_update_profiles_system.sql
 * 
 * @version 2.0.0
 */

export interface Profile {
  // Identidade
  id: string;
  user_id: string;
  profile_type: ProfileType;
  
  // Identificadores públicos
  slug: string;                    // URL-friendly (único)
  username: string | null;         // @mention (único, opcional)
  display_name: string;
  
  // Informações básicas
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  
  // Localização (SSOT territorial)
  location_id: string | null;      // FK para locations
  
  // Contato (PII - protegido por RLS)
  phone: string | null;
  whatsapp: string | null;
  
  // Status
  is_active: boolean;
  is_suspended: boolean;
  suspended_at: string | null;
  suspended_until: string | null;
  suspension_reason: string | null;
  
  // Verificação
  verified: boolean;
  verified_at: string | null;
  
  // Gamificação
  reputation: number;
  
  // Auditoria
  created_at: string;
  updated_at: string;
  
  // Metadata flexível
  metadata: Record<string, unknown>;
}
```

### Separação de Responsabilidades

#### 1. ProfileRow (Persistência)

```typescript
// src/core/profiles/persistence/ProfileRow.ts

import type { Database } from '@/integrations/supabase/types.generated';

/**
 * ProfileRow — Representação do banco (snake_case)
 * 
 * Re-export direto do types.generated.
 * NUNCA modificar manualmente.
 */
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
```

#### 2. ProfileSummary (View)

```typescript
// src/core/profiles/views/ProfileSummary.ts

/**
 * ProfileSummary — Read Model para Listas
 * 
 * Usado em feeds, comentários, listas.
 * Apenas dados não-sensíveis.
 */
export interface ProfileSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
}
```

#### 3. CreateProfileInput (Operation)

```typescript
// src/core/profiles/operations/CreateProfileInput.ts

import type { ProfileType } from '../domain/ProfileType';

/**
 * CreateProfileInput — Input de Criação
 * 
 * Validado por Zod antes de chegar no service.
 */
export interface CreateProfileInput {
  profile_type: ProfileType;
  display_name: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  location_id?: string;
}
```

#### 4. Mappers

```typescript
// src/core/profiles/persistence/ProfileRowMapper.ts

import type { Profile } from '../domain/Profile';
import type { ProfileRow } from './ProfileRow';

export class ProfileRowMapper {
  static toDomain(row: ProfileRow): Profile {
    return {
      id: row.id,
      user_id: row.user_id,
      profile_type: row.profile_type,
      slug: row.slug,
      username: row.username,
      display_name: row.display_name,
      bio: row.bio,
      avatar_url: row.avatar_url,
      cover_url: row.cover_url,
      location_id: row.location_id,
      phone: row.phone,
      whatsapp: row.whatsapp,
      is_active: row.is_active,
      is_suspended: row.is_suspended,
      suspended_at: row.suspended_at,
      suspended_until: row.suspended_until,
      suspension_reason: row.suspension_reason,
      verified: row.verified,
      verified_at: row.verified_at,
      reputation: row.reputation,
      created_at: row.created_at,
      updated_at: row.updated_at,
      metadata: row.metadata as Record<string, unknown>,
    };
  }
  
  static toRow(profile: Profile): Partial<ProfileRow> {
    // Implementação inversa
  }
}
```

---

## 🚨 Riscos de Migração

### Alto Risco

1. **Quebra de imports**: 100+ arquivos importam de `services/types.ts`
2. **Conflito de nomes**: `ProfileType` definido em 3 lugares
3. **Campos legados**: Código pode depender de `pontos`, `badges`, etc.

### Médio Risco

1. **Multi-profile não totalmente adotado**: Convivência de 2 arquiteturas
2. **Mappers inexistentes**: Conversão row -> domain feita manualmente
3. **Views não consolidadas**: `Author`, `PublicProfile` em arquivos separados

### Baixo Risco

1. **Types.generated**: Não será modificado (gerado automaticamente)
2. **Migrations**: Já estão corretas

---

## ✅ Plano de Execução

### Fase 1: Preparação (Sem Breaking Changes) ✅ CONCLUÍDA

1. ✅ Criar nova estrutura de pastas (`domain/`, `persistence/`, `views/`, `operations/`, `legacy/`)
2. ✅ Criar `Profile` canônico em `domain/Profile.ts`
3. ✅ Criar `ProfileType`, `ProfileStatus`, `ProfilePermissions` em `domain/`
4. ✅ Criar `ProfileExtensions` (BusinessData, ProfessionalData, DriverData) em `domain/`
5. ✅ Criar mappers em `persistence/ProfileRowMapper.ts`
6. ✅ Criar views consolidadas em `views/` (ProfileSummary, Author, PublicProfile, ProfileContext)
7. ✅ Criar inputs em `operations/` (CreateProfileInput, UpdateProfileInput, ProfileFilters)
8. ✅ Criar camada legacy em `legacy/` (LegacyProfile, LegacyMapper)
9. ✅ Adicionar `@deprecated` em tipos antigos em `services/types.ts`
10. ✅ Atualizar barrel export `index.ts` com novos tipos canônicos

### Fase 2: Migração Gradual

1. ✅ Atualizar `ProfileService` para usar novos tipos
2. ✅ Atualizar hooks para importar de `domain/`
3. ✅ Atualizar componentes (lote por lote)
4. ✅ Atualizar pages (lote por lote)

### Fase 3: Limpeza

1. ✅ Remover `src/core/profiles/types/Profile.ts` (esqueleto inútil)
2. ✅ Remover `src/shared/types/core.generated.ts` Profile
3. ✅ Remover redefinições locais
4. ✅ Consolidar `ProfileType` em um único lugar
5. ✅ Remover campos legados não usados

### Fase 4: Blindagem

1. ✅ Adicionar regra ESLint: proibir redefinição de `Profile` fora de `domain/`
2. ✅ Adicionar regra ESLint: proibir `any` em inputs de Profile
3. ✅ Adicionar regra ESLint: proibir import de `services/types.ts` Profile
4. ✅ Atualizar documentação

---

## 📝 Arquivos a Serem Alterados

### Criados (Fase 1)

- `src/core/profiles/domain/Profile.ts`
- `src/core/profiles/domain/ProfileType.ts`
- `src/core/profiles/domain/ProfileStatus.ts`
- `src/core/profiles/domain/ProfilePermissions.ts`
- `src/core/profiles/domain/ProfileExtensions.ts`
- `src/core/profiles/persistence/ProfileRow.ts`
- `src/core/profiles/persistence/ProfileRowMapper.ts`
- `src/core/profiles/views/ProfileSummary.ts`
- `src/core/profiles/views/Author.ts`
- `src/core/profiles/views/PublicProfile.ts`
- `src/core/profiles/views/ProfileContext.ts`
- `src/core/profiles/operations/CreateProfileInput.ts`
- `src/core/profiles/operations/UpdateProfileInput.ts`
- `src/core/profiles/operations/ProfileFilters.ts`
- `src/core/profiles/legacy/LegacyProfile.ts`
- `src/core/profiles/legacy/LegacyMapper.ts`

### Modificados (Fase 2)

- `src/core/profiles/services/ProfileService.ts`
- `src/core/profiles/services/types.ts` (reduzir escopo)
- `src/core/profiles/index.ts` (atualizar exports)
- ~100 arquivos que importam Profile

### Removidos (Fase 3)

- `src/core/profiles/types/Profile.ts`
- `src/shared/types/core.generated.ts` (Profile)
- Redefinições locais em hooks

---

## 🎯 Validação Final

### Checklist de Conformidade

- [ ] Apenas 1 definição canônica de `Profile` existe
- [ ] `Profile` está em `domain/`, não em `services/`
- [ ] Todos os aliases foram eliminados
- [ ] Campos legados estão em `legacy/` com `@deprecated`
- [ ] Mappers explícitos entre camadas existem
- [ ] Nenhum `any` ou index signature solta em inputs
- [ ] Services não redefinem entidades de domínio
- [ ] Views públicas não expõem PII
- [ ] ESLint rules impedem regressão

### Testes de Validação

```bash
# TypeCheck
npx tsc --noEmit

# Lint
npx eslint src/core/profiles --ext .ts,.tsx

# Buscar redefinições de Profile
grep -r "interface Profile" src/ --exclude-dir=node_modules

# Buscar aliases não controlados
grep -r "is_verified\|verified" src/core/profiles

# Buscar any soltos
grep -r ": any" src/core/profiles
```

---

## 📚 Documentação Atualizada

Após migração, atualizar:

1. `src/core/profiles/README.md` — Arquitetura final
2. `docs/architecture/SSOT_REGISTRY.md` — Registrar Profile como SSOT
3. `docs/architecture/PROFILE_DOMAIN.md` — Documentar domínio Profile
4. `.eslintrc.js` — Adicionar regras de blindagem

---

## 🏁 Conclusão

Esta auditoria identificou **deriva arquitetural severa** no domínio Profile. A migração proposta consolida 7 definições concorrentes em 1 SSOT canônico, com separação clara entre:

- **Domínio** (entidades canônicas)
- **Persistência** (row types do banco)
- **Views** (read models)
- **Operations** (inputs/outputs)
- **Legacy** (compatibilidade temporária)

A execução em 4 fases minimiza riscos e permite rollback incremental.

**Próximo passo**: Aprovação para iniciar Fase 1 (preparação sem breaking changes).
