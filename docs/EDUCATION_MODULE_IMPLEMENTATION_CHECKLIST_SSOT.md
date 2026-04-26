# EDUCATION MODULE - CHECKLIST COMPLETO (SSOT / ESCALAVEL / ATUALIZADO)

## 1) Objetivo deste documento

Este documento e o guia oficial para implementar o modulo `education` no estado atual do projeto, com qualidade AAA, SSOT rigoroso e sem gambiarras.

Resultado esperado:
- vertical `education` para escolas focada em captacao e conversao de matriculas;
- arquitetura alinhada com a estrategia atual: `Business (base)` + `Vertical (especializada)`;
- compatibilidade com rotas e billing ja existentes no projeto;
- fundacao pronta para evolucao futura (academico, frequencia, boletim) sem retrabalho estrutural.

---

## 2) Estado atual do projeto (verdade hoje)

Antes de implementar, assumir estas verdades do repositorio:

- Existe `business` como base canonica.
- A gastronomia esta em `src/modules/business/gastronomy` (nao em `src/modules/gastronomy`).
- Dashboard de empresa usa namespace:
  - `/perfil/empresas/:businessId/...`
- Site premium curto usa:
  - `/p/:slug/*`
  - resolvido por `PremiumBusinessSiteRoute`.
- Entitlements de plano ja existem em `src/core/billing/types.ts` com flags como:
  - `canUsePremiumPublicPage`
  - `canUseShortPremiumLink`
  - alias generico `canUsePremiumSite` / `canUseShortLink`.

Conclusao arquitetural:
- Education deve seguir o mesmo encaixe da gastronomia: vertical dentro de `business`.

---

## 3) Escopo de produto (MVP 60-90 dias)

### 3.1 In scope (obrigatorio)
- Perfil publico da escola.
- Catalogo de programas/turmas.
- Landing publica da vertical.
- Pagina de detalhe da escola.
- Captacao de leads (formulario "tenho interesse").
- Pipeline comercial de matricula:
  - `new -> contacted -> visit_scheduled -> proposal_sent -> enrolled -> lost`.
- Agenda de eventos/visitas.
- Dashboard administrativo da escola.
- Billing/plans da vertical usando core billing.
- Analytics basico de conversao.
- Botao oficial de WhatsApp da escola em perfil padrao e landing premium.

### 3.2 Out of scope (MVP)
- Frequencia por aula.
- Boletim/notas.
- Diario de classe completo.
- Secretaria academica full.
- Emissao fiscal avancada.

---

## 4) Regras SSOT obrigatorias

### 4.1 Fluxo canonico
`Database -> Service -> Hook -> Component/Page`

### 4.2 Regras
- Nao fazer query Supabase direta em componentes/paginas.
- Nao duplicar regra ja existente em `src/core/*`.
- Dados de negocio variaveis no banco.
- Mock isolado de runtime de producao.
- Sem `any` sem justificativa.
- Sem hardcode de entitlement em componente.

### 4.3 Owners canonicos para reuso
- `src/core/business/services/BusinessService.ts`
- `src/core/business/services/BusinessOwnershipService.ts`
- `src/core/business/services/OpeningHoursService.ts`
- `src/core/business/services/BusinessUrlService.ts`
- `src/core/billing/*`
- `src/app/routes/AppRoutes.tsx`
- `src/config/modules.ts`
- `src/config/territory.ts`

---

## 5) Estrutura alvo (atualizada para o projeto)

Criar em:

