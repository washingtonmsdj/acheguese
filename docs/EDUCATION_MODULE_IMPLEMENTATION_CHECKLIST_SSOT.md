# EDUCATION MODULE - CHECKLIST COMPLETO (SSOT / SEM GAMBIARRA)

## 1) Objetivo deste documento

Este documento e um guia de execucao para outra IA implementar o modulo `education` neste projeto com qualidade AAA, seguindo SSOT e sem duplicacoes.

Resultado esperado:
- modulo novo para escolas focado em aquisicao e conversao de matriculas;
- arquitetura alinhada ao padrao existente em `gastronomy`;
- sem quebrar contratos existentes;
- sem criar camada paralela de verdade.

Nao e objetivo deste escopo:
- gestao pedagogica completa (frequencia, boletim, diario de classe, secretaria academica full).

---

## 2) Escopo de produto (MVP 60-90 dias)

### 2.1 In scope (obrigatorio)
- Perfil publico da escola (institucional, diferenciais, contatos, horarios, endereco).
- Catalogo de programas/turmas (faixa etaria, turno, vagas, faixa de preco).
- Landing publica da vertical.
- Pagina de detalhe da escola.
- Captacao de leads (formulario "tenho interesse").
- Pipeline comercial basico de lead (`new -> contacted -> visit_scheduled -> proposal_sent -> enrolled -> lost`).
- Agenda de eventos/visitas abertas.
- Dashboard da escola (resumo de leads, conversao, proximas acoes).
- Billing/plans da vertical reaproveitando core billing existente.
- Analytics basico de conversao da vertical.

### 2.2 Out of scope (proibido neste ciclo)
- Frequencia por aula.
- Lancamento de notas.
- Boletim.
- Diario de classe.
- Controle financeiro academico completo.
- Emissao fiscal complexa.

---

## 3) Regras duras de arquitetura (SSOT)

### 3.1 Fluxo canonico de dados (obrigatorio)
`Database -> Service -> Hook -> Component/Page`

### 3.2 Regras SSOT obrigatorias
- Nao fazer query Supabase direta em componente/pagina.
- Nao duplicar regras que ja existem em `src/core/*`.
- Dados de negocio variaveis vao para banco, nao hardcoded.
- Constantes tecnicas podem ficar em codigo (timeouts, limites de pagina, etc).
- Mock nao pode contaminar producao.
- Todo arquivo novo deve ter responsabilidade clara.

### 3.3 Reuso de fontes canonicas do projeto
- Base de empresa: `src/core/business/services/BusinessService.ts`
- Ownership: `src/core/business/services/BusinessOwnershipService.ts`
- Horarios: `src/core/business/services/OpeningHoursService.ts`
- Billing: `src/core/billing/*`
- Rotas app: `src/app/routes/AppRoutes.tsx`

### 3.4 Anti-padroes proibidos
- "Temporary fix" sem ticket.
- Conversao de tipo com `as any`.
- Duplicar enums/status em multiplos lugares.
- Service chamando hook.
- Hook contendo regra de negocio pesada.
- Componente com mais de 1 responsabilidade de dominio.

---

## 4) Estrutura alvo de pastas/arquivos

Criar modulo seguindo o padrao de `src/modules/gastronomy`.

```txt
src/modules/education/
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
    EducationDashboardSummary.tsx
    EducationPlanStatusWidget.tsx
    analytics/
      EducationAnalyticsOverviewCard.tsx
      EducationAnalyticsConversionCard.tsx
    dashboard/
      EducationLeadsSummaryCard.tsx
      EducationQuickActionsCard.tsx
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
```

---

## 5) Modelo de dados minimo (migrations)

## 5.1 Tabelas obrigatorias
- `education_profiles`
- `education_programs`
- `education_leads`
- `education_lead_events`
- `education_events`
- `education_messages` (basico, opcional na fase 1 se houver backlog)

