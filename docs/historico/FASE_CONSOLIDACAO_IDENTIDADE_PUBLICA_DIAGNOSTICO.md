# DIAGNÓSTICO MINUCIOSO: Consolidação Arquitetural de Identidade Pública

**Data**: 2026-03-29  
**Objetivo**: Limpeza estrutural do módulo empresa + fundação transversal de identidade pública

---

## 1. DIAGNÓSTICO MINUCIOSO

### 1.1 Estado Atual da Identidade Pública por Perfil

#### 🏢 EMPRESA (Business)
**Localização**: `src/core/business/`

**Identificador Público Atual**: `slug` (campo em `business_data.slug`)

**Validação e Geração**:
- ✅ `BusinessUrlService.generateSlug()` - normalização kebab-case
- ✅ `BusinessUrlService.generateUniqueSlug()` - verifica colisões
- ✅ `BusinessUrlService.isValidSlug()` - valida formato + reservados
- ⚠️ Usa `isReservedSlug()` de `src/core/routing/reservedSlugs.ts`

**Histórico de Mudança**:
- ✅ Tabela `business_slug_history` implementada (migration 20260329000011)
- ✅ Trigger automático registra mudanças de slug e território
- ✅ `BusinessUrlService.resolveBySlugHistory()` resolve URLs antigas
- ❌ **NÃO TEM** cooldown de troca
- ❌ **NÃO TEM** UI para mostrar histórico ao dono
- ❌ **NÃO TEM** informação de próxima data permitida

**URLs**:
- Canônica: `/empresas/:uf/:cidade/:slug`
- Premium: `/p/:slug` (redirect 308)
- Legado: `/business/:slug` (redirect, **DEVE SER REMOVIDO**)
- Legado typo: `/businesss/:slug` (redirect, **DEVE SER REMOVIDO**)
- Standalone: `/:slug` (redirect, **DEVE SER REMOVIDO**)

**Disponibilidade**:
- ✅ Checagem em `generateUniqueSlug()` via query ao banco
- ❌ **NÃO TEM** endpoint/função pública para UI checar disponibilidade em tempo real

**Problemas Identificados**:
1. Slug é tratado como identificador público, mas não há conceito unificado
2. Validação de formato está em `BusinessUrlService`, não centralizada
3. Reserved slugs vem de fonte externa (`reservedSlugs.ts`)
4. Não há política de cooldown
5. Histórico existe mas não é exposto ao usuário
6. Disponibilidade não é checada em tempo real na UI

---

#### 👤 PERFIL PESSOAL (Personal Profile)
**Localização**: `src/modules/profile/`, `src/core/profiles/`

**Identificador Público Atual**: `username` (campo em `profiles.username`)

**Validação**:
- ✅ Schema Zod em `src/core/profiles/services/validation.ts`
- ✅ Regex: `/^[a-z][a-z0-9_]{2,29}$/` (lowercase, números, underscore, 3-30 chars)
- ✅ Deve começar com letra
- ❌ **NÃO USA** `isReservedSlug()` centralizado
- ❌ **NÃO TEM** lista própria de reserved usernames

**Disponibilidade**:
- ✅ `ProfileService.isUsernameAvailable()` - verifica no banco
- ✅ `ProfileIdentityService.isUsernameAvailable()` - duplicado
- ⚠️ Duas implementações fazendo a mesma coisa

**Histórico de Mudança**:
- ❌ **NÃO TEM** tabela de histórico
- ❌ **NÃO TEM** registro de mudanças anteriores
- ❌ **NÃO TEM** cooldown

**URLs**:
- Pública: `/perfil/:userId` (usa profile_id, **NÃO username**)
- Handle: `/p/:handle` (rota existe em App.tsx mas não está implementada)
- ❌ **NÃO TEM** rota pública por username funcional

**Problemas Identificados**:
1. Username existe mas não é usado para URL pública
2. Validação diferente de business (regex vs isValidSlug)
3. Não compartilha reserved slugs com business
4. Sem histórico de mudanças
5. Sem cooldown
6. Disponibilidade checada mas não exposta na UI
7. Duas implementações de `isUsernameAvailable()` (ProfileService e ProfileIdentityService)

---

#### 💼 PERFIL PROFISSIONAL (Professional)
**Localização**: `src/core/professional/`

**Identificador Público Atual**: ❌ **NÃO TEM**

**Estado**:
- Tabela `professional_data` existe
- Tem `profile_id` mas não tem campo de identificador público próprio
- Não tem slug, não tem username
- Não tem rota pública dedicada
- Acesso via `/services/:id` (usa ID numérico/UUID)