```txt
src/modules/business/education/
  index.ts
  README.md
  VALIDATION.md
  types/
    education.ts
    lead.ts
    catalog.ts
    index.ts
  constants/
    index.ts
    education.ts
    ui-limits.ts
    subscription-status.ts
  utils/
    index.ts
    education.helpers.ts
  services/
    index.ts
    education.queries.ts
    education.mutations.ts
    education.helpers.ts
    lead.queries.ts
    lead.mutations.ts
    EducationService.ts
    EducationUrlService.ts
    education-subscription.service.ts
  hooks/
    index.ts
    useEducationList.ts
    useEducationDetail.ts
    useEducationProfile.ts
    useEducationSetup.ts
    useEducationLeads.ts
    useLeadPipeline.ts
    useEducationEvents.ts
    useEducationAnalytics.ts
    useEducationSubscription.ts
  components/
    index.ts
    EducationCard.tsx
    EducationHero.tsx
    EducationFilters.tsx
    EducationCTA.tsx
    EducationLeadForm.tsx
    EducationLeadPipeline.tsx
    EducationEventsPanel.tsx
    EducationPlanStatusWidget.tsx
    dashboard/
      EducationLeadsSummaryCard.tsx
      EducationQuickActionsCard.tsx
    analytics/
      EducationAnalyticsOverviewCard.tsx
      EducationAnalyticsConversionCard.tsx
  pages/
    index.ts
    EducationLandingPage.tsx
    EducationDetailPage.tsx
    EducationSetupPage.tsx
    EducationDashboardPage.tsx
    EducationLeadsPage.tsx
    EducationBillingPage.tsx
    EducationPlansPage.tsx
    EducationAnalyticsPage.tsx
  niches/
    index.ts
    README.md
    types.ts
    registry.ts
    services/
      EducationNicheConfigService.ts
    hooks/
      useEducationNiche.ts
    versioning/
      EducationNicheVersioningService.ts
      hooks/
        useEducationNicheVersioning.ts
      components/
        EducationAdminSectionGuard.tsx
        EducationNicheUpgradeBanner.tsx
```

---

## 6) Rotas e navegacao (atualizadas)

## 6.1 Dashboard da empresa (namespace atual)
Adicionar em `AppRoutes` dentro de `/perfil/empresas/:businessId`:

- `education` -> `EducationDashboardPage`
- `education/setup`
- `education/programas`
- `education/leads`
- `education/eventos`
- `education/analytics`
- `education/planos`

## 6.2 Rota publica da vertical
Seguir padrao territorial:
- listagem: `/educacao/:state/:city`
- listagem bairro/grupo: `/educacao/:state/:city/:groupSlugOrDistrict`
- detalhe: `/educacao/:state/:city/:district/:slug`

## 6.3 Integracao com site premium curto
- manter politica global em `/p/:slug/*`;
- Education deve plugar no mesmo mecanismo de entitlement, sem criar rota curta paralela.

## 6.4 Atualizacoes de configuracao global (obrigatorio)
- [ ] Adicionar `education` em `src/config/modules.ts` (id, slug, icon, order, isTerritorial).
- [ ] Adicionar `education` em `LAUNCH_URLS` de `src/config/territory.ts`.
- [ ] Adicionar lazy imports de Education em `src/app/routes/lazyImports.ts`.
- [ ] Garantir que sidebar/menus leiam o modulo via SSOT de `modules.ts`.
- [ ] Evitar hardcode de rotas de education fora de `AppRoutes` e helpers canonicos.

---

## 7) Modelo de dados minimo (MVP)

## 7.1 Tabelas obrigatorias
- `education_profiles`
- `education_programs`
- `education_leads`
- `education_lead_events`
- `education_events`
- `education_messages` (opcional fase 1)

## 7.2 Relacionamentos
- `education_profiles.business_id -> businesses.id`
- `education_programs.education_profile_id -> education_profiles.id`
- `education_leads.education_profile_id -> education_profiles.id`
- `education_lead_events.lead_id -> education_leads.id`
- `education_events.education_profile_id -> education_profiles.id`

## 7.3 Campos chave adicionais (recomendado)
- `education_profiles.niche_key text not null default 'regular_school'`
- `education_profiles.support_level text not null default 'basic_enabled'`
- `education_profiles.whatsapp_number text null`
- `education_profiles.published_at timestamptz null`
- `education_profiles.status text not null default 'draft'` (`draft`, `published`, `paused`)

## 7.4 Regras SQL obrigatorias
- constraints para status pipeline.
- indices:
  - `education_leads(education_profile_id, status, created_at desc)`
  - `education_programs(education_profile_id, is_active, display_order)`
  - `education_events(education_profile_id, starts_at)`
- trigger de `updated_at`.
- RLS em todas as tabelas novas.

---

## 8) Nichos de Education (novo - inspirado na gastronomia)

Sim, e recomendado implementar nichos em education, no mesmo estilo arquitetural de nichos da gastronomia.

