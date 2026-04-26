# EDUCATION MODULE - TASKS DE IMPLEMENTACAO

## OVERVIEW
Este documento organiza as tasks necessarias para implementar o modulo Education seguindo SSOT, padrao atual do projeto e escalabilidade por nichos.

Referencias obrigatorias:
- `docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md`
- `docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md`

---

## FASE 0: STARTER TECNICO (Prioridade: CRITICA)

### Task 0.1: Scaffold base do modulo
**Descricao**: Criar estrutura minima para iniciar desenvolvimento sem bloquear fases seguintes.  
**Arquivos**:
- `src/modules/business/education/index.ts`
- `src/modules/business/education/README.md`
- `src/modules/business/education/VALIDATION.md`
- `src/modules/business/education/types/index.ts`
- `src/modules/business/education/constants/index.ts`
- `src/modules/business/education/services/index.ts`
- `src/modules/business/education/hooks/index.ts`
- `src/modules/business/education/components/index.ts`
- `src/modules/business/education/pages/index.ts`

**Requisitos**:
- [ ] Exports minimos compilando
- [ ] Sem `any` sem justificativa
- [ ] Build continua passando com placeholders

---

### Task 0.2: Starter de nichos education
**Descricao**: Criar estrutura inicial de nichos no mesmo modelo da gastronomia.  
**Arquivos**:
- `src/modules/business/education/niches/types.ts`
- `src/modules/business/education/niches/registry.ts`
- `src/modules/business/education/niches/index.ts`
- `src/modules/business/education/niches/services/EducationNicheConfigService.ts`
- `src/modules/business/education/niches/hooks/useEducationNiche.ts`

**Requisitos**:
- [ ] Nichos iniciais: `regular_school`, `daycare`, `language_school`
- [ ] Helpers: `getNicheByKey`, `getAllNiches`, `hasCapability`, `getNicheOrDefault`
- [ ] Hook e service compilando com API minima

---

### Task 0.3: Starter de rotas e configuracao global
**Descricao**: Registrar Education no fluxo atual de rotas/config sem UI completa.  
**Arquivos**:
- `src/app/routes/lazyImports.ts`
- `src/app/routes/AppRoutes.tsx`
- `src/config/modules.ts`
- `src/config/territory.ts`

**Requisitos**:
- [ ] Modulo `education` em `modules.ts`
- [ ] `LAUNCH_URLS.education` em `territory.ts`
- [ ] Rotas admin em `/perfil/empresas/:businessId/education/*`
- [ ] Rotas publicas `/educacao/:state/:city/*`
- [ ] Lazy imports education adicionados

---

## FASE 1: DATABASE & MIGRATIONS (Prioridade: CRITICA)

### Task 1.1: Criar migrations base
**Descricao**: Criar tabelas principais do modulo Education.  
**Arquivos**:
- `supabase/migrations/[timestamp]_create_education_profiles.sql`
- `supabase/migrations/[timestamp]_create_education_programs.sql`
- `supabase/migrations/[timestamp]_create_education_leads.sql`
- `supabase/migrations/[timestamp]_create_education_lead_events.sql`
- `supabase/migrations/[timestamp]_create_education_events.sql`

**Requisitos**:
- [ ] `education_profiles` com:
  - `id`, `business_id`, `institution_type`, `summary`
  - `niche_key`, `support_level`, `whatsapp_number`
  - `status` (`draft`, `published`, `paused`), `published_at`, `created_at`, `updated_at`
- [ ] `education_programs` com:
  - `id`, `education_profile_id`, `name`, `description`
  - `age_group`, `shift`, `modality`, `available_slots`, `price_from`
  - `is_active`, `display_order`, `created_at`, `updated_at`
- [ ] `education_leads` com:
  - `id`, `education_profile_id`, `full_name`, `email`, `phone`, `status`
  - `child_name`, `child_age`, `interest_note`, `source_channel`
  - `owner_user_id`, `first_contact_at`, `lost_reason`, `created_at`, `updated_at`
- [ ] `education_lead_events` com:
  - `id`, `lead_id`, `event_type`, `payload` (jsonb), `actor_user_id`, `created_at`
- [ ] `education_events` com:
  - `id`, `education_profile_id`, `title`, `description`, `starts_at`, `ends_at`
  - `location`, `is_public`, `created_at`, `updated_at`

