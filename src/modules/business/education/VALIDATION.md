# Validação atual — Módulo Educação

**Data do checkpoint:** 2026-09-05  
**Checkpoint técnico:** `575a0da8ab0a00b868e890cfad88ff39f132c828`  
**Status:** G6 PRÉ-CERTIFICAÇÃO DE SOURCE CONCLUÍDA — PUBLIC CANARY / HOSTED SAME-SHA BLOCKED

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
- rotas privadas: `centralLazyImports` / `CentralRoutes`;
- rotas públicas: permanecem protegidas por
  `createLaunchPausedRoute("Educacao")`.

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

O job `Authenticated Account + Business + Education E2E` já está ligado ao
workflow canônico, mas os runs do HEAD atual continuam encerrando com
`steps=null`. Portanto a suite existe e está gateada, mas **a execução hosted
same-SHA ainda não foi observada**.

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

## 9. Estado de provider / build

Evidências independentes já obtidas em Vercel:

- `31377a685c51`: READY;
- `3b23725a3a8f`: READY;
- `5e1a26c46f9`: READY;
- `750f2dd7f69a`: READY;
- `6ad10de1b1a1`: READY;
- `82a283998d42`: READY;
- `0f1ef66487dd`: READY;
- `331371cebe81`: READY.

Os commits posteriores de lifecycle/caller-census/read-truthfulness ainda
precisam de build/deploy same-SHA observado.

GitHub Actions no HEAD `575a0da8...` permanece em falha de infraestrutura:
Security, SSOT e Territorial retornaram `steps=null`. Isso não é PASS nem
falha de source.

## 10. O que ainda bloqueia Education READY

### BLOCKED — public canary

A rota pública real ainda está `launch-paused`. Não existe override test-only
canônico para montar Explorer/Detail reais em Production sem expor a feature.

Não despausar apenas para “ver se funciona”. A próxima ativação pública deve
ser um canary controlado ou uma decisão explícita de launch seguida de:

- Explorer territorial;
- Detail territorial;
- programas públicos;
- lead capture real;
- tracking público;
- SEO/canonical/noindex conforme escopo;
- mobile/acessibilidade.

### BLOCKED — hosted same-SHA

Ainda falta no mesmo SHA:

- lint;
- typecheck;
- unit/integration/security;
- lifecycle autenticado;
- build/deploy;
- smoke.

O código não deve ser marcado READY por inferência a partir de SHAs anteriores.

## 11. Próximo passo

Enquanto os runners hosted permanecem indisponíveis e o public launch continua
pausado:

1. manter Educação `PAUSED/BLOCKED`, sem reabrir source já fechado;
2. observar o próximo build Vercel do HEAD e corrigir apenas erro concreto;
3. executar o lifecycle autenticado assim que o runner receber steps reais;
4. preparar canary/decisão de launch público antes de remover
   `launch-paused`;
5. avançar G6 para **Community** em paralelo, registrando Educação como blocker
   externo de certificação final.

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
