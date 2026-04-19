# HEALTH MODULE - CHECKLIST COMPLETO (SSOT / SEM GAMBIARRA)

## 1) Objetivo deste documento

Este documento e o guia oficial para implementar o modulo `health` com qualidade AAA, mantendo SSOT, sem duplicacoes e sem workaround temporario.

Resultado esperado:
- modulo novo para saude focado em captacao, agendamento e conversao de atendimentos;
- arquitetura alinhada ao padrao de vertical especializada ja usado no projeto;
- separacao clara entre perfil basico (business) e experiencia avancada (health);
- pronto para evoluir para prontuario e operacao clinica sem retrabalho estrutural.

Arquitetura alvo explicita:
- seguir o mesmo principio de vertical especializada:
  - `Business` = perfil basico institucional;
  - `Vertical Health` = experiencia avancada de saude (agenda, servicos, profissionais, leads, analytics).

Nao e objetivo deste escopo:
- prontuario clinico completo;
- prescricao digital;
- integracao total com convenios;
- telemedicina regulada completa.

---

## 2) Escopo de produto (MVP 60-90 dias)

### 2.1 In scope (obrigatorio)
- Perfil publico da clinica/profissional de saude.
- Catalogo de servicos/procedimentos.
- Agenda de disponibilidade (slots e bloqueios).
- Solicitacao de agendamento (lead de atendimento).
- Pipeline de atendimento comercial:
  - `new -> contacted -> scheduled -> confirmed -> completed -> canceled -> no_show`.
- Pagina de detalhe publica da vertical health.
- Dashboard operacional/comercial (agendamentos, taxa de confirmacao, no-show).
- Billing/plans da vertical integrado ao core billing.
- Analytics basico de conversao/agendamento.

### 2.2 Out of scope (proibido neste ciclo)
- Prontuario medico com evolucao clinica completa.
- Receita digital e assinatura qualificada.
- Faturamento TISS completo.
- Prontuario compartilhado multi-instituicao.

---

## 3) Regras duras de arquitetura (SSOT)

### 3.1 Fluxo canonico obrigatorio
`Database -> Service -> Hook -> Component/Page`

### 3.2 Regras SSOT obrigatorias
- Nao fazer query Supabase direta em componente/pagina.
- Nao duplicar regra existente em `src/core/*`.
- Dados de negocio variaveis ficam no banco.
- Constantes tecnicas podem ficar em codigo.
- Mock isolado e nunca contaminando runtime de producao.
- Responsabilidade unica por arquivo.

### 3.3 Reuso de owners canonicos
- Base empresa: `src/core/business/services/BusinessService.ts`
- Ownership: `src/core/business/services/BusinessOwnershipService.ts`
- Horarios: `src/core/business/services/OpeningHoursService.ts`
- Billing: `src/core/billing/*`
- Rotas: `src/app/routes/AppRoutes.tsx`
- URL canonica de empresa: `src/core/business/services/BusinessUrlService.ts`

### 3.4 Anti-padroes proibidos
- `any` sem justificativa.
- regra de negocio em componente.
- hook com regra pesada de dominio.
- service chamando hook.
- enums/status duplicados em varios arquivos.
- logica de autorizacao apenas no frontend.

---

## 4) Estrutura alvo de pastas/arquivos