## 5.2 Relacionamentos minimos
- `education_profiles.business_id -> businesses.id`
- `education_programs.education_profile_id -> education_profiles.id`
- `education_leads.education_profile_id -> education_profiles.id`
- `education_lead_events.lead_id -> education_leads.id`
- `education_events.education_profile_id -> education_profiles.id`

## 5.3 Campos minimos por tabela (MVP)

### `education_profiles`
- `id uuid pk`
- `business_id uuid unique not null`
- `institution_type text not null` (school, course, daycare, language_school, other)
- `summary text`
- `age_range_min int`
- `age_range_max int`
- `pedagogical_approach text`
- `admission_process text`
- `contact_whatsapp text`
- `website_url text`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

### `education_programs`
- `id uuid pk`
- `education_profile_id uuid not null`
- `name text not null`
- `description text`
- `age_group text`
- `shift text` (morning, afternoon, evening, full_time, flexible)
- `modality text` (in_person, remote, hybrid)
- `available_slots int`
- `price_from numeric(10,2)`
- `is_active boolean default true`
- `display_order int default 0`
- `created_at timestamptz`
- `updated_at timestamptz`

### `education_leads`
- `id uuid pk`
- `education_profile_id uuid not null`
- `full_name text not null`
- `phone text`
- `email text`
- `child_name text`
- `child_age int`
- `interest_note text`
- `source_channel text` (organic, whatsapp, ad, referral, other)
- `status text not null` (pipeline canonico)
- `owner_user_id uuid null`
- `first_contact_at timestamptz null`
- `lost_reason text null`
- `created_at timestamptz`
- `updated_at timestamptz`

### `education_lead_events`
- `id uuid pk`
- `lead_id uuid not null`
- `event_type text not null` (created, status_changed, note_added, call_made, visit_scheduled, proposal_sent, converted, lost)
- `payload jsonb not null default '{}'::jsonb`
- `created_by uuid`
- `created_at timestamptz`

### `education_events`
- `id uuid pk`
- `education_profile_id uuid not null`
- `title text not null`
- `description text`
- `starts_at timestamptz not null`
- `ends_at timestamptz null`
- `is_public boolean default true`
- `capacity int null`
- `created_at timestamptz`
- `updated_at timestamptz`

## 5.4 Regras SQL obrigatorias
- Constraints de dominio para status pipeline.
- Indices para listagem/analytics:
  - `education_leads(education_profile_id, status, created_at desc)`
  - `education_programs(education_profile_id, is_active, display_order)`
  - `education_events(education_profile_id, starts_at)`
- Trigger de `updated_at`.
- RLS habilitado em todas as tabelas novas.

## 5.5 RLS minima
- Leitura publica apenas para dados publicos (`education_profiles.is_active = true`, programas/eventos publicos).
- Escrita apenas para owners/admin da empresa vinculada.
- Leads: apenas owners/admin visualizam e alteram.
- Eventos privados: apenas owners/admin.

---

## 6) Contratos TypeScript (obrigatorio)

Criar contratos tipados sem `any`.

### 6.1 Tipos minimos
- `EducationProfile`
- `EducationProgram`
- `EducationLead`
- `EducationLeadStatus` (union literal)
- `EducationLeadEvent`
- `EducationEvent`
- Inputs/outputs separados:
  - `CreateEducationProfileInput`
  - `UpdateEducationProfileInput`
  - `CreateEducationLeadInput`
  - `UpdateEducationLeadStatusInput`
  - `CreateEducationProgramInput`
  - `UpdateEducationProgramInput`

### 6.2 Regras de tipo
- Preferir `as const` para enums de string.
- Exportar todos os tipos no `types/index.ts`.
- Evitar type duplicado em hooks/pages/components.

---

## 7) Services e hooks (checklist de implementacao)

