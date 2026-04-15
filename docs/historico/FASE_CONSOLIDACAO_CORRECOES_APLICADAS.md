# CORREÇÕES ARQUITETURAIS APLICADAS

**Data**: 2026-03-29  
**Versão**: 2.0 (Arquitetura Corrigida)

---

## RESUMO DAS CORREÇÕES

### ✅ 1. Evitar God Module

**Problema Original**:
- `PublicIdentityService` centralizava toda lógica
- Switch/case espalhado por entity type
- Risco de virar god module

**Correção Aplicada**:
- Arquitetura com **Policies + Adapters**
- Cada entity type tem seu adapter próprio
- `PublicIdentityService` é orquestrador, não executor
- Sem switch/case de lógica

**Estrutura**:
```
core/public-identity/
├── policies/              # Regras por entity type
│   ├── BusinessIdentityPolicy.ts
│   ├── ProfileIdentityPolicy.ts
│   └── ProfessionalIdentityPolicy.ts
├── adapters/              # Comportamento específico
│   ├── BusinessIdentityAdapter.ts
│   ├── ProfileIdentityAdapter.ts
│   └── ProfessionalIdentityAdapter.ts
└── services/
    └── PublicIdentityService.ts  # Orquestrador
```

---

### ✅ 2. UI Fora do Core

**Problema Original**:
- Componentes UI dentro de `core/public-identity/components/`
- Hooks dentro de `core/public-identity/hooks/`
- Violação de separação de concerns

**Correção Aplicada**:
- Componentes genéricos em `shared/components/public-identity/`
- Hooks em `shared/hooks/public-identity/`
- Wrappers específicos por módulo

**Estrutura**:
```
src/
├── core/public-identity/          # SEM UI
│   └── (apenas domain, services, utils)
├── shared/
│   ├── components/public-identity/  # Componentes genéricos
│   │   ├── IdentityField.tsx
│   │   ├── IdentityAvailabilityBadge.tsx
│   │   └── IdentityHistory.tsx
│   └── hooks/public-identity/       # Hooks genéricos
│       ├── useIdentityAvailability.ts
│       └── useIdentityHistory.ts
└── modules/
    ├── business/components/identity/  # Wrappers específicos
    │   └── BusinessSlugField.tsx
    └── profile/components/identity/
        └── ProfileUsernameField.tsx
```

---

### ✅ 3. Histórico como SSOT

**Problema Original**:
- Campos `last_*_change_at` e `can_change_*_after` tratados como SSOT
- Cooldown calculado de campos diretos
- Risco de inconsistência

**Correção Aplicada**:
- **Histórico é SSOT** para mudanças
- Campos denormalizados são **CACHE** apenas
- Cooldown calculado do histórico
- Triggers atualizam cache automaticamente

**Modelagem**:
```sql
-- SSOT
CREATE TABLE business_slug_history (...);
CREATE TABLE profile_username_history (...);

-- CACHE (denormalização)
ALTER TABLE business_data
ADD COLUMN last_slug_change_at TIMESTAMPTZ,  -- CACHE
ADD COLUMN can_change_slug_after TIMESTAMPTZ; -- CACHE

COMMENT ON COLUMN business_data.last_slug_change_at IS
  'CACHE: Última mudança de slug. SSOT é business_slug_history.';
```

**Lógica**:
```typescript
// ❌ ERRADO: Consultar campo direto
const canChange = business.can_change_slug_after < new Date();

// ✅ CORRETO: Calcular do histórico
const canChange = await IdentityHistoryService.canChange({
  entityType: 'business',
  entityId: business.id
});
```

---

### ✅ 4. Reserved Names por Policy

**Problema Original**:
- Lista plana única `RESERVED_NAMES` para todos
- Sem escopo por entity type
- Business e Profile compartilhavam mesma lista cegamente

**Correção Aplicada**:
- Reserved names com **escopo por policy**
- Nomes comuns compartilhados
- Nomes específicos por entity type

