# Links Internos que Ainda Apontam para Rotas Legadas

## Documento de Rastreio - Fase 1.1

Este documento lista os arquivos que ainda contêm links para rotas legadas `/perfil/empresas/*` e `/perfil/mobilidade/*`, com priorização para migração.

---

## Arquivos Prioritários (Alta Prioridade)

### 1. `src/core/business/utils/businessManagementRoutes.ts`

**Funções que geram rotas legadas:**
- `overview(businessId)` → `/perfil/empresas/${businessId}`
- `dados(businessId)` → `/perfil/empresas/${businessId}/dados`
- `gastronomia(businessId)` → `/perfil/empresas/${businessId}/gastronomia`
- `planos(businessId)` → `/perfil/empresas/${businessId}/planos`
- `linkPremium(businessId)` → `/perfil/empresas/${businessId}/link-premium`
- `analytics(businessId)` → `/perfil/empresas/${businessId}/analytics`
- `configuracoes(businessId)` → `/perfil/empresas/${businessId}/configuracoes`

**Impacto:** Alto - Usado em múltiplos lugares para gerar URLs de empresas

**Ação Futura:** Atualizar funções para gerar rotas `/central/empresas/${businessId}`

---

### 2. `src/core/business/hooks/useBusinessUrls.ts`

**Funções que retornam rotas legadas:**
- `useBusinessUrls()` - Retorna URLs baseadas em `/perfil/empresas/*`

**Impacto:** Alto - Hook usado em componentes de empresas

**Ação Futura:** Atualizar hook para usar rotas `/central/empresas/*`

---

### 3. `src/core/business/services/BusinessUrlService.ts`

**Funções que geram rotas legadas:**
- `getBusinessDashboardUrl()` → `/perfil/empresas/${id}`
- `getBusinessGastronomyUrl()` → `/perfil/empresas/${id}/gastronomia`
- `getBusinessEducationUrl()` → `/perfil/empresas/${id}/education`

**Impacto:** Alto - Serviço central de URLs de empresas

**Ação Futura:** Atualizar serviço para usar rotas `/central/empresas/*`

---

### 4. `src/core/routing/hooks/useAppUrls.ts`

**Propriedades com rotas legadas:**
- `profile.empresas.home` → `/perfil/empresas`
- `profile.empresas.dashboard(businessId)` → `/perfil/empresas/${businessId}`
- `profile.mobilidade.home` → `/perfil/mobilidade`
- `profile.mobilidade.motorista.home` → `/perfil/mobilidade/motorista`
- `profile.mobilidade.motoboy.home` → `/perfil/mobilidade/motoboy`

**Impacto:** Alto - Hook central de URLs da aplicação

**Ação Futura:** Atualizar para usar rotas `/central/*`

---

### 5. `src/modules/profile/utils/profileNavigation.ts`

**Funções com rotas legadas:**
- `getProfileSectionPath('empresas')` → `/perfil/empresas`
- `getProfileSectionPath('mobilidade')` → `/perfil/mobilidade`

**Impacto:** Médio - Usado em navegação do perfil

**Ação Futura:** Atualizar para apontar para `/central/*`

---

### 6. `src/modules/profile/utils/profileMobilityNavigation.ts`

**Funções com rotas legadas:**
- `getProfileMobilityServicePath('motorista')` → `/perfil/mobilidade/motorista`
- `getProfileMobilityServicePath('motoboy')` → `/perfil/mobilidade/motoboy`
- `buildProfileMobilityServiceNavItems()` - Gera itens com rotas legadas

**Impacto:** Médio - Usado em navegação de mobilidade

**Ação Futura:** Atualizar para usar rotas `/central/motorista` e `/central/motoboy`

---

### 7. `src/core/mobility/hooks/useMobilityUrls.ts`

**Funções com rotas legadas:**
- `useMobilityUrls()` - Retorna URLs baseadas em `/perfil/mobilidade/*`