**Validacao**:
- [ ] FKs corretas e comportamento de delete definido
- [ ] Constraints para status validos
- [ ] Trigger `updated_at` nas tabelas necessarias

---

### Task 1.2: Criar indices de performance
**Arquivo**: `supabase/migrations/[timestamp]_add_education_indexes.sql`

**Requisitos**:
- [ ] `education_leads(education_profile_id, status, created_at desc)`
- [ ] `education_programs(education_profile_id, is_active, display_order)`
- [ ] `education_events(education_profile_id, starts_at)`
- [ ] `education_profiles(business_id)`
- [ ] `education_profiles(status, published_at)`

---

### Task 1.3: Implementar RLS
**Arquivo**: `supabase/migrations/[timestamp]_add_education_rls.sql`

**Requisitos**:
- [ ] RLS ativa em todas as tabelas Education
- [ ] Leitura publica somente para dados publicados/publicos
- [ ] Escrita somente para owner/manager autorizado
- [ ] Isolamento por escola garantido em backend

---

## FASE 2: TYPES & CONSTANTS (Prioridade: ALTA)

### Task 2.1: Criar types base
**Arquivos**: `src/modules/business/education/types/*`

**Requisitos**:
- [ ] `education.ts` (perfil, programa, evento)
- [ ] `lead.ts` (lead, pipeline, eventos)
- [ ] `catalog.ts` (catalogo/filtros)
- [ ] `index.ts` com exports centralizados
- [ ] Tipagem sem `any`

---

### Task 2.2: Criar constants
**Arquivos**: `src/modules/business/education/constants/*`

**Requisitos**:
- [ ] `education.ts` (status, labels, support levels)
- [ ] `ui-limits.ts`
- [ ] `subscription-status.ts`
- [ ] `index.ts` centralizado

---

## FASE 3: SERVICES (Prioridade: ALTA)

### Task 3.1: Criar EducationService (facade)
**Arquivo**: `src/modules/business/education/services/EducationService.ts`

**Requisitos**:
- [ ] Orquestrar operacoes de profile/programs/leads/events
- [ ] Validacoes de negocio centrais
- [ ] Integracao com `BusinessService`
- [ ] Tratamento de erro consistente
- [ ] Nao concentrar SQL aqui (delegar para queries/mutations)

---

### Task 3.2: Queries e mutations
**Arquivos**:
- `education.queries.ts`
- `education.mutations.ts`
- `lead.queries.ts`
- `lead.mutations.ts`

**Requisitos**:
- [ ] Acesso a dados tipado
- [ ] Validacao de payload nas mutacoes
- [ ] Error handling padrao
- [ ] Sem duplicacao de regras

---

### Task 3.3: Criar EducationUrlService
**Arquivo**: `EducationUrlService.ts`

**Requisitos**:
- [ ] Integrar com `BusinessUrlService`
- [ ] Gerar URLs canonicas territoriais de education
- [ ] Respeitar entitlement para premium/short link
- [ ] Fallback para visual basico quando necessario

---

### Task 3.4: Criar education-subscription.service
**Arquivo**: `education-subscription.service.ts`

**Requisitos**:
- [ ] Integrar com `core/billing`
- [ ] Ler entitlements reais do projeto
- [ ] Tratar upgrade/downgrade sem hardcode de plano

---

## FASE 4: HOOKS (Prioridade: ALTA)

### Task 4.1: Hooks publicos
**Arquivos**:
- `useEducationList.ts`
- `useEducationDetail.ts`
- `useEducationProfile.ts`

### Task 4.2: Hooks admin
**Arquivos**:
- `useEducationSetup.ts`
- `useEducationLeads.ts`
- `useLeadPipeline.ts`
- `useEducationEvents.ts`

### Task 4.3: Hooks analytics/subscription
**Arquivos**:
- `useEducationAnalytics.ts`
- `useEducationSubscription.ts`

**Requisitos comuns**:
- [ ] React Query com `queryKey` consistente
- [ ] Loading/error/empty state
- [ ] Invalidation correta pos-mutation

---

## FASE 5: NICHES (Prioridade: ALTA)

### Task 5.1: Implementar `types.ts` de nichos
- [ ] `EducationNicheStatus`
- [ ] `EducationNicheCapability`
- [ ] `EducationAdminSection`
- [ ] `EducationNicheConfig`

