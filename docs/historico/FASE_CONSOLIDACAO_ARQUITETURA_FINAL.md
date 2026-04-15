# ARQUITETURA FINAL: Consolidação de Identidade Pública

**Data**: 2026-03-29  
**Status**: Arquitetura Corrigida - Pronta para Implementação  
**Versão**: 2.0 (com correções arquiteturais obrigatórias)

---

## 1. ARQUITETURA FINAL ESCOLHIDA

### 1.1 Princípios Arquiteturais Obrigatórios

#### ❌ Evitar God Module
- `core/public-identity` é núcleo SSOT, mas não centraliza toda lógica
- Usa **policies + adapters** por entity type
- Sem switch/case espalhado
- Cada entity type tem seu adapter próprio

#### ❌ UI Fora do Core
- Componentes UI **NÃO** ficam em `core/public-identity`
- UI vai para `shared/components/public-identity` (genéricos)
- Ou wrappers específicos por módulo

#### ✅ Histórico como SSOT
- Histórico é a **fonte de verdade** para mudanças
- Campos `last_*_change_at` e `can_change_*_after` são **cache/denormalização**
- Cooldown calculado a partir do histórico, não de campos diretos

#### ✅ Reserved Names por Policy
- Centralizados mas com **escopo por entity type**
- Não é lista plana única para todos
- Cada policy define seus reserved específicos + compartilha comuns

#### ✅ Histórico Diferenciado
- **Business**: histórico com resolução pública (redirect 308)
- **Profile**: histórico interno (auditoria/cooldown, sem redirect público)
- Não copiar automaticamente comportamento de business para profile

---

### 1.2 Camada Transversal: `core/public-identity`

**Estrutura Corrigida**:
```
src/core/public-identity/
├── domain/
│   ├── PublicIdentity.ts          # Entity + Value Objects
│   ├── IdentityPolicy.ts          # Interface de policy
│   ├── IdentityAdapter.ts         # Interface de adapter
│   └── types.ts                   # Types compartilhados
├── policies/
│   ├── BusinessIdentityPolicy.ts  # Policy business (slug, kebab-case)
│   ├── ProfileIdentityPolicy.ts   # Policy profile (username, underscore)
│   └── ProfessionalIdentityPolicy.ts # Policy professional (preparada)
├── adapters/
│   ├── BusinessIdentityAdapter.ts # Adapter business (histórico público)
│   ├── ProfileIdentityAdapter.ts  # Adapter profile (histórico interno)
│   └── ProfessionalIdentityAdapter.ts # Adapter professional (preparado)
├── services/
│   ├── PublicIdentityService.ts   # Orquestrador (usa adapters)
│   └── IdentityHistoryService.ts  # Queries de histórico (SSOT)
├── repositories/
│   ├── IIdentityRepository.ts     # Interface
│   └── IdentityRepositorySupabase.ts # Implementação
├── utils/
│   ├── reserved-names.ts          # Reserved names por policy
│   └── cooldown.ts                # Cálculo de cooldown a partir de histórico
├── __tests__/
│   └── ...
└── index.ts                       # Barrel exports
```

**Responsabilidades**:
- ✅ Orquestração via adapters (não switch/case)
- ✅ Policies definem regras por entity type
- ✅ Adapters implementam comportamento específico
- ✅ Histórico como SSOT (não campos denormalizados)
- ✅ Reserved names com escopo por policy
- ✅ Cooldown calculado do histórico
- ❌ SEM componentes UI
- ❌ SEM god service com toda lógica

---

### 1.3 Policies por Tipo de Entidade

#### Business Identity Policy
```typescript
{
  entityType: 'business',
  identifierField: 'slug',
  format: 'kebab-case',
  regex: /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
  minLength: 2,
  maxLength: 100,
  allowedChars: 'a-z, 0-9, hífen',
  separator: '-',
  normalize: (name) => kebabCase(name),
  historyTable: 'business_slug_history',
  cooldownDays: 30,
  reservedNames: [...COMMON_RESERVED, ...BUSINESS_SPECIFIC_RESERVED]
}
```

#### Profile Identity Policy
```typescript
{
  entityType: 'profile',
  identifierField: 'username',
  format: 'social-style',
  regex: /^[a-z][a-z0-9_]{2,29}$/,
  minLength: 3,
  maxLength: 30,
  allowedChars: 'a-z, 0-9, underscore',
  separator: '_',
  mustStartWith: 'letter',
  normalize: (name) => socialUsername(name),
  historyTable: 'profile_username_history',
  cooldownDays: 30,
  reservedNames: [...COMMON_RESERVED, ...PROFILE_SPECIFIC_RESERVED]
}
```

#### Professional Identity Policy
```typescript
{
  entityType: 'professional',
  identifierField: 'slug',
  format: 'kebab-case',
  // Preparado mas não implementado UI final
  reservedNames: [...COMMON_RESERVED, ...PROFESSIONAL_SPECIFIC_RESERVED]
}
```

---

### 1.4 Adapters por Tipo de Entidade

#### Business Identity Adapter
**Responsabilidades**:
- Integração com `business_data` e `business_slug_history`
- Resolução pública de URLs antigas (redirect 308)
- Checagem de disponibilidade específica de business
- Integração com `BusinessUrlService`

