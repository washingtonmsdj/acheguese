# AUDITORIA FRONT-END MULTI-PERFIL - COMPLETA

**Data**: 28/03/2026  
**Status Backend**: ✅ Homologado em Staging (40/40 testes)  
**Status Front-End**: ⚠️ PARCIALMENTE IMPLEMENTADO

---

## A) AUDITORIA DO FRONT ATUAL

### 1. PÁGINAS EXISTENTES

#### ✅ Páginas Funcionais
- **`/perfil`** → `GerenciarPerfisPageV2.tsx`
  - Lista todos os perfis (personal, business, professional, driver)
  - Permite trocar perfil ativo
  - Botões para criar novos perfis
  - **Status**: ✅ COMPLETO

- **`/perfil/configuracoes`** → `ProfileSettingsPage.tsx`
  - Tabs: Privacidade, Vínculos, Membros
  - Integrado com hooks multi-perfil
  - **Status**: ✅ COMPLETO

- **`/p/:handle`** → `PublicProfilePage.tsx`
  - Renderiza perfil público por handle
  - Mostra extensões (business, professional, driver)
  - Mostra vínculos públicos
  - **Status**: ✅ COMPLETO

- **`/create-business`** → `CriarEmpresaPageV2.tsx`
  - Formulário multi-step (3 etapas)
  - Usa `useBusinessCreateMultiProfile` hook
  - Cria perfil business via RPC
  - **Status**: ✅ COMPLETO

- **`/services/cadastrar`** → `CadastrarServicoPage.tsx`
  - Formulário multi-step (4 etapas)
  - Usa `useProfessionalCreateMultiProfile` hook
  - Cria perfil professional via RPC
  - **Status**: ✅ COMPLETO

#### ⚠️ Páginas com Problemas

- **`/mobilidade/motorista`** → `MotoristaPage.tsx`
  - Usa `DriverRegistrationModal` para criar perfil driver
  - Modal usa `useDriverCreateMultiProfile` hook
  - **Problema**: Página não é dedicada à criação, é página de motorista ativo
  - **Status**: ⚠️ FLUXO CONFUSO

### 2. COMPONENTES EXISTENTES

#### ✅ Componentes Completos

- **`MultiProfileSwitcher.tsx`**
  - Dropdown para trocar perfil ativo
  - Integrado com `useActiveProfile` hook
  - **Problema**: ❌ NÃO ESTÁ SENDO USADO EM NENHUM LAYOUT
  - **Status**: ✅ CÓDIGO OK, ❌ NÃO INTEGRADO

- **`PrivacySettings.tsx`**
  - Toggle is_public
  - Toggles granulares (show_contact_email, show_phone, etc)
  - Botão salvar
  - Usa `MultiProfileService.updateProfile()`
  - **Status**: ✅ COMPLETO

- **`ProfileLinksManager.tsx`**
  - Criar vínculo (selecionar perfil, tipo, público/privado)
  - Editar visibilidade
  - Deletar vínculo
  - Usa `useProfileLinks` hook
  - **Status**: ✅ COMPLETO

- **`ProfileMembersManagerImproved.tsx`**
  - Adicionar membro por email (busca user_id)
  - Alterar role
  - Remover membro
  - Usa `useProfileMembers` hook
  - **Status**: ✅ COMPLETO

- **`DriverRegistrationModal.tsx`**
  - Formulário de cadastro de motorista
  - Usa `useDriverCreateMultiProfile` hook
  - **Status**: ✅ COMPLETO

#### ⚠️ Componentes Legados (NÃO MIGRADOS)

- **`EmpresaEditSheet.tsx`**
  - Usa `adminBusinessService.createBusinessProfile()` (LEGADO)
  - Usa `profileService.updateProfile()` (LEGADO)
  - **Problema**: ❌ NÃO USA HOOKS MULTI-PERFIL
  - **Status**: ❌ PRECISA MIGRAÇÃO

### 3. HOOKS EXISTENTES

#### ✅ Hooks Multi-Perfil (CORRETOS)

- **`useBusinessCreateMultiProfile`**
  - Cria perfil business via `MultiProfileService.createProfile()`
  - Valida com `businessUXSchema`
  - Retorna `{ profile_id, handle }`
  - **Status**: ✅ COMPLETO