## 8.1 Objetivo de nichos
- adaptar UX/fluxos sem duplicar modulo;
- liberar capacidades por nicho e por plano;
- manter um unico core de education.

## 8.2 Nichos iniciais sugeridos
- `regular_school`
- `daycare`
- `language_school`
- `prep_course`
- `technical_school`
- `tutoring_center`
- `music_school`
- `sports_school`

## 8.3 Modelo de nicho (padrao)
Cada nicho deve declarar:
- `nicheKey`
- `displayName`
- `supportLevel` (`full_enabled`, `basic_enabled`, `beta`, `planned`)
- `enabledCapabilities`
- `missingCapabilities`
- `adminSections`
- `isPublic`, `isSelectable`, `isBeta`

## 8.4 Capacidades de nicho (exemplos)
- `class_schedule_public`
- `trial_class_booking`
- `enrollment_pipeline`
- `document_upload_pre_enrollment`
- `guardian_portal_basic`
- `attendance_tracking` (futuro)
- `gradebook` (futuro)
- `transport_tracking` (futuro)

## 8.5 Secoes admin por nicho (exemplos)
- `basic_profile`
- `programs`
- `events`
- `lead_pipeline`
- `documents`
- `guardians`
- `attendance` (futuro)
- `grades` (futuro)

## 8.6 Checklist de implementacao de nichos
- [ ] Criar `registry.ts` de nichos education.
- [ ] Criar `EducationNicheConfigService` (leitura/filtro/validacao/section-guard).
- [ ] Criar hook `useEducationNiche`.
- [ ] Criar guard visual de secoes admin por nicho.
- [ ] Criar banner de upgrade quando nicho/plano bloquear recurso.
- [ ] Cobrir com testes unitarios de capability + visibilidade.

---

## 9) Landing premium vs perfil padrao (atualizado)

## 9.1 Conceitos
- `profile_basic`: perfil publico basico (plano sem premium page).
- `landing_premium`: pagina de conversao completa (assinante com entitlement).

## 9.2 Politica de URL
- URL canonica sempre existe.
- `/p/:slug/*` e atalho premium, governado por entitlement.
- sem entitlement premium, fallback para visual basico na canonic.

## 9.3 Entitlements (usar nomenclatura atual)
Usar flags canonicamente no core billing:
- `canUsePremiumPublicPage`
- `canUseShortPremiumLink`
- aliases genericos quando aplicavel (`canUsePremiumSite`, `canUseShortLink`)

## 9.4 Conteudo minimo `profile_basic`
- nome + resumo;
- endereco/contato/horario;
- whatsapp da escola;
- CTA simples.

## 9.5 Conteudo minimo `landing_premium`
- hero + CTA;
- programas/turmas com metadados;
- diferenciais;
- eventos;
- prova social;
- formulario de lead;
- FAQ curta;
- mapa + contatos.

---

## 10) Admin e RBAC

## 10.1 Roles
- `school_owner`
- `school_manager`
- `school_staff`
- `guardian_view` (futuro)

## 10.2 Regras
- autorizacao em backend via RLS + ownership.
- guard de rota frontend.
- isolamento entre escolas.

## 10.3 Auditoria obrigatoria
Auditar:
- alteracao de perfil.
- alteracao de programa.
- mudanca de status de lead.
- alteracao de configuracao sensivel.

Campos minimos:
- `actor_user_id`, `action`, `resource_type`, `resource_id`, `payload_diff`, `created_at`.

## 10.4 LGPD e seguranca para Education (dados de menores) - Gate obrigatorio
Sem cumprir os itens abaixo, nao liberar features sensiveis de Education:

- [ ] Classificar dados de alunos/responsaveis como sensiveis quando aplicavel.
- [ ] Definir minimizacao de dados por campo e finalidade.
- [ ] Registrar consentimento do responsavel para tratamento/notificacoes sensiveis.
- [ ] Implementar revogacao de consentimento e efeitos no produto.
- [ ] RLS em todas as tabelas de education.
- [ ] Isolamento entre escolas garantido no backend.
- [ ] Trilhas de auditoria para alteracoes criticas.
- [ ] Politica de retencao por tipo de dado.
- [ ] Mascara de dados sensiveis em logs.
- [ ] Upload seguro (MIME/tamanho/signed URL/scan malware) quando documentos forem habilitados.