**Comportamento de Histórico**:
- ✅ Registra mudanças em `business_slug_history`
- ✅ Resolve URLs antigas publicamente
- ✅ Redirect 308 para URL canônica atual

#### Profile Identity Adapter
**Responsabilidades**:
- Integração com `profiles` e `profile_username_history`
- Histórico interno (auditoria/cooldown)
- ❌ **NÃO** resolve username antigo publicamente
- ❌ **NÃO** faz redirect de `/u/:old_username`

**Comportamento de Histórico**:
- ✅ Registra mudanças em `profile_username_history`
- ✅ Usado para cooldown e auditoria
- ❌ Sem resolução pública de username antigo

#### Professional Identity Adapter
**Responsabilidades**:
- Preparado para `professional_data` e `professional_slug_history`
- Comportamento similar a business (se houver página pública futura)

---

### 1.5 URLs Públicas Finais

#### Business
- Canônica: `/empresas/:uf/:cidade/:slug`
- Premium: `/p/:slug` → redirect 308 para canônica
- ❌ Removido: `/business/:slug`
- ❌ Removido: `/businesss/:slug`
- ❌ Removido: `/:slug` standalone

#### Profile
- Pública: `/u/:username` ✅ NOVA
- ❌ Removido: `/p/:handle` (conflito com premium business)
- Interna: `/perfil/:userId` (mantida para compatibilidade)

#### Professional
- Preparado: `/profissionais/:slug` (arquitetura pronta, UI futura)

---

### 1.6 SSOT Mantido e Hierarquia

**IdentityHistoryService** é SSOT para:
- Registro de mudanças de identificador
- Consulta de histórico
- Cálculo de cooldown (a partir do histórico)
- Resolução de identificador antigo (quando aplicável)

**PublicIdentityService** é orquestrador que:
- Delega para adapters específicos por entity type
- Não tem switch/case de lógica
- Coordena validação, disponibilidade, sugestão

**Adapters** implementam comportamento específico:
- `BusinessIdentityAdapter`: histórico público + redirect
- `ProfileIdentityAdapter`: histórico interno + auditoria
- Cada adapter conhece sua tabela, policy e comportamento

**BusinessUrlService** continua sendo SSOT para:
- Geração de URLs públicas de business
- Resolução territorial
- Montagem de rota canônica
- Consome `BusinessIdentityAdapter` para validação/disponibilidade

**Hierarquia**:
```
IdentityHistoryService (SSOT histórico)
         ↓
PublicIdentityService (orquestrador)
         ↓
Adapters (comportamento específico)
         ↓
Policies (regras de formato)
```

**Campos Denormalizados** (cache, não SSOT):
- `business_data.last_slug_change_at`
- `business_data.can_change_slug_after`
- `profiles.last_username_change_at`
- `profiles.can_change_username_after`

Esses campos são atualizados automaticamente mas **não são consultados como fonte de verdade**. Cooldown é sempre calculado do histórico.

---

## 2. ARQUIVOS A CRIAR / ALTERAR / MOVER / REMOVER

### 2.1 CRIAR

#### Core Public Identity (SEM UI)
```
src/core/public-identity/
├── domain/
│   ├── PublicIdentity.ts          # Entity + Value Objects
│   ├── IdentityPolicy.ts          # Interface de policy
│   ├── IdentityAdapter.ts         # Interface de adapter
│   └── types.ts                   # Types compartilhados
├── policies/
│   ├── BusinessIdentityPolicy.ts
│   ├── ProfileIdentityPolicy.ts
│   └── ProfessionalIdentityPolicy.ts
├── adapters/
│   ├── BusinessIdentityAdapter.ts
│   ├── ProfileIdentityAdapter.ts
│   └── ProfessionalIdentityAdapter.ts
├── services/
│   ├── PublicIdentityService.ts   # Orquestrador
│   └── IdentityHistoryService.ts  # SSOT histórico
├── repositories/
│   ├── IIdentityRepository.ts
│   └── IdentityRepositorySupabase.ts
├── utils/
│   ├── reserved-names.ts          # Reserved por policy
│   └── cooldown.ts                # Cálculo de cooldown
├── __tests__/
│   ├── PublicIdentityService.test.ts
│   ├── IdentityHistoryService.test.ts
│   ├── BusinessIdentityAdapter.test.ts
│   ├── ProfileIdentityAdapter.test.ts
│   ├── BusinessIdentityPolicy.test.ts
│   └── ProfileIdentityPolicy.test.ts
├── index.ts
└── README.md
```

#### Componentes UI (FORA do core)
```
src/shared/components/public-identity/
├── IdentityField.tsx              # Campo genérico com validação
├── IdentityAvailabilityBadge.tsx  # Badge de status
├── IdentityPreview.tsx            # Preview genérico
├── IdentityHistory.tsx            # Lista de histórico
└── IdentityCooldownWarning.tsx    # Aviso de cooldown
```

#### Hooks para UI (FORA do core)
```
src/shared/hooks/public-identity/
├── useIdentityAvailability.ts
├── useIdentityHistory.ts
└── useIdentityCooldown.ts
```