```txt
src/modules/health/
  index.ts
  README.md
  VALIDATION.md
  types/
    health.ts
    scheduling.ts
    booking.ts
    index.ts
  constants/
    index.ts
    health.ts
  utils/
    index.ts
    health.helpers.ts
  services/
    index.ts
    health.queries.ts
    health.mutations.ts
    health.helpers.ts
    scheduling.queries.ts
    scheduling.mutations.ts
    booking.queries.ts
    booking.mutations.ts
    HealthService.ts
    HealthUrlService.ts
    health-subscription.service.ts
  hooks/
    index.ts
    useHealthList.ts
    useHealthDetail.ts
    useHealthProfile.ts
    useHealthSetup.ts
    useHealthServices.ts
    useHealthSchedule.ts
    useHealthBookings.ts
    useHealthPipeline.ts
    useHealthAnalytics.ts
    useHealthSubscription.ts
  components/
    index.ts
    HealthCard.tsx
    HealthHero.tsx
    HealthFilters.tsx
    HealthCTA.tsx
    HealthServiceCatalog.tsx
    HealthBookingForm.tsx
    HealthAvailabilityCalendar.tsx
    HealthPipelineBoard.tsx
    HealthPlanStatusWidget.tsx
    dashboard/
      HealthBookingSummaryCard.tsx
      HealthNoShowCard.tsx
      HealthQuickActionsCard.tsx
    analytics/
      HealthAnalyticsOverviewCard.tsx
      HealthConversionCard.tsx
      HealthScheduleCard.tsx
  pages/
    index.ts
    HealthLandingPage.tsx
    HealthDetailPage.tsx
    HealthSetupPage.tsx
    HealthDashboardPage.tsx
    HealthBookingsPage.tsx
    HealthSchedulePage.tsx
    HealthBillingPage.tsx
    HealthPlansPage.tsx
    HealthAnalyticsPage.tsx
```

---

## 5) Modelo de dados minimo (migrations)

### 5.1 Tabelas obrigatorias
- `health_profiles`
- `health_specialties`
- `health_services`
- `health_professionals`
- `health_schedule_slots`
- `health_booking_requests`
- `health_booking_events`

### 5.2 Relacionamentos minimos
- `health_profiles.business_id -> businesses.id`
- `health_services.health_profile_id -> health_profiles.id`
- `health_professionals.health_profile_id -> health_profiles.id`
- `health_schedule_slots.health_profile_id -> health_profiles.id`
- `health_schedule_slots.professional_id -> health_professionals.id`
- `health_booking_requests.health_profile_id -> health_profiles.id`
- `health_booking_requests.service_id -> health_services.id`
- `health_booking_requests.professional_id -> health_professionals.id`
- `health_booking_events.booking_request_id -> health_booking_requests.id`

### 5.3 Campos minimos por tabela

#### `health_profiles`
- `id uuid pk`
- `business_id uuid unique not null`
- `health_type text not null` (clinic, hospital, lab, dental, therapy, other)
- `summary text`
- `accepts_insurance boolean default false`
- `insurance_notes text null`
- `emergency_phone text null`
- `contact_whatsapp text null`
- `website_url text null`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `health_specialties`
- `id uuid pk`
- `health_profile_id uuid not null`
- `name text not null`
- `is_active boolean default true`
- `display_order int default 0`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `health_services`
- `id uuid pk`
- `health_profile_id uuid not null`
- `specialty_id uuid null`
- `name text not null`
- `description text`
- `duration_minutes int not null`
- `price_from numeric(10,2) null`
- `is_telehealth boolean default false`
- `is_active boolean default true`
- `display_order int default 0`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `health_professionals`
- `id uuid pk`
- `health_profile_id uuid not null`
- `full_name text not null`
- `role text not null`
- `license_number text null`
- `specialty text null`
- `bio text null`
- `is_active boolean default true`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `health_schedule_slots`
- `id uuid pk`
- `health_profile_id uuid not null`
- `professional_id uuid null`
- `service_id uuid null`
- `starts_at timestamptz not null`
- `ends_at timestamptz not null`
- `status text not null` (`available`, `blocked`, `reserved`)
- `notes text null`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `health_booking_requests`
- `id uuid pk`
- `health_profile_id uuid not null`
- `service_id uuid null`
- `professional_id uuid null`
- `full_name text not null`
- `phone text null`
- `email text null`
- `preferred_date date null`
- `preferred_time text null`
- `status text not null` (pipeline canonico do MVP)
- `source_channel text not null` (`organic`, `whatsapp`, `ad`, `referral`, `other`)
- `notes text null`
- `owner_user_id uuid null`
- `confirmed_at timestamptz null`
- `completed_at timestamptz null`
- `canceled_reason text null`
- `created_at timestamptz`
- `updated_at timestamptz`

