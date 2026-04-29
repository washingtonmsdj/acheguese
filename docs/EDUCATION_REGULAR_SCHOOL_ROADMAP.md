# EDUCATION REGULAR SCHOOL ROADMAP (SSOT)

**Data**: 2026-04-27
**Escopo**: Evolucao do nicho `regular_school` sem quebrar arquitetura atual

---

## 1) Estado atual (snapshot real)

Ja existente no codigo:
- Nicho `regular_school` no `registry.ts`
- Hook `useEducationNicheBilling`
- Guards visuais (`EducationCapabilityGuard`, `EducationUpgradeBanner`)
- Integracao de billing/capability em paginas admin (setup, programas, eventos, analytics)
- Rotas publicas de education existentes:
  - `/educacao/:state/:city`
  - `/educacao/:state/:city/:district/:slug`

Ja validado em SSOT recente:
- Sem uso de `business_profiles` no fluxo education
- Query territorial usa `locations + business_data + education_profiles`

---

## 2) Principios imutaveis

1. Nao criar novo nicho: usar `regular_school` existente.
2. Nao criar submodulo por nicho (`school/`, `escola/`, etc.).
3. SSOT de nicho fica em `src/modules/business/education/niches/registry.ts`.
4. Nao hardcodar capability em UI: usar `useEducationNicheBilling.can()`.
5. Nao hardcodar limite: usar `checkCanCreateProgram`, `checkCanCreateEvent`, `checkCanReceiveLead`.
6. Evitar `if (nicheKey === 'regular_school')` espalhado; usar config/labels do nicho.
7. Dados institucionais vem de `business_data` (nome, endereco, contato, slug).
8. Dados educacionais ficam na vertical education (`education_profiles`, `education_programs`, `education_events`, `education_leads`).

---

## 3) Fase 1 - UX de linguagem escolar

**Objetivo**: adaptar textos e formularios para escola sem quebrar modelo generico.

### 3.1 Labels por nicho (pendente)
- [ ] Adicionar `uiLabels` em `EducationNicheConfig` (`types.ts`)
- [ ] Preencher labels no `registry.ts` para todos os nichos
- [ ] Criar hook `useEducationLabels(nicheKey)`
- [ ] Aplicar labels em setup/dashboard/programs/events/leads/analytics

### 3.2 Campos escolares no profile (pendente)
- [ ] Estender `EducationProfile` com campos opcionais de escola:
  - `schoolType?: 'public' | 'private' | 'charter'`
  - `educationLevels?: (...)[]`
  - `shifts?: (...)[]`
  - `ageRange?: { min: number; max: number }`
  - `enrollmentOpen?: boolean`
- [ ] Exibir esses campos no `EducationSetupPage` para `regular_school`
- [ ] Persistir via `education.mutations.updateEducationProfile`/`EducationService`

**Gate de saida**:
- [ ] Labels 100% vindos do nicho
- [ ] Sem hardcode de texto escolar por pagina
- [ ] `check:ssot` e `typecheck` passando

---

## 4) Fase 2 - Programas como series/turmas

**Objetivo**: representar estrutura escolar sem criar tabela paralela.

- [ ] Estender `EducationProgram` com campos opcionais escolares:
  - `educationLevel`, `grade`, `className`, `maxCapacity`, `currentEnrollment`, `schedule`
- [ ] Atualizar formulario/listagem em `EducationProgramsPage`
- [ ] Manter validacao de limite usando `checkCanCreateProgram`
- [ ] Garantir compatibilidade com nichos nao-escola (campos opcionais)

**Gate de saida**:
- [ ] CRUD de programas funcionando com novos campos
- [ ] Limites de plano/nicho respeitados

---

## 5) Fase 3 - Eventos escolares

**Objetivo**: tipar eventos de escola sem quebrar eventos genericos.

- [ ] Adicionar `SchoolEventType` (opcional) no dominio de eventos
- [ ] Incluir `eventType` opcional em `EducationEvent`
- [ ] Atualizar `EducationEventsPage` com select/badge de tipo
- [ ] Manter gating atual por capability e limite (`checkCanCreateEvent`)

**Gate de saida**:
- [ ] Eventos escolares exibindo tipo corretamente
- [ ] Sem regressao para outros nichos

---

## 6) Fase 4 - Leads de matricula

**Objetivo**: melhorar lead para contexto escolar.

- [ ] Estender `EducationLead` com campos opcionais:
  - `guardianName`, `studentName`, `studentAge`, `desiredGrade`, `desiredShift`
- [ ] Ajustar `EducationLeadsPage` e pipeline para mostrar dados de matricula
- [ ] Manter limite com `checkCanReceiveLead`

**Gate de saida**:
- [ ] Pipeline com contexto de matricula
- [ ] Sem quebrar modelo de leads atual

---

## 7) Fase 5 - Analytics escolar

**Objetivo**: metricas orientadas a captacao de matricula.

- [ ] Evoluir `useEducationAnalytics` para metricas por serie/turno
- [ ] Dashboard com cards de interesse, vagas, eventos, visitas
- [ ] Aplicar capability:
  - `analytics_basic`
  - `analytics_advanced` (quando existir recurso avancado)
- [ ] Exportacao somente quando plano permitir

**Gate de saida**:
- [ ] Bloqueio de analytics por capability/plano funcionando
- [ ] Cards e dados coerentes com o nicho escola

---

## 8) Fase 6 - Pagina publica da escola (na rota existente)

**Objetivo**: profissionalizar pagina publica sem criar rota paralela.

Importante:
- Nao criar `/escola/:slug` por padrao.
- Usar rota canonica atual: `/educacao/:state/:city/:district/:slug`.

- [ ] Evoluir `EducationDetailPage` para experiencia escola (hero, series, eventos, CTA)
- [ ] Consumir dados institucionais de `business_data` + dados education
- [ ] Garantir SEO basico (`title`, `description`, canonical)
- [ ] Manter fallback visual para ambientes sem dados (preview/mocks) somente em dev se necessario

**Gate de saida**:
- [ ] Pagina publica consistente com SSOT
- [ ] Sem duplicacao de dados institucionais em education

---

## 9) Fase 7 - Validacao final e docs

- [ ] Validar fluxo completo regular_school (setup -> programas -> eventos -> leads -> analytics -> publico)
- [ ] Rodar:
  - `npm run check:ssot`
  - `npm run typecheck`
  - `npm run build`
- [ ] Atualizar docs:
  - `docs/EDUCATION_NICHES_TASKS.md`
  - `docs/EDUCATION_NICHES_IMPLEMENTATION_GUIDE.md`
  - `src/modules/business/education/README.md` (se necessario)

---

## Definition of Done

- [ ] `regular_school` funciona ponta a ponta no fluxo comercial
- [ ] Linguagem escolar aplicada via configuracao (nao hardcode)
- [ ] Gating de capability + plano consistente
- [ ] Limites aplicados no fluxo de negocio
- [ ] Pagina publica da escola coerente na rota canonica
- [ ] `check:ssot`, `typecheck` e `build` passando
- [ ] Documentacao atualizada
