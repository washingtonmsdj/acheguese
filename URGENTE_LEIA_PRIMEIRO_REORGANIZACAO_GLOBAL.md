# 🚨 URGENTE — LEIA PRIMEIRO: REORGANIZAÇÃO GLOBAL DO REPOSITÓRIO

> **ARQUIVO PERMANENTE DA RAIZ — NÃO MOVER, NÃO RENOMEAR, NÃO EXCLUIR.**
>
> Este arquivo deve permanecer **sempre na raiz do repositório**. Ele é o ponto de entrada obrigatório para futuras IAs, agentes, desenvolvedores e auditorias antes de qualquer reorganização estrutural, refactor transversal, criação de módulo, mudança de SSOT ou migração de arquivos.
>
> **Regra para IA/agente:** antes de alterar arquitetura, estrutura de pastas, ownership de domínio, imports transversais, `core`, `modules`, `integrations`, `shared`, `tests`, `scripts/tools`, Supabase ou SSOT, leia este documento inteiro e preserve suas invariantes.

**Criado em:** 2026-08-26  
**Estratégia:** `main` only, commits pequenos, sem force push, sem branch nova para esta missão  
**Status:** EM EXECUÇÃO — G6 / Empresas base, Gastronomia e Educação aguardam provas finais; Community está em sweep ativo de ownership  
**Checkpoint técnico atual:** `94e804c0013e8a8fd54a488beb96f0d6b4d45bb7`  
**Checkpoint de transição G5 → G6:** `docs/03-architecture/G5_CLOSURE_G6_CONTINUATION_2026-09-04.md`  
**Projeto:** Achegue-se  
**Arquitetura atual:** single-repo / modular monolith Vite + React + TypeScript + Supabase  
**Monorepo:** NÃO atualmente; manter monorepo-ready, sem migrar para workspaces/Turborepo agora

---

## 1. Objetivo

Reorganizar **todo o repositório** para que cada arquivo tenha um owner arquitetural claro, eliminar arquivos espalhados e namespaces históricos concorrentes, consolidar SSOTs globais, alinhar source ↔ banco ↔ RLS ↔ testes ↔ deploy e só então certificar os módulos um a um.

A ordem obrigatória é:

1. organizar o repositório;
2. instalar boundaries e taxonomia globais;
3. consolidar SSOTs transversais;
4. reconciliar banco/RLS/legados;
5. estruturar e corrigir módulos por domínio;
6. executar certificação operacional do mesmo SHA;
7. declarar MVP somente com evidência.

**Não repetir o padrão antigo de corrigir um módulo profundamente enquanto o repositório continua estruturalmente ambíguo.**

---

## 2. Decisão arquitetural: NÃO transformar em monorepo agora

O projeto atual possui um único `package.json` de aplicação Vite e não usa `workspaces`. Portanto, hoje ele **não é monorepo**.

A reorganização deve produzir primeiro um **modular monolith rigoroso**, com boundaries claros. Isso entrega a organização necessária sem introduzir agora PNPM workspaces, Turborepo, múltiplos builds ou complexidade adicional de CI/deploy.

O repositório deve ficar **monorepo-ready**. Uma futura migração só deve ser considerada quando houver motivo real, por exemplo:

- mais de um app independente (`web`, `mobile`, `admin`);
- código compartilhado realmente versionável como package;
- equipes independentes por package;
- necessidade mensurável de cache/build isolado;
- SDK ou segundo produto reutilizando o mesmo core.

Até lá, **não criar `apps/`, `packages/`, `pnpm-workspace.yaml` ou `turbo.json` apenas por organização estética.**

---

## 3. Estrutura física alvo

```text
acheguese/
├── URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md   # PERMANENTE NA RAIZ
├── src/
│   ├── app/                 # bootstrap, providers, router, layouts, composition root
│   ├── modules/             # UI e aplicação por domínio/produto
│   │   ├── business/
│   │   ├── community/
│   │   ├── events/
│   │   ├── classifieds/
│   │   ├── mobility/
│   │   ├── tourism/
│   │   ├── jobs/
│   │   └── ...
│   ├── core/                # SSOT de domínio, contracts canônicos, read/write models
│   │   ├── business/
│   │   ├── profiles/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── analytics/
│   │   ├── reviews/
│   │   ├── messaging/
│   │   ├── moderation/
│   │   ├── media/
│   │   ├── territory/
│   │   └── ...
│   ├── integrations/        # adapters externos somente
│   │   ├── supabase/
│   │   ├── maps/
│   │   ├── payments/
│   │   └── ...
│   ├── shared/              # primitives realmente transversais
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── contracts/
│   │   └── types/
│   ├── assets/
│   └── styles/
├── api/                     # endpoints/server handlers Vercel
├── supabase/
│   ├── functions/
│   ├── migrations/
│   └── tests/
├── tests/
│   ├── architecture/
│   ├── security/
│   ├── integration/
│   ├── regression/
│   └── e2e/
├── tools/                   # destino gradual dos scripts operacionais
│   ├── architecture/
│   ├── security/
│   ├── migrations/
│   ├── seeds/
│   └── release/
└── docs/
```

### Invariante importante

`src/features` é um namespace histórico e deve chegar a **zero implementação própria**. Cada feature deve escolher um owner real:

- UI/aplicação → `src/modules/<domínio>`;
- domínio/SSOT/persistência → `src/core/<domínio>`.

Bridges temporários podem existir durante migração, mas devem ser explicitamente rastreados e removidos.

---

## 4. Taxonomia obrigatória

### `src/app`
Pode conter:

- bootstrap;
- composition root;
- providers globais;
- roteamento;
- layouts globais;
- integração entre módulos no nível da aplicação.

Não deve conter regra de negócio ou persistência de domínio.

### `src/modules/<domínio>`
Pode conter:

- páginas;
- componentes de produto;
- hooks de apresentação/aplicação;
- view models;
- orchestration de UI;
- adapters de compatibilidade temporários apontando para core.

Não pode conter acesso runtime direto a Supabase/integrations quando houver owner canônico em core.

### `src/core/<domínio>`
É o owner de:

- contracts canônicos do domínio;
- invariantes;
- services/read models/write models;
- autorização específica do domínio;
- persistência do domínio;
- integração com outros SSOTs do core.

`core` **não pode depender de `modules`**.

### `src/integrations`
Somente adapters técnicos externos, sem regra de negócio:

- Supabase client/base infrastructure;
- mapas;
- gateways externos;
- SDKs/providers.

Domínio não deve nascer aqui.

### `src/shared`
Somente aquilo que é realmente reutilizável e sem owner de domínio específico.

Não usar `shared` como pasta de descarte.

### `tests`
Owners globais:

- `tests/architecture` — boundaries/SSOT/taxonomia;
- `tests/security` — authz/RLS/abuso;
- `tests/integration` — integração entre owners;
- `tests/regression` — regressões históricas;
- `tests/e2e` — fluxos reais de produto.