**Impacto:** Médio - Hook usado em componentes de mobilidade

**Ação Futura:** Atualizar para usar rotas `/central/motorista` e `/central/motoboy`

---

## Arquivos Secundários (Média Prioridade)

### 8. `src/modules/profile/pages/PerfilPlanosPage.tsx`

**Links com rotas legadas:**
- Links para `/perfil/empresas` (navegação interna)

**Impacto:** Baixo - Página de planos do perfil

**Ação Futura:** Atualizar links para `/central/empresas`

---

### 9. `src/modules/business/gastronomy/pages/GastronomySetupPage.tsx`

**Links com rotas legadas:**
- Links para `/perfil/empresas/${businessId}` (navegação interna)

**Impacto:** Baixo - Página de setup de gastronomia

**Ação Futura:** Atualizar links para `/central/empresas/${businessId}`

---

### 10. `src/modules/business/dashboard/pages/BusinessDashboardShellPage.tsx`

**Links com rotas legadas:**
- Links para `/perfil/empresas` (botão "Voltar para empresas")
- Links para `/perfil/empresas` (breadcrumbs)

**Impacto:** Médio - Dashboard shell de empresas

**Ação Futura:** Atualizar links para `/central/empresas`

---

### 11. `src/modules/business/education/services/EducationUrlService.ts`

**Funções com rotas legadas:**
- `getEducationDashboardUrl()` → `/perfil/empresas/${businessId}/education`
- `getEducationSetupUrl()` → `/perfil/empresas/${businessId}/education/setup`

**Impacto:** Médio - Serviço de URLs de education

**Ação Futura:** Atualizar para usar rotas `/central/empresas/${businessId}/education`

---

### 12. `src/modules/business/education/pages/*`

**Arquivos:**
- `EducationDashboardPage.tsx`
- `EducationSetupPage.tsx`
- `EducationProgramsPage.tsx`
- `EducationLeadsPage.tsx`
- `EducationPlansPage.tsx`
- `EducationEventsPage.tsx`
- `EducationAnalyticsPage.tsx`

**Links com rotas legadas:**
- Links para `/perfil/empresas/${businessId}` (navegação interna)

**Impacto:** Baixo - Páginas de education

**Ação Futura:** Atualizar links para `/central/empresas/${businessId}`

---

### 13. `src/core/verticals/config.ts`

**Links com rotas legadas:**
- Links para `/perfil/empresas` (configuração de verticals)

**Impacto:** Baixo - Configuração de verticals

**Ação Futura:** Atualizar links para `/central/empresas`

---

### 14. `src/core/profiles/contexts/multi-profile-runtime-context.tsx`

**Links com rotas legadas:**
- Links para `/perfil/empresas` (contexto de perfis)

**Impacto:** Médio - Contexto de perfis

**Ação Futura:** Atualizar links para `/central/empresas`

---

### 15. `src/modules/mobility/components/ActiveRideWidget.tsx`

**Links com rotas legadas:**
- Links para `/perfil/mobilidade/motorista` (widget de corrida ativa)

**Impacto:** Baixo - Widget de corrida

**Ação Futura:** Atualizar links para `/central/motorista`

---

## Arquivos da Central (Já Tratados)

### 16. `src/modules/central/pages/CentralEmpresasPage.tsx`

**Redirecionamento:** `/central/empresas` → `/perfil/empresas`

**Status:** ✅ Documentado em `REDIRECIONAMENTOS_PERFIL.md`

**Ação Futura:** Migrar página para eliminar redirecionamento

---

### 17. `src/modules/central/pages/CentralMotoristaPage.tsx`

**Redirecionamento:** `/central/motorista` → `/perfil/mobilidade/motorista`

**Status:** ✅ Documentado em `REDIRECIONAMENTOS_PERFIL.md`

**Ação Futura:** Migrar página para eliminar redirecionamento

---

