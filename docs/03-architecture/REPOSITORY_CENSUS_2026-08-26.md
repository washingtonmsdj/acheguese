# Repository Census — Reorganização Global

**Criado em:** 2026-08-26  
**Atualizado em:** 2026-08-27  
**Missão:** `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`  
**Status:** G0 CONCLUÍDO — baseline vivo; revalidar antes de cada corte  
**Baseline inicial:** `289066361bf77cb451e9e39ac3f6bfe45a6e9c86`  
**Snapshot verificado:** `73f88d5890672ca8e46e075acdafff44ae0cfb32`

Este documento é o inventário operacional da reorganização global. Ele não substitui o plano permanente da raiz. O baseline inicial foi preservado acima; as classificações abaixo refletem o snapshot verificado atual e devem ser rechecadas antes de writes porque a missão opera diretamente na `main`.

## Legenda

- **KEEP** — owner/local atual está correto.
- **MOVE** — deve migrar fisicamente para owner canônico.
- **BRIDGE** — compatibilidade temporária apontando em uma direção para o owner canônico.
- **MERGE** — conteúdo sobreposto deve ser consolidado em SSOT único.
- **RETIRE** — legado candidato a remoção depois de prova de não uso.
- **INVESTIGATE** — precisa de callers/contracts/provenance antes da decisão.

---

## 1. Raiz do repositório

### KEEP

