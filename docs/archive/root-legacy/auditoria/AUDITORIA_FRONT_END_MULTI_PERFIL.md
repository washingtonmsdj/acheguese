# AUDITORIA FRONT-END MULTI-PERFIL

**Data**: 2026-03-28  
**Objetivo**: Mapear estado atual da UI multi-perfil e identificar gaps nos 7 fluxos críticos

---

## A) ESTADO ATUAL DO FRONT-END

### 1. ARQUITETURA DE SERVICES

#### Services Multi-Perfil (NOVOS - FASE 3)
✅ **Localizados em**: `src/core/profiles/services/multi-profile/`

- `MultiProfileService` - Operações de perfil via RPC `create_profile_with_extension`
- `BusinessService` - Extensão business (get/update)
- `ProfessionalService` - Extensão professional (get/update)
- `DriverService` - Extensão driver (get/update/availability/location)
- `ProfileLinksService` - Vínculos entre perfis
- `ProfileMembersService` - Membros de perfis business/professional
- `AdminService` - Operações admin (verify/suspend)

**Método de Criação**: `MultiProfileService.createProfile(input)` → chama RPC `create_profile_with_extension`

#### Services Legados (ANTIGOS - PRÉ-FASE 3)
⚠️ **Localizados em**: `src/core/profiles/services/ProfileService.ts`, `src/core/business/services/BusinessService.ts`, `src/core/professional/services/ProfessionalService.ts`

- `ProfileService.createProfile()` - Cria profile direto na tabela (INSERT)
- `BusinessService.createBusiness()` - Cria profile legado + business_data
- `ProfessionalService.createProfessional()` - Cria profile legado + professional_data

**Método de Criação**: `profileService.createProfile()` → INSERT direto em `profiles` (não usa RPC)

**⚠️ PROBLEMA CRÍTICO IDENTIFICADO**:
- **BusinessService** e **ProfessionalService** usam `profileService.createProfile()` (legado)
- **NÃO usam** `MultiProfileService.createProfile()` (novo)
- Isso significa que criar business/professional pela UI atual **NÃO cria perfis multi-perfil reais**
- Cria perfis legados sem extensões corretas

---

### 2. HOOKS DISPONÍVEIS

✅ **Hooks Multi-Perfil** (conectados aos services novos):
- `useActiveProfile()` - Perfil ativo + lista + troca
- `useProfiles()` - Lista todos os perfis do usuário
- `useProfileLinks()` - CRUD de vínculos
- `useProfileMembers()` - CRUD de membros

✅ **Context**:
- `MultiProfileContext` - Provider com perfil ativo + lista + troca

---

### 3. COMPONENTES EXISTENTES

✅ **Componentes Multi-Perfil** (FASE 5-6):
- `MultiProfileSwitcher.tsx` - Dropdown para trocar perfil ativo
- `PrivacySettings.tsx` - Configurações de privacidade granular
- `ProfileLinksManager.tsx` - Gerenciar vínculos
- `ProfileMembersManager.tsx` - Gerenciar membros

**Status**: Componentes implementados e conectados aos hooks corretos

---

### 4. PÁGINAS EXISTENTES

#### Páginas Multi-Perfil
✅ `ProfileSettingsPage.tsx` - `/perfil/configuracoes`
- Tabs: Privacidade, Vínculos, Membros
- Usa `useActiveProfile()` + componentes multi-perfil
- **Status**: FUNCIONAL

✅ `PublicProfilePage.tsx` - `/p/:handle`
- Renderiza perfil público por tipo (personal, business, professional, driver)
- Usa `MultiProfileService.getPublicProfileByHandle()`
- Renderiza extensões específicas por tipo
- **Status**: FUNCIONAL

#### Páginas de Criação (LEGADAS)
⚠️ `CriarEmpresaPageV2.tsx` - `/create-business`
- Usa `useBusinessCreate()` → `BusinessService.createBusiness()`
- **PROBLEMA**: Cria profile legado, não multi-perfil
- **Status**: QUEBRADO (não cria perfil multi-perfil real)

⚠️ `CadastrarServicoPage.tsx` - `/services/cadastrar`
- Usa `ProfessionalService.createProfessional()`
- **PROBLEMA**: Cria profile legado, não multi-perfil
- **Status**: QUEBRADO (não cria perfil multi-perfil real)