#### `health_booking_events`
- `id uuid pk`
- `booking_request_id uuid not null`
- `event_type text not null`
- `payload jsonb not null default '{}'::jsonb`
- `created_by uuid null`
- `created_at timestamptz`

### 5.4 Regras SQL obrigatorias
- constraints para status de booking.
- constraints para `ends_at > starts_at`.
- trigger de `updated_at`.
- indices minimos:
  - `health_booking_requests(health_profile_id, status, created_at desc)`
  - `health_schedule_slots(health_profile_id, starts_at, status)`
  - `health_services(health_profile_id, is_active, display_order)`
  - `health_professionals(health_profile_id, is_active)`
- RLS habilitado em todas as tabelas novas.

### 5.5 RLS minima obrigatoria
- Leitura publica apenas de dados publicos e ativos.
- Escrita apenas para owner/admin da empresa vinculada.
- Booking requests:
  - criacao publica controlada;
  - leitura detalhada apenas por owner/staff autorizado.
- Eventos de booking:
  - somente equipe autorizada.

---

## 6) Contratos TypeScript (obrigatorio)

### 6.1 Tipos minimos
- `HealthProfile`
- `HealthService`
- `HealthProfessional`
- `HealthScheduleSlot`
- `HealthBookingRequest`
- `HealthBookingStatus`
- `HealthBookingEvent`

### 6.2 Inputs/outputs obrigatorios
- `CreateHealthProfileInput`
- `UpdateHealthProfileInput`
- `CreateHealthServiceInput`
- `UpdateHealthServiceInput`
- `CreateHealthBookingRequestInput`
- `UpdateHealthBookingStatusInput`
- `CreateHealthScheduleSlotInput`
- `UpdateHealthScheduleSlotInput`

### 6.3 Regras de tipo
- union literals com `as const`;
- export centralizado em `types/index.ts`;
- sem duplicacao de tipos em pages/components.

---

## 7) Services e hooks (checklist de implementacao)

### 7.1 Services obrigatorios
- [ ] `health.queries.ts` (perfil/lista/detalhe).
- [ ] `health.mutations.ts` (create/update perfil).
- [ ] `scheduling.queries.ts` e `scheduling.mutations.ts`.
- [ ] `booking.queries.ts` e `booking.mutations.ts`.
- [ ] `health.helpers.ts` (regras de transicao, no-show, labels, validacoes).
- [ ] `HealthService.ts` facade.
- [ ] `HealthUrlService.ts` URL canonica da vertical.
- [ ] `health-subscription.service.ts` integrado ao billing.

### 7.2 Hooks obrigatorios
- [ ] Hooks apenas estado/cache/orquestracao.
- [ ] Query keys estaveis.
- [ ] Invalidation correta apos mutacoes.
- [ ] Estados consistentes: loading/empty/error.

---

## 8) UI / pages / rotas

### 8.1 Paginas obrigatorias
- [ ] `HealthLandingPage`
- [ ] `HealthDetailPage`
- [ ] `HealthSetupPage`
- [ ] `HealthDashboardPage`
- [ ] `HealthBookingsPage`
- [ ] `HealthSchedulePage`
- [ ] `HealthBillingPage`
- [ ] `HealthPlansPage`
- [ ] `HealthAnalyticsPage`

### 8.2 Rotas administrativas obrigatorias
- [ ] `/dashboard/business/:businessId/health/setup`
- [ ] `/dashboard/business/:businessId/health/billing`
- [ ] `/dashboard/business/:businessId/health/dashboard`
- [ ] `/dashboard/business/:businessId/health/bookings`
- [ ] `/dashboard/business/:businessId/health/schedule`
- [ ] `/dashboard/business/:businessId/health/plans`
- [ ] `/dashboard/business/:businessId/health/analytics`

### 8.3 Rotas publicas da vertical
- [ ] listagem health territorial (mesmo padrao de rotas territoriais do projeto).
- [ ] detalhe health por `state/city/district/slug`.