#### Wrappers Específicos por Módulo
```
src/modules/business/components/identity/
└── BusinessSlugField.tsx          # Wrapper de IdentityField para business

src/modules/profile/components/identity/
└── ProfileUsernameField.tsx       # Wrapper de IdentityField para profile
```

#### Rota Pública de Profile
```
src/core/routing/components/
└── ProfilePublicRoute.tsx         # /u/:username
```

#### Testes de Integração
```
src/core/public-identity/__tests__/
└── publicIdentity.integration.test.ts
```

---

### 2.2 ALTERAR

#### Business
```
src/core/business/services/BusinessUrlService.ts
- Integrar com PublicIdentityService
- Remover validação duplicada
- Consumir reserved names da fundação

src/core/business/services/BusinessService.ts
- Usar PublicIdentityService.checkAvailability()
- Usar PublicIdentityService.validateIdentifier()

src/core/business/hooks/useBusiness.ts
- Integrar hooks de identidade
```

#### Profile
```
src/core/profiles/services/ProfileService.ts
- Remover isUsernameAvailable() duplicado
- Consumir PublicIdentityService

src/core/profiles/services/ProfileIdentityService.ts
- Remover isUsernameAvailable() duplicado
- Consumir PublicIdentityService

src/core/profiles/services/validation.ts
- Migrar para usar ProfileIdentityPolicy
```

#### Routing
```
src/App.tsx
- Remover rota /business/:slug
- Remover rota /businesss/:slug
- Remover rota /:slug standalone
- Adicionar rota /u/:username

src/core/routing/reservedSlugs.ts
- Mover para core/public-identity/utils/reserved-names.ts
- Manter re-export para compatibilidade temporária
```

#### Dashboard
```
src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx
- Linha 64: Migrar de /businesss/ para BusinessUrlService.getCanonicalUrl()
```

---

### 2.3 MOVER

#### De `core/business/` para `modules/`
```
MOVER:
src/core/business/components/AnalyticsDashboard.tsx
→ src/modules/dashboard/components/business/AnalyticsDashboard.tsx

src/core/business/components/EmpresaDashboardTab.tsx
→ src/modules/dashboard/components/business/EmpresaDashboardTab.tsx

src/core/business/components/CouponManager.tsx
→ src/modules/business/components/CouponManager.tsx

src/core/business/components/SubscriptionPlans.tsx
→ src/modules/business/components/SubscriptionPlans.tsx

src/core/business/hooks/useBusinessImageUpload.ts
→ src/modules/business/hooks/useBusinessImageUpload.ts

src/core/business/hooks/useBusinessManagement.ts
→ src/modules/business/hooks/useBusinessManagement.ts
```

#### Reserved Names
```
MOVER:
src/core/routing/reservedSlugs.ts
→ src/core/public-identity/utils/reserved-names.ts

MANTER re-export em:
src/core/routing/reservedSlugs.ts (deprecated, para compatibilidade)
```

---

### 2.4 REMOVER

#### Rotas Legadas
```
REMOVER ARQUIVOS:
src/core/routing/components/BusinessLegacyRoute.tsx
src/shared/components/routing/LegacyBusinessRedirect.tsx
src/core/routing/components/StandaloneRoute.tsx
```

#### Utilitários Deprecated
```
REMOVER de src/shared/utils/urlUtils.ts:
- gerarUrlEmpresa()
- gerarUrlCompletaEmpresa()
- gerarTodasUrlsEmpresa()
- gerarUrlCanonica()
- parseUrlEmpresa()
- isUrlLegacy()
- extrairSlugLegacy()
- CATEGORIA_PARA_NICHO
- obterNicho()
```

#### Imports Mortos
```
BUSCAR E REMOVER imports de:
- BusinessLegacyRoute
- LegacyBusinessRedirect
- StandaloneRoute
- Funções deprecated de urlUtils
```

---

## 3. MIGRAÇÕES E MODELAGEM

### 3.1 Decisão de Modelagem

**ESCOLHA**: Manter `business_slug_history` separado + criar `profile_username_history`

**Justificativa**:
- `business_slug_history` já está em produção e funcionando
- Migração unificada seria arriscada e complexa
- Estruturas similares mas não idênticas (business tem territory)
- Mais fácil manter e escalar

**Estrutura**:
- Business: `business_slug_history` (mantido)
- Profile: `profile_username_history` (novo)
- Professional: `professional_slug_history` (preparado, não criado agora)

---

### 3.2 Migration: Profile Username History

```sql
-- Migration: 20260329000012_profile_username_history.sql

-- Tabela de histórico de username (SSOT para mudanças)
CREATE TABLE IF NOT EXISTS profile_username_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  old_username TEXT NOT NULL,
  new_username TEXT NOT NULL,
  change_reason TEXT CHECK (change_reason IN ('user_requested', 'admin_action', 'policy_violation')),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profile_username_history_profile_id
  ON profile_username_history(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_username_history_old_username
  ON profile_username_history(old_username);

CREATE INDEX IF NOT EXISTS idx_profile_username_history_changed_at
  ON profile_username_history(changed_at DESC);

-- Trigger para registrar mudanças
CREATE OR REPLACE FUNCTION fn_record_profile_username_history()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sai se username não mudou
  IF OLD.username IS NOT DISTINCT FROM NEW.username THEN
    RETURN NEW;
  END IF;

  -- Não registra se não havia username antes
  IF OLD.username IS NULL THEN
    RETURN NEW;
  END IF;

  -- Registra mudança
  INSERT INTO profile_username_history (
    profile_id,
    old_username,
    new_username,
    change_reason
  ) VALUES (
    OLD.id,
    OLD.username,
    NEW.username,
    'user_requested'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_username_history ON profiles;

CREATE TRIGGER trg_profile_username_history
  BEFORE UPDATE OF username
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_record_profile_username_history();

COMMENT ON TABLE profile_username_history IS
  'Histórico de mudanças de username. SSOT para auditoria e cooldown. '
  'NÃO usado para resolução pública (profile não faz redirect de username antigo).';
```