⚠️ `DriverRegistrationModal.tsx` - Modal em `MotoristaPage`
- Usa `profileIdentityService.createProfile()` (legado)
- Depois cria `driver_data` via `mobilityService.createDriverData()`
- **PROBLEMA**: Cria profile legado, não multi-perfil
- **Status**: QUEBRADO (não cria perfil multi-perfil real)

⚠️ `GerenciarPerfisPage.tsx` - `/perfil` (legado)
- Lista perfis usando `SessionContext` (não `MultiProfileContext`)
- Botão "Nova Empresa" → navega para `/create-business` (legado)
- **Status**: DESATUALIZADO (não usa multi-perfil)

---

## B) ANÁLISE DOS 7 FLUXOS CRÍTICOS

### FLUXO 1: Criar perfil business pela UI
**Rota atual**: `/create-business` → `CriarEmpresaPageV2.tsx`

**Problema**:
```typescript
// CriarEmpresaPageV2 usa:
useBusinessCreate() 
  → BusinessService.createBusiness()
    → profileService.createProfile() // ❌ LEGADO
      → INSERT direto em profiles
```

**O que deveria fazer**:
```typescript
MultiProfileService.createProfile({
  profile_type: 'business',
  handle: 'minha-empresa',
  display_name: 'Minha Empresa',
  extension_data: { /* business data */ }
})
  → RPC create_profile_with_extension // ✅ CORRETO
```

**Status**: ❌ QUEBRADO - Cria profile legado sem extensão multi-perfil

---

### FLUXO 2: Criar perfil professional pela UI
**Rota atual**: `/services/cadastrar` → `CadastrarServicoPage.tsx`

**Problema**:
```typescript
// CadastrarServicoPage usa:
ProfessionalService.createProfessional()
  → profileService.createProfile() // ❌ LEGADO
    → INSERT direto em profiles
```

**O que deveria fazer**:
```typescript
MultiProfileService.createProfile({
  profile_type: 'professional',
  handle: 'meu-servico',
  display_name: 'Meu Serviço',
  extension_data: { /* professional data */ }
})
  → RPC create_profile_with_extension // ✅ CORRETO
```

**Status**: ❌ QUEBRADO - Cria profile legado sem extensão multi-perfil

---

### FLUXO 3: Criar perfil driver pela UI
**Rota atual**: Modal em `/mobilidade/motorista` → `DriverRegistrationModal.tsx`

**Problema**:
```typescript
// DriverRegistrationModal usa:
profileIdentityService.createProfile() // ❌ LEGADO
  → INSERT direto em profiles
mobilityService.createDriverData() // Cria driver_data separado
```

**O que deveria fazer**:
```typescript
MultiProfileService.createProfile({
  profile_type: 'driver',
  handle: 'motorista-joao',
  display_name: 'João - Motorista',
  extension_data: { /* driver data */ }
})
  → RPC create_profile_with_extension // ✅ CORRETO
```

**Status**: ❌ QUEBRADO - Cria profile legado sem extensão multi-perfil

---

### FLUXO 4: Abrir /p/:handle no navegador
**Rota**: `/p/:handle` → `PublicProfilePage.tsx`

**Implementação atual**:
```typescript
// 1. Busca perfil base
const baseProfile = await MultiProfileService.getPublicProfileByHandle(handle);

// 2. Busca extensão por tipo
if (baseProfile.profile_type === 'business') {
  fullProfile = await MultiProfileService.getPublicBusinessProfile(handle);
} else if (baseProfile.profile_type === 'professional') {
  fullProfile = await MultiProfileService.getPublicProfessionalProfile(handle);
} else if (baseProfile.profile_type === 'driver') {
  fullProfile = await MultiProfileService.getPublicDriverProfile(handle);
}

// 3. Renderiza extensão específica
{profile.profile_type === 'business' && (
  <div>Informações da Empresa</div>
)}
```

**Status**: ✅ FUNCIONAL - Usa services multi-perfil corretos, renderiza por tipo

**⚠️ DEPENDÊNCIA**: Só funciona se perfil foi criado via `create_profile_with_extension`. Perfis legados não aparecem corretamente.

---

### FLUXO 5: Alterar privacidade pela UI
**Rota**: `/perfil/configuracoes` → `ProfileSettingsPage.tsx` → Tab "Privacidade"

**Implementação atual**:
```typescript
// ProfileSettingsPage usa:
const { activeProfile } = useActiveProfile(); // ✅ Multi-perfil

// PrivacySettings usa:
await MultiProfileService.updateProfile(profile.id, settings); // ✅ Correto
```