- `README.md`
- `SECURITY.md`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` — **PERMANENTE; nunca mover/renomear/excluir**
- `package.json` / `package-lock.json`
- configs Vite/TypeScript/ESLint/Tailwind/PostCSS/Playwright/Vitest
- `.github/`, `.husky/`, `.kiro/`, `.lovable/`
- `api/`, `docs/`, `public/`, `src/`, `supabase/`, `tests/`

### Dívida ainda ativa

| Path | Classificação | Owner alvo / regra |
|---|---|---|
| `scripts/` | MOVE gradual | `tools/{architecture,security,migrations,seeds,release,...}` preservando comandos públicos |
| `tools/` | KEEP + EXPAND | hoje já possui `templates/`; receber ferramentas por lotes funcionais |
| `plans/` | INVESTIGATE/MOVE/RETIRE | plano ativo → `docs/08-roadmap`; histórico → `docs/10-archive` após validar links |
| `e2e/` | BRIDGE/RETIRE | restou compatibilidade de helper; owner canônico é `tests/e2e/` |
| `eslint-rules/` | KEEP provável | tooling de lint; só mover se callers/config forem atualizados no mesmo corte |

Os antigos roots `handoff/`, `product-qa-screenshots/` e `templates/` já foram retirados da raiz e possuem regression guard. Não recriá-los.

---

## 2. `src/` — snapshot atual

Roots atuais:

- `app/`
- `assets/`
- `config/`
- `core/`
- `integrations/`
- `modules/`
- `shared/`
- `styles/`

Arquivos de bootstrap atuais:

- `App.tsx`
- `index.css`
- `main.tsx`
- `vite-env.d.ts`

### Estado das dívidas antigas

- `src/features` — **RETIRADO**; não recriar.
- `src/test` — **RETIRADO**; não recriar.
- `src/__tests__` — **RETIRADO**; não recriar como root genérico.
- `src/types` — **RETIRADO**; domínio deve ficar em `core/<owner>` e tipos transversais em `shared/types`.
- `src/App.css` e `src/global.d.ts` — **RETIRADOS**.

### `src/config`

Classificação: **BRIDGE temporário**.

O regression guard atual congela `src/config` aos bridges:

- `communityLaunch.ts` → `src/core/community/config/communityLaunch.ts`
- `launchScope.ts` → `src/app/config/launchScope.ts`
- `moduleSlugs.ts` → `src/app/config/moduleSlugs.ts`
- `modules.ts` → `src/app/config/modules.ts`
- `territory.ts` → `src/app/config/territory.ts`

Não adicionar implementação nova em `src/config`.

---

## 3. `src/modules` — owners de produto atuais

Módulos de topo verificados:

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

Classificação: **KEEP**, sujeitos aos boundaries.

Regras:

- module = UI/aplicação/orchestration de produto;
- persistência, autorização e contracts canônicos devem pertencer ao `core` correspondente;
- não criar agregador genérico `modules/community` apenas por estética;
- `community-events` já é o owner físico de Events; o antigo `src/features/events` não existe mais.

---

## 4. `src/core` — owners de domínio

Roots observados incluem:

`address`, `admin`, `ai`, `alerts`, `analytics`, `audit`, `auth`, `authorization`, `banners`, `billing`, `business`, `city`, `classifieds`, `comments`, `communication-territorial`, `community`, `community-events`, `community-experience`, `community-feed`, `community-groups`, `community-issues`, `community-lost-found`, `community-recommendations`, `contact`, `coverage`, `education`, `engagement`, `family`, `favorites`, `feed`, `geocoding`, `geospatial`, `governance`, `guide`, `infrastructure`, `landing`, `legal`, `location`, `maps`, `media`, `messaging`, `metrics`, `mobility`, `moderation`, `navigation`, `nearby`, `notifications`, `posts`, `pricing`, `privacy`, `professional`, `profiles`, `public-identity`, `qr`, `realtime`, `residence`, `reviews`, `rollout`, `routing`, `safety`, `search`, `service-areas`, `session`, `social`, `subscription`, `taxonomy`, `telemetry`, `territorial`, `tracking`, `trust`, `users`, `verification`, `verticals`, `work-opportunities`.

A quantidade de roots não prova duplicação. Os seguintes grupos ficam **INVESTIGATE para G4/G5**, por contracts/callers/provenance:

- `auth` / `session` / `authorization` / `profiles`;
- `analytics` / `metrics` / `telemetry` / `tracking`;
- `address` / `city` / `location` / `geocoding` / `geospatial` / `territorial` / `service-areas`;
- `community` / `community-experience` / `community-feed` / `feed` e demais bounded contexts `community-*`;
- `billing` / `pricing` / `subscription`;
- `professional` / `work-opportunities`;
- `media` vs `shared/media`;
- `taxonomy` vs `shared/taxonomy`.

**Boundary atual:** busca de código no snapshot encontrou zero imports `@/modules/*` em `src/core` para `.ts` e `.tsx`; `scripts/validate-project-taxonomy.ts` já possui guard contra essa dependência invertida.

---

## 5. `src/integrations`

Estado atual:

- `maps/`
- `supabase/`

Classificação: **KEEP**.

Regra: somente adapters técnicos externos. Domínio não nasce aqui.

### Dívida module → integrations

Busca textual no snapshot encontrou **14 arquivos TypeScript** sob `src/modules` contendo referência `@/integrations/`. A amostra inclui `src/modules/ai/core/client/aiClient.ts`, `src/modules/ai/virtual-tryon/services/tryon.service.ts` e paths de `src/modules/business/gastronomy`.

Esse número é inventário bruto e inclui testes co-localizados; em G1 o validator deve distinguir runtime de testes e transformar apenas a dívida runtime existente em allowlist monotônica. **Nenhuma nova ocorrência runtime deve ser permitida.**

---

## 6. `src/shared`

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

Classificação:

- `components`, `design-system`, `hooks`, `utils` — **KEEP/AUDIT**;
- `config`, `constants`, `schemas`, `types`, `lib` — **AUDIT** para impedir domínio sem owner;
- `services` — **INVESTIGATE**, alto risco de pasta genérica;
- `media` — **INVESTIGATE** contra `core/media`;
- `taxonomy` — **INVESTIGATE** contra `core/taxonomy`.

`shared` não pode virar pasta de descarte.

---

## 7. Testes

Owner global atual: `tests/`.

Subroots observados:

- `architecture/`
- `e2e/`
- `fixtures/`
- `helpers/`
- `integration/`
- `operational/`
- `regression/`
- `scripts/`
- `security/`

Unitários muito locais podem permanecer co-localizados no source.

### Compatibilidade E2E restante

`e2e/` deixou de ser owner de specs. O contrato de reorganização preserva apenas bridge mínimo de autenticação em `e2e/helpers/auth.ts` apontando para `tests/e2e/helpers/auth.ts`; arquivos históricos de geolocation/network e `e2e/network-branches.spec.ts` já foram retirados. O próximo corte deve remover o bridge somente quando todos os callers tiverem migrado.

---

## 8. `scripts/` → `tools/`

A classificação funcional permanece:

| Responsabilidade atual | Destino alvo |
|---|---|
| validators de arquitetura/SSOT | `tools/architecture/` |
| segurança | `tools/security/` |
| migrations/schema/types | `tools/migrations/` |
| seeds/E2E data | `tools/seeds/` |
| deploy/release/CI | `tools/release/`, `tools/ci/` ou owner explícito |
| benchmarks/diagnostics/maintenance | owner técnico explícito a definir |

`package.json` ainda possui muitos comandos apontando literalmente para `scripts/*`. Portanto a migração será feita em commits pequenos, preservando os nomes públicos dos scripts npm.

`tools/` hoje já contém `templates/`, cuja estrutura foi atualizada para separar `core/` e `module/` e possui regression guard.

---

## 9. Mapa owner atual → owner alvo

| Item | Atual | Alvo | Estado |
|---|---|---|---|
| bootstrap/router/providers | `src/app` | `src/app` | KEEP |
| UI/aplicação por produto | `src/modules/*` | `src/modules/*` | KEEP |
| domínio/SSOT/persistência/authz | `src/core/*` | `src/core/*` | KEEP + G4 AUDIT |
| adapters Supabase/maps | `src/integrations/*` | `src/integrations/*` | KEEP |
| primitives transversais | `src/shared/*` | `src/shared/*` | KEEP + AUDIT |
| Events legado | `src/features/events` | `src/modules/community-events` + core | RETIRADO/MIGRADO |
| generic source test roots | `src/test`, `src/__tests__` | `tests/*` ou co-location real | RETIRADOS |
| generic source types | `src/types` | `shared/types` ou `core/<owner>` | RETIRADO |
| app/domain config | `src/config/*` | `src/app/config`, `src/core/*`, `src/shared/config` | BRIDGES restantes |
| E2E global | `e2e/*` | `tests/e2e/*` | quase concluído; 1 bridge auth |
| scripts operacionais | `scripts/*` | `tools/*` por responsabilidade | MOVE gradual |
| planos históricos/ativos | `plans/*` | `docs/08-roadmap` ou `docs/10-archive` | INVESTIGATE |

---

## 10. Guards já instalados

Não criar validators concorrentes quando já existir owner:

- `tests/architecture/repository-reorganization-contract.test.ts` protege o arquivo permanente, roots já retirados, Events canônico, config bridges, templates e E2E bridges;
- `scripts/validate-project-taxonomy.ts` protege módulos canônicos, paths legados e `core → modules`;
- `scripts/validate-architecture-boundaries-incremental.mjs` mantém baseline incremental para cross-module, Supabase em TSX e outras violações existentes.

Lacuna para G1: generalizar **module → integrations runtime** com allowlist monotônica e stale-allowlist failure, reutilizando o validator incremental ou um único owner claramente conectado a ele.

---

## 11. Resultado G0

Checklist do censo:

- [x] diretórios de raiz inventariados;
- [x] roots atuais de `src` inventariados;
- [x] `src/modules` inventariado;
- [x] `src/core` inventariado;
- [x] `src/features` revalidado como ausente;
- [x] `src/integrations` inventariado;
- [x] `src/shared` inventariado;
- [x] testes globais/co-localizados e bridge E2E classificados;
- [x] `scripts` classificado por responsabilidade e `tools` identificado como destino gradual;
- [x] namespaces históricos/arquivos soltos relevantes classificados;
- [x] overlaps/SSOTs candidatos identificados sem fusão por heurística;
- [x] `core → modules` revalidado sem ocorrência alias no snapshot e protegido por guard;
- [x] `module → integrations` identificado como dívida ativa a ratchetar em G1;
- [x] mapa owner atual → owner alvo registrado;
- [x] itens classificados como KEEP / MOVE / BRIDGE / MERGE / RETIRE / INVESTIGATE.

**Decisão:** G0 está concluído como inventário. A dívida encontrada não precisa estar removida para fechar G0; ela alimenta G1–G5. O próximo passo obrigatório é **G1 — Architecture Taxonomy**, começando pela proteção completa dos roots canônicos e pelo ratchet `module → integrations`.