Testes unitários muito locais podem permanecer próximos ao source quando isso melhora coesão.

### `tools`
Destino gradual do atual `scripts/` por responsabilidade. A migração deve preservar os comandos públicos do `package.json` durante a transição.

---

## 5. Regras de movimentação

1. **Mover primeiro, alterar comportamento depois.**
2. Não combinar move massivo com regra de negócio nova no mesmo commit.
3. Preservar blobs/implementação exata sempre que possível.
4. Atualizar imports, validators, tsconfigs, workflows e deploy guards no mesmo corte quando apontarem para paths movidos.
5. Bridge é temporário e sempre deve apontar numa só direção: legado → owner canônico.
6. Nunca criar dois SSOTs para “facilitar” uma migração.
7. `core → modules` é proibido.
8. `module → integrations` direto deve ser eliminado progressivamente e protegido por validator.
9. Não apagar legado/dados apenas por nome ou heurística; provenance obrigatória.
10. Não declarar módulo completo/MVP por documentação antiga ou testes de outro SHA.
11. Revalidar `main` antes de cada write porque podem existir agentes concorrentes.
12. Nunca usar force update da `main` nesta missão.

---

## 6. Fases de execução

## G0 — Repository Census

**Objetivo:** saber exatamente o que existe antes de mover.

Checklist:

- [x] inventariar todos os diretórios de raiz;
- [x] inventariar roots de `src`;
- [x] inventariar `src/modules`;
- [x] inventariar `src/core`;
- [x] inventariar `src/features`;
- [x] inventariar `src/integrations`;
- [x] inventariar `src/shared`;
- [x] inventariar testes dispersos (`tests`, `src/test`, `src/__tests__`, colocados no domínio);
- [x] inventariar `scripts` por responsabilidade;
- [x] identificar arquivos soltos e namespaces históricos;
- [x] identificar módulos duplicados/paralelos;
- [x] identificar imports `core → modules`;
- [x] identificar imports `module → integrations`;
- [x] identificar SSOTs duplicados;
- [x] gerar mapa owner atual → owner alvo;
- [x] classificar cada item como KEEP / MOVE / BRIDGE / MERGE / RETIRE / INVESTIGATE.

**Saída:** inventário versionado em `docs/` + validators iniciais.

## G1 — Architecture Taxonomy

**Objetivo:** impedir novas ambiguidades enquanto a reorganização ocorre.

- [x] formalizar taxonomia em documentação arquitetural;
- [x] validator contra novos roots não autorizados em `src`;
- [x] validator contra novos arquivos de implementação em `src/features`;
- [x] validator `core → modules`;
- [x] validator de module → integrations;
- [x] mapear exceções temporárias com allowlists monotônicas;
- [x] stale allowlist deve falhar.

## G2 — Physical Reorganization

**Objetivo:** mover fisicamente cada owner sem mudar comportamento.

**Status:** CONCLUÍDO no nível estrutural. Prova hosted same-SHA continua separada e não deve ser inferida enquanto o runner não executar steps.

Ordem recomendada:

1. namespaces históricos pequenos e isolados;
2. `src/features` → owners reais;
3. services/contracts fora do owner;
4. testes globais dispersos;
5. scripts → tools;
6. arquivos soltos de domínio;
7. bridges restantes.

Cada corte deve terminar com path antigo vazio ou bridge mínimo explicitamente rastreado.

## G3 — Global Boundaries

**Objetivo:** tornar a estrutura auto-defensiva.

**Status:** CONCLUÍDO no source/gates. Os workflows alcançam os validators, mas a infraestrutura hosted continua incapaz de executar os jobs no checkpoint conhecido.

- [x] integração somente pelos owners permitidos;
- [x] sem imports reversos;
- [x] sem cross-module indevido;
- [x] sem novo `features`;
- [x] sem SSOT paralelo conhecido;
- [x] workflows alcançam todos os validators de arquitetura bloqueantes.

## G4 — Global SSOT Hardening

**Objetivo:** consolidar primeiro os serviços horizontais usados por vários módulos.

**Status:** CONCLUÍDO no nível source/authority. Drift exaustivo, legados e certificação same-SHA seguem em G5/G7.

Ordem prioritária:

- [x] Auth/session — owner/source consolidado em `src/core/auth` + `src/core/session`; providers/hooks paralelos aposentados e direct auth runtime concentrado nos owners/adapters canônicos;
- [x] Profiles/memberships/roles — owners de profiles, memberships e roles consolidados em `src/core`; runtime não consulta `user_roles` diretamente fora da autoridade canônica e callers de membership convergem para o owner;
- [x] Business — owner/source, single-create authority, writer de `business_data`, autorização conhecida de subrecursos e Analytics convergidos; atomicidade/compensação, provenance de legados, drift exaustivo e certificação funcional permanecem em G5/G6/G7;
- [x] Territory/location — `core/location` é owner da geografia estrutural, `core/territorial` é owner de grupos/orquestração territorial, `core/geospatial` limita-se a boundary enrichment e Edge Functions endurecidas mantêm apenas gateways especializados de visibilidade; callers e bridges do antigo repository de grupos em `core/location` foram aposentados e o ratchet impede recriação;
- [x] Public URL/slug — `core/public-identity` governa política, disponibilidade e geração de identificadores estáveis; Profile, Business, Professional e Classifieds mantêm builders/resolvers explícitos por domínio, com semântica própria de identidade, e `validate-public-url-ssot.ts` bloqueia imports internos e unicidade concorrente;
- [x] Media/uploads — imagem pública canônica converge em `core/media` + broker `media-assets`; Safety privado converge em `SafetyEvidenceService`; helper público residual ficou restrito a Try-On, gateways server-side de Storage estão enumerados no validator e a migration remota `20260829161927` reparou as policies do bucket `safety-evidence`;
- [x] Analytics — `src/core/analytics/AnalyticsService.ts` é o owner horizontal único; adapter/UI/read model paralelos foram aposentados, contratos de RPC/enum foram alinhados ao remoto, `validate-analytics-ssot.ts` está no Gate-First e a migration `20260829164446` reparou a autoridade de leitura de métricas de Business;
- [x] Reviews — `public.reviews` + `src/core/reviews` permanecem o agregado/owner de Profile Reviews; Business usa `BusinessReviewService` + `business-reviews-rpc`, admin foi alinhado a `is_admin`, resposta comercial exige gestão canônica via `private.user_can_manage_profile`, e o remoto está sincronizado na Edge Function v10; cinco RPCs comerciais antigos ficaram classificados como legado dormente service-role-only para provenance em G5;
- [x] Billing/subscriptions — `src/core/billing` é o owner horizontal; catálogo publicado é a autoridade de plano/preço/entitlements, `user_subscriptions` é read-only no browser, Checkout/Portal governam mudança comercial e `billing-webhook` materializa estado server-side; legados, semântica completa de snapshot e E2E Stripe permanecem em G5/G6/G7;
- [x] Messaging/realtime/notifications — `src/core/messaging` mantém agregados Classified e Community Direct explicitamente separados, `src/core/realtime/RealtimeService` é o único owner de channels e `src/core/notifications` governa inbox/preferências/outbox; UI pausada foi retirada do core, writes privilegiados de notifications foram endurecidos e os streams exigidos foram alinhados à publication; UX, carga, legados e E2E ficam em G5/G6/G7;
- [x] Moderation/trust — `core/moderation` governa taxonomia/projecao federada, cada dominio preserva seu report/status mestre e `core/trust` governa eventos, bans, policies e comandos horizontais; writers/review bypass do browser foram removidos, views admin ficaram read-only, UI horizontal saiu de core e `moderation-trust-boundary.test.ts` congela o desenho; retencao LGPD, drift exaustivo e certificacao permanecem em G5/G7;
- [x] Search/discovery — `src/core/search/SearchService` é o único orquestrador textual federado, providers delegam aos owners de domínio e não acessam read models diretamente; `public_business_search` e `public_professional_search` permanecem read models dos domínios Business/Professional e foram endurecidos para SELECT-only; RPCs `search_entities_*` continuam no boundary Maps/Geospatial e não formam um segundo Search SSOT;
- [x] permissions/authorization helpers — `src/core/authorization/RoleService` governa decisões globais via `role-rpc`, `AdminRolesService` ficou management-only, `get_user_roles` foi reparado para a validade canônica, policies globais convergiram para helpers `private.*`, wrappers públicos viraram bridges one-way e o browser perdeu hard DELETE de `user_roles`; `gastronomy_subscriptions` permanece legado deprecated para provenance em G5.