## 7.1 Services
- [ ] `education.queries.ts` com leitura de perfil/lista/detalhe.
- [ ] `education.mutations.ts` com create/update profile.
- [ ] `lead.queries.ts` com listagem paginada + filtros por status.
- [ ] `lead.mutations.ts` com transicao de status + trilha em `education_lead_events`.
- [ ] `education.helpers.ts` com validacoes de dominio (pipeline, conversao, labels).
- [ ] `EducationService.ts` como facade de alto nivel.
- [ ] `EducationUrlService.ts` com URLs canonicas da vertical.
- [ ] `education-subscription.service.ts` integrado ao core billing.

## 7.2 Hooks
- [ ] Hooks apenas com estado/orquestracao/cache (React Query).
- [ ] Cada hook delega regra ao service correspondente.
- [ ] `queryKey` consistente e estavel.
- [ ] Invalidation correta apos mutacoes.
- [ ] Tratamento uniforme de loading/error/empty state.

---

## 8) UI/Pages/Rotas (checklist de implementacao)

## 8.1 Paginas obrigatorias
- [ ] `EducationLandingPage`
- [ ] `EducationDetailPage`
- [ ] `EducationSetupPage`
- [ ] `EducationDashboardPage`
- [ ] `EducationLeadsPage`
- [ ] `EducationBillingPage`
- [ ] `EducationPlansPage`
- [ ] `EducationAnalyticsPage`

## 8.2 Componentes obrigatorios
- [ ] Card principal da escola com metadados relevantes.
- [ ] Form de lead com validacao (zod ou padrao do projeto).
- [ ] Pipeline visual de leads com transicao controlada.
- [ ] Painel de eventos/visitas.
- [ ] Cards de resumo no dashboard.

## 8.3 Rotas obrigatorias (inserir em `src/app/routes/AppRoutes.tsx`)
- [ ] `/dashboard/business/:businessId/education/setup`
- [ ] `/dashboard/business/:businessId/education/billing`
- [ ] `/dashboard/business/:businessId/education/dashboard`
- [ ] `/dashboard/business/:businessId/education/leads`
- [ ] `/dashboard/business/:businessId/education/plans`
- [ ] `/dashboard/business/:businessId/education/analytics`
- [ ] Rota publica de landing/listagem education (seguir padrao territorial atual do projeto).

## 8.4 Lazy imports
- [ ] Adicionar exports no arquivo de lazy imports utilizado por `AppRoutes`.
- [ ] Garantir que nao haja import circular.

---

## 9) Integracoes obrigatorias

- [ ] Integrar com `BusinessService` para dados base da empresa.
- [ ] Integrar ownership com `BusinessOwnershipService`.
- [ ] Integrar horario com `OpeningHoursService` quando aplicavel.
- [ ] Integrar billing com hooks/services de `src/core/billing`.
- [ ] Integrar favoritos/reviews apenas se houver contrato canonico ja existente (nao duplicar).

---

## 10) Testes obrigatorios

## 10.1 Unitarios
- [ ] Testes para regras de pipeline de lead (transicoes validas/invalidas).
- [ ] Testes para helpers de status/conversao.
- [ ] Testes para services criticos (`education.queries`, `lead.mutations`).

## 10.2 Integracao (runtime)
- [ ] Fluxo criar lead -> alterar status -> gerar evento.
- [ ] Fluxo setup da escola -> publicar perfil -> listar landing.
- [ ] Fluxo billing/plans basico da vertical.

## 10.3 Nao-regressao
- [ ] Garantir que modulo `gastronomy` continua compilando e funcional.
- [ ] Garantir que rotas existentes nao foram quebradas.

---

## 11) Validacao obrigatoria antes de concluir