### 3.3 Migration: Campos Denormalizados de Cooldown (CACHE)

```sql
-- Migration: 20260329000013_add_identity_cooldown_cache_fields.sql

-- ATENÇÃO: Estes campos são CACHE/DENORMALIZAÇÃO, não SSOT.
-- SSOT é o histórico. Estes campos são atualizados automaticamente
-- mas não são consultados como fonte de verdade.

-- Business
ALTER TABLE business_data
ADD COLUMN IF NOT EXISTS last_slug_change_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_change_slug_after TIMESTAMPTZ;

-- Profile
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_username_change_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_change_username_after TIMESTAMPTZ;

-- Índices (para queries de performance, não para lógica)
CREATE INDEX IF NOT EXISTS idx_business_slug_cooldown 
  ON business_data(can_change_slug_after) 
  WHERE can_change_slug_after IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_username_cooldown 
  ON profiles(can_change_username_after) 
  WHERE can_change_username_after IS NOT NULL;

-- Função para atualizar cache de cooldown (business)
CREATE OR REPLACE FUNCTION fn_update_business_slug_cooldown_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza cache quando slug muda
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    NEW.last_slug_change_at := NOW();
    NEW.can_change_slug_after := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_business_slug_cooldown_cache ON business_data;

CREATE TRIGGER trg_update_business_slug_cooldown_cache
  BEFORE UPDATE OF slug
  ON business_data
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_business_slug_cooldown_cache();

-- Função para atualizar cache de cooldown (profile)
CREATE OR REPLACE FUNCTION fn_update_profile_username_cooldown_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza cache quando username muda
  IF OLD.username IS DISTINCT FROM NEW.username THEN
    NEW.last_username_change_at := NOW();
    NEW.can_change_username_after := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_profile_username_cooldown_cache ON profiles;

CREATE TRIGGER trg_update_profile_username_cooldown_cache
  BEFORE UPDATE OF username
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_profile_username_cooldown_cache();

COMMENT ON COLUMN business_data.last_slug_change_at IS
  'CACHE: Última mudança de slug. SSOT é business_slug_history.';

COMMENT ON COLUMN business_data.can_change_slug_after IS
  'CACHE: Próxima data permitida. SSOT é business_slug_history.';

COMMENT ON COLUMN profiles.last_username_change_at IS
  'CACHE: Última mudança de username. SSOT é profile_username_history.';

COMMENT ON COLUMN profiles.can_change_username_after IS
  'CACHE: Próxima data permitida. SSOT é profile_username_history.';
```

---

### 3.4 Migration: Profile Username Field

```sql
-- Migration: 20260329000014_ensure_profile_username.sql

-- Garantir que username existe e é único
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Índice único
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique 
  ON profiles(LOWER(username)) 
  WHERE username IS NOT NULL;

-- Índice de busca
CREATE INDEX IF NOT EXISTS idx_profiles_username_search 
  ON profiles(username) 
  WHERE username IS NOT NULL;
```

---

## 4. PLANO DE TESTES OBRIGATÓRIOS

**NOTA**: Esta seção descreve a cobertura de testes exigida, não evidência de execução real.
Os testes devem ser implementados e executados durante a fase de desenvolvimento.

### 4.1 Fundação Transversal

#### Reserved Names por Policy
```typescript
describe('Reserved Names - Business Policy', () => {
  const policy = new BusinessIdentityPolicy();

  it('deve bloquear nomes comuns reservados', () => {
    expect(policy.isReserved('admin')).toBe(true);
    expect(policy.isReserved('dashboard')).toBe(true);
  });

  it('deve bloquear nomes específicos de business', () => {
    expect(policy.isReserved('empresas')).toBe(true);
    expect(policy.isReserved('business')).toBe(true);
  });

  it('deve permitir nomes válidos', () => {
    expect(policy.isReserved('tonecos-studios')).toBe(false);
  });
});

describe('Reserved Names - Profile Policy', () => {
  const policy = new ProfileIdentityPolicy();

  it('deve bloquear nomes comuns reservados', () => {
    expect(policy.isReserved('admin')).toBe(true);
    expect(policy.isReserved('system')).toBe(true);
  });

  it('deve bloquear nomes específicos de profile', () => {
    expect(policy.isReserved('profile')).toBe(true);
    expect(policy.isReserved('user')).toBe(true);
  });

  it('deve permitir nomes válidos', () => {
    expect(policy.isReserved('maria_silva')).toBe(false);
  });
});
```