### 8.4 Conteudo da pagina publica health (MVP)
- Hero institucional de saude.
- Catalogo de servicos/procedimentos.
- Lista de profissionais (quando houver).
- Agenda/disponibilidade publica simplificada.
- CTA de agendamento.
- FAQ curta.
- Contato e localizacao.

---

## 9) Admin, profile e RBAC da area health

### 9.1 Perfis de acesso
- `health_owner`
- `health_manager`
- `health_staff`
- `patient_view` (futuro)

### 9.2 Regras obrigatorias
- autorizacao no backend via RLS + ownership;
- guard de rota no frontend;
- isolamento entre clinicas.

### 9.3 Permissoes minimas por recurso
- Perfil:
  - owner/manager editam;
  - staff leitura ou campos limitados.
- Servicos/profissionais:
  - owner/manager CRUD;
  - staff conforme regra definida.
- Agenda:
  - owner/manager/staff autorizado.
- Bookings:
  - owner/manager/staff leitura;
  - transicao de status por role.
- Billing:
  - owner apenas (ou manager financeiro explicitamente autorizado).

### 9.4 Auditoria obrigatoria
Registrar:
- alteracao de perfil;
- alteracao de servico/profissional;
- bloqueio/abertura de slot;
- mudanca de status de booking.

---

## 10) Landing de assinante vs perfil padrao (health)

### 10.1 Conceitos
- `profile_basic`:
  - pagina publica basica.
- `landing_premium`:
  - pagina completa de conversao e agendamento.

### 10.2 Politica de URL
- URL canonica sempre existe.
- Link curto segue entitlement global por plano.
- Link curto redireciona para URL canonica.

### 10.3 Conteudo minimo por modo

#### `profile_basic`
- nome e resumo;
- contato;
- endereco/horario;
- CTA simples.

#### `landing_premium`
- hero + CTA;
- servicos detalhados;
- disponibilidade simplificada;
- formulario de agendamento;
- prova social;
- FAQ;
- canais de contato.

### 10.4 Feature flags sugeridas
- `health_landing_enabled`
- `health_booking_form_enabled`
- `health_schedule_public_enabled`
- `health_catalog_full_enabled`
- `short_link_enabled` (global)

---

## 11) Beneficios por plano (globais x vertical health)

### 11.1 Beneficios globais (todas empresas assinantes)
- URL canonica publica;
- link curto por entitlement;
- pagina premium por entitlement;
- dashboard administrativo;
- billing e plano.

### 11.2 Beneficios especificos de health
- agenda de disponibilidade;
- pedidos de agendamento;
- pipeline de atendimento;
- indicadores de confirmacao e no-show.

---

## 12) Integracoes obrigatorias

- [ ] Reuso de `BusinessService`.
- [ ] Reuso de `BusinessOwnershipService`.
- [ ] Reuso de `OpeningHoursService` onde aplicavel.
- [ ] Integracao com `core/billing`.
- [ ] Integracao com sistema de notificacoes existente (se disponivel) para lembretes basicos.

---

## 13) Testes obrigatorios

### 13.1 Unitarios
- [ ] transicoes validas/invalidas de booking.
- [ ] validacao de slots.
- [ ] helpers de no-show e metricas.

### 13.2 Integracao
- [ ] criar booking -> confirmar -> concluir/cancelar.
- [ ] criar slot -> reservar -> bloquear.
- [ ] setup health -> publicar -> listar em landing.

### 13.3 Seguranca/autorizacao
- [ ] usuario de clinica A nao acessa dados da B.
- [ ] usuario sem role nao acessa admin.
- [ ] leitura publica restrita a dados permitidos.

---

