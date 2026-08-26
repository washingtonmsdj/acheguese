# Repository Census — Reorganização Global

**Data:** 2026-08-26  
**Missão:** `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`  
**Status:** G0 EM EXECUÇÃO  
**Baseline inicial:** `289066361bf77cb451e9e39ac3f6bfe45a6e9c86`

Este documento é o inventário operacional da reorganização global. Ele não substitui o plano permanente da raiz; registra o estado encontrado e classifica os próximos cortes.

## Legenda

- **KEEP** — owner/local atual está correto.
- **MOVE** — deve migrar fisicamente para owner canônico.
- **BRIDGE** — compatibilidade temporária; implementação deve viver em outro owner.
- **MERGE** — conteúdo sobreposto deve ser consolidado em SSOT único.
- **RETIRE** — legado candidato a remoção depois de prova de não uso.
- **INVESTIGATE** — precisa de callers/contracts/provenance antes da decisão.

---

## 1. Raiz do repositório

A raiz atual mistura configuração legítima de build com diretórios operacionais/históricos.

### KEEP na raiz

- `README.md`
- `SECURITY.md`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` — **PERMANENTE; nunca mover**
- `package.json`
- `package-lock.json`
- configs de Vite/TS/ESLint/Tailwind/PostCSS/Playwright
- `.github/`, `.husky/`, `.gitignore`, `.gitleaks*`, `.vercelignore`
- `index.html`
- `api/`
- `src/`
- `supabase/`
- `public/`
- `docs/`
- `tests/`

### INVESTIGATE / organizar

| Path atual | Classificação | Destino/decisão provável |
|---|---|---|
| `e2e/` | MOVE | consolidar em `tests/e2e/`; hoje contém helpers + `network-branches.spec.ts` |
| `scripts/` | MOVE gradual | `tools/{architecture,security,migrations,seeds,release,...}` preservando comandos do `package.json` |
| `plans/` | MOVE/RETIRE | planos ativos para `docs/08-roadmap` ou arquivo histórico para `docs/10-archive`; validar links antes |
| `handoff/` | INVESTIGATE | documentação operacional; definir `docs/` vs artefato temporário |
| `product-qa-screenshots/` | INVESTIGATE | artefatos de QA; avaliar Git/LFS/CI artifacts vs `docs/` |
| `templates/` | INVESTIGATE | classificar templates de código/documento/build antes de mover |
| `eslint-rules/` | KEEP provável | tooling de lint; futuro `tools/eslint-rules` só se imports/config permitirem |
| `.kiro/` | INVESTIGATE | metadata/specs de ferramenta; não mover sem entender consumidor |
| `.lovable/` | KEEP enquanto integração ativa | metadata de integração Lovable |
| `bun.lock` | INVESTIGATE | projeto declara `npm@11.17.0`; reconciliar lockfile concorrente antes de remover |

### Achado crítico de organização

Há dois roots E2E: `e2e/` e `tests/e2e/`. O `package.json` já usa `tests/e2e/*` para praticamente todos os fluxos, exceto `test:e2e:network`, que ainda aponta para `e2e/network-branches.spec.ts`.

**Primeiro move físico recomendado:** migrar `e2e/network-branches.spec.ts` para `tests/e2e/network-branches.spec.ts` e atualizar o script. Os helpers de `e2e/helpers` devem ser tratados em corte separado porque possuem referências históricas.

---

## 2. `src/` — roots atuais

Roots de diretório encontrados:

- `__tests__`
- `app`
- `assets`
- `config`
- `core`
- `features`
- `integrations`
- `modules`
- `shared`
- `styles`
- `test`
- `types`

Arquivos de bootstrap na raiz de `src`:

- `App.tsx`
- `App.css`
- `main.tsx`
- `index.css`
- `global.d.ts`
- `vite-env.d.ts`

### Classificação

| Path | Classificação | Regra alvo |
|---|---|---|
| `src/app` | KEEP | composition root, providers, router, layouts |
| `src/assets` | KEEP | assets de aplicação |
| `src/core` | KEEP | SSOT/domain/read-write/authz |
| `src/integrations` | KEEP | adapters externos apenas |
| `src/modules` | KEEP | UI/aplicação por domínio |
| `src/shared` | KEEP + AUDIT | apenas primitives transversais; impedir virar pasta de descarte |
| `src/styles` | KEEP | estilos globais/design tokens conforme owners |
| `src/features` | MOVE/RETIRE | namespace histórico; hoje contém apenas `events` |
| `src/__tests__` | MOVE/INVESTIGATE | testes globais devem convergir para `tests/`; unitários locais podem ficar junto ao owner |
| `src/test` | MOVE/INVESTIGATE | mesma regra; separar setup/helpers de testes de produto |
| `src/types` | INVESTIGATE | tipos de domínio devem ir para `core/<owner>`; tipos realmente globais para `shared/types` |
| `src/config` | INVESTIGATE | separar config de app (`app`) de config compartilhada (`shared`) e config de domínio (`core`) |

### Invariante imediata

Nenhum novo root em `src/features` pode ser criado. O único legado atual permitido durante a migração é `events`.

---

## 3. `src/modules` — inventário canônico atual

O validator `scripts/validate-project-taxonomy.ts` já define os seguintes 17 módulos de topo:

1. `admin`
2. `ai`
3. `business`
4. `central`
5. `classifieds`
6. `communication-territorial`
7. `community-events`
8. `community-feed`
9. `community-groups`
10. `community-issues`
11. `community-lost-found`
12. `community-recommendations`
13. `guide`
14. `mobility`
15. `professionals`
16. `profile`
17. `work-opportunities`

### Observações G0

- `business` possui verticais internas e já passou por hardening de Education/Gastronomy.
- `community-*` está fragmentado por bounded contexts explícitos; não criar agregador genérico `modules/community` sem decisão arquitetural nova.
- `community-events` é o destino de produto para Events, mas a implementação histórica ainda vive em `src/features/events`.
- `profile` coexistindo com `src/core/profiles` é esperado se module = UI e core = domínio, mas callers/boundaries devem ser auditados.
- `central` deve ser tratado como shell/central operacional e não virar SSOT de domínios que já possuem owner em core.

---

## 4. `src/features`

Estado atual:

```text
src/features/
└── events/
```

Classificação: **MOVE + BRIDGE temporário**.

Destino:

- UI/aplicação de Events → `src/modules/community-events`;
- domain/read-write/persistência → owners de `src/core/community*`/core apropriado;
- `src/features/events` deve terminar sem implementação própria.

### Bloqueios já conhecidos para o move coordenado

O corte de Events precisa atualizar no mesmo lote:

- route caller em `src/app/routes/territorial/TerritorialModulePages.tsx`;
- `tsconfig.typecheck.events-checkin.json`;
- `scripts/verify-deploy-ready.mjs`;
- validators/tests que ainda apontem para `src/features/events`;
- bridges de `EventEngagementService`/página quando necessário.

Mover apenas a subtree sem atualizar deploy guard criaria falso positivo de validação.

---

## 5. `src/core`

`src/core` já contém dezenas de owners explícitos. Owners observados incluem, entre outros:

- `address`
- `admin`
- `ai`
- `alerts`
- `analytics`
- `audit`
- `auth`
- `authorization`
- `banners`
- `billing`
- `business`
- `city`
- `classifieds`
- `comments`
- `communication-territorial`
- `community`
- `community-experience`
- `community-feed`
- `community-groups`
- `community-issues`
- `community-lost-found`
- `community-recommendations`
- `contact`
- `coverage`
- `education`
- `engagement`
- `family`
- `favorites`
- `feed`
- `geocoding`
- `geospatial`
- `governance`
- `guide`
- `infrastructure`
- `landing`
- `legal`
- `location`
- `maps`
- `media`
- `messaging`
- `metrics`
- `mobility`
- `moderation`
- `navigation`
- `nearby`
- outros owners ainda a classificar no censo profundo.

### Risco estrutural

Quantidade alta de roots em `core` não é automaticamente problema. O problema é quando conceitos próximos possuem owners paralelos sem contrato claro, por exemplo:

- `analytics` vs `metrics`;
- `location` vs `geocoding` vs `geospatial` vs `city` vs `address`;
- `community` vs `community-experience` vs `community-feed` e demais bounded contexts;
- `feed` vs `community-feed`;
- `alerts` vs notifications/messaging owners;
- `authorization` vs auth/profile membership helpers.

Esses grupos entram em **G4 Global SSOT**, não devem ser fundidos apenas pelo nome.

### Boundary já existente

`validate-project-taxonomy.ts` já detecta imports/reexports runtime `src/core → @/modules/*`. Preservar e ampliar esse SSOT de validação, não criar regra concorrente.

---

## 6. `src/integrations`

Estado atual:

```text
src/integrations/
├── maps/
└── supabase/
```

Classificação: **KEEP**.

Regra:

- apenas adapters técnicos externos;
- regra de negócio não deve nascer aqui;
- módulos devem preferir owner de domínio em `core`, não importar integrations diretamente.

Education, Gastronomy e Business já receberam ratchets específicos contra direct runtime integrations. G3 deverá generalizar a regra de maneira sustentável para os demais módulos.

---

## 7. `src/shared`

Roots atuais:

- `components`
- `config`
- `constants`
- `design-system`
- `hooks`
- `lib`
- `media`
- `schemas`
- `services`
- `taxonomy`
- `types`
- `utils`
- `validation`

### Classificação inicial

- `components`, `design-system`, `hooks`, `utils` — **KEEP/AUDIT**.
- `types`, `schemas`, `constants`, `config` — **AUDIT** para garantir que não contêm domínio com owner conhecido.
- `services` — **ALTO RISCO DE PASTA GENÉRICA**; cada service deve provar que é realmente transversal, senão migrar para `core/<domínio>`.
- `media` — **INVESTIGATE** porque já existe `src/core/media`; evitar dois owners conceituais.
- `taxonomy` — **INVESTIGATE** para diferenciar taxonomia global de taxonomia de domínio.
- `validation` — **INVESTIGATE** para separar helpers compartilhados de validação de domínio.

---

## 8. Testes

### Roots existentes

- `tests/`
- `tests/e2e/`
- `e2e/`
- `src/__tests__/`
- `src/test/`
- testes co-localizados em `src/**/__tests__`, `*.spec.*`, `*.test.*`.

### `tests/` já possui boa base

Pastas observadas:

- `architecture`
- `e2e`
- `fixtures`
- `helpers`
- `operational`
- `scripts`
- `security`

Mas existem muitos testes soltos na raiz de `tests`, incluindo suites `fase*`, regression, SSOT e mobility.

### Destino alvo

- architecture → `tests/architecture`
- security → `tests/security`
- e2e → `tests/e2e`
- integration → criar/usar `tests/integration`
- regression → criar/usar `tests/regression`
- script/tool tests → `tests/tools` ou manter `tests/scripts` até scripts→tools ser concluído
- fixtures/helpers → manter enquanto realmente globais
- unitários co-localizados → permitidos junto ao owner

Não mover testes em massa antes de atualizar scripts de package/CI e imports relativos.

---

## 9. `scripts/`

O root `scripts` mistura pelo menos as seguintes responsabilidades:

### Architecture / SSOT

Exemplos:

- `validate-project-taxonomy.ts`
- `validate-architecture-governance.ts`
- `validate-core-platform-ownership.mjs`
- `validate-architecture-boundaries-incremental.mjs`
- `generate-architecture-audit.ts`
- module boundary validators

Destino futuro: `tools/architecture/`.

### Security

Já existe `scripts/security/`, além de scripts de segurança ainda soltos.

Destino futuro: `tools/security/`.

### Migration / schema tooling

- `generate-migration-template.ts`
- `generate-supabase-types.ts`
- migration validators
- reconciliation helpers

Destino futuro: `tools/migrations/` ou subowner equivalente.

### Seeds / E2E data

- `seed-e2e-users.ts`
- `seed-e2e-network.ts`

Destino futuro: `tools/seeds/`.

### Release / deploy / CI

- `run-vercel-production-build.mjs`
- `verify-deploy-ready.mjs`
- `deploy-security-updates.sh`
- `monitor-security-deployment.sh`
- `scripts/ci/`
- `scripts/devops/`

Destino futuro: `tools/release/`, `tools/ci/` ou `tools/devops/` após mapa de callers.

### Benchmarks / diagnostics / maintenance

Há benchmark econômico, connectivity diagnostics, backup/restore, sync geográfico e maintenance scripts misturados no topo.

**Conclusão:** scripts→tools deve ser uma migração por grupos funcionais, nunca rename massivo, pois `package.json`, workflows e docs possuem muitos callers literais.

---

## 10. Duplicidades/overlaps prioritários para investigação

| Grupo | Estado | Fase |
|---|---|---|
| `features/events` vs `modules/community-events` | confirmado | G2 |
| `e2e/` vs `tests/e2e/` | confirmado | G2 |
| `src/test` vs `src/__tests__` vs `tests/` | confirmado | G2 |
| `core/analytics` vs business analytics read model | bug/SSOT paralelo já identificado | G4 |
| `shared/media` vs `core/media` | investigar | G4 |
| `shared/services` vs owners de core | investigar | G0/G4 |
| `core/location/geocoding/geospatial/address/city` | boundaries precisam ser documentados | G4 |
| `core/auth/authorization/profiles` | autoridade transversal precisa convergir | G4/G5 |
| `business_subscriptions` vs `user_subscriptions` | legado DB confirmado | G5 |
| `business_stats` vs métricas atuais | legado/owner não reconciliado | G5 |
| `bun.lock` vs packageManager npm/package-lock | toolchain concorrente | G0/G1 |

---

## 11. Fila de execução física recomendada

Do menor risco para o maior:

1. `e2e/network-branches.spec.ts` → `tests/e2e/network-branches.spec.ts` + package script.
2. classificar/migrar `e2e/helpers/*` para `tests/e2e/helpers` ou `tests/helpers` conforme callers.
3. consolidar testes globais soltos por categoria sem alterar comportamento.
4. congelar novos arquivos em `src/features`; preparar move coordenado de Events.
5. mover Events completo para `src/modules/community-events`/core apropriado, atualizando route/tsconfig/deploy validators no mesmo commit/lote.
6. auditar `src/shared/services`, `shared/media`, `src/types`, `src/config` e mover domínio para owners.
7. migrar `scripts` em lotes para `tools` com comandos públicos preservados.
8. classificar `plans`, `handoff`, QA artifacts e templates da raiz.

---

## 12. Próximas ações G0/G1

- instalar regression guard do documento permanente da raiz;
- ratchet de `src/features`: somente `events` pode existir durante a migração;
- ampliar o owner existente `validate-project-taxonomy.ts` para roots de `src` quando o baseline estiver completamente classificado;
- mapear callers de `e2e/helpers`;
- executar o primeiro move físico de E2E;
- continuar censo profundo de `core` e `shared` por imports/callers, não por nome apenas.

---

## Conclusão do checkpoint

A estrutura não exige um monorepo para ficar organizada. O maior ganho imediato vem de **um modular monolith com owners físicos rígidos e ratchets de migração**.

O repositório já possui uma base arquitetural relevante, mas acumulou namespaces e convenções em épocas diferentes. A missão global deve consolidá-los gradualmente, preservando comportamento e instalando guards a cada dívida removida.