**Problemas Identificados**:
1. Não tem identificador público amigável
2. Não tem rota pública por slug/username
3. Não está preparado para identidade pública

---

### 1.2 Duplicação de Regras

#### Reserved Slugs
**Fonte Única**: `src/core/routing/reservedSlugs.ts`
- ✅ Exporta `RESERVED_SLUGS` array
- ✅ Exporta `isReservedSlug()` função
- ✅ Usado por `BusinessUrlService`
- ❌ **NÃO usado** por validação de username de perfil pessoal
- ❌ **NÃO usado** por professional

**Lista Atual**:
```typescript
RESERVED_SLUGS = [
  // Territoriais
  'ba', 'salvador', 'pituba', ...
  // Módulos
  'empresas', 'servicos', 'classificados', 'eventos', 'comunidade',
  'mobilidade', 'admin', 'dashboard', 'perfil', 'profile',
  // Sistema
  'login', 'logout', 'cadastro', 'sobre', 'contato', 'termos',
  'privacidade', 'ajuda', 'suporte', 'api', 'p', 'business'
]
```

#### Normalização de Slug
**Business**: `BusinessUrlService.generateSlug()`
```typescript
name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/[\s_]+/g, '-')
  .replace(/^-+|-+$/g, '');
```

**Profile**: Usa Zod schema com regex `/^[a-z][a-z0-9_]{2,29}$/`
- Permite underscore
- Não permite hífen
- Formato diferente de business

**Problema**: Dois formatos incompatíveis para identificador público

#### Validação de Formato
**Business**: `isValidSlug()`
- Regex: `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/`
- 2-100 caracteres
- Permite hífen
- Não permite underscore

**Profile**: Zod schema
- Regex: `/^[a-z][a-z0-9_]{2,29}$/`
- 3-30 caracteres
- Permite underscore
- Não permite hífen

**Problema**: Regras conflitantes

---

### 1.3 Rotas Legadas a Remover

#### Rotas de Business Legado
**Arquivo**: `src/App.tsx`

1. `/business/:slug` → `BusinessLegacyRoute`
   - **Status**: Redirect para canônica
   - **Ação**: REMOVER

2. `/businesss/:slug` → `LegacyBusinessRedirect`
   - **Status**: Redirect para canônica (typo histórico)
   - **Ação**: REMOVER

3. `/:slug` → `StandaloneRoute`
   - **Status**: Catch-all que tenta resolver como business
   - **Ação**: REMOVER (ou transformar em 404 direto)

#### Componentes a Remover
1. `src/core/routing/components/BusinessLegacyRoute.tsx`
2. `src/shared/components/routing/LegacyBusinessRedirect.tsx`
3. `src/core/routing/components/StandaloneRoute.tsx`

#### Utilitários Legados
**Arquivo**: `src/shared/utils/urlUtils.ts`

Funções deprecated:
- `gerarUrlEmpresa()` - retorna `/business/:slug`
- `gerarUrlCompletaEmpresa()`
- `gerarTodasUrlsEmpresa()`
- `gerarUrlCanonica()`
- `parseUrlEmpresa()`
- `isUrlLegacy()`
- `extrairSlugLegacy()`

**Ação**: REMOVER todas após migrar consumidores para `BusinessUrlService`

---

### 1.4 Módulo Business - Arquivos Bagunçados

#### Estrutura Atual
```
src/core/business/
├── components/
│   ├── AnalyticsDashboard.tsx
│   ├── CouponManager.tsx
│   ├── EmpresaDashboardTab.tsx
│   └── SubscriptionPlans.tsx
├── hooks/
│   ├── useBusiness.ts
│   ├── useBusinessImageUpload.ts
│   └── useBusinessManagement.ts
├── migrations/
│   └── migrateBusinessDataToCanonical.ts
├── services/
│   ├── BusinessCanonicalAdapter.ts
│   ├── BusinessManagementService.ts
│   ├── BusinessService.ts
│   └── BusinessUrlService.ts ✅ SSOT URLs
├── types/
│   └── Business.ts
├── index.ts
├── MIGRATION_GUIDE.md
└── README.md
```

**Problemas**:
1. Componentes de dashboard misturados com core
2. Hooks de management não estão em módulo dedicado
3. Falta organização clara entre público/interno/admin
4. Barrel exports (`index.ts`) não está organizado

---

### 1.5 Onde Existe Geração Manual de URL

