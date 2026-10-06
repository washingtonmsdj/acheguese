# Validação atual — Módulo Educação

**Data do checkpoint:** 2026-10-06  
**Branch:** `education/post-mvp-readiness`  
**PR:** #612 (draft)  
**Status:** HARDENING PÓS-MVP — SOURCE GATES COM PROVA VERDE; ATIVAÇÃO AINDA BLOQUEADA

Este arquivo substitui os relatórios históricos que declaravam Educação pronta
para produção antes da Definition of Done atual. O módulo **não está READY** e
as rotas públicas continuam `launch-paused`.

## 1. Ownership canônico

- UI/aplicação: `src/modules/business/education`;
- contratos/read/write model: `src/core/education`;
- `EducationTrackingService`: único writer de
  `public.education_analytics_events`;
- `EducationObservabilityService`: observabilidade técnica sem persistência no
  funil de analytics;
- owners privados permanecem em `src/modules/business/education/pages`, fora de
  `activeCentralLazyImports.ts` e de `CentralRoutes` enquanto Education está pausado;
- rotas públicas preservadas permanecem fora do grafo público ativo; o barrel
  pós-MVP `lazyImports.ts` ainda mantém o kill-switch legado até o corte público correspondente.

`tools/architecture/validate-education-module-boundaries.ts` e
`tests/architecture/education-module-boundary-ratchet.test.ts` congelam essas
fronteiras.

## 2. Banco / RLS / autorização

O projeto Supabase canônico mantém RLS habilitado em:

- `education_profiles`;
- `education_programs`;
- `education_leads`;
- `education_lead_events`;
- `education_events`;
- `education_analytics_events`.

A gestão privada converge para
`private.can_operate_business_profile(...)`. O probe versionado
`tests/security/education-management-authority-remote-probe.sql`
(`de2f7e0da061...`) foi executado em `BEGIN ... ROLLBACK` e comprovou:

- owner direto autorizado;
- autenticado não-owner sem leitura/update;
- membership ativa `admin` autorizada;
- profile/program/lead/event/lead-event protegidos pela mesma autoridade;
- `washingtonmsdj` explicitamente excluído da fixture;
- nenhuma mutação persistente após a prova.

## 3. Analytics / tracking

A store `education_analytics_events` aceita somente o funil canônico:

- `profile_view`;
- `program_view`;
- `event_view`;
- `whatsapp_click`;
- `enrollment_cta_click`;
- `lead_submitted`;
- `event_interest`.

Cortes G6:

- `31377a685c51`: separa observabilidade técnica do funil;
- `750f2dd7f69a`: restaura analytics real;
- `6ad10de1b1a1`: aposenta facades duplicados de limites;
- `82a283998d42`: remove período fake;
- `74d08aa08580` / `8aeaa55b8bef` / `0f1ef66487dd`: convergem
  analytics para erro real em vez de zero sintético e fecham a query canônica;
- `1c10aae1515`: contagens do pipeline passam a usar o conjunto real completo.

## 4. Billing / limites

- Billing comercial usa o catálogo canônico de `core/billing`;
- limites operacionais pertencem ao registry de nichos Education;
- `EducationSubscriptionService` não mantém preço/limite paralelo;
- FREE continua fail-closed para capabilities pagas como eventos públicos e
  analytics avançado;
- o lifecycle autenticado valida os limites FREE na UI.

## 5. Lifecycle autenticado

`ae0c06d0c63c` adicionou
`tests/e2e/education-lifecycle-authenticated.spec.ts` e o runner
`test:e2e:education-lifecycle-authenticated`, com `retries=0`.

A suite usa exclusivamente a fixture Auth dedicada
`account-authenticated-e2e`; não usa service-role no browser e não usa
`washingtonmsdj`.

O fluxo implementado prova por UI + sessão autenticada:

1. criar Business Education;
2. entrar em `/educacao/setup`;
3. configurar escola / nicho regular-school;
4. persistir profile Education draft;
5. criar programa;
6. desativar e reativar programa;
7. abrir gestão de leads sem CTA fake de criação privada;
8. validar bloqueio de eventos no FREE;
9. validar Analytics/upgrade sem zero artificial;
10. limpar fixtures técnicas com prefixo `G6 E2E Education`.

A suite `test:e2e:education-lifecycle-authenticated` permanece disponível como
certificação dedicada, mas não integra o gate obrigatório de Account + Business
enquanto `PUBLIC_LAUNCH_SURFACES.education=false`. Isso evita bloquear o MVP
por um módulo explicitamente pausado sem apagar a cobertura funcional pronta.

A execução hosted same-SHA da suite Education continua necessária antes de
reativar a superfície pública ou privada no launch scope.

## 6. Confiabilidade de mutações

Cortes G6 recentes:

- `aad71766bc38`: setup Education ganhou compensação quando uma etapa posterior
  falha;