## 14) Validacao obrigatoria antes de concluir

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run validate:ssot`
- [ ] `npm run check:ssot`
- [ ] `npm run validate:architecture:governance -- --json`
- [ ] `npm run build`
- [ ] testes do modulo health

Falhou qualquer item:
- [ ] corrigir
- [ ] reexecutar
- [ ] nao encerrar entrega

---

## 15) Definition of Done (DoD)

So considerar pronto quando:
- [ ] escopo MVP entregue completo;
- [ ] sem hardcode de negocio fora SSOT;
- [ ] sem query direta em componentes;
- [ ] rotas publicas/admin funcionando;
- [ ] RLS ativo e validado;
- [ ] testes criticos passando;
- [ ] validadores SSOT/arquitetura/build passando;
- [ ] `README.md` e `VALIDATION.md` do modulo atualizados.

---

## 16) Checklist de code review (bloqueio)

Reprovar PR se houver:
- [ ] `any` sem justificativa;
- [ ] regra de negocio em componente;
- [ ] duplicacao de status/enum;
- [ ] autorizacao apenas frontend;
- [ ] sem auditoria para acoes sensiveis;
- [ ] sem testes de transicao de booking.

---

## 17) Sequencia de execucao recomendada

1. Migrations + RLS + indices.
2. Tipos + constantes + utils.
3. Services/facades.
4. Hooks.
5. Components.
6. Pages.
7. Rotas + lazy imports.
8. Testes.
9. Validacao final.
10. Documentacao final.

---

## 18) Roadmap futuro (expansao segura)

### 18.1 Fase futura A - Operacao clinica avancada
- prontuario basico por atendimento;
- anexos de exames/laudos;
- historico longitudinal simples.

### 18.2 Fase futura B - Jornadas de paciente
- lembretes automáticos (D-1, H-2);
- pre-check-in digital;
- pos-atendimento com retorno/encaminhamento.

### 18.3 Fase futura C - Compliance/regulatorio
- logs imutaveis de acesso a dados sensiveis;
- politicas de retencao por tipo de dado;
- trilha de consentimento.

### 18.4 Fase futura D - Integracoes
- integracao parcial com convenio;
- integracao agenda externa;
- integracao omnichannel de confirmacao.

### 18.5 Pre-requisitos antes de liberar fases futuras
- maturidade juridica/LGPD;
- observabilidade e SLA operacional;
- suporte de operacao clinica;
- demanda comprovada de clientes pagantes.

---

## 19) Prompt pronto para delegar para outra IA

```txt
Implemente o modulo src/modules/health neste repositorio seguindo estritamente:
docs/HEALTH_MODULE_IMPLEMENTATION_CHECKLIST_SSOT.md

Regras obrigatorias:
1) Siga SSOT sem excecao.
2) Proibido gambiarra e duplicacao de dominio.
3) Fluxo: Database -> Service -> Hook -> Component/Page.
4) Nao use query direta em componente/pagina.
5) Reuse core: BusinessService, BusinessOwnershipService, OpeningHoursService e core/billing.
6) Entregar apenas o MVP definido no documento.
7) Criar migrations com RLS e indices.
8) Criar testes para pipeline de booking e autorizacao.
9) Rodar validacoes finais (typecheck, lint, validate:ssot, check:ssot, validate:architecture:governance, build).
10) Nao finalizar ate tudo passar.