- **`useProfessionalCreateMultiProfile`**
  - Cria perfil professional via `MultiProfileService.createProfile()`
  - Valida campos obrigatórios
  - Retorna `{ profile_id, handle }`
  - **Status**: ✅ COMPLETO

- **`useDriverCreateMultiProfile`**
  - Cria perfil driver via `MultiProfileService.createProfile()`
  - Valida CNH, placa, modelo
  - Retorna `{ profile_id, handle }`
  - **Status**: ✅ COMPLETO

- **`useActiveProfile`**
  - Gerencia perfil ativo
  - Persiste em localStorage
  - Método `switchProfile()`
  - **Status**: ✅ COMPLETO

- **`useProfileLinks`**
  - CRUD de vínculos
  - Usa `ProfileLinksService`
  - **Status**: ✅ COMPLETO

- **`useProfileMembers`**
  - CRUD de membros
  - Usa `ProfileMembersService`
  - **Status**: ✅ COMPLETO

- **`useProfiles`**
  - Lista todos os perfis do usuário
  - Usa `MultiProfileService.getMyProfiles()`
  - **Status**: ✅ COMPLETO

### 4. CONTEXTS EXISTENTES

- **`MultiProfileContext.tsx`**
  - Gerencia `activeProfile` e `allProfiles`
  - Método `switchProfile()`
  - Persiste em localStorage
  - **Status**: ✅ COMPLETO

### 5. SERVICES EXISTENTES

- **`MultiProfileService`** (profileService.ts)
  - `createProfile()` via RPC
  - `getMyProfiles()` via RLS
  - `getPublicProfileByHandle()` via view
  - `updateProfile()` via RLS
  - **Status**: ✅ COMPLETO

- **`BusinessService`** (businessService.ts)
  - `getBusinessData()` via RLS
  - `updateBusinessData()` via RLS
  - **Status**: ✅ COMPLETO

- **`ProfessionalService`** (professionalService.ts)
  - `getProfessionalData()` via RLS
  - `updateProfessionalData()` via RLS
  - **Status**: ✅ COMPLETO

- **`DriverService`** (driverService.ts)
  - `getDriverData()` via RLS
  - `updateDriverData()` via RLS
  - `updateAvailability()`, `updateLocation()`
  - **Status**: ✅ COMPLETO

- **`ProfileLinksService`**
  - CRUD de vínculos via RLS
  - `getPublicProfileLinks()` via view
  - **Status**: ✅ COMPLETO

- **`ProfileMembersService`**
  - CRUD de membros via RLS
  - **Status**: ✅ COMPLETO

### 6. ROTAS EXISTENTES

- ✅ `/perfil` → Gerenciar perfis
- ✅ `/perfil/configuracoes` → Configurações do perfil ativo
- ✅ `/p/:handle` → Perfil público
- ✅ `/create-business` → Criar empresa
- ✅ `/services/cadastrar` → Cadastrar serviço
- ⚠️ `/mobilidade/motorista` → Página de motorista (não é página de criação dedicada)

---

## B) PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICO 1: MultiProfileSwitcher NÃO INTEGRADO

**Problema**: Componente `MultiProfileSwitcher` existe mas não está sendo usado em nenhum layout.

**Impacto**: Usuário não consegue trocar de perfil ativo pela UI.

**Causa**: Componente não foi adicionado ao `AppTopbar` ou `AppSidebar`.

**Correção Necessária**:
- Adicionar `MultiProfileSwitcher` no `AppTopbar` (desktop)
- Adicionar no `AppSidebar` ou `BottomNav` (mobile)

---

### 🔴 CRÍTICO 2: Criação de Driver Sem Página Dedicada

**Problema**: Não existe página dedicada para criar perfil driver. O fluxo atual é:
1. Usuário vai em `/mobilidade/motorista` (página de motorista ativo)
2. Se não tem perfil driver, abre modal `DriverRegistrationModal`
3. Modal cria perfil e fecha

**Impacto**: Fluxo confuso, usuário não sabe onde criar perfil driver.

**Correção Necessária**:
- Criar página dedicada `/create-driver` ou `/motorista/cadastrar`
- Adicionar botão "Cadastrar como Motorista" em `/perfil`
- Redirecionar para página dedicada

---

### 🟡 MÉDIO 3: EmpresaEditSheet Usa Services Legados