### Task 5.2: Implementar `registry.ts`
- [ ] Registro SSOT de nichos
- [ ] Helpers de consulta/filtro/capability

### Task 5.3: Implementar `EducationNicheConfigService`
- [ ] Leitura e validacao por nicho
- [ ] Visibilidade de secoes admin por nicho

### Task 5.4: Implementar `useEducationNiche`
- [ ] Expor `config`, `hasCapability`, `shouldShowSection`, `validateForNiche`

### Task 5.5: Versioning/guards de nicho
**Arquivos**:
- `versioning/hooks/useEducationNicheVersioning.ts`
- `versioning/components/EducationAdminSectionGuard.tsx`
- `versioning/components/EducationNicheUpgradeBanner.tsx`

**Requisitos**:
- [ ] Bloquear secoes nao permitidas
- [ ] Mostrar banner de upgrade quando capability/plano bloquear

---

## FASE 6: COMPONENTS (Prioridade: MEDIA)

### Task 6.1: Componentes publicos
- `EducationCard.tsx`
- `EducationHero.tsx`
- `EducationFilters.tsx`
- `EducationCTA.tsx`
- `EducationLeadForm.tsx`

### Task 6.2: Componentes admin/dashboard
- `EducationLeadPipeline.tsx`
- `EducationEventsPanel.tsx`
- `EducationPlanStatusWidget.tsx`
- `dashboard/EducationLeadsSummaryCard.tsx`
- `dashboard/EducationQuickActionsCard.tsx`

### Task 6.3: Componentes analytics
- `analytics/EducationAnalyticsOverviewCard.tsx`
- `analytics/EducationAnalyticsConversionCard.tsx`

**Requisitos**:
- [ ] Responsivo e acessivel
- [ ] Sem logica de negocio pesada no componente
- [ ] Pipeline com mudanca de status (drag-and-drop opcional no MVP)

---

## FASE 7: PAGES (Prioridade: MEDIA)

### Task 7.1: Paginas publicas
- `EducationLandingPage.tsx`
- `EducationDetailPage.tsx`

### Task 7.2: Paginas admin
- `EducationSetupPage.tsx`
- `EducationDashboardPage.tsx`
- `EducationLeadsPage.tsx`
- `EducationBillingPage.tsx`
- `EducationPlansPage.tsx`
- `EducationAnalyticsPage.tsx`

**Requisitos**:
- [ ] Guards de auth/ownership
- [ ] Integracao com nichos (onde aplicavel)
- [ ] WhatsApp CTA visivel no publico
- [ ] `profile_basic` vs `landing_premium` por entitlement

---

## FASE 8: ROUTING & CONFIG (Prioridade: CRITICA)

### Task 8.1: Atualizar AppRoutes
- [ ] Rotas admin em `/perfil/empresas/:businessId/education/*`
- [ ] Rotas publicas territoriais em `/educacao/:state/:city/*`
- [ ] Nao quebrar namespace atual de business/gastronomy

### Task 8.2: Atualizar modules.ts
- [ ] Registrar `education` com metadados completos

### Task 8.3: Atualizar territory.ts
- [ ] Adicionar `LAUNCH_URLS.education`

### Task 8.4: Atualizar lazyImports.ts
- [ ] Lazy imports de todas as paginas education

---

## FASE 9: INTEGRATION (Prioridade: ALTA)

### Task 9.1: Integracao core business
- [ ] `BusinessService`
- [ ] `BusinessOwnershipService`
- [ ] `OpeningHoursService` (quando aplicavel)

### Task 9.2: Integracao billing
- [ ] Entitlements de `core/billing/types.ts`
- [ ] `canUsePremiumPublicPage`
- [ ] `canUseShortPremiumLink`
- [ ] aliases (`canUsePremiumSite`, `canUseShortLink`) quando aplicavel

### Task 9.3: Integracao premium short route
- [ ] Plugar no modelo premium existente, sem criar rota curta paralela
- [ ] Fallback para canonic quando sem entitlement

---

## FASE 10: LGPD & SECURITY (Prioridade: CRITICA)

### Task 10.1: Dados e finalidade
- [ ] Classificar dados sensiveis de menores
- [ ] Minimizar coleta por finalidade