**Status**: ✅ FUNCIONAL - Usa services multi-perfil corretos

**⚠️ DEPENDÊNCIA**: Só funciona se perfil ativo foi criado via multi-perfil

---

### FLUXO 6: Criar vínculo pela UI
**Rota**: `/perfil/configuracoes` → `ProfileSettingsPage.tsx` → Tab "Vínculos"

**Implementação atual**:
```typescript
// ProfileLinksManager usa:
const { createLink } = useProfileLinks(profileId); // ✅ Multi-perfil

// Hook chama:
await ProfileLinksService.createLink(profileId, toProfileId, linkType, isPublic, displayOrder);
```

**Status**: ✅ FUNCIONAL - Usa services multi-perfil corretos

**⚠️ DEPENDÊNCIA**: Só funciona se ambos os perfis foram criados via multi-perfil

---

### FLUXO 7: Adicionar membro pela UI
**Rota**: `/perfil/configuracoes` → `ProfileSettingsPage.tsx` → Tab "Membros"

**Implementação atual**:
```typescript
// ProfileMembersManager usa:
const { addMember } = useProfileMembers(profileId); // ✅ Multi-perfil

// Hook chama:
await ProfileMembersService.addMember(profileId, userId, role);
```

**Status**: ✅ FUNCIONAL - Usa services multi-perfil corretos

**⚠️ PROBLEMA UX**: Input pede `user_id` (UUID), não email. Usuário não sabe UUID de outros usuários.

---

## C) CAUSA RAIZ DOS PROBLEMAS

### PROBLEMA 1: Dualidade de Services
Existem **DOIS sistemas de criação de perfil** rodando em paralelo:

1. **Sistema NOVO (Multi-Perfil)** - FASE 3
   - `MultiProfileService.createProfile()` → RPC `create_profile_with_extension`
   - Cria perfil + extensão atomicamente
   - Usado por: NINGUÉM na UI atual

2. **Sistema LEGADO (Pré-Fase 3)**
   - `profileService.createProfile()` → INSERT direto
   - `BusinessService.createBusiness()` → profile legado + business_data
   - `ProfessionalService.createProfessional()` → profile legado + professional_data
   - Usado por: CriarEmpresaPageV2, CadastrarServicoPage, DriverRegistrationModal

**Resultado**: Perfis criados pela UI atual são legados e incompatíveis com sistema multi-perfil.

### PROBLEMA 2: Páginas de Criação Não Migradas
As 3 páginas de criação (business, professional, driver) ainda usam services legados:
- `CriarEmpresaPageV2` → `BusinessService.createBusiness()` (legado)
- `CadastrarServicoPage` → `ProfessionalService.createProfessional()` (legado)
- `DriverRegistrationModal` → `profileIdentityService.createProfile()` (legado)

### PROBLEMA 3: UX de Membros
`ProfileMembersManager` pede `user_id` (UUID) em vez de email/username. Usuário não sabe UUID de outros usuários.

---

## D) LISTA DE ARQUIVOS A ALTERAR

### CORREÇÕES OBRIGATÓRIAS (Criar perfis multi-perfil reais)

1. **`src/modules/business/hooks/useBusinessCreate.ts`**
   - Trocar `BusinessService.createBusiness()` por `MultiProfileService.createProfile()`
   - Passar `extension_data` com dados business

2. **`src/modules/services/pages/CadastrarServicoPage.tsx`**
   - Trocar `ProfessionalService.createProfessional()` por `MultiProfileService.createProfile()`
   - Passar `extension_data` com dados professional

3. **`src/modules/mobility/components/DriverRegistrationModal.tsx`**
   - Trocar `profileIdentityService.createProfile()` por `MultiProfileService.createProfile()`
   - Passar `extension_data` com dados driver

### MELHORIAS UX (Não bloqueantes, mas importantes)

4. **`src/core/profiles/components/ProfileMembersManager.tsx`**
   - Trocar input de `user_id` por busca de email/username
   - Adicionar autocomplete ou busca de usuários

5. **`src/modules/profile/pages/GerenciarPerfisPage.tsx`**
   - Atualizar para usar `MultiProfileContext` em vez de `SessionContext`
   - Adicionar botões para criar professional e driver (não só business)

### NOVOS COMPONENTES (Opcional, para melhorar UX)