Para cada SSOT:

- owner único;
- contracts únicos;
- read/write model único;
- adapters legados one-way;
- tests de regressão;
- schema/RLS coerentes quando aplicável.

**Interpretação dos checkboxes de G4:** `[x]` fecha a autoridade arquitetural/source do SSOT e exige que o estado remoto conhecido não contradiga essa autoridade. Reconciliação exaustiva de migrations ↔ schema remoto, cobertura integral de RLS/grants, legados de banco e certificação same-SHA pertencem a G5/G7 e não são implicitamente marcadas como concluídas por G4.

## G5 — Database, RLS e legado

**Objetivo:** alinhar código e banco antes de certificar módulos.

**Status:** EM EXECUÇÃO. Primeiro corte: inventário de drift migration ↔ remoto e provenance de legados, sem exclusão por heurística.

- [ ] schema atual vs migrations;
- [ ] RLS e grants;
- [ ] funções/RPCs e authority;
- [ ] tabelas legadas sem caller;
- [ ] órfãos;
- [ ] fixtures/E2E sem provenance;
- [ ] indexes/constraints;
- [ ] migrations idempotentes/fail-closed;
- [ ] source ↔ DB contract drift;
- [ ] definir plano de limpeza sem perda de dados.

## G6 — Module Certification

**Objetivo:** só depois da base global, corrigir/certificar módulo por módulo.

Checklist padrão por módulo:

1. arquitetura;
2. contracts;
3. DB/schema;
4. RLS/authz;
5. services/read/write;
6. hooks;
7. UI;
8. loading/error/empty states;
9. mobile/responsividade;
10. segurança;
11. testes unitários/integration;
12. E2E;
13. build/deploy do mesmo SHA;
14. documentação;
15. decisão READY / PAUSED / BLOCKED.

Ordem inicial sugerida:

