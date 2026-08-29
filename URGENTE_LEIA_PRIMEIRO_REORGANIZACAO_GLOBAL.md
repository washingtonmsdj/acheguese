# 🚨 URGENTE — LEIA PRIMEIRO: REORGANIZAÇÃO GLOBAL DO REPOSITÓRIO

> **ARQUIVO PERMANENTE DA RAIZ — NÃO MOVER, NÃO RENOMEAR, NÃO EXCLUIR.**
>
> Este arquivo deve permanecer **sempre na raiz do repositório**. Ele é o ponto de entrada obrigatório para futuras IAs, agentes, desenvolvedores e auditorias antes de qualquer reorganização estrutural, refactor transversal, criação de módulo, mudança de SSOT ou migração de arquivos.
>
> **Regra para IA/agente:** antes de alterar arquitetura, estrutura de pastas, ownership de domínio, imports transversais, `core`, `modules`, `integrations`, `shared`, `tests`, `scripts/tools`, Supabase ou SSOT, leia este documento inteiro e preserve suas invariantes.

**Criado em:** 2026-08-26  
**Estratégia:** `main` only, commits pequenos, sem force push, sem branch nova para esta missão  
**Status:** EM EXECUÇÃO  
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

- [ ] integração somente pelos owners permitidos;
- [ ] sem imports reversos;
- [ ] sem cross-module indevido;
- [ ] sem novo `features`;
- [ ] sem SSOT paralelo conhecido;
- [ ] workflows executam todos os validators de arquitetura.

## G4 — Global SSOT Hardening

**Objetivo:** consolidar primeiro os serviços horizontais usados por vários módulos.

Ordem prioritária:

- [ ] Auth/session;
- [ ] Profiles/memberships/roles;
- [ ] Business;
- [ ] Territory/location;
- [ ] Public URL/slug;
- [ ] Media/uploads;
- [ ] Analytics;
- [ ] Reviews;
- [ ] Billing/subscriptions;
- [ ] Messaging/realtime/notifications;
- [ ] Moderation/trust;
- [ ] Search/discovery;
- [ ] permissions/authorization helpers.

Para cada SSOT:

- owner único;
- contracts únicos;
- read/write model único;
- adapters legados one-way;
- tests de regressão;
- schema/RLS coerentes quando aplicável.

## G5 — Database, RLS e legado

**Objetivo:** alinhar código e banco antes de certificar módulos.

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

- [ ] Empresas base;
- [ ] Gastronomia;
- [ ] Educação;
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

Esses itens devem ser revalidados, não assumidos eternamente verdadeiros.

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
- banco/RLS/RPC refletem a mesma autoridade;
- existe regression guard;
- não há segundo service/write model ativo concorrente conhecido.

---

## 11. Registro de progresso

Atualizar esta seção somente com marcos relevantes. Não transformar este arquivo em log de cada commit.

### 2026-08-26 — Início

- [x] decisão: reorganização global antes de novas certificações verticais;
- [x] decisão: manter single-repo modular; não migrar para monorepo agora;
- [x] estrutura alvo definida;
- [x] fases G0–G7 definidas;
- [x] este arquivo permanente criado na raiz;
- [x] G0 Repository Census concluído;
- [x] G1 Architecture Taxonomy concluída;
- [x] G2 Physical Reorganization concluída;
- [ ] G3 Global Boundaries concluído;
- [ ] G4 Global SSOT concluído;
- [ ] G5 Database/RLS concluído;
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
- [ ] próximo marco: G3 Global Boundaries. Não iniciar G4 antes de fechar G3.

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