6. **`src/core/profiles/components/CreateProfileModal.tsx`** (NOVO)
   - Modal genérico para criar qualquer tipo de perfil
   - Formulário dinâmico por tipo
   - Usa `MultiProfileService.createProfile()`

---

## E) CORREÇÕES IMPLEMENTADAS

### NENHUMA AINDA

Aguardando aprovação para iniciar correções.

---

## F) CHECKLIST FINAL DE INTERFACE

### Status dos 7 Fluxos:

| # | Fluxo | Status Atual | Bloqueio |
|---|-------|--------------|----------|
| 1 | Criar business pela UI | ❌ QUEBRADO | Usa service legado |
| 2 | Criar professional pela UI | ❌ QUEBRADO | Usa service legado |
| 3 | Criar driver pela UI | ❌ QUEBRADO | Usa service legado |
| 4 | Abrir /p/:handle | ⚠️ FUNCIONAL* | *Só se perfil for multi-perfil |
| 5 | Alterar privacidade pela UI | ⚠️ FUNCIONAL* | *Só se perfil for multi-perfil |
| 6 | Criar vínculo pela UI | ⚠️ FUNCIONAL* | *Só se perfis forem multi-perfil |
| 7 | Adicionar membro pela UI | ⚠️ FUNCIONAL* | *Só se perfil for multi-perfil + UX ruim (pede UUID) |

**Legenda**:
- ✅ FUNCIONAL: Implementado e funcionando
- ⚠️ FUNCIONAL*: Implementado mas com dependências/limitações
- ❌ QUEBRADO: Implementado mas não funciona com multi-perfil

---

## G) LIMITES DESTA FASE

### O QUE SOBROU NÃO RESOLVIDO

#### 1. Services Legados Ainda Existem
- `BusinessService.createBusiness()` (legado)
- `ProfessionalService.createProfessional()` (legado)
- `profileService.createProfile()` (legado)

**Por que sobrou**: Esses services são usados em MUITOS lugares do código. Refatorar todos os usos está fora do escopo desta fase.

**Solução proposta**: Criar wrappers ou deprecar gradualmente.

#### 2. UX de Membros Pede UUID
`ProfileMembersManager` pede `user_id` em vez de email/username.

**Por que sobrou**: Requer busca de usuários por email, que pode não estar implementada no backend.

**Solução proposta**: Adicionar RPC `search_users_by_email` ou usar autocomplete.

#### 3. GerenciarPerfisPage Desatualizado
Página `/perfil` ainda usa `SessionContext` legado.

**Por que sobrou**: Página legada que precisa ser refatorada ou substituída.

**Solução proposta**: Migrar para `MultiProfileContext` ou criar nova página.

---

## H) CLASSIFICAÇÃO

### Tipo de Problema por Fluxo

| Fluxo | Tipo de Bug |
|-------|-------------|
| 1. Criar business | ❌ BUG DE INTEGRAÇÃO (service legado) |
| 2. Criar professional | ❌ BUG DE INTEGRAÇÃO (service legado) |
| 3. Criar driver | ❌ BUG DE INTEGRAÇÃO (service legado) |
| 4. Abrir /p/:handle | ✅ OK (mas depende de perfis multi-perfil) |
| 5. Alterar privacidade | ✅ OK (mas depende de perfis multi-perfil) |
| 6. Criar vínculo | ✅ OK (mas depende de perfis multi-perfil) |
| 7. Adicionar membro | ⚠️ BUG DE UX (pede UUID em vez de email) |

**Conclusão**: 3 bugs de integração bloqueantes + 1 bug de UX não bloqueante.

---

## I) PRÓXIMOS PASSOS

### FASE 1: Corrigir Criação de Perfis (BLOQUEANTE)
1. Migrar `useBusinessCreate` para usar `MultiProfileService`
2. Migrar `CadastrarServicoPage` para usar `MultiProfileService`
3. Migrar `DriverRegistrationModal` para usar `MultiProfileService`

### FASE 2: Melhorar UX (NÃO BLOQUEANTE)
4. Adicionar busca de usuários por email em `ProfileMembersManager`
5. Atualizar `GerenciarPerfisPage` para usar `MultiProfileContext`
6. Adicionar botões para criar professional/driver em `GerenciarPerfisPage`

### FASE 3: Validação Manual
7. Testar cada fluxo manualmente no navegador
8. Gerar evidências visuais (prints/logs)
9. Reclassificar status final

---

**FIM DA AUDITORIA**