- [ ] Empresas base — source/RLS/partial-state preparados, Production same-SHA READY/smoke 200; lifecycle autenticado ainda BLOCKED por runner pré-step (#89 reaberto);
- [ ] Gastronomia — migrations reconciliadas, management RLS alinhado a `private.can_manage_profile`, probe owner/admin/non-manager PASS e source cleanup compilado em Vercel; certificacao hosted same-SHA ainda pendente;
- [ ] Educação — source pre-certification concluída até `575a0da8`: ownership/RLS/probe fechados, lifecycle autenticado browser-only ligado ao gate, compensação/lead pipeline/event datetime corrigidos, callerless UI aposentada e reads privados fail-closed; permanece BLOCKED por public canary + hosted same-SHA;
- [ ] Community;
- [ ] Events;
- [ ] Messaging;
- [ ] Classifieds;
- [ ] Mobility;
- [ ] Tourism;
- [ ] Jobs/Professional;
- [ ] Admin;
- [ ] demais módulos inventariados em G0.

## G7 — Repository / MVP Certification

Só declarar o repositório MVP-ready quando **o mesmo SHA** tiver:

- [ ] arquitetura sem violações conhecidas;
- [ ] SSOT global reconciliado;
- [ ] migrations reconciliadas com remoto;
- [ ] security/RLS checks;
- [ ] lint;
- [ ] typecheck;
- [ ] unit/integration/regression;
- [ ] E2E de escopo de lançamento;
- [ ] build;
- [ ] deploy;
- [ ] smoke pós-deploy;
- [ ] documentação sincronizada.

Falha de provider/runner deve ser registrada como BLOCKED, nunca convertida em PASS por inferência.

---

## 7. Problemas globais já conhecidos no início desta missão

Este plano nasce com evidências recentes de que a reorganização é necessária:

- `src/features/events` ainda é implementation owner histórico enquanto `src/modules/community-events` existe como destino arquitetural;
- Education e Gastronomy já precisaram de migrações extensas module → core;
- Business possuía RPC público dentro do módulo e authorization helpers divergentes;
- Analytics possuía read model paralelo com schema drift;
- existem tabelas/paths legados e dados técnicos históricos que exigem provenance;
- testes existem em mais de uma convenção/local;
- `scripts/` concentra responsabilidades diferentes;
- `main` opera sem branch protection/ruleset efetivo no checkpoint conhecido;
- CI hosted e Vercel podem bloquear certificação mesmo quando source está correto.

Esses itens descrevem o **baseline inicial** e devem ser revalidados, não assumidos eternamente verdadeiros. O registro de progresso abaixo é a autoridade para saber o que já foi fechado depois do baseline.

---

## 8. Política de commits desta missão

Preferir commits pequenos e semanticamente únicos, por exemplo:

```text
docs(architecture): add repository census
arch(taxonomy): lock canonical source roots
refactor(events): move implementation to community module
refactor(analytics): consolidate business metrics read model
arch(tests): centralize architecture regression tests
arch(tools): group security validators
```

Evitar:

```text
refactor: reorganize everything
```

Um commit grande demais torna regressão, revisão e rollback impraticáveis.

---

## 9. Definition of Done da reorganização física

A reorganização física G0–G3 só estará concluída quando:

- não houver namespace de implementação `src/features`;
- todos os domínios tiverem owner explícito;
- `core` não importar `modules`;
- modules não acessarem integrations diretamente fora de exceção temporária registrada;
- arquivos de domínio não estiverem espalhados por roots genéricos;
- testes globais tenham taxonomia consistente;
- ferramentas estejam classificadas;
- deploy/typecheck/workflows apontem para os paths novos;
- bridges tenham inventário e plano de remoção;
- validators impeçam regressão estrutural.

---

## 10. Definition of Done de SSOT

Um domínio/serviço transversal só está SSOT quando:

- existe um owner canônico documentado;
- existe uma única regra de negócio autoritativa;
- callers antigos delegam ao owner ou foram removidos;
- banco/RLS/RPC conhecidos não contradizem a mesma autoridade; drift exaustivo é fechado em G5;
- existe regression guard;
- não há segundo service/write model ativo concorrente conhecido.

---



## 11. Registro de progresso

Atualizar esta seção somente com marcos relevantes. Não transformar este arquivo em log de cada commit.

### 2026-09-05 — G6 Community / ownership sweep ativo

- [x] Feed, Groups, Recommendations, Lost & Found, access policy e route-territory deixaram de depender dos bridges genéricos históricos; os owners explícitos permanecem em `core/community-feed`, `core/community-groups`, `core/community-recommendations`, `core/community-lost-found` e `core/community-experience`;
- [x] Events consolidado em `5824840546555f0bf360d74aac89e612382a53e4`: a rota ativa continua em `modules/community-events`, `useEventTerritoryFilter` usa `useModuleTerritoryFilter` com escopo preservado, e as pages/hook genéricos antigos foram aposentados;
- [x] Groups consolidado em `1989bdc20aec39a0438201cf71fe25d3e913d7cb` + `c1fcf55ffebfc557fb7c1d67e156ea787a322879`: service, listagem, favoritos, detalhe, chat e moderação usam `core/community-groups`; a facade genérica `CommunityService` foi removida;
- [x] Recommendations/Q&A consolidado em `487788ecac6a66228887bfee85596b2e30f4c1bd` + `031ea3b4af8519aaf37ff386f5dc9a16edc336fe`: service, hooks, tipos Q&A e `QuestionsList` pertencem a `core/community-recommendations`;
- [x] `src/core/community/pages` chegou a zero implementação e não deve ser recriado;
- [x] Vercel READY comprovado em `1989bdc20aec39a0438201cf71fe25d3e913d7cb`, cobrindo o primeiro corte completo de Groups;
- [ ] `c1fcf55f` / `031ea3b4` ainda aguardam build/deploy hosted do próprio SHA; jobs GitHub observados continuam falhando antes dos steps (`steps=null`), portanto não inferir source failure nem PASS;
- [ ] continuar caller census do namespace genérico `src/core/community` por responsabilidade real (feed/composer/comments, messaging, sponsored ads, civic reports etc.); **não fazer move/delete em massa por nome**;
- [ ] Community continua **NÃO READY** até lint/typecheck/security/test/build/smoke same-SHA e certificação funcional exigida por G6.

### 2026-09-05 — G6 Educação / source pre-certification

- [x] lifecycle autenticado Education implementado em `ae0c06d0`, usando somente a fixture
  `account-authenticated-e2e`, sem service-role no browser e sem tocar em `washingtonmsdj`;
- [x] gestão privada desacoplada do public launch em `7fc26776`; `launch-paused` público permanece fail-closed;
- [x] setup com compensação, pipeline de leads, contagens reais e horário local de eventos corrigidos;
- [x] analytics/billing/limites convergidos para contratos reais, sem período/zero artificial;
- [x] componentes Education sem caller runtime aposentados em `8846d95d`;
- [x] reads privados passaram a falhar fechado com retry explícito em `575a0da8`;
- [x] authorization probe `de2f7e0d` PASS em `BEGIN/ROLLBACK`, excluindo explicitamente `washingtonmsdj`;
- [ ] public Explorer/Detail continuam BLOCKED por `launch-paused`; não remover a pausa apenas para testar;
- [ ] lifecycle hosted + lint/typecheck/security/build/smoke same-SHA continuam BLOCKED porque os jobs atuais retornam `steps=null`;
- [x] próximo sweep G6 liberado: Community pode avançar em paralelo sem declarar Educação READY.

### 2026-09-04 — G6 Empresas base / autorização + lifecycle + partial-state

- [x] autorização negativa Business provada no Supabase canônico por probe `BEGIN/ROLLBACK`:
  owner visível; não-owner `read=0`, `update=0`, DELETE negado;
- [x] lifecycle positivo implementado com a fixture Auth dedicada
  `account-authenticated-e2e`, sem usar `washingtonmsdj` e sem service-role no browser;
- [x] lifecycle mutante default-deny; somente o runner explícito
  `test:e2e:business-lifecycle-authenticated` o habilita com `retries=0`;
- [x] create parcial ganhou compensação via `ProfileService.deleteProfile` + `AddressService.deleteAddress`;
- [x] update ganhou cleanup de address novo ainda não anexado e estratégia de retry idempotente
  para profile/business/hours/contacts;
- [x] soft delete classificado como retry convergente `deleted -> is_active=false`;
- [x] cupons/promocoes reclassificados como **PAUSED / fora do launch scope**, não blocker de Empresas base;
- [x] Vercel READY em `126da4a`, `0f5ccbef`, `ad08edea` e `cc0cf891`; smoke same-SHA em `acheguese.com.br` para `/`, `/empresas` e `/login` retornou HTTP 200;
- [ ] execução E2E same-SHA de Empresas base — **BLOCKED por infraestrutura GitHub**:
  jobs recentes continuam `steps=null`, inclusive Authenticated Account E2E;
- [ ] Heavy Pre-Merge Certification + smoke do mesmo SHA antes de marcar Empresas base READY.

### 2026-09-04 — G6 Gastronomia / pre-certificacao source + DB

- [x] antigo drift historico de migrations revalidado como resolvido: 498 migrations remotas = 498 arquivos locais, sem versao/nome divergente;
- [x] censo RLS identificou nove policies Gastronomy/menu ainda limitadas a dono direto por `profiles.user_id = auth.uid()`;
- [x] migration `20260904232530_align_gastronomy_profile_management_authority_g6.sql` aplicada ao Supabase canônico e reconciliada no source;
- [x] oito policies de escrita agora usam `USING` + `WITH CHECK` com `private.can_manage_profile`; historico de niche usa a mesma autoridade para SELECT;
- [x] probe remoto versionado passou em `BEGIN/ROLLBACK`: non-manager UPDATE=0; membership temporaria `admin` gerencia profile/menu/category/item; `washingtonmsdj` explicitamente preservado;
- [ ] testes/E2E/build/deploy same-SHA de Gastronomia ainda pendentes; nao marcar o modulo READY;
- [ ] Empresas base continua BLOCKED apenas pela recorrencia de runner pre-step registrada no issue #89, sem regressao source comprovada.

### 2026-08-26 — Início

- [x] decisão: reorganização global antes de novas certificações verticais;
- [x] decisão: manter single-repo modular; não migrar para monorepo agora;
- [x] estrutura alvo definida;
- [x] fases G0–G7 definidas;
- [x] este arquivo permanente criado na raiz;
- [x] G0 Repository Census concluído;
- [x] G1 Architecture Taxonomy concluída;
- [x] G2 Physical Reorganization concluída;
- [x] G3 Global Boundaries concluído;
- [x] G4 Global SSOT concluído no nível source/authority;
- [x] G5 Database/RLS concluído — blockers B0–B3 fechados; novos drifts são regressões focadas;
- [ ] G6 módulos certificados;
- [ ] G7 MVP certificado.

### 2026-08-27 — G0/G1

- [x] censo revalidado e atualizado em `docs/03-architecture/REPOSITORY_CENSUS_2026-08-26.md`;
- [x] `src/features`, `src/test`, `src/__tests__` e `src/types` revalidados como roots aposentados;
- [x] roots canônicos de `src` congelados por regression guard (`4f646d0`);
- [x] dívida runtime `module → integrations` inventariada em allowlist exata de 8 entradas (`12bdf13`);
- [x] validator incremental passou a bloquear nova dívida `module → integrations`, impedir absorção no baseline e falhar allowlist stale (`9430f6f`);
- [ ] validação hosted do SHA `9430f6f` — **BLOCKED por runner/provider**: jobs retornaram `steps: []`, `runner_id: 0` e nenhum runner executou comandos; não inferir PASS nem source failure;
- [x] próximo marco executado: G2 Physical Reorganization em cortes pequenos, preservando comportamento e os guards de G1.

### 2026-08-28 — G2 Physical Reorganization

- [x] `src/features`, `src/test`, `src/__tests__`, `src/types` e o root global `src/config` aposentados e protegidos contra recriação;
- [x] bridges globais de configuração reduzidos a zero e owners canônicos consolidados em `app`, `core` e `shared`;
- [x] root `scripts/` aposentado após migração do tooling operacional para `tools/**`;
- [x] root `e2e/` aposentado com specs/helpers globais em `tests/e2e/**`;
- [x] namespaces históricos de Events e Guide retirados dos owners antigos e protegidos por ratchets;
- [x] `plans/` aposentado: roadmaps ativos migrados para `docs/08-roadmap/**`, planos concluídos para `docs/10-archive/plans/**`, e consumidores dos paths antigos atualizados;
- [x] `tests/architecture/repository-reorganization-contract.test.ts` protege os roots aposentados, incluindo `plans/`;
- [x] G2 fechado estruturalmente no SHA `dd2e9cd235cd7a61da2ef85384a76b1fcb1b9836`;
- [ ] validação hosted do SHA `dd2e9cd235cd7a61da2ef85384a76b1fcb1b9836` — **BLOCKED por runner/provider**: jobs observados retornaram `steps: []`, `runner_id: 0` e nenhum runner executou lint, typecheck, testes ou validators. Isso não é PASS nem falha de source;
- [x] próximo marco executado: G3 Global Boundaries.

### 2026-08-29 — G3/G4 fechados / G5 iniciado

- [x] G3 Global Boundaries fechado: validators bloqueantes ficaram alcançáveis pelo workflow canônico e os ratchets impedem imports reversos, cross-module indevido, recriação de roots aposentados e novos SSOTs paralelos conhecidos;
- [x] Auth/session consolidado: `SessionProvider`/`SessionService`/`SessionState` e `useSessionContext` são a superfície canônica; hooks/providers paralelos foram aposentados e protegidos por `validate-session-context.ts`;
- [x] Profiles/memberships/roles consolidado no source: decisões runtime e leituras de roles foram roteadas para os owners canônicos; busca no HEAD confirmou zero leitura runtime direta de `user_roles` em `src` fora da autoridade central;
- [x] metadata remota do Supabase revalidada: RLS está habilitado nos owners centrais observados; helpers canônicos de admin/business permanecem com `search_path` explícito e grants intencionais. Isso é evidência de coerência atual, não substitui o drift audit completo de G5;
- [x] Business fechado no nível G4 de source/ownership: criação convergiu para `BusinessService.createBusiness()`, writers de `business_data` ficaram dentro de `src/core/business`, subrecursos conhecidos foram revalidados contra `private.can_manage_profile`, Analytics convergiu para `AnalyticsService` e os ratchets bloqueiam regressão. Atomicidade/compensação e legados continuam G5/G6/G7;
- [x] Territory/location fechado no source: `core/location` mantém CRUD/hierarquia geográfica, `core/territorial` concentra grupos e orquestração de visibilidade, `core/geospatial` só enriquece `boundary`, e os três bridges históricos de repository territorial sob `core/location` foram aposentados; `validate-territory-ssot.ts` bloqueia sua recriação;
- [x] Public URL/slug fechado no source: `PublicIdentityService.generateAvailableIdentifier()` passou a confirmar candidatos por existência exata, Business e Professional removeram fallbacks próprios de `ilike + contador`, consumidores externos passaram a carregar a facade `@/core/public-identity`, e `validate-public-url-ssot.ts` protege identidade e builders públicos por domínio;
- [x] Media/uploads fechado no nível G4: `MediaService`/`media-assets` governam imagem pública canônica, `SafetyEvidenceService` é o owner do fluxo privado de evidências, `validate-upload-ssot.ts` cobre frontend e Edge Functions, e `20260829161927_repair_safety_evidence_storage_owner_policies.sql` reconciliou o bucket privado remoto; `verification-documents` sem caller runtime permanece dívida explícita de G5;
- [x] Analytics fechado no nível G4: `src/core/analytics/AnalyticsService.ts` ficou como owner horizontal único; adapter duplicado, UI pausada em `core` e read model paralelo de Work Opportunities foram aposentados; contratos de `get_recent_analytics_events` e `analytics_event_type` foram alinhados ao remoto; `validate-analytics-ssot.ts` entrou no Gate-First; e `20260829164446_repair_analytics_business_read_authority.sql` corrigiu o drift `profiles.id` vs `auth.uid()` e removeu leitura anônima dos read models de Business;
- [x] Reviews fechado no nível G4: `public.reviews`/`src/core/reviews` continuam o agregado e owner de reviews com alvo Profile; o broker Business deixou de consultar `user_roles` diretamente, resposta comercial passou a exigir `private.user_can_manage_profile` via wrapper service-role-only `20260829171858`, a Edge Function `business-reviews-rpc` foi sincronizada no remoto na versão 10 com `verify_jwt=true` e proteção de conta operacional, e o contrato `docs/07-modules/REVIEWS_SSOT.md` foi revalidado; cinco RPCs comerciais antigos sem caller runtime permanecem explicitamente como legado dormente para provenance/retirada em G5;
- [x] Billing/subscriptions fechado no nível G4: catálogo publicado (`commercial_catalog_version` + `catalog_item` + policies) passou a ser a autoridade de plano/preço/features/entitlements; `BillingPlanService` virou adapter desse catálogo; `BusinessSubscriptionService` separou explicitamente assinatura de Business do reader de assinatura `user`; writer browser de `user_subscriptions` foi eliminado, painéis admin ficaram read-only, Checkout/Portal governam mudanças comerciais e `billing-webhook` é o materializador server-side;
- [x] Billing remoto reconciliado no escopo conhecido: `20260829173833` removeu self-service write do usuário, `20260829175638` preservou entitlements extras no catálogo e `20260829183431` removeu a policy administrativa `ALL`; revalidação posterior confirmou somente policies SELECT em `user_subscriptions` para usuários/proprietários/admins;
- [x] `tests/architecture/billing-subscription-authority.test.ts` protege ausência de writers browser, catálogo read-only no browser, namespaces/serviços paralelos aposentados, escopo/status canônicos e autoridade Stripe/server-side; `src/core/billing/README.md` e `docs/architecture/SSOT_REGISTRY.md` foram sincronizados;
- [x] Messaging/realtime/notifications fechado no nível G4: `ClassifiedMessagingService` e `CommunityDirectMessagingService` permanecem owners explícitos dos seus agregados, sem `MessagingService` genérico; UI órfã em `src/core/messaging/{components,hooks,pages}` foi aposentada porque as rotas já estavam launch-paused, e `tests/architecture/classified-messaging-ssot.test.ts` impede recriação de UI dentro de core;
- [x] Realtime reconciliado no remoto conhecido: `RealtimeService` continua sendo o único owner de `.channel()`, e `20260829185634_align_messaging_notification_realtime_publication.sql` adicionou `public.notifications` e `public.messages` à `supabase_realtime`; revalidação confirmou também `community_direct_messages` na mesma publication;
- [x] Notifications reconciliado no remoto conhecido: `20260829185546_harden_notification_inbox_write_authority.sql` tornou `create_notification` `SECURITY DEFINER` com `search_path=public, pg_temp`, manteve EXECUTE para authenticated/service_role, removeu anon, retirou INSERT/hard DELETE direto do browser e preservou apenas UPDATE das colunas de estado da própria inbox sob RLS;
- [x] `NotificationPreferencesService` está consolidado sobre RPCs canônicos, `tests/architecture/notification-inbox-authority.test.ts` bloqueia writer browser paralelo e `tests/architecture/realtime-ssot.test.ts` protege publication/transporte; READMEs de Messaging/Notifications e `docs/architecture/SSOT_REGISTRY.md` foram sincronizados;
- [ ] o manifest secundário `docs/architecture/core-platform-ownership.json` ainda conserva o rótulo histórico CP-001 `status: migration` para `notifications`, mas seu `currentOwner`, `targetOwner` e allowlist já apontam para a autoridade canônica e não registram writer concorrente; normalização documental/exaustiva fica para o sweep de G5 e não reabre a autoridade de source de G4;
- [x] Moderation/trust fechado no nível G4: `community_reports` conserva apenas criacao direta pelo owner Community, review/acoes passam por RPCs server-owned, `community_user_moderation_actions` e tabelas sensiveis de Trust nao possuem acesso browser direto conhecido, e a fila federada permanece read-only sem copiar status mestre;
- [x] autoridade remota de Moderation reconciliada no escopo conhecido: `20260829192000_harden_moderation_table_authority.sql` removeu UPDATE/DELETE direto e policies admin concorrentes de `community_reports` e retirou SELECT direto de `community_user_moderation_actions`; `20260829193600_harden_admin_moderation_view_grants.sql` deixou as views admin com somente SELECT para `authenticated`, preservando filtro `private.is_admin_user(auth.uid())`;
- [x] fronteira física de Moderation/trust corrigida: fila federada/hook migraram para o modulo Admin, `TrustFeedbackForm` e `ReportReasonDialog` passaram a apresentacao compartilhada sem dependencia de `core`, `core/trust/components` foi aposentado e o path historico do dialog em `core/moderation/components` ficou reduzido a bridge one-way; `tests/architecture/moderation-trust-boundary.test.ts` e `test:moderation:ssot` bloqueiam regressao;
- [x] Search/discovery fechado no nível G4: `SearchService` permaneceu como orquestrador federado único, providers delegam para services de domínio e não conhecem tabelas/read models; `public_business_search` e `public_professional_search` foram classificados como read models dos respectivos owners e as migrations `20260829201000`/`20260829202000` deixaram `anon`, `authenticated` e `service_role` com somente SELECT; `tests/architecture/search-ssot.test.ts` e `docs/07-modules/SEARCH_SSOT.md` congelam a separação;
- [x] Authorization/permissions fechado no nível G4: `RoleService`/`role-rpc` governam decisões globais, `AdminRolesService` foi reduzido a gestão/lifecycle, `AdminDataService` usa `RoleService`, e `_shared/adminAuth.ts` deixou de consultar `user_roles` diretamente;
- [x] autoridade remota de Authorization reparada: `20260829203000` alinhou `get_user_roles` a active + unrevoked + unexpired; `20260829204000` criou `private.has_valid_global_role`, convergiu policies globais e transformou wrappers públicos remanescentes em bridges `private.*`; `20260829204500` retirou hard DELETE de `user_roles` do browser; `tests/architecture/authorization-ssot.test.ts`, os guards de segurança e `docs/07-modules/AUTHORIZATION_SSOT.md` protegem o desenho;
- [ ] `gastronomy_subscriptions` permanece exceção remota conhecida com policy histórica que consulta `user_roles`; a própria tabela está marcada DEPRECATED/read-only, possui 5 linhas históricas e declara migração para `user_subscriptions`. Não apagar nem reinterpretar sem provenance em G5;
- [ ] retencao/TTL de audit e reports continua sem politica aprovada e permanece bloqueio de lancamento para G5/G7; o fechamento G4 nao inventa prazo LGPD nem certifica operacao same-SHA;
- [ ] validação hosted do checkpoint atual — deve ser revalidada ao final de um corte significativo; histórico recente continua **BLOCKED por runner/provider** quando jobs retornam `steps: []` e `runner_id: 0`. Não converter isso em PASS nem em source failure;
- [ ] limpeza de refs temporárias `tmp-public-url-ssot` e `tmp-public-url-ssot-2` — criadas durante tentativa de Git Data, nunca usadas para merge; o conector atual não expõe delete-ref, portanto devem ser removidas pelo próximo executor com capacidade de apagar refs remotas;
- [x] G4 Global SSOT Hardening fechado no nível source/authority;
- [ ] próximo alvo seguro: G5 `schema atual vs migrations` + inventário de RLS/grants/RPCs/legados, começando por drift comprovado e provenance antes de qualquer remoção.

---

# 🚨 REGRA FINAL PARA FUTURAS IAs

**NÃO MOVA ESTE ARQUIVO. NÃO O RENOMEIE. NÃO O EXCLUA.**

Se o repositório parecer confuso, se houver dúvida sobre onde um arquivo deve morar, se um módulo estiver duplicado entre `features`, `modules`, `core` ou `shared`, ou se surgir a tentação de criar um novo SSOT para contornar dívida existente:

1. pare a mudança estrutural;
2. leia este documento;
3. localize o owner canônico;
4. preserve compatibilidade por bridge one-way quando necessário;
5. faça a mudança em pequeno corte verificável;
6. instale/atualize o guard para que a dívida não volte.

## Checkpoint 2026-09-05 — G6 Community ownership + CI/deploy limits

- Source checkpoint antes deste registro: `faa94da7b72ad358d21da52ee90b6194bc50c669`.
- Feed/composer: corrigidos os callers quebrados pelo move de `CreatePostModal` e `useCreatePostForm` para `core/community-feed`; o mock residual de `ComunidadePage.publicDeepLink.spec.tsx` também foi alinhado.
- Community Issues: `src/core/community-issues` passou a ser o owner explícito da implementação (service, hooks, components, schema e types); `src/core/community/issues` ficou sem implementação e não deve ser recriado.
- Callers runtime/admin, testes ativos e `tools/architecture/architecture-registry.ts` foram alinhados ao owner `core/community-issues`.
- Supabase canônico: `community_issues`, `community_issue_supports` e `community_issue_reports` estão com RLS ativo. Os RPCs públicos de criação/mutação/support são `SECURITY INVOKER` e delegam à autoridade privada. Reports preservam `INSERT` column-scoped somente em `issue_id`/`reason`, com `profile_id` server-owned e validação por RLS/trigger.
- `get_community_poll_for_post(uuid)` continua sendo exceção SECURITY DEFINER conhecida/allowlisted; não alterar sem novo desenho, pois a exceção atual é intencional e fail-closed.
- GitHub Actions: quota de minutos hospedados esgotada; não rerodar/disparar workflows até liberação. Falhas instantâneas desse período são blocker de infraestrutura, não verdict de source.
- Vercel: o deploy do SHA `5324766588ff3be7ee8a500c3c7af13d887ae408` falhou por 3 imports antigos no typecheck e foi corrigido em `03a2fb29e09053019bb101be82d65d4ccaac977c`; deployments posteriores estão bloqueados por `Deployment rate limited — retry in 24 hours`, portanto ainda não existe prova same-SHA do HEAD atual.
- Sponsored Ads: `SponsoredWidget` passou a consumir diretamente `core/business/promotions/useAdDelivery`; `useSponsoredAds` e `SponsoredAdsRuntimeService` foram removidos por serem adapters sem autoridade própria. Commit source: `457b560ce161804d40aacc3d44ad515ce4580ec7`.
- Civic Reports: `CivicReportService` e `useCivicReports` foram removidos após census provar ausência de caller runtime; o Supabase canônico também não possui `public.civic_reports` nem `public.civic_report_comments`, confirmando que o código era residual de schema inexistente. Commit source: `51aa43358dac400ed1ba2ac904c08b262947189b`.
- Alerts: não mover `src/core/community/alerts` por conveniência de nome. O registry atual o reconhece como owner canônico territorial em conjunto com `src/core/alerts`; criar `core/community-alerts` agora duplicaria autoridade.
- Next action: PAUSAR novos cortes estruturais amplos enquanto GitHub Actions e Vercel estiverem bloqueados. Continuar apenas census/read-only e correções de source obviamente prováveis. Quando o Vercel liberar, executar uma única certificação same-SHA do HEAD então vigente; não consumir GitHub Actions enquanto a quota hospedada estiver indisponível.

## Checkpoint 2026-09-05 — G6 source-only após rate limits

- HEAD source antes deste registro: `1e6f84329f71caa19b39b6ac5e6b03f67e636d0f`.
- `15440eee5071add5c14435d027160eb85acbb824`: rascunhos do composer ficaram locais + criptografados; `postDraftSync` foi removido porque `public.community_post_drafts` nao existe no Supabase canonico. `postDraft`, `postDraftCrypto` e `newPostHighlight` foram movidos para `core/community-feed`; `useNovoPost` foi aposentado.
- `60985995316172ae4d571fb5ba4492fa0a8cdd09`: facade `core/community/hooks/useCommunityUrls.ts` aposentada; caller direto e barrel agora usam `core/routing/hooks/useCommunityUrls`.
- `06f74303c736baf93c6897f81072410d7e8c921b`: `usePollForm` e `useCommunityKeyboard` removidos apos caller census zero.
- `1e6f84329f71caa19b39b6ac5e6b03f67e636d0f`: `useCommunityTerritory`, `usePopularTags`, `useDeletePost` e `useUpdatePost` removidos apos caller census zero; `usePostCard` foi preservado porque regressao estatica ainda o exige.
- `CommunityLocationService` e `CommunityRolloutService` foram auditados e preservados: ambos adicionam regra real do dominio sobre `core/location`/`core/rollout`, portanto nao sao facades mortas.
- Supabase `ACTIVE_HEALTHY`: auditoria confirmou 9 SECURITY DEFINER executaveis por anon, sendo 6 application-owned ja cobertos por allowlist + 3 PostGIS. `track_analytics_event` foi rechecado e permanece intencional: bloqueia spoofing de user_id, exige session para anon, aplica rate limit, restringe eventos operacionais ao service_role e ignora IP/UA/referrer enviados pelo browser.
- Advisors de RLS sem policy incluem tabelas deny-all/private e nao devem ser 'corrigidos' mecanicamente. `public.spatial_ref_sys` e extensions publicas tambem exigem tratamento de provenance/extension, nao mudanca cega.
- Vercel permanece bloqueado por deployment rate limit; o ultimo deploy real continua no SHA `5324766588ff3be7ee8a500c3c7af13d887ae408`. Nao existe prova hosted same-SHA dos cortes acima.
- GitHub Actions permanece sem minutos hospedados. Nao rerodar workflows.
- NEXT_ACTION: nenhum novo corte estrutural amplo. Assim que o Vercel liberar, executar uma unica certificacao production same-SHA do HEAD vigente. Se o build falhar, corrigir somente o erro concreto; se passar, retomar o caller census G6.


## Checkpoint 2026-09-05 — G6 Community sem dependência de Vercel

- [x] Comments materializados no owner explícito `core/community-feed`: UI de comentários e hooks específicos saíram do namespace genérico; `core/comments` continua owner de persistência. Corte: `a1ac0065c3411cb80c43a976051cc4849fbdaf77`.
- [x] filtros duplicados consolidados: `useCommunityFiltersAAA` foi aposentado e a semântica runtime ativa ficou em `core/community-feed/hooks/useFeedFilters.ts`, preservando `community_filters_v2` e default de bairro. Corte: `99826f2d123cc9f9c7de75879f313897a7cb83f7`.
- [x] detalhe de Post movido para o owner de experiência Community Feed e endurecido sem recriar o antigo FeedService: `core/posts` ganhou `getPublicPostById(postId, TerritoryFilter)`, com visibilidade pública + filtro territorial antes do retorno. Cortes: `c3ed15132963dd94306858a4478e701529c59b32` e `e85c144dcda7c7540693b0456880b71b7fdcc415`.
- [x] `src/core/community/hooks/usePost.ts` aposentado após caller census zero. Corte: `99cf9176b73dbe088ba71fd80af85029ab36a5da`.
- [x] G5 revalidado sem mutação: 12 tabelas públicas com RLS e zero policies permanecem intencionalmente fail-closed, sem grants CRUD para `anon` ou `authenticated`; não criar policies artificiais para silenciar advisor.
- [x] precedência documental corrigida: source executável + Core Platform CP-008 vencem snapshots antigos. `FeedService`/`FeedRepository` removidos não devem ser recriados; o owner atual de Post é `core/posts`, com composição em `core/community-feed`.
- [ ] hosted build/typecheck same-SHA continua prova futura separada; G6 pode continuar por source, Supabase, ownership, segurança e regressions estáticos sem depender de Vercel/GitHub Actions.
- [x] comentarios, filtros, Poll, detalhe, moderacao de Post/Comment e adapter de mensagem iniciada por Post foram consolidados nos owners explicitos; facades genericas de Community foram retiradas.
- [x] `useCommunityScopeResolver` foi aposentado; o shell territorial usa `useResolveTerritoryFromUrl` diretamente.
- [x] o barrel `src/core/community/hooks/index.ts` foi removido para impedir reexports entre owners.
- [x] `useCreatePost`, `usePostCard` e `PostForm` foram aposentados apos caller census zero; testes passaram a bloquear recriacao em vez de exigir arquivo morto.
- [x] `usePostInteractions` foi movido para `src/core/posts/hooks`, pois atende Feed, Profile e card compartilhado.
- [x] D-009 e o composer foram alinhados ao contrato real de rascunho local criptografado; a migration pendente que criaria `community_post_drafts` foi retirada sem alterar o Supabase.
- [x] cortes desta etapa: `9b0cdabad7a6570f2879f7e48fee611cdda1adf0`, `1f3360facc29c314cf43b1f7a3e70302b8b907b8`, `c6c79d3f15b35f3f0aad5b81e6e2cc6d4134ccc6`, `3cef596b40fcbb9696c4985ae84a66c0b9dcfb37`, `687452f4f163380be9897327a0ea71fcf392d9fb`, `31bdae212272a0a808c492e5603679e81341f3d0`, `af595b1a1cb0a290b8fcf0edb802fc71d5608e32` e `94e804c0013e8a8fd54a488beb96f0d6b4d45bb7`.
- [x] utilitarios exclusivos do Feed (`communityFeedTab`, `communityCopy`, `resolveCommunityFeedTerritoryFilter`) e seus testes foram movidos para `core/community-feed`; script SSOT e callers recentes do `UnifiedPostCard` foram alinhados. Corte: `e398f72a7c19950b8ea763fbcfbf32f5e0e019e6`.
- [x] detalhe de Post consolidado fisicamente em `core/community-feed`: `PostBadge`, `PostContent`, `PostHeader`, `PostMetrics`, `PostTags` e `ImageGallery`; a galeria perdida foi restaurada somente no owner novo e usa `SafeImage`. Corte: `57075db92988974750fb6aa2fdb9462064487766`.
- [x] Community Direct Messaging alinhado aos owners: hook React em `core/messaging/hooks/useCommunityDirectMessages.ts`, UI iniciada pelo Feed em `core/community-feed/components/DirectMessageModal.tsx`; contracts/tests atualizados. Corte: `839c6ca4456431c26437983e242c397bd50be4af`.
- [x] residuos genericos sem caller removidos (`community/types.ts`, `accessibilityAAA.ts`) e export quebrado `./components` retirado do public API; READMEs/ratchet alinhados. Corte: `76744cc5569aa1e3c1de3c6e0bd8b45a719d844c`.
- [x] caller census source-only de `src/core/community` fechado: o restante possui responsabilidade explicita (Alerts, Audit, Moderation, Location/Rollout, tests e design token compartilhado com caller real). Nao mover por nome.
- [ ] Community permanece NAO READY ate a prova hosted same-SHA exigida pelo checklist G6; esta ausencia nao bloqueia o proximo sweep source-only.
- [ ] NEXT_ACTION sem dependencia de Vercel: iniciar G6 source-only de Events pela mesma ordem — ownership/callers -> contracts/schema -> RLS/authz -> services/hooks/UI -> residuos/legados -> ratchets; nao executar GitHub Actions enquanto a quota hosted estiver indisponivel.

### 2026-09-05 — G6 Events source-only

- [x] owner confirmado: `src/core/community-events` governa contratos/servicos e `src/modules/community-events` governa UI; namespaces historicos `src/features/events` e `src/core/verticals/events` permanecem aposentados.
- [x] terceira UI paralela `src/shared/components/eventos` removida apos caller census zero. Corte: `fde68086fefbdb5b98d99d9028c5561a8bf03919`.
- [x] participation authority endurecida: join/leave/check-in usam `event-rpc` + RPCs atomicas `service_role`-only; `authenticated` perdeu INSERT/UPDATE/DELETE direto em `public.event_participants`, preservando SELECT sob RLS.
- [x] migration remota/source reconciliada em `20260905150847_revoke_direct_event_participant_mutations_g6.sql`; remoto verificado com `auth_select=true` e `auth_insert/auth_update/auth_delete=false`. Cortes: `7d1ee4787738d5f8826fca281563092061332cf8` + provenance `6801cf532a3287f0a6aef6cba8701ddb575aa174`.
- [x] `EventTicketManager` e `EventsGlobalSidebar` aposentados apos caller census zero; demais componentes amostrados possuem caller real. Corte: `585ea0813b0134d45e6ecd2c698a5bc0b57b9585`.
- [ ] Events permanece NAO READY: hosted same-SHA/E2E/build continuam provas futuras separadas.
- [ ] NEXT_ACTION Events: auditar `event_favorites`, `event_reminders`, `event_reviews` e `event_review_helpfulness` por caller, grants/RLS e identidade de Profile; corrigir somente bypass/drift comprovado.