**Estrutura**:
```typescript
// Comuns (todos os perfis)
export const COMMON_RESERVED = [
  'admin', 'system', 'login', 'api', ...
];

// Específicos de business
export const BUSINESS_SPECIFIC_RESERVED = [
  'empresas', 'business', 'loja', 'catalogo', ...
];

// Específicos de profile
export const PROFILE_SPECIFIC_RESERVED = [
  'perfil', 'profile', 'conta', 'dashboard', ...
];

// Policy usa ambos
class BusinessIdentityPolicy {
  private readonly reservedNames = [
    ...COMMON_RESERVED,
    ...BUSINESS_SPECIFIC_RESERVED
  ];

  isReserved(name: string): boolean {
    return this.reservedNames.includes(name.toLowerCase());
  }
}
```

---

### ✅ 5. Histórico Diferenciado

**Problema Original**:
- Assumia que todos os perfis teriam redirect público de identificador antigo
- Copiava comportamento de business para profile automaticamente

**Correção Aplicada**:
- **Business**: histórico com resolução pública (redirect 308)
- **Profile**: histórico interno (auditoria/cooldown, sem redirect)

**Comportamento**:

#### Business
```typescript
// ✅ Resolve URL antiga publicamente
const resolved = await BusinessIdentityAdapter.resolveOldIdentifier('old-slug');
// → { entityId: '...', currentIdentifier: 'new-slug' }

// Redirect 308: /empresas/ba/salvador/old-slug → /empresas/ba/salvador/new-slug
```

#### Profile
```typescript
// ❌ NÃO resolve username antigo publicamente
const resolved = await ProfileIdentityAdapter.resolveOldIdentifier('old_username');
// → null

// Histórico usado apenas para:
// - Auditoria interna
// - Cálculo de cooldown
// - Exibição ao dono
```

**Justificativa**:
- Business: URLs antigas podem estar em links externos, SEO, materiais impressos
- Profile: Username é identidade pessoal, sem necessidade de redirect público

---

### ✅ 6. Renomear Seção de Testes

**Problema Original**:
- Seção "Testes Executados" sugeria evidência de execução
- Na verdade descrevia cobertura exigida

**Correção Aplicada**:
- Renomeado para "Plano de Testes Obrigatórios"
- Nota clara: descreve cobertura exigida, não execução real

---

## HIERARQUIA FINAL

```
IdentityHistoryService (SSOT histórico)
         ↓
PublicIdentityService (orquestrador)
         ↓
Adapters (comportamento específico)
    ├── BusinessIdentityAdapter (histórico público)
    ├── ProfileIdentityAdapter (histórico interno)
    └── ProfessionalIdentityAdapter (preparado)
         ↓
Policies (regras de formato + reserved names)
    ├── BusinessIdentityPolicy
    ├── ProfileIdentityPolicy
    └── ProfessionalIdentityPolicy
```

---

## SSOT MANTIDO

### IdentityHistoryService
- ✅ Registro de mudanças
- ✅ Consulta de histórico
- ✅ Cálculo de cooldown
- ✅ Resolução de identificador antigo (quando aplicável)

### PublicIdentityService
- ✅ Orquestração
- ✅ Delegação para adapters
- ❌ Sem switch/case de lógica

### Adapters
- ✅ Comportamento específico por entity type
- ✅ Integração com tabelas específicas
- ✅ Resolução pública (business) ou interna (profile)

### BusinessUrlService
- ✅ URLs públicas de business
- ✅ Resolução territorial
- ✅ Montagem de rota canônica
- ✅ Consome `BusinessIdentityAdapter`

---

## CAMPOS DENORMALIZADOS (CACHE)

**NÃO são SSOT**:
- `business_data.last_slug_change_at`
- `business_data.can_change_slug_after`
- `profiles.last_username_change_at`
- `profiles.can_change_username_after`

**Atualizados automaticamente por triggers**:
- Mantidos sincronizados com histórico
- Usados para queries de performance
- **Nunca consultados como fonte de verdade**

---

## VALIDAÇÃO DAS CORREÇÕES

### Checklist de Conformidade

- [x] Policies + Adapters por entity type (não god module)
- [x] UI fora de `core/public-identity/`
- [x] Histórico como SSOT (campos são cache)
- [x] Reserved names com escopo por policy
- [x] Histórico diferenciado (business público, profile interno)
- [x] Seção renomeada para "Plano de Testes Obrigatórios"
- [x] Hierarquia clara de responsabilidades
- [x] Sem switch/case espalhado
- [x] Cooldown calculado do histórico
- [x] Documentação atualizada

---

**Status**: Correções aplicadas e validadas  
**Próximo passo**: Implementação conforme arquitetura corrigida