Ao final, entregar:
- lista de arquivos alterados/criados;
- resumo tecnico por fase;
- resultado dos validadores;
- riscos residuais.
```

---

## 20) Backlog administrativo (futuras funcionalidades) - SALVAR NO ADMIN

Objetivo: manter visivel no painel admin um backlog de evolucao para evitar esquecimento.

### 20.1 Itens futuros priorizados (registrar no admin)
- [ ] Upload de documentos do paciente (PDF/imagem) com trilha de auditoria.
- [ ] Renovacao de receita por solicitacao digital (workflow com aprovacao profissional).
- [ ] Centro de mensagens paciente-clinica com fallback de notificacao.
- [ ] Pre-consulta digital com questionario estruturado.
- [ ] Regra de lembretes inteligentes para reduzir no-show.
- [ ] Bloco de urgencia: CTA rapido para SAMU 192 e orientacao de UPA.
- [ ] Portal do paciente com consultas, documentos e orientacoes.
- [ ] Score de no-show e automacoes de contato por risco.
- [ ] Consentimentos digitais e historico de aceite.
- [ ] Interoperabilidade FHIR incremental (Appointment, DocumentReference, Consent, MedicationRequest, Questionnaire).

### 20.2 Requisito de produto (admin)
- [ ] Criar secao "Roadmap Futuro - Health" no admin interno.
- [ ] Cada item deve ter: prioridade, status, responsavel, fase alvo, risco regulatorio.
- [ ] Exibir alertas de dependencia regulatoria (LGPD/CFM) para features sensiveis.

---

## 21) Estrategia de adocao comercial (nao depender de alto trafego inicial)

Premissa valida: muitas clinicas ja usam sistema legado ou WhatsApp; adocao nao pode depender apenas de visitas no site.

### 21.1 Estrategia recomendada: WhatsApp-first + Operacao-first
- Entrar como camada de conversao e organizacao, nao como substituicao total imediata.
- Oferecer ganho rapido:
  - confirmacao automatica;
  - reducao de no-show;
  - organizacao de agenda e leads;
  - relatorios simples para dono/secretaria.

### 21.2 MVP comercial para adesao rapida
- [ ] Link de agendamento compartilhavel no WhatsApp/Instagram.
- [ ] Confirmacao e lembrete automatico.
- [ ] Painel simples de agenda e fila de atendimento.
- [ ] Sem exigir migracao completa de prontuario no inicio.

### 21.3 Posicionamento de venda
- Nao vender como "troca total de sistema".
- Vender como "melhorar marcacao e comparecimento em 30 dias".
- Provar valor com KPI operacional:
  - taxa de confirmacao;
  - taxa de no-show;
  - tempo medio de resposta;
  - conversao de contato em consulta.

### 21.4 Checkpoint de product-market fit
So acelerar investimento pesado no vertical health se:
- [ ] pelo menos 5-10 clientes pagantes usando semanalmente;
- [ ] melhora comprovada de no-show/confirmacao;
- [ ] baixo churn nos primeiros 60-90 dias;
- [ ] ticket compativel com suporte e compliance.

---

## 22) LGPD Gate + Security Gate (OBRIGATORIO PARA PRODUCAO)

Esta secao e bloqueante.  
Sem cumprir todos os gates abaixo, o modulo health NAO pode entrar em producao.

### 22.1 Classificacao de dados e minimizacao
- [ ] Classificar dados de health como `dados pessoais sensiveis`.
- [ ] Catalogar campos por nivel de sensibilidade (baixo, medio, alto, critico).
- [ ] Coletar apenas dados estritamente necessarios para a finalidade do MVP.
- [ ] Proibir campo livre para dado clinico sensivel fora de fluxo controlado.
- [ ] Definir e documentar finalidade por tabela/campo.

### 22.2 Base legal, consentimento e transparencia
- [ ] Definir base legal para cada operacao de tratamento no modulo health.
- [ ] Exibir aviso de privacidade contextual no fluxo de agendamento e upload.
- [ ] Registrar consentimento quando exigido e manter historico de versao do termo.
- [ ] Implementar trilha de revogacao de consentimento e efeitos no sistema.
- [ ] Garantir canal de contato DPO/privacidade visivel no produto.

### 22.3 Controle de acesso e autenticacao forte
- [ ] RBAC estrito por role (`owner`, `manager`, `staff`) com principio do menor privilegio.
- [ ] RLS obrigatoria em todas as tabelas health.
- [ ] Revalidacao de permissao no backend para toda operacao sensivel.
- [ ] Bloquear acesso cruzado entre clinicas/empresas.
- [ ] Exigir MFA para perfis administrativos do health.
- [ ] Politica de sessao segura (expiracao, refresh seguro, revogacao ativa).

### 22.4 Protecao contra vazamento e invasao
- [ ] Criptografia em transito (TLS) e em repouso nos dados sensiveis.
- [ ] Segredos e chaves fora de codigo, com rotacao e controle de acesso.
- [ ] Upload seguro de arquivos:
  - [ ] validacao de tipo MIME e extensao;
  - [ ] limite de tamanho;
  - [ ] sanitizacao de nome;
  - [ ] antivirus/scan de malware;
  - [ ] armazenamento privado por tenant.
- [ ] URLs de arquivo com expiracao curta (signed URLs), sem exposicao publica indevida.
- [ ] Protecoes de app: CSP, rate limit, anti-bruteforce, validacao de input, anti-XSS.
- [ ] Segregacao de ambientes (dev/staging/prod) sem compartilhamento de dados sensiveis.
- [ ] Mascara/pseudonimizacao em logs, sem PII sensivel em log de aplicacao.

### 22.5 Auditoria, rastreabilidade e monitoramento
- [ ] Auditoria imutavel para acesso/leitura/exportacao/alteracao de dados sensiveis.
- [ ] Campos minimos de auditoria: `who`, `what`, `when`, `where`, `before/after`.
- [ ] Alertas para comportamento anomalo:
  - acesso massivo;
  - exportacao atipica;
  - tentativas de acesso negado repetidas.
- [ ] Dashboard de seguranca com eventos criticos e trilha investigativa.
- [ ] Retencao de logs de auditoria com prazo definido e protegido.

### 22.6 Politica de retencao, descarte e direitos do titular
- [ ] Definir matriz de retencao por tipo de dado (agenda, documentos, mensagens, eventos).
- [ ] Implementar descarte seguro/anonimizacao apos prazo legal/contratual.
- [ ] Implementar fluxo de atendimento aos direitos do titular (acesso, correcao, eliminacao quando cabivel).
- [ ] Garantir exportacao de dados do titular em formato estruturado quando aplicavel.
- [ ] Registrar SLA interno para atendimento de solicitacoes de privacidade.

### 22.7 Backup, continuidade e recuperacao
- [ ] Politica de backup criptografado e testado periodicamente.
- [ ] Definir RPO/RTO para dados do modulo health.
- [ ] Teste de restauracao com evidencia (nao apenas backup teorico).
- [ ] Plano de continuidade para indisponibilidade de notificacoes/agenda.
- [ ] Procedimento de contingencia manual documentado para clinica.

### 22.8 Resposta a incidente e comunicacao
- [ ] Plano de resposta a incidente (runbook) para vazamento/invasao.
- [ ] Matriz de severidade e escalonamento com responsaveis nomeados.
- [ ] Evidencia de simulacao de incidente (tabletop/exercicio pratico).
- [ ] Processo de notificacao regulatoria e comunicacao a titulares quando aplicavel.
- [ ] Postmortem obrigatorio com acoes corretivas e preventivas.

### 22.9 Seguranca de desenvolvimento (SSDLC)
- [ ] Threat modeling do modulo health antes de go-live.
- [ ] Revisao de seguranca em PR para mudancas em dados sensiveis.
- [ ] SAST e lint de seguranca no CI bloqueando merge critico.
- [ ] DAST/pentest antes de producao e recorrente.
- [ ] Dependencias com politica de atualizacao e correcoes CVE.
- [ ] Proibido deploy com vulnerabilidade critica aberta sem aceite formal de risco.

### 22.10 Governanca de terceiros e contratos
- [ ] Mapear operadores/suboperadores que processam dados de health.
- [ ] Validar contratos e clausulas de protecao de dados com fornecedores.
- [ ] Definir transferencia internacional de dados (se houver) com base legal adequada.
- [ ] Garantir que integracoes externas respeitem minimizacao e escopo.

### 22.11 Gate final de liberacao (Go/No-Go)
Liberacao de producao so com TODOS os itens:
- [ ] LGPD Gate 100% concluido.
- [ ] Security Gate 100% concluido.
- [ ] Testes de autorizacao/isolamento passando.
- [ ] Teste de incidente executado com evidencia.
- [ ] Aprovacao formal de seguranca + produto + juridico.

### 22.12 Regra operacional critica
- Se houver suspeita de vazamento/invasao:
  - [ ] congelar mudancas nao essenciais;
  - [ ] ativar resposta a incidente imediatamente;
  - [ ] preservar evidencias;
  - [ ] comunicar stakeholders conforme runbook.