Executar e anexar resultado (pass/fail) de:

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run validate:ssot`
- [ ] `npm run check:ssot`
- [ ] `npm run validate:architecture:governance -- --json`
- [ ] `npm run build`
- [ ] testes do modulo novo (unitarios e integracao adicionados)

Se qualquer item falhar:
- [ ] corrigir;
- [ ] reexecutar;
- [ ] nao marcar como pronto sem tudo verde.

---

## 12) Definition of Done (DoD) obrigatoria

So considerar "entregue" se TODOS abaixo forem verdadeiros:

- [ ] Escopo MVP implementado completo.
- [ ] Sem hardcodes de negocio fora SSOT.
- [ ] Sem query direta em componente/pagina.
- [ ] Services/hooks/pages/componentes separados por responsabilidade.
- [ ] Barrel exports completos (`index.ts`) no modulo.
- [ ] Rotas adicionadas e navegacao funcional.
- [ ] Migrations com RLS e indices aplicadas.
- [ ] Testes novos passando.
- [ ] Build e validadores SSOT/arquitetura passando.
- [ ] README e VALIDATION do modulo atualizados.

---

## 13) Checklist de code review (para reprovar PR ruim)

Reprovar se houver qualquer um:
- [ ] `any` sem justificativa forte.
- [ ] duplicacao de enum/status/constante de dominio.
- [ ] logica de negocio em hook/componente.
- [ ] mutacao de banco fora service.
- [ ] ausencia de RLS.
- [ ] ausencia de testes para regra de pipeline.
- [ ] uso de mock em runtime de producao.
- [ ] "TODO depois ajusta" em caminho critico.

---

## 14) Sequencia sugerida de execucao (ordem obrigatoria)

1. Migrations + RLS + indices.
2. Types + constants + utils.
3. Services (queries/mutations/helpers/facades).
4. Hooks.
5. Components.
6. Pages.
7. Rotas/lazy imports.
8. Testes.
9. Validacoes finais SSOT/arquitetura/build.
10. Documentacao final (`README.md`, `VALIDATION.md`, changelog se houver padrao).

---

## 15) Prompt pronto para delegar para outra IA

Copie e envie exatamente:

```txt
Implemente o modulo src/modules/education neste repositorio seguindo estritamente o documento:
docs/EDUCATION_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md

Regras obrigatorias:
1) Siga SSOT sem excecao.
2) Proibido gambiarra, workaround temporario e duplicacao de dominio.
3) Fluxo de dados obrigatorio: Database -> Service -> Hook -> Component/Page.
4) Nao use query Supabase direta em componentes/paginas.
5) Reaproveite servicos core existentes (BusinessService, BusinessOwnershipService, OpeningHoursService, core billing).
6) Entregar somente escopo MVP comercial definido no documento (sem frequencia/boletim/diario).
7) Criar migrations com RLS + indices.
8) Criar testes para regras criticas de pipeline de leads.
9) Executar validacoes finais (typecheck, lint, validate:ssot, check:ssot, validate:architecture:governance, build).
10) Nao finalize ate tudo passar.