#### Normalização por Policy
```typescript
describe('Business Identity Policy', () => {
  it('deve normalizar para kebab-case', () => {
    const policy = new BusinessIdentityPolicy();
    expect(policy.normalize('Tonecos Studios')).toBe('tonecos-studios');
    expect(policy.normalize('Salão da Ju')).toBe('salao-da-ju');
  });

  it('deve validar formato correto', () => {
    const policy = new BusinessIdentityPolicy();
    expect(policy.validate('tonecos-studios')).toEqual({ valid: true });
    expect(policy.validate('tonecos_studios')).toEqual({ 
      valid: false, 
      error: 'Formato inválido' 
    });
  });
});

describe('Profile Identity Policy', () => {
  it('deve normalizar para social-style', () => {
    const policy = new ProfileIdentityPolicy();
    expect(policy.normalize('Maria Silva')).toBe('maria_silva');
    expect(policy.normalize('João123')).toBe('joao123');
  });

  it('deve validar formato correto', () => {
    const policy = new ProfileIdentityPolicy();
    expect(policy.validate('maria_silva')).toEqual({ valid: true });
    expect(policy.validate('maria-silva')).toEqual({ 
      valid: false, 
      error: 'Formato inválido' 
    });
  });

  it('deve exigir início com letra', () => {
    const policy = new ProfileIdentityPolicy();
    expect(policy.validate('123maria')).toEqual({ 
      valid: false, 
      error: 'Deve começar com letra' 
    });
  });
});
```

#### Disponibilidade
```typescript
describe('PublicIdentityService - Availability', () => {
  it('deve retornar available quando não existe', async () => {
    const result = await service.checkAvailability({
      identifier: 'novo-slug',
      entityType: 'business'
    });
    expect(result.status).toBe('available');
  });

  it('deve retornar taken quando já existe', async () => {
    await createBusiness({ slug: 'existente' });
    const result = await service.checkAvailability({
      identifier: 'existente',
      entityType: 'business'
    });
    expect(result.status).toBe('taken');
  });

  it('deve retornar invalid quando formato errado', async () => {
    const result = await service.checkAvailability({
      identifier: 'slug inválido',
      entityType: 'business'
    });
    expect(result.status).toBe('invalid');
  });

  it('deve retornar reserved quando é nome reservado', async () => {
    const result = await service.checkAvailability({
      identifier: 'admin',
      entityType: 'business'
    });
    expect(result.status).toBe('reserved');
  });
});
```

#### Cooldown
```typescript
describe('IdentityCooldownService', () => {
  it('deve bloquear troca antes de 30 dias', async () => {
    const lastChange = new Date();
    const result = await service.canChange({
      entityType: 'business',
      entityId: 'business-123',
      lastChangeAt: lastChange
    });
    expect(result.canChange).toBe(false);
    expect(result.reason).toBe('cooldown_active');
    expect(result.nextAllowedDate).toBeDefined();
  });

  it('deve permitir troca após 30 dias', async () => {
    const lastChange = new Date();
    lastChange.setDate(lastChange.getDate() - 31);
    const result = await service.canChange({
      entityType: 'business',
      entityId: 'business-123',
      lastChangeAt: lastChange
    });
    expect(result.canChange).toBe(true);
  });

  it('deve permitir primeira troca', async () => {
    const result = await service.canChange({
      entityType: 'business',
      entityId: 'business-123',
      lastChangeAt: null
    });
    expect(result.canChange).toBe(true);
  });
});
```

#### Histórico (SSOT)
```typescript
describe('IdentityHistoryService - SSOT', () => {
  it('deve registrar mudança de slug', async () => {
    await service.recordChange({
      entityType: 'business',
      entityId: 'business-123',
      oldIdentifier: 'old-slug',
      newIdentifier: 'new-slug',
      reason: 'user_requested'
    });

    const history = await service.getHistory({
      entityType: 'business',
      entityId: 'business-123'
    });

    expect(history).toHaveLength(1);
    expect(history[0].old_identifier).toBe('old-slug');
    expect(history[0].new_identifier).toBe('new-slug');
  });

  it('deve resolver identificador antigo (business apenas)', async () => {
    await service.recordChange({
      entityType: 'business',
      entityId: 'business-123',
      oldIdentifier: 'old-slug',
      newIdentifier: 'new-slug'
    });

    const resolved = await service.resolveOldIdentifier({
      entityType: 'business',
      oldIdentifier: 'old-slug'
    });

    expect(resolved).toBeDefined();
    expect(resolved.currentIdentifier).toBe('new-slug');
  });

  it('NÃO deve resolver username antigo de profile', async () => {
    await service.recordChange({
      entityType: 'profile',
      entityId: 'profile-123',
      oldIdentifier: 'old_username',
      newIdentifier: 'new_username'
    });

    // Profile não faz resolução pública
    const resolved = await service.resolveOldIdentifier({
      entityType: 'profile',
      oldIdentifier: 'old_username'
    });

    expect(resolved).toBeNull();
  });
});
```