---

## 11) Integracoes obrigatorias

- [ ] `BusinessService`.
- [ ] `BusinessOwnershipService`.
- [ ] `OpeningHoursService` (quando aplicavel).
- [ ] `core/billing` (planos/entitlements).
- [ ] `BusinessUrlService`/padrao de URL publica.
- [ ] `PremiumBusinessSiteRoute` para experiencia premium curta.

---

## 12) Testes obrigatorios

## 12.1 Unitarios
- pipeline de lead (transicoes validas/invalidas).
- helpers de nicho (capabilities, section visibility).
- services criticos (queries/mutations).

## 12.2 Integracao
- setup -> publicar -> aparecer na landing.
- criar lead -> trocar status -> auditar evento.
- downgrade de plano -> fallback de landing premium para profile basic.

## 12.3 Seguranca/autorizacao
- usuario sem permissao nao acessa admin.
- escola A nao acessa dados da escola B.
- dados publicos nao expõem campos privados.

---

## 13) Validacoes obrigatorias antes de concluir

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run validate:ssot`
- [ ] `npm run check:ssot`
- [ ] `npm run validate:architecture:governance -- --json`
- [ ] `npm run build`
- [ ] testes do modulo education

Falhou:
- [ ] corrigir
- [ ] reexecutar
- [ ] nao finalizar

---

## 14) Definition of Done (DoD)

So considerar pronto quando:
- [ ] modulo em `src/modules/business/education` implementado.
- [ ] rotas no namespace atual (`/perfil/empresas/:businessId/...`) funcionando.
- [ ] rota publica education funcionando no padrao territorial.
- [ ] profile basic + landing premium por entitlement funcionando.
- [ ] nichos education (registry + service + hook + guard) implementados.
- [ ] RLS, testes e validadores passando.
- [ ] README e VALIDATION do modulo atualizados.

---

## 15) Anti-padroes (bloqueio de PR)

Reprovar PR se houver:
- query direta ao banco em componente.
- entitlement hardcoded em UI.
- duplicacao de enum/status/constantes.
- sem RLS nas tabelas novas.
- sem testes de pipeline e nichos.
- mock em runtime de producao.

---

## 16) Sequencia recomendada

1. Migrations + RLS + indices.
2. Types/constants/utils.
3. Services.
4. Hooks.
5. Niches (registry/service/hooks/guards).
6. Components.
7. Pages.
8. Rotas/lazy imports.
9. Testes.
10. Validacao final + docs.

---

## 17) Roadmap futuro (escalabilidade)

## 17.1 Fase futura academica
- frequencia
- boletim
- diario

## 17.2 Fase futura responsavel em tempo real
- status entrada/saida
- notificacoes aos pais

## 17.3 Gate de entrada para fases futuras
Iniciar apenas se:
- demanda recorrente de clientes pagantes;
- impacto em venda/churn comprovado;
- maturidade operacional e juridica (LGPD para menores);
- infraestrutura de eventos/notificacoes confiavel.

---

## 18) Prompt pronto para delegar para outra IA

```txt
Implemente o modulo src/modules/business/education seguindo estritamente:
docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md

Regras obrigatorias:
1) Siga SSOT sem excecao.
2) Sem gambiarra e sem duplicacao de dominio.
3) Fluxo: Database -> Service -> Hook -> Component/Page.
4) Nao use query direta em componente/pagina.
5) Reuse core: BusinessService, BusinessOwnershipService, OpeningHoursService, BusinessUrlService e core/billing.
6) Respeite o namespace de rotas atual: /perfil/empresas/:businessId/...
7) Integre premium site curto no modelo atual /p/:slug/* por entitlement.
8) Implemente nichos de education (registry + service + hook + guard) no mesmo estilo arquitetural da gastronomia.
9) Rode validacoes finais (typecheck, lint, validate:ssot, check:ssot, validate:architecture:governance, build).
10) Nao finalizar ate tudo passar.

Entregar ao final:
- arquivos criados/alterados;
- resumo por fase;
- resultado dos validadores;
- riscos residuais.
```