No fim, entregue:
- lista de arquivos criados/alterados;
- resumo tecnico por fase;
- resultado dos comandos de validacao;
- riscos residuais (se houver).
```

---

## 16) Nota final de estrategia

Este plano foi desenhado para maximizar valor de negocio com baixo risco:
- primeiro captura e conversao comercial de escolas;
- depois, com tracao comprovada, evoluir para gestao academica completa.

---

## 17) Roadmap futuro (ja previsto para expansao segura)

Esta secao e obrigatoria como referencia de evolucao.  
Nao implementar tudo agora. Preparar fundacao e liberar por fases.

### 17.1 Principio de rollout
- Implementar por modulos e liberar com feature flags por escola/plano.
- Evitar "codigo completo oculto" sem uso real.
- Entregar pequenos blocos com validacao real em producao.

### 17.2 Fase futura A - Academico essencial
- Frequencia por aula (presenca, atraso, falta justificada, falta nao justificada).
- Diario de chamada digital por professor.
- Fechamento de chamada com trilha de auditoria.
- Notificacao de ausencia para responsavel (configuravel por escola).

### 17.3 Fase futura B - Avaliacao e boletim
- Lancamento de avaliacoes e notas por disciplina/periodo.
- Regras de media, recuperacao, arredondamento e aprovacao configuraveis.
- Geracao de boletim por periodo letivo.
- Historico de alteracoes de nota (quem alterou, quando, motivo).

### 17.4 Fase futura C - Jornada de entrada/saida e comunicacao em tempo real
- Registro de entrada e saida do aluno.
- Evento de "aula encerrada" e "aluno saiu".
- Notificacoes para responsavel (push, email, whatsapp se integrado).
- Status operacional para pais no app: `em_aula`, `intervalo`, `aguardando_saida`, `saiu`.

### 17.5 Fase futura D - Presenca assistida por operacao (opcional avancado)
- Integracao com portaria/catraca/leitor (quando existir).
- Geofencing apenas com consentimento explicito e base legal valida.
- Modo contingencia para operacao manual em caso de falha.

### 17.6 Entidades futuras recomendadas (nao obrigatorio criar agora)
- `academic_terms`
- `school_classes`
- `class_sessions`
- `student_enrollments`
- `attendance_records`
- `attendance_events`
- `assessments`
- `grade_records`
- `report_cards`
- `student_presence_status`
- `student_gate_events` (entrada/saida)
- `guardian_notification_events`

### 17.7 Contratos futuros recomendados (tipos TS)
- `AttendanceStatus` (`present`, `late`, `absent_excused`, `absent_unexcused`)
- `PresenceStatus` (`at_school`, `in_class`, `break`, `checkout_pending`, `left_school`)
- `GradeType` (`exam`, `assignment`, `project`, `participation`, `recovery`)
- `GuardianNotificationType` (`absence_alert`, `class_ended`, `checkin`, `checkout`)

### 17.8 Regras de dominio obrigatorias para fases futuras
- Nenhuma alteracao critica sem trilha de auditoria.
- Registro de presenca/nota deve ser versionado (nao sobrescrever sem historico).
- Toda automacao deve ter fallback manual.
- Notificacao a pais nao pode ser tratada como confirmacao operacional absoluta.
- Evento de saida deve ter origem rastreavel (manual, portaria, integracao).

### 17.9 LGPD, seguranca e compliance (pre-requisitos de liberacao)
- Consentimento explicito do responsavel para dados sensiveis e notificacoes.
- Politica de retencao por tipo de dado (presenca, notas, eventos de portaria).
- Controle de acesso estrito por perfil (professor, coordenacao, responsavel, admin).
- RLS e auditoria obrigatorios para todas as tabelas academicas.
- Log de acesso a dados de menores (quem consultou e quando).
- Processo de revogacao de consentimento e efeito no produto.

### 17.10 Operacao e confiabilidade (pre-requisitos de liberacao)
- SLA interno de notificacao (latencia alvo e taxa minima de entrega).
- Retentativa e fila para eventos de notificacao.
- Painel de observabilidade (eventos enviados, entregues, falhas).
- Procedimento de contingencia documentado para internet indisponivel.
- Testes de carga em horarios de pico (entrada/saida e troca de turno).

### 17.11 Feature flags e estrategia comercial
- Flags por capacidade:
  - `education_attendance_enabled`
  - `education_report_cards_enabled`
  - `education_guardian_realtime_enabled`
  - `education_gate_integration_enabled`
- Liberacao por plano:
  - Plano base: comercial + leads + eventos.
  - Plano intermediario: frequencia + alertas basicos.
  - Plano avancado: boletim + realtime + integracoes.

### 17.12 Checkpoint para decidir inicio da Fase A
So iniciar academico interno quando TODOS forem verdade:
- demanda recorrente de clientes pagantes;
- perda de vendas comprovada por ausencia desses recursos;
- capacidade operacional para suporte e implantacao;
- base legal/LGPD definida com assessoria juridica;
- infraestrutura pronta para eventos e notificacoes confiaveis.

### 17.13 Decisao recomendada (importante)
- Recomendado: deixar roadmap e arquitetura futura definidos agora.
- Nao recomendado: implementar completo e esconder do publico.
- Motivo: reduz risco tecnico, risco juridico e custo de manutencao prematuro.