#### Cooldown Calculado do Histórico
```typescript
describe('Cooldown - Calculado do Histórico (SSOT)', () => {
  it('deve calcular cooldown a partir do histórico', async () => {
    // Registrar mudança no histórico
    await IdentityHistoryService.recordChange({
      entityType: 'business',
      entityId: 'business-123',
      oldIdentifier: 'old-slug',
      newIdentifier: 'new-slug'
    });

    // Cooldown calculado do histórico, não de campos
    const result = await IdentityHistoryService.canChange({
      entityType: 'business',
      entityId: 'business-123'
    });

    expect(result.canChange).toBe(false);
    expect(result.reason).toBe('cooldown_active');
    expect(result.daysRemaining).toBeGreaterThan(0);
  });

  it('deve permitir troca após 30 dias (calculado do histórico)', async () => {
    // Simular mudança há 31 dias
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 31);

    await supabase
      .from('business_slug_history')
      .insert({
        business_id: 'business-123',
        profile_id: 'profile-123',
        old_slug: 'old-slug',
        old_canonical_url: '/empresas/ba/salvador/old-slug',
        change_reason: 'slug_changed',
        created_at: oldDate.toISOString()
      });

    const result = await IdentityHistoryService.canChange({
      entityType: 'business',
      entityId: 'business-123'
    });

    expect(result.canChange).toBe(true);
  });

  it('campos denormalizados são cache, não SSOT', async () => {
    // Mesmo que campo cache esteja desatualizado, histórico é verdade
    await supabase
      .from('business_data')
      .update({
        can_change_slug_after: new Date('2025-01-01') // Data antiga no cache
      })
      .eq('id', 'business-123');

    // Mas histórico diz que mudou recentemente
    await IdentityHistoryService.recordChange({
      entityType: 'business',
      entityId: 'business-123',
      oldIdentifier: 'old-slug',
      newIdentifier: 'new-slug'
    });

    // Cooldown usa histórico, não campo cache
    const result = await IdentityHistoryService.canChange({
      entityType: 'business',
      entityId: 'business-123'
    });

    expect(result.canChange).toBe(false); // Histórico prevalece
  });
});
```

#### Sugestão
```typescript
describe('PublicIdentityService - Suggestion', () => {
  it('deve sugerir identificador único', async () => {
    await createBusiness({ slug: 'tonecos' });
    const suggestion = await service.suggestIdentifier({
      baseName: 'Tonecos',
      entityType: 'business'
    });
    expect(suggestion).toBe('tonecos-1');
  });

  it('deve adicionar sufixo empresa se reservado', async () => {
    const suggestion = await service.suggestIdentifier({
      baseName: 'Admin',
      entityType: 'business'
    });
    expect(suggestion).toBe('admin-empresa');
  });
});
```

---

### 4.2 Business

#### Slug como Identidade Pública
```typescript
describe('Business - Slug as Public Identity', () => {
  it('não deve criar campo username paralelo', async () => {
    const business = await BusinessService.create({
      name: 'Tonecos Studios',
      // ... outros campos
    });
    expect(business).not.toHaveProperty('username');
    expect(business.slug).toBeDefined();
  });

  it('deve usar slug como identificador público', () => {
    const business = { slug: 'tonecos-studios', /* ... */ };
    const urls = BusinessUrlService.buildUrls(business);
    expect(urls.canonical).toContain('tonecos-studios');
  });
});
```

#### URL Canônica
```typescript
describe('Business - Canonical URL', () => {
  it('deve gerar URL canônica territorial', () => {
    const ctx = {
      id: 'uuid',
      slug: 'tonecos-studios',
      geographic_path: '/br/ba/salvador'
    };
    const url = BusinessUrlService.getCanonicalUrl(ctx);
    expect(url).toBe('/empresas/ba/salvador/tonecos-studios');
  });
});
```

#### URL Premium
```typescript
describe('Business - Premium URL', () => {
  it('deve gerar URL premium curta', () => {
    const ctx = {
      id: 'uuid',
      slug: 'tonecos-studios',
      is_premium: true,
      geographic_path: '/br/ba/salvador'
    };
    const urls = BusinessUrlService.buildUrls(ctx);
    expect(urls.premium).toBe('/p/tonecos-studios');
  });

  it('não deve gerar URL premium se não for premium', () => {
    const ctx = {
      id: 'uuid',
      slug: 'tonecos-studios',
      is_premium: false,
      geographic_path: '/br/ba/salvador'
    };
    const urls = BusinessUrlService.buildUrls(ctx);
    expect(urls.premium).toBeNull();
  });
});
```

#### Troca com Cooldown
```typescript
describe('Business - Slug Change with Cooldown', () => {
  it('deve respeitar cooldown de 30 dias', async () => {
    const business = await createBusiness({ slug: 'old-slug' });
    
    // Primeira troca
    await BusinessService.update(business.id, { slug: 'new-slug' });
    
    // Tentar trocar novamente imediatamente
    await expect(
      BusinessService.update(business.id, { slug: 'another-slug' })
    ).rejects.toThrow('Cooldown ativo');
  });

  it('deve permitir troca após cooldown', async () => {
    const business = await createBusiness({ 
      slug: 'old-slug',
      last_slug_change_at: new Date('2026-02-01')
    });
    
    // Troca após 30+ dias
    await expect(
      BusinessService.update(business.id, { slug: 'new-slug' })
    ).resolves.toBeDefined();
  });
});
```