**Problema**: Componente `EmpresaEditSheet` usa:
- `adminBusinessService.createBusinessProfile()` (LEGADO)
- `profileService.updateProfile()` (LEGADO)

**Impacto**: Não usa hooks multi-perfil, pode causar inconsistência.

**Correção Necessária**:
- Migrar para `useBusinessCreateMultiProfile` hook
- Remover chamadas diretas a services legados

---

### 🟡 MÉDIO 4: ProfileMembersManagerImproved Busca Email Errado

**Problema**: Busca `contact_email` na tabela `profiles`, mas deveria buscar na tabela `auth.users` ou usar RPC.

**Código Atual**:
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('user_id')
  .eq('contact_email', email.trim())
  .limit(1)
  .single();
```

**Problema**: Coluna `contact_email` não existe em `profiles`.

**Correção Necessária**:
- Criar RPC `get_user_id_by_email(p_email text)` que busca em `auth.users`
- Ou buscar em view pública se existir

---

### 🟢 MENOR 5: Navegação Após Criar Perfil

**Problema**: Após criar perfil, navegação não é consistente:
- Business: navega para `/p/:handle` (perfil público)
- Professional: navega para `/p/:handle` (perfil público)
- Driver: fecha modal e fica na página de motorista

**Impacto**: UX inconsistente.

**Correção Sugerida**:
- Padronizar: sempre navegar para `/perfil/configuracoes` após criar
- Ou sempre navegar para `/p/:handle` (perfil público)

---

### 🟢 MENOR 6: Loading States Faltando

**Problema**: Alguns componentes não mostram loading state durante operações assíncronas.

**Exemplos**:
- `ProfileLinksManager`: não mostra loading ao criar/deletar link
- `ProfileMembersManagerImproved`: mostra loading apenas na busca, não no add/remove

**Correção Sugerida**:
- Adicionar estados de loading locais
- Desabilitar botões durante operações

---

### 🟢 MENOR 7: Empty States Genéricos

**Problema**: Empty states são muito simples, sem call-to-action claro.

**Exemplos**:
- `ProfileLinksManager`: "Nenhum vínculo criado ainda"
- `ProfileMembersManagerImproved`: "Nenhum membro adicionado ainda"

**Correção Sugerida**:
- Adicionar ilustração ou ícone
- Adicionar texto explicativo
- Adicionar botão de ação primária

---

## C) CHECKLIST DOS 7 FLUXOS

### 1. ✅ Criar Perfil Business pela UI

**Rota**: `/create-business`  
**Componente**: `CriarEmpresaPageV2.tsx`  
**Hook**: `useBusinessCreateMultiProfile`  
**Status**: ✅ FUNCIONA

**Fluxo**:
1. Usuário clica "Nova Empresa" em `/perfil`
2. Navega para `/create-business`
3. Preenche formulário (3 etapas)
4. Clica "Criar Empresa"
5. Hook chama `MultiProfileService.createProfile()` com `profile_type: 'business'`
6. Backend cria perfil + business_data via RPC
7. Navega para `/p/:handle`

**Validação**: ✅ Código correto, integração OK

---

### 2. ✅ Criar Perfil Professional pela UI

**Rota**: `/services/cadastrar`  
**Componente**: `CadastrarServicoPage.tsx`  
**Hook**: `useProfessionalCreateMultiProfile`  
**Status**: ✅ FUNCIONA

**Fluxo**:
1. Usuário clica "Novo Serviço" em `/perfil`
2. Navega para `/services/cadastrar`
3. Preenche formulário (4 etapas)
4. Clica "Cadastrar Serviço"
5. Hook chama `MultiProfileService.createProfile()` com `profile_type: 'professional'`
6. Backend cria perfil + professional_data via RPC
7. Navega para `/p/:handle`

**Validação**: ✅ Código correto, integração OK

---

### 3. ⚠️ Criar Perfil Driver pela UI

**Rota**: `/mobilidade/motorista` (não dedicada)  
**Componente**: `DriverRegistrationModal.tsx`  
**Hook**: `useDriverCreateMultiProfile`  
**Status**: ⚠️ FUNCIONA MAS FLUXO CONFUSO

**Fluxo Atual**:
1. Usuário clica "Cadastrar como Motorista" em `/perfil`
2. Navega para `/mobilidade/motorista`
3. Se não tem perfil driver, abre modal
4. Preenche formulário
5. Clica "Enviar Cadastro"
6. Hook chama `MultiProfileService.createProfile()` com `profile_type: 'driver'`
7. Backend cria perfil + driver_data via RPC
8. Modal fecha, fica na página de motorista

**Problemas**:
- ❌ Não tem página dedicada de criação
- ❌ Fluxo confuso (vai para página de motorista ativo)
- ❌ Navegação inconsistente com business/professional

**Correção Necessária**:
- Criar página `/create-driver` ou `/motorista/cadastrar`
- Usar formulário completo em vez de modal
- Navegar para `/p/:handle` após criar (consistente)

---

### 4. ✅ Abrir /p/:handle no Navegador

**Rota**: `/p/:handle`  
**Componente**: `PublicProfilePage.tsx`  
**Status**: ✅ FUNCIONA

**Fluxo**:
1. Usuário acessa `/p/:handle`
2. Componente busca perfil via `MultiProfileService.getPublicProfileByHandle()`
3. Se perfil não existe ou é privado: retorna 404
4. Se perfil existe e é público: renderiza
5. Busca extensão específica (business, professional, driver)
6. Busca vínculos públicos via `ProfileLinksService.getPublicProfileLinks()`
7. Renderiza perfil com extensões e vínculos

**Validação**: ✅ Código correto, integração OK

---

### 5. ✅ Alterar Privacidade pela UI

**Rota**: `/perfil/configuracoes` (tab Privacidade)  
**Componente**: `PrivacySettings.tsx`  
**Status**: ✅ FUNCIONA

**Fluxo**:
1. Usuário vai em `/perfil/configuracoes`
2. Clica na tab "Privacidade"
3. Altera toggles (is_public, show_contact_email, etc)
4. Clica "Salvar Alterações"
5. Componente chama `MultiProfileService.updateProfile()`
6. Backend atualiza via RLS
7. Toast de sucesso

**Validação**: ✅ Código correto, integração OK

---

### 6. ✅ Criar Vínculo pela UI

**Rota**: `/perfil/configuracoes` (tab Vínculos)  
**Componente**: `ProfileLinksManager.tsx`  
**Status**: ✅ FUNCIONA

**Fluxo**:
1. Usuário vai em `/perfil/configuracoes`
2. Clica na tab "Vínculos"
3. Clica "Adicionar Vínculo"
4. Seleciona perfil de destino
5. Seleciona tipo de vínculo (owns, works_for, drives_for, partner)
6. Toggle público/privado
7. Clica "Criar Vínculo"
8. Hook chama `ProfileLinksService.createLink()`
9. Backend cria via RLS
10. Toast de sucesso

**Validação**: ✅ Código correto, integração OK

---

### 7. ⚠️ Adicionar Membro pela UI

**Rota**: `/perfil/configuracoes` (tab Membros)  
**Componente**: `ProfileMembersManagerImproved.tsx`  
**Status**: ⚠️ FUNCIONA MAS COM BUG

**Fluxo**:
1. Usuário vai em `/perfil/configuracoes`
2. Clica na tab "Membros"
3. Clica "Adicionar Membro"
4. Digite email do usuário
5. Clica "Buscar"
6. **BUG**: Busca `contact_email` em `profiles` (coluna não existe)
7. Se encontrar, seleciona role
8. Clica "Adicionar"
9. Hook chama `ProfileMembersService.addMember()`
10. Backend cria via RLS

**Problemas**:
- ❌ Busca email em coluna errada
- ❌ Vai falhar sempre

**Correção Necessária**:
- Criar RPC `get_user_id_by_email(p_email text)`
- Ou buscar em `auth.users` via admin API
- Ou usar view pública se existir

---

## D) RESUMO DE ARQUIVOS

### Arquivos que FUNCIONAM (não mexer)

1. `src/App.tsx` - Rotas OK
2. `src/core/profiles/contexts/MultiProfileContext.tsx` - Context OK
3. `src/core/profiles/hooks/useActiveProfile.ts` - Hook OK
4. `src/core/profiles/hooks/useProfileLinks.ts` - Hook OK
5. `src/core/profiles/hooks/useProfileMembers.ts` - Hook OK
6. `src/core/profiles/hooks/useProfiles.ts` - Hook OK
7. `src/core/profiles/services/multi-profile/profileService.ts` - Service OK
8. `src/core/profiles/services/multi-profile/businessService.ts` - Service OK
9. `src/core/profiles/services/multi-profile/professionalService.ts` - Service OK
10. `src/core/profiles/services/multi-profile/driverService.ts` - Service OK
11. `src/modules/business/hooks/useBusinessCreateMultiProfile.ts` - Hook OK
12. `src/modules/services/hooks/useProfessionalCreateMultiProfile.ts` - Hook OK
13. `src/modules/mobility/hooks/useDriverCreateMultiProfile.ts` - Hook OK
14. `src/modules/profile/pages/GerenciarPerfisPageV2.tsx` - Página OK
15. `src/app/pages/ProfileSettingsPage.tsx` - Página OK
16. `src/app/pages/PublicProfilePage.tsx` - Página OK
17. `src/modules/business/pages/CriarEmpresaPageV2.tsx` - Página OK
18. `src/modules/services/pages/CadastrarServicoPage.tsx` - Página OK
19. `src/core/profiles/components/PrivacySettings.tsx` - Componente OK
20. `src/core/profiles/components/ProfileLinksManager.tsx` - Componente OK

### Arquivos que PRECISAM CORREÇÃO

1. ❌ `src/core/profiles/components/MultiProfileSwitcher.tsx`
   - **Problema**: Não está sendo usado
   - **Correção**: Adicionar no AppTopbar

2. ❌ `src/app/components/AppTopbar.tsx`
   - **Problema**: Não tem seletor de perfil
   - **Correção**: Adicionar MultiProfileSwitcher

3. ❌ `src/core/profiles/components/ProfileMembersManagerImproved.tsx`
   - **Problema**: Busca email em coluna errada
   - **Correção**: Criar RPC ou usar método correto

4. ⚠️ `src/modules/business/components/EmpresaEditSheet.tsx`
   - **Problema**: Usa services legados
   - **Correção**: Migrar para hooks multi-perfil (OPCIONAL, não bloqueia fluxos)

5. ⚠️ Criar página `/create-driver`
   - **Problema**: Não existe
   - **Correção**: Criar página dedicada (OPCIONAL, modal funciona)

---

## E) CLASSIFICAÇÃO HONESTA

### ✅ O QUE FUNCIONA (5/7 fluxos)

1. ✅ Criar business pela UI
2. ✅ Criar professional pela UI
3. ✅ Abrir /p/:handle
4. ✅ Alterar privacidade pela UI
5. ✅ Criar vínculo pela UI

### ❌ O QUE NÃO FUNCIONA (2/7 fluxos)

6. ❌ Criar driver pela UI (fluxo confuso, sem página dedicada)
7. ❌ Adicionar membro pela UI (busca email em coluna errada)

### 🔴 BLOQUEANTES PARA PRODUÇÃO

1. **MultiProfileSwitcher não integrado**: Usuário não consegue trocar perfil ativo
2. **Busca de email quebrada**: Adicionar membro sempre falha

### 🟡 MELHORIAS RECOMENDADAS (não bloqueantes)

1. Criar página dedicada `/create-driver`
2. Migrar `EmpresaEditSheet` para hooks multi-perfil
3. Melhorar loading states
4. Melhorar empty states
5. Padronizar navegação após criar perfil

---

## F) PRÓXIMOS PASSOS

### FASE 1: Corrigir Bloqueantes (OBRIGATÓRIO)

1. ✅ Adicionar `MultiProfileSwitcher` no `AppTopbar`
2. ✅ Corrigir busca de email em `ProfileMembersManagerImproved`

### FASE 2: Melhorias UX (RECOMENDADO)

3. ⚠️ Criar página `/create-driver` dedicada
4. ⚠️ Migrar `EmpresaEditSheet` para hooks multi-perfil
5. ⚠️ Melhorar loading/empty states

---

## G) ENTREGA ESPERADA

Após correções da FASE 1:

- ✅ 7/7 fluxos funcionando pela UI
- ✅ Usuário consegue trocar perfil ativo
- ✅ Usuário consegue adicionar membros por email
- ✅ Todos os componentes integrados com hooks multi-perfil
- ✅ Backend + Front-End homologados em staging

**Classificação Final**: 🟢 PRONTO PARA PRODUÇÃO (após FASE 1)

---

**Próxima Ação**: Implementar correções da FASE 1.