**Busca por**: `gerarUrl`, `/business/`, `/empresas/`

#### Consumidores de Funções Legadas
1. `src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx`
   - Linha 64: `navigate(\`/businesss/${business.slug}\`)`
   - **Ação**: Migrar para `BusinessUrlService.getCanonicalUrl()`

2. Outros arquivos usando `urlUtils.ts` deprecated
   - **Ação**: Buscar e migrar todos

---

### 1.6 Histórico e Cooldown

#### Business Slug History
**Tabela**: `business_slug_history`
```sql
CREATE TABLE business_slug_history (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES business_data(id),
  profile_id UUID,
  old_canonical_url TEXT,
  old_slug TEXT,
  change_reason TEXT CHECK (change_reason IN ('slug_changed', 'territory_changed', 'both')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Trigger**: `trg_business_slug_history`
- Dispara em UPDATE de `slug` ou `location_id`
- Registra URL canônica antiga completa
- Registra motivo da mudança

**Resolução**: `BusinessUrlService.resolveBySlugHistory()`
- Busca `profile_id` por `old_canonical_url`
- Retorna contexto atual da empresa
- Usado para redirect 308

**Faltando**:
- ❌ Cooldown (ex: 30 dias entre mudanças)
- ❌ Campo `last_changed_at` em `business_data`
- ❌ Campo `can_change_after` calculado
- ❌ UI mostrando histórico ao dono
- ❌ UI mostrando próxima data permitida

#### Profile Username History
**Status**: ❌ **NÃO EXISTE**

---

### 1.7 Disponibilidade em Tempo Real

#### Business
- Checagem existe em `generateUniqueSlug()`
- Não é exposta como função pública
- UI não checa disponibilidade enquanto usuário digita

#### Profile
- `ProfileService.isUsernameAvailable()` existe
- `ProfileIdentityService.isUsernameAvailable()` duplicado
- Não é usado na UI de edição

**Faltando**:
- Endpoint/hook para checar disponibilidade em tempo real
- Debounce na UI
- Feedback visual (disponível/indisponível/inválido/reservado)

---

## 2. MAPEAMENTO DE DUPLICAÇÕES

### Validação de Identificador
| Aspecto | Business | Profile | Problema |
|---------|----------|---------|----------|
| Formato | `[a-z0-9][a-z0-9-]*[a-z0-9]` | `[a-z][a-z0-9_]{2,29}` | Incompatível |
| Separador | Hífen `-` | Underscore `_` | Diferente |
| Tamanho | 2-100 chars | 3-30 chars | Diferente |
| Início | Letra ou número | Apenas letra | Diferente |
| Reserved | Usa `isReservedSlug()` | Não usa | Inconsistente |

### Checagem de Disponibilidade
| Perfil | Função | Localização |
|--------|--------|-------------|
| Business | `generateUniqueSlug()` | `BusinessUrlService` |
| Profile | `isUsernameAvailable()` | `ProfileService` |
| Profile | `isUsernameAvailable()` | `ProfileIdentityService` |

**Problema**: 3 implementações diferentes

### Histórico
| Perfil | Tabela | Trigger | Resolução |
|--------|--------|---------|-----------|
| Business | ✅ `business_slug_history` | ✅ Sim | ✅ `resolveBySlugHistory()` |
| Profile | ❌ Não existe | ❌ Não | ❌ Não |
| Professional | ❌ Não existe | ❌ Não | ❌ Não |

---

## 3. DÍVIDAS ESTRUTURAIS IDENTIFICADAS

### 3.1 Arquitetura
1. **Sem camada transversal de identidade pública**
   - Cada módulo implementa sua própria lógica
   - Duplicação de código e regras
   - Inconsistência entre perfis

2. **Validação espalhada**
   - Business: `BusinessUrlService`
   - Profile: `validation.ts` com Zod
   - Sem fonte única de verdade

3. **Reserved slugs não compartilhados**
   - Business usa `reservedSlugs.ts`
   - Profile não usa
   - Professional não tem

4. **Histórico apenas para business**
   - Profile não registra mudanças
   - Impossível rastrear username anterior
   - Sem auditoria

5. **Sem política de cooldown**
   - Usuário pode trocar identificador infinitamente
   - Risco de abuso
   - Sem controle temporal

### 3.2 Modelagem
1. **business_slug_history é específico**
   - Não serve para outros perfis
   - Precisa de estrutura transversal ou manter separado

2. **Falta campo de controle temporal**
   - `last_identifier_change_at`
   - `can_change_identifier_after`

3. **Username de profile não é usado**
   - Campo existe mas URL pública usa `profile_id`
   - Rota `/p/:handle` não funciona

### 3.3 UI/UX
1. **Sem feedback de disponibilidade**
   - Usuário só descobre se identificador está em uso ao salvar
   - Experiência ruim

2. **Sem preview de URL**
   - Business: não mostra URL canônica ao editar slug
   - Profile: não mostra URL pública ao editar username

3. **Sem informação de cooldown**
   - Usuário não sabe quando pode trocar novamente
   - Sem transparência

4. **Sem histórico visível**
   - Dono não vê mudanças anteriores
   - Sem auditoria pessoal

### 3.4 Testes
1. **Sem testes de cooldown**
   - Funcionalidade não existe

2. **Sem testes de disponibilidade em tempo real**
   - Não há endpoint para testar

3. **Sem testes de reserved slugs transversais**
   - Cada módulo testa separadamente

---

## 4. CONSUMIDORES DE ROTAS LEGADAS

### `/business/:slug`
**Arquivo**: `src/App.tsx` linha 298
```tsx
<Route path="/business/:slug" element={<BusinessLegacyRoute />} />
```

**Componente**: `src/core/routing/components/BusinessLegacyRoute.tsx`
- Resolve por slug ou UUID
- Redireciona para canônica
- **Ação**: REMOVER

### `/businesss/:slug`
**Arquivo**: `src/App.tsx` linha 403
```tsx
<Route path="/businesss/:slug" element={<LegacyBusinessRedirect />} />
```

**Componente**: `src/shared/components/routing/LegacyBusinessRedirect.tsx`
- Typo histórico (dois 's')
- Redireciona para canônica
- **Ação**: REMOVER

### `/:slug`
**Arquivo**: `src/App.tsx` linha 467
```tsx
<Route path="/:slug" element={<StandaloneRoute />} />
```

**Componente**: `src/core/routing/components/StandaloneRoute.tsx`
- Catch-all que tenta resolver como business
- Bloqueia slugs reservados
- **Ação**: REMOVER ou transformar em 404

### Navegação Manual
**Arquivo**: `src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx` linha 64
```tsx
navigate(`/businesss/${business.slug}`);
```
**Ação**: Migrar para `BusinessUrlService.getCanonicalUrl()`

---

## 5. ARQUIVOS DO MÓDULO BUSINESS APÓS MUDANÇAS

### Componentes Misturados
```
src/core/business/components/
├── AnalyticsDashboard.tsx      → Mover para src/modules/dashboard/
├── CouponManager.tsx           → Mover para src/modules/business/
├── EmpresaDashboardTab.tsx     → Mover para src/modules/dashboard/
└── SubscriptionPlans.tsx       → Mover para src/modules/business/
```

### Hooks de Management
```
src/core/business/hooks/
├── useBusiness.ts              → OK (core)
├── useBusinessImageUpload.ts   → Mover para src/modules/business/
└── useBusinessManagement.ts    → Mover para src/modules/business/
```

### Services
```
src/core/business/services/
├── BusinessCanonicalAdapter.ts → OK
├── BusinessManagementService.ts → OK
├── BusinessService.ts          → OK
└── BusinessUrlService.ts       → OK ✅ SSOT
```

---

## RESUMO EXECUTIVO

### Problemas Críticos
1. ❌ Sem camada transversal de identidade pública
2. ❌ Validação duplicada e inconsistente entre perfis
3. ❌ Reserved slugs não compartilhados
4. ❌ Histórico apenas para business
5. ❌ Sem cooldown em nenhum perfil
6. ❌ Disponibilidade não exposta na UI
7. ❌ Rotas legadas ainda ativas
8. ❌ Módulo business desorganizado
9. ❌ Username de profile não usado para URL pública
10. ❌ Professional sem identificador público

### Escopo da Fase
- ✅ Criar fundação transversal `core/public-identity`
- ✅ Migrar business para usar fundação
- ✅ Migrar profile para usar fundação
- ✅ Implementar cooldown de 30 dias
- ✅ Implementar checagem de disponibilidade em tempo real
- ✅ Remover rotas legadas
- ✅ Limpar módulo business
- ✅ Criar UI de edição com preview e disponibilidade
- ⚠️ Professional: preparar arquitetura mas não implementar UI se não houver perfil público real

### Próximos Passos
Aguardando aprovação para prosseguir com:
1. Arquitetura final escolhida
2. Arquivos a criar/alterar/remover
3. Testes e validações
4. Checklist final de aceite