#### Histórico
```typescript
describe('Business - Slug History', () => {
  it('deve registrar mudança de slug no histórico', async () => {
    const business = await createBusiness({ slug: 'old-slug' });
    await BusinessService.update(business.id, { slug: 'new-slug' });

    const history = await IdentityHistoryService.getHistory({
      entityType: 'business',
      entityId: business.id
    });

    expect(history).toHaveLength(1);
    expect(history[0].old_identifier).toBe('old-slug');
  });

  it('deve resolver URL antiga via histórico', async () => {
    const business = await createBusiness({ 
      slug: 'old-slug',
      geographic_path: '/br/ba/salvador'
    });
    await BusinessService.update(business.id, { slug: 'new-slug' });

    const oldUrl = '/empresas/ba/salvador/old-slug';
    const resolved = await BusinessUrlService.resolveBySlugHistory(oldUrl);

    expect(resolved).toBeDefined();
    expect(resolved.slug).toBe('new-slug');
  });
});
```

#### Preview
```typescript
describe('Business - URL Preview', () => {
  it('deve mostrar preview de URL canônica', () => {
    const preview = BusinessUrlService.previewCanonicalUrl({
      slug: 'tonecos-studios',
      uf: 'ba',
      cidade: 'salvador'
    });
    expect(preview).toBe('/empresas/ba/salvador/tonecos-studios');
  });

  it('deve mostrar preview de URL premium', () => {
    const preview = BusinessUrlService.previewPremiumUrl({
      slug: 'tonecos-studios'
    });
    expect(preview).toBe('/p/tonecos-studios');
  });
});
```

---

### 4.3 Profile

#### Username Público
```typescript
describe('Profile - Public Username', () => {
  it('deve ter username como identificador público', async () => {
    const profile = await ProfileService.create({
      name: 'Maria Silva',
      username: 'maria_silva'
    });
    expect(profile.username).toBe('maria_silva');
  });

  it('deve seguir policy de profile', () => {
    const policy = new ProfileIdentityPolicy();
    expect(policy.validate('maria_silva')).toEqual({ valid: true });
    expect(policy.validate('maria-silva')).toEqual({ valid: false });
  });
});
```

#### Rota /u/:username
```typescript
describe('Profile - Public Route', () => {
  it('deve resolver /u/:username corretamente', async () => {
    const profile = await createProfile({ username: 'maria_silva' });
    const resolved = await ProfileService.resolveByUsername('maria_silva');
    expect(resolved).toBeDefined();
    expect(resolved.id).toBe(profile.id);
  });

  it('deve retornar 404 para username inexistente', async () => {
    const resolved = await ProfileService.resolveByUsername('nao_existe');
    expect(resolved).toBeNull();
  });
});
```

#### Troca com Histórico
```typescript
describe('Profile - Username Change', () => {
  it('deve registrar mudança no histórico', async () => {
    const profile = await createProfile({ username: 'old_username' });
    await ProfileService.update(profile.id, { username: 'new_username' });

    const history = await IdentityHistoryService.getHistory({
      entityType: 'profile',
      entityId: profile.id
    });

    expect(history).toHaveLength(1);
    expect(history[0].old_identifier).toBe('old_username');
  });
});
```

#### Cooldown
```typescript
describe('Profile - Username Cooldown', () => {
  it('deve respeitar cooldown de 30 dias', async () => {
    const profile = await createProfile({ username: 'old_username' });
    await ProfileService.update(profile.id, { username: 'new_username' });

    await expect(
      ProfileService.update(profile.id, { username: 'another_username' })
    ).rejects.toThrow('Cooldown ativo');
  });
});
```

#### Disponibilidade Centralizada
```typescript
describe('Profile - Availability via Central Layer', () => {
  it('deve usar PublicIdentityService', async () => {
    const spy = vi.spyOn(PublicIdentityService, 'checkAvailability');
    await ProfileService.checkUsernameAvailability('maria_silva');
    expect(spy).toHaveBeenCalledWith({
      identifier: 'maria_silva',
      entityType: 'profile'
    });
  });
});
```

---

### 4.4 Limpeza

#### Rotas Legadas Removidas
```typescript
describe('Legacy Routes Removed', () => {
  it('não deve ter rota /business/:slug', () => {
    const routes = getAllRoutes();
    expect(routes).not.toContain('/business/:slug');
  });

  it('não deve ter rota /businesss/:slug', () => {
    const routes = getAllRoutes();
    expect(routes).not.toContain('/businesss/:slug');
  });

  it('não deve ter rota /:slug standalone', () => {
    const routes = getAllRoutes();
    const standaloneSlug = routes.find(r => r === '/:slug');
    expect(standaloneSlug).toBeUndefined();
  });
});
```

#### Helpers Deprecated Removidos
```typescript
describe('Deprecated Helpers Removed', () => {
  it('não deve exportar gerarUrlEmpresa', () => {
    expect(urlUtils.gerarUrlEmpresa).toBeUndefined();
  });

  it('não deve exportar parseUrlEmpresa', () => {
    expect(urlUtils.parseUrlEmpresa).toBeUndefined();
  });
});
```