### Task 10.2: Consentimento
- [ ] Registro de consentimento de responsavel
- [ ] Fluxo de revogacao

### Task 10.3: Auditoria
- [ ] Trilhas para alteracoes criticas
- [ ] Campos minimos de auditoria padronizados

### Task 10.4: Upload seguro (quando habilitado)
- [ ] Validacao MIME/extensao/tamanho
- [ ] Signed URLs
- [ ] Scan malware (ou backlog claro se nao implementado no MVP)

---

## FASE 11: TESTING (Prioridade: ALTA)

### Task 11.1: Unit tests
- [ ] Pipeline de leads
- [ ] Services principais
- [ ] Niches (capabilities, section visibility)

### Task 11.2: Integration tests
- [ ] Setup -> publish -> landing
- [ ] Lead -> status -> audit event
- [ ] Downgrade/upgrade afetando premium/basic

### Task 11.3: Security tests
- [ ] Isolamento entre escolas
- [ ] Restricao de admin por role
- [ ] RLS funcionando

---

## FASE 12: VALIDATION & DOCS (Prioridade: CRITICA)

### Task 12.1: Rodar validadores
```bash
npm run typecheck
npm run lint
npm run validate:ssot
npm run check:ssot
npm run validate:architecture:governance -- --json
npm run build
```

### Task 12.2: README do modulo
- [ ] Overview
- [ ] Arquitetura
- [ ] Uso
- [ ] Nichos
- [ ] Billing/entitlements

### Task 12.3: VALIDATION.md do modulo
- [ ] Checklist SSOT
- [ ] Checklist seguranca/LGPD
- [ ] Checklist performance e acessibilidade

---

## FASE 13: DEPLOYMENT PREP (Prioridade: MEDIA)

### Task 13.1: Feature flags
- [ ] `education_module_enabled`
- [ ] `education_premium_enabled`
- [ ] `education_niches_enabled`

### Task 13.2: Observabilidade
- [ ] Eventos de conversao
- [ ] Eventos de erro
- [ ] Metricas principais

### Task 13.3: Guia de deploy
- [ ] Ordem de deploy (migrations primeiro)
- [ ] Rollback plan
- [ ] Smoke tests

---

## DEFINITION OF DONE (DoD)

### Estrutura
- [ ] Modulo em `src/modules/business/education` implementado
- [ ] Nichos implementados com registry/service/hook/guard

### Funcionalidades
- [ ] Rotas admin `/perfil/empresas/:businessId/education/*` funcionando
- [ ] Rotas publicas `/educacao/:state/:city/*` funcionando
- [ ] Profile basic + landing premium por entitlement funcionando
- [ ] Pipeline de leads funcionando
- [ ] WhatsApp CTA visivel

### Qualidade
- [ ] RLS em todas as tabelas
- [ ] Testes unitarios/integracao/seguranca passando
- [ ] Validadores SSOT e build passando

### Documentacao
- [ ] README e VALIDATION.md do modulo completos

### Seguranca e LGPD
- [ ] Consentimento/isolamento/auditoria implementados no escopo do MVP

---

## ESTIMATIVAS

- Fase 0 (Starter tecnico): 1-2 dias
- Fase 1 (Database): 3-5 dias
- Fase 2 (Types/Constants): 1-2 dias
- Fase 3 (Services): 5-7 dias
- Fase 4 (Hooks): 3-4 dias
- Fase 5 (Niches): 4-5 dias
- Fase 6 (Components): 6-9 dias
- Fase 7 (Pages): 5-7 dias
- Fase 8 (Routing/Config): 2-3 dias
- Fase 9 (Integration): 3-4 dias
- Fase 10 (LGPD/Security): 3-5 dias
- Fase 11 (Testing): 4-6 dias
- Fase 12 (Validation/Docs): 2-3 dias
- Fase 13 (Deployment Prep): 2-3 dias

**Total estimado**: 44-65 dias (2-3 meses com 1 dev full-time)

---

## PROXIMOS PASSOS

1. Aprovar este task plan.
2. Quebrar em issues por fase.
3. Executar pela Fase 0.
4. Validar fase a fase sem pular gates de seguranca.

---

**Ultima atualizacao**: 2026-04-26  
**Status**: Pronto para execucao  
**Owner**: Time de Produto