- `8d08bedeab53`: transições do pipeline de leads passaram a respeitar a
  máquina de estados canônica;
- `1c10aae1515`: contagens por etapa deixam de usar apenas a página atual;
- `331371cebe81`: eventos preservam horário local ao converter
  `datetime-local <-> ISO`;
- `7fc267768fbc`: gestão privada deixou de depender do launch público.

## 7. Caller census / legado

`8846d95d1956` aposentou componentes de apresentação sem caller runtime:

- `EducationCard`;
- `EducationProgramsSection`;
- `EducationContactSidebar`.

Explorer/Detail atuais usam seus próprios owners de apresentação e os arquivos
acima não fazem mais parte da API pública do módulo. O ratchet impede
recriação.

## 8. Truthfulness de leitura privada

`575a0da8ab0a` fechou um gap adicional:

- erros Supabase de profile/program/lead/lead-event/event privado não são mais
  convertidos em `null/[]/0`;
- o read model canônico lança erro;
- hooks de Programs/Leads/Pipeline/Events expõem
  `isError/error/refetch`;
- Dashboard, Setup, Programs, Leads, Events e Analytics exibem
  `EducationAdminReadError` com retry;
- empty state agora significa consulta bem-sucedida sem dados, não falha de
  backend mascarada.

`tests/architecture/education-private-read-truthfulness.test.ts` protege esse
contrato.

## 9. Evidência de source / CI

A frente pós-MVP já obteve uma prova conjunta de source no SHA
`f1b2231344555c9ff440d78c69eeb54a60e0b7c0`:

- Active Visual SSOT: **success**;
- Security Scan: **success**;
- Security Check: **success**;
- SSOT Enforcement: **success**;
- SSOT Territorial Tests: **success**;
- Heavy PR Certification: **success**.

Depois desse SHA o hardening continuou. A correção específica do falso positivo
histórico do Gitleaks foi provada isoladamente no SHA
`475c8e823ff1998c8de8de91d1150c08cbcf449d`, com **Security Scan success**.

Essas evidências demonstram que os gates funcionam e que a frente alcançou
estados verdes reais. Elas **não** autorizam copiar o resultado para um head
posterior: cada novo head relevante precisa ser revalidado no mesmo SHA.

O checkpoint operacional detalhado desta frente está em
`docs/08-roadmap/checkpoints/2026-10-06-education-post-mvp-readiness.md`.

## 10. O que ainda bloqueia Education READY

### BLOCKED — lifecycle / launch

Education permanece `paused` no registry canônico e fora dos lazy imports e
rotas ativas do MVP. Isso é intencional.

Não retirar o gate apenas para executar testes. A ativação deve ser uma decisão
explícita após certificação e precisa montar novamente, de forma controlada:

- Explorer territorial;
- Detail territorial;
- programas/eventos públicos;
- lead capture autorizado;
- tracking público;
- SEO/canonical;
- mobile, teclado e acessibilidade.

### BLOCKED — specialist E2E same-SHA

Existe uma suite autenticada dedicada,
`tests/e2e/education-lifecycle-authenticated.spec.ts`, que cria fixture
Business Education, executa Setup e prova operações privadas sem service-role
no browser. Ela foi fortalecida para validar também:

- INEP e URL de proveniência persistidos;
- faixa etária incluindo idade mínima `0`;
- programa com vagas `0`;
- preço `0` preservado.

Antes da ativação, essa suite precisa passar em execução hosted/autorizada no
mesmo SHA candidato.

As suites legadas em `tests/e2e/education/` são classificadas honestamente:
Setup operacional quando o ambiente existe, público pausado, Programas/Leads
como smoke legado e debug fora da certificação.

### BLOCKED — data plane e deployment final

Ainda são necessárias, no mesmo SHA candidato à ativação:

- reconciliação final de schema/RLS/RPCs;
- probes remotos de autorização;
- lifecycle autenticado;
- build/deployment observado;
- smoke do deployment;
- E2E público depois da liberação do lifecycle.

## 11. Próximo passo

1. manter Education `paused` enquanto o hardening continua;
2. fechar qualquer regressão concreta indicada pelos gates do head;
3. executar a suite autenticada dedicada em ambiente hosted autorizado quando
   houver janela de certificação;
4. reconciliar data plane/RLS/RPCs no SHA candidato;
5. preparar canary/decisão explícita de launch;
6. somente então executar E2E público e smoke de deployment no mesmo SHA.

## 12. Do not repeat

- não usar documentos arquivados como prova atual;
- não restaurar bridges Education aposentados;
- não restaurar componentes sem caller runtime;
- não transformar erro privado em empty state;
- não escrever observabilidade técnica em `education_analytics_events`;
- não expandir constraints do funil para acomodar código sem caller;
- não tocar em `washingtonmsdj` durante fixtures/probes;
- não converter `steps=null` em PASS;
- não retirar `launch-paused` apenas para executar E2E.