#### Validação Não Duplicada
```typescript
describe('No Validation Duplication', () => {
  it('ProfileService não deve ter isUsernameAvailable próprio', () => {
    const method = ProfileService.prototype.isUsernameAvailable;
    // Deve delegar para PublicIdentityService
    expect(method.toString()).toContain('PublicIdentityService');
  });

  it('ProfileIdentityService não deve duplicar disponibilidade', () => {
    const method = ProfileIdentityService.prototype.isUsernameAvailable;
    expect(method.toString()).toContain('PublicIdentityService');
  });
});
```

---

## 5. CHECKLIST FINAL DE ACEITE

### 5.1 Fundação Transversal

- [ ] `core/public-identity/` criado com estrutura completa
- [ ] `PublicIdentityService` implementado
- [ ] `IdentityHistoryService` implementado
- [ ] `IdentityCooldownService` implementado
- [ ] `BusinessIdentityPolicy` implementado
- [ ] `ProfileIdentityPolicy` implementado
- [ ] `ProfessionalIdentityPolicy` preparado
- [ ] Reserved names movidos para fundação
- [ ] Testes unitários passando (100% coverage)

### 5.2 Business

- [ ] Slug continua sendo identidade pública
- [ ] NÃO existe campo `username` em `business_data`
- [ ] `BusinessUrlService` consome `PublicIdentityService`
- [ ] URL canônica funciona: `/empresas/:uf/:cidade/:slug`
- [ ] URL premium funciona: `/p/:slug`
- [ ] Troca de slug respeita cooldown de 30 dias
- [ ] Histórico registra mudanças
- [ ] Preview de URL funciona na UI
- [ ] Disponibilidade em tempo real funciona
- [ ] Testes passando

### 5.3 Profile

- [ ] Username é identidade pública
- [ ] Rota `/u/:username` funciona
- [ ] NÃO existe rota `/p/:handle` para profile
- [ ] Username segue policy de profile (underscore, social-style)
- [ ] Troca registra histórico
- [ ] Cooldown de 30 dias funciona
- [ ] Disponibilidade usa camada central
- [ ] `ProfileService.isUsernameAvailable()` removido (usa central)
- [ ] `ProfileIdentityService.isUsernameAvailable()` removido (usa central)
- [ ] Testes passando

### 5.4 Limpeza

- [ ] Rota `/business/:slug` removida
- [ ] Rota `/businesss/:slug` removida
- [ ] Rota `/:slug` standalone removida
- [ ] `BusinessLegacyRoute.tsx` removido
- [ ] `LegacyBusinessRedirect.tsx` removido
- [ ] `StandaloneRoute.tsx` removido
- [ ] Funções deprecated de `urlUtils.ts` removidas
- [ ] Imports mortos removidos
- [ ] Navegação manual antiga migrada
- [ ] Testes de limpeza passando

### 5.5 Módulo Business Reorganizado

- [ ] Componentes de dashboard movidos para `modules/dashboard/`
- [ ] Componentes de UI movidos para `modules/business/`
- [ ] Hooks de management movidos para `modules/business/`
- [ ] `core/business/` contém apenas domínio transversal
- [ ] Barrel exports atualizados
- [ ] Imports corrigidos
- [ ] Testes passando após reorganização

### 5.6 Migrações

- [ ] Migration `profile_username_history` aplicada
- [ ] Migration `identity_cooldown_fields` aplicada
- [ ] Migration `ensure_profile_username` aplicada
- [ ] Índices criados
- [ ] RLS configurado
- [ ] Validação em banco real executada

### 5.7 UI

- [ ] Business: campo de slug com disponibilidade
- [ ] Business: preview de URL canônica
- [ ] Business: preview de URL premium
- [ ] Business: aviso de cooldown
- [ ] Business: histórico visível para dono
- [ ] Profile: campo de username com disponibilidade
- [ ] Profile: preview de URL pública `/u/:username`
- [ ] Profile: aviso de cooldown
- [ ] Profile: histórico visível para dono

### 5.8 Testes E2E

- [ ] Criar business → slug válido → URL canônica funciona
- [ ] Trocar slug → cooldown ativo → erro esperado
- [ ] Trocar slug após 30 dias → sucesso → histórico registrado
- [ ] Criar profile → username válido → `/u/:username` funciona
- [ ] Trocar username → cooldown ativo → erro esperado
- [ ] Acessar URL antiga → redirect 308 → URL atual

### 5.9 Documentação

- [ ] README de `core/public-identity/` criado
- [ ] Guia de migração criado
- [ ] Exemplos de uso documentados
- [ ] Políticas por entidade documentadas
- [ ] Changelog atualizado

---

## RESTRIÇÕES CUMPRIDAS

✅ Sem `/p/:handle` para usuários (usa `/u/:username`)  
✅ Sem username paralelo para empresas (slug é a identidade)  
✅ Sem regex única forçada (policies por entity type)  
✅ Sem legado de business (rotas removidas)  
✅ Sem UI fake de professional (apenas arquitetura preparada)  
✅ Sem duplicação de disponibilidade (camada central única)  
✅ SSOT mantido (BusinessUrlService + PublicIdentityService)  
✅ Módulo business limpo e reorganizado  
✅ Cooldown de 30 dias implementado  
✅ Histórico centralizado  
✅ Reserved names unificados  

---

**Status**: Pronto para implementação  
**Próximo passo**: Aprovação e início da execução