### 18. `src/modules/central/pages/CentralMotoboyPage.tsx`

**Redirecionamento:** `/central/motoboy` → `/perfil/mobilidade/motoboy`

**Status:** ✅ Documentado em `REDIRECIONAMENTOS_PERFIL.md`

**Ação Futura:** Migrar página para eliminar redirecionamento

---

## Rotas Legadas (Preservadas)

### 19. `src/app/routes/AppRoutes.tsx`

**Rotas legadas preservadas:**
- `/perfil/empresas` - Lista de empresas
- `/perfil/empresas/:businessId/*` - Todas as sub-rotas de gestão
- `/perfil/mobilidade` - Hub de mobilidade
- `/perfil/mobilidade/motorista/*` - Sub-rotas de motorista
- `/perfil/mobilidade/motoboy/*` - Sub-rotas de motoboy

**Status:** ✅ Preservadas (não removidas)

**Nota:** Rotas legadas continuam funcionando para compatibilidade

---

## Resumo

**Total de Arquivos com Links Legados:** 18

**Prioridade Alta (7 arquivos):**
1. businessManagementRoutes.ts
2. useBusinessUrls.ts
3. BusinessUrlService.ts
4. useAppUrls.ts
5. profileNavigation.ts
6. profileMobilityNavigation.ts
7. useMobilityUrls.ts

**Prioridade Média (7 arquivos):**
8. PerfilPlanosPage.tsx
9. BusinessDashboardShellPage.tsx
10. EducationUrlService.ts
11. multi-profile-runtime-context.tsx
12. verticals.config.ts
13. profileNavigation.ts (já listado)
14. profileMobilityNavigation.ts (já listado)

**Prioridade Baixa (4 arquivos):**
15. GastronomySetupPage.tsx
16. Education pages (7 arquivos)
17. ActiveRideWidget.tsx

**Arquivos da Central (3 arquivos):**
18. CentralEmpresasPage.tsx, CentralMotoristaPage.tsx, CentralMotoboyPage.tsx (já documentados)

---

## Notas Importantes

1. **Migração Gradual:**
   - Não é necessário migrar todos os links nesta fase
   - Rotas legadas continuam funcionando
   - Migração deve ser incremental para evitar regressões

2. **Ordem de Migração Sugerida:**
   - Primeiro: Hooks e serviços centrais (useAppUrls, useBusinessUrls, BusinessUrlService)
   - Depois: Utils de navegação (profileNavigation, profileMobilityNavigation, businessManagementRoutes)
   - Por último: Páginas específicas (DashboardShell, Education pages, etc.)

3. **Compatibilidade:**
   - Preservar compatibilidade com rotas legadas
   - Adicionar parâmetros opcionais para escolher entre rotas legadas e novas
   - Testar migrações gradualmente

---

## Próximos Passos (Fase 2)

1. **Atualizar Hooks Centrais:**
   - `useAppUrls` - Adicionar parâmetro para escolher entre `/central` e `/perfil`
   - `useBusinessUrls` - Adicionar parâmetro para escolher entre `/central/empresas` e `/perfil/empresas`
   - `useMobilityUrls` - Adicionar parâmetro para escolher entre `/central/motorista` e `/perfil/mobilidade/motorista`

2. **Atualizar Serviços:**
   - `BusinessUrlService` - Adicionar métodos para rotas da Central
   - `EducationUrlService` - Adicionar métodos para rotas da Central

3. **Atualizar Utils de Navegação:**
   - `profileNavigation` - Atualizar para apontar para `/central` por padrão
   - `profileMobilityNavigation` - Atualizar para apontar para `/central/motorista` e `/central/motoboy`
   - `businessManagementRoutes` - Atualizar para gerar rotas `/central/empresas`

4. **Atualizar Páginas:**
   - `BusinessDashboardShellPage` - Atualizar links para `/central/empresas`
   - Education pages - Atualizar links para `/central/empresas`
