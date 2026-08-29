# Repository Census — Reorganização Global

**Criado em:** 2026-08-26  
**Atualizado em:** 2026-08-28  
**Missão:** `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`  
**Status:** G0 CONCLUÍDO — snapshot operacional atualizado durante fechamento de G2  
**Baseline inicial:** `289066361bf77cb451e9e39ac3f6bfe45a6e9c86`  
**Snapshot verificado:** `96c9681eb8ff8ea780971f1128f8ebd61bacbca9`

Este documento é o inventário operacional da reorganização global. Ele não substitui o plano permanente da raiz. O baseline inicial permanece registrado para rastreabilidade; as classificações abaixo refletem a árvore atual verificada e devem ser revalidadas antes de qualquer write porque a missão opera diretamente na `main`.

## Legenda

- **KEEP** — owner/local atual está correto.
- **MOVE** — deve migrar fisicamente para owner canônico.
- **BRIDGE** — compatibilidade temporária apontando em uma direção para o owner canônico.
- **MERGE** — conteúdo sobreposto deve ser consolidado em SSOT único.
- **RETIRE** — legado candidato a remoção depois de prova de não uso.
- **INVESTIGATE** — precisa de callers/contracts/provenance antes da decisão.
- **RETIRED** — removido fisicamente e protegido contra recriação.

---

## 1. Raiz do repositório

### KEEP

- `README.md`
- `SECURITY.md`
- `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` — **PERMANENTE; nunca mover/renomear/excluir**
- `package.json` / `package-lock.json`
- configs Vite/TypeScript/ESLint/Tailwind/PostCSS/Playwright/Vitest
- `.github/`, `.husky/`, `.kiro/`, `.lovable/`
- `api/`, `docs/`, `public/`, `src/`, `supabase/`, `tests/`, `tools/`

### Dívida ainda deliberadamente aberta

| Path | Classificação | Owner alvo / regra |
|---|---|---|
| `plans/` | INVESTIGATE/MOVE/RETIRE | plano ativo → `docs/08-roadmap`; histórico → `docs/10-archive` somente após validar links e autoridade |
| `eslint-rules/` | KEEP provável | tooling de lint; mover somente se callers/config forem atualizados no mesmo corte |

### Roots já retirados

- `scripts/` — **RETIRED**; tooling operacional é canônico em `tools/**`.
- `e2e/` — **RETIRED**; owner global é `tests/e2e/**`.
- `handoff/`, `product-qa-screenshots/`, `templates/` — **RETIRED** da raiz; material válido foi movido/arquivado e há regression guards.

Não recriar roots aposentados para conveniência temporária.

---

## 2. `src/` — snapshot atual

Roots atuais:

- `app/`
- `assets/`
- `core/`
- `integrations/`
- `modules/`
- `shared/`
- `styles/`

Arquivos de bootstrap atuais permanecem sob `src/`, incluindo `App.tsx`, `main.tsx`, `index.css` e declarations necessárias ao Vite.

### Roots/arquivos genéricos aposentados

- `src/config` — **RETIRED**; não existe mais como root de compatibilidade.
- `src/features` — **RETIRED**; `src/app/features` continua permitido como composição de aplicação.
- `src/test` — **RETIRED**.
- `src/__tests__` — **RETIRED** como root genérico; testes co-localizados específicos continuam permitidos.
- `src/types` — **RETIRED**; domínio fica em `core/<owner>` e tipos transversais em `shared/types`.
- `src/App.css` e `src/global.d.ts` — **RETIRED**.

### Configuração — owners canônicos

O antigo `src/config/**` foi completamente aposentado. Não adicionar implementação ou bridge novo nesse caminho.

| Responsabilidade | Owner canônico |
|---|---|
| launch scope | `src/app/config/launchScope.ts` |
| registry de módulos | `src/app/config/modules.ts` |
| slugs de módulos | `src/shared/config/moduleSlugs.ts` |
| configuração territorial | `src/core/routing/config/territory.ts` |
| lançamento da Community | `src/core/community/config/communityLaunch.ts` |

`tests/architecture/repository-reorganization-contract.test.ts` protege a ausência de `src/config` e dos imports de compatibilidade aposentados.

---

## 3. `src/modules` — owners de produto

Os módulos representam UI, aplicação e orchestration de produto. O inventário G0 identificou bounded contexts como `business`, `classifieds`, `communication-territorial`, `community-events`, `community-feed`, `community-groups`, `community-issues`, `community-lost-found`, `community-recommendations`, `mobility`, `professionals`, `profile` e `work-opportunities`, entre outros.

Classificação geral: **KEEP**, sujeitos aos boundaries.

Regras:

- module = UI/aplicação/orchestration de produto;
- persistência, autorização e contracts canônicos pertencem ao `core` correspondente;
- não criar agregador genérico `modules/community` apenas por estética;
- `community-events` é o owner físico da experiência de Events; o antigo `src/features/events` não existe mais;
- exceções module → integration devem permanecer explicitamente ratcheted e não podem crescer silenciosamente.

---

## 4. `src/core` — owners de domínio

`src/core` contém os owners reutilizáveis de domínio, infraestrutura interna, contracts, services, repositories e políticas de autorização/persistência.

A quantidade de roots não prova duplicação. Os seguintes grupos continuam **INVESTIGATE para G4/G5**, por contracts/callers/provenance — não consolidar por semelhança de nome:

- `auth` / `session` / `authorization` / `profiles`;
- `analytics` / `metrics` / `telemetry` / `tracking`;
- `address` / `city` / `location` / `geocoding` / `geospatial` / `territorial` / `service-areas`;
- `community` / `community-experience` / `community-feed` / `feed` e demais bounded contexts `community-*`;
- `billing` / `pricing` / `subscription`;
- `professional` / `work-opportunities`;
- `media` vs `shared/media`;
- `taxonomy` vs `shared/taxonomy`.

**Boundary obrigatório:** `src/core/**` não pode depender de `src/modules/**`. O guard canônico fica no tooling de arquitetura sob `tools/architecture/**` e nos testes de arquitetura associados.

---

## 5. `src/integrations`

Estado estrutural:

- `maps/`
- `supabase/`

Classificação: **KEEP**.

Regra: adapters técnicos externos. Domínio não nasce aqui.

Dívida histórica module → integrations foi transformada em boundary/ratchet durante G1. O censo não congela um número bruto antigo: o validator é a autoridade para a allowlist atual e deve falhar se surgirem novas exceções ou se uma exceção ficar stale.

---

## 6. `src/shared`

Roots transversais incluem componentes, config, constants, design-system, hooks, lib, media, schemas, services, taxonomy, types e utils.

Classificação:

- `components`, `design-system`, `hooks`, `utils` — **KEEP/AUDIT**;
- `config`, `constants`, `schemas`, `types`, `lib` — **AUDIT** para impedir domínio sem owner;
- `services` — **INVESTIGATE**, alto risco de pasta genérica;
- `media` — **INVESTIGATE** contra `core/media`;
- `taxonomy` — **INVESTIGATE** contra `core/taxonomy`.

`shared` não pode virar pasta de descarte e não deve depender de `app`, `modules` ou `core` para obter configuração de domínio. Durante a retirada de `src/config/territory.ts`, o `LandingFooter` sem callers foi removido em vez de criar uma dependência `shared → core`.

---

## 7. Testes

Owner global: `tests/`.

Subroots incluem arquitetura, E2E, fixtures, helpers, integration, operational, regression, scripts e security. Unitários muito locais podem permanecer co-localizados no source quando o bounded context justificar.

### E2E

- `e2e/` na raiz — **RETIRED**.
- specs e helpers canônicos — `tests/e2e/**`.
- `tests/architecture/repository-reorganization-contract.test.ts` bloqueia recriação do root legado.

Não existe mais bridge global de autenticação sob `e2e/helpers/auth.ts`.

---

## 8. Tooling operacional

`tools/**` é o owner canônico do tooling operacional por responsabilidade.

| Responsabilidade | Owner |
|---|---|
| validators de arquitetura/SSOT | `tools/architecture/` |
| segurança | `tools/security/` |
| migrations/schema/types | `tools/migrations/` |
| Supabase helpers operacionais | `tools/supabase/` |
| seeds/E2E data | `tools/seeds/` quando aplicável |
| deploy/release/CI | owner explícito sob `tools/` ou workflow correspondente |

O root `scripts/**` foi completamente aposentado. `package.json`, regressions de segurança e policies já apontam aos owners canônicos. Não recriar wrappers em `scripts/` para manter comandos antigos; preserve o comando público npm apontando diretamente ao owner correto.

---

## 9. Mapa owner atual → owner alvo

| Item | Atual | Alvo | Estado |
|---|---|---|---|
| bootstrap/router/providers | `src/app` | `src/app` | KEEP |
| UI/aplicação por produto | `src/modules/*` | `src/modules/*` | KEEP |
| domínio/SSOT/persistência/authz | `src/core/*` | `src/core/*` | KEEP + G4 AUDIT |
| adapters Supabase/maps | `src/integrations/*` | `src/integrations/*` | KEEP |
| primitives transversais | `src/shared/*` | `src/shared/*` | KEEP + AUDIT |
| Events legado | `src/features/events` | `src/modules/community-events` + `src/core/community-events` | RETIRED/MIGRADO |
| generic source test roots | `src/test`, `src/__tests__` | `tests/*` ou co-location real | RETIRED |
| generic source types | `src/types` | `shared/types` ou `core/<owner>` | RETIRED |
| global compatibility config | `src/config/*` | owners específicos em `app`, `core`, `shared` | RETIRED |
| E2E global legado | `e2e/*` | `tests/e2e/*` | RETIRED |
| tooling legado | `scripts/*` | `tools/*` por responsabilidade | RETIRED |
| planos históricos/ativos | `plans/*` | `docs/08-roadmap` ou `docs/10-archive` | INVESTIGATE |

---

## 10. Guards instalados

Não criar validators concorrentes quando já existir owner.

- `tests/architecture/repository-reorganization-contract.test.ts` protege o arquivo permanente, taxonomia de roots, paths de source aposentados, configuração canônica, templates e E2E.
- `tests/architecture/compatibility-surface-cleanup.test.ts` protege roots/namespaces de compatibilidade já retirados.
- tooling canônico de taxonomia e boundaries reside em `tools/architecture/**`.
- regras específicas de bounded context permanecem em seus tests/validators próprios quando representam contratos distintos.

G1 está concluído; novas mudanças de boundary devem fortalecer os ratchets existentes, não criar mecanismos paralelos sem necessidade.

---

## 11. Resultado do censo no estado atual

Checklist estrutural relevante ao fechamento de G2:

- [x] diretórios de raiz inventariados;
- [x] roots de `src` congelados pela taxonomia canônica;
- [x] `src/features`, `src/test`, `src/__tests__`, `src/types` e `src/config` retirados;
- [x] `scripts/` retirado e tooling operacional consolidado em `tools/**`;
- [x] `e2e/` retirado e owner canônico consolidado em `tests/e2e/**`;
- [x] compatibility bridges globais reduzidos a zero;
- [x] Events legado retirado dos owners históricos;
- [x] `core → modules` protegido por boundary;
- [x] module → integrations protegido por ratchet de G1;
- [x] itens de sobreposição sem prova continuam INVESTIGATE em vez de sofrer merge por heurística;
- [ ] `plans/` ainda exige classificação deliberada entre roadmap ativo, referência e archive;
- [ ] documentação histórica/operacional ainda deve ser sincronizada onde mencionar paths já aposentados;
- [ ] certificação same-SHA de testes/typecheck/build ainda é necessária antes de declarar G2 formalmente encerrado.

**Decisão:** G0 permanece concluído como inventário e G1 permanece concluído como taxonomia/boundaries. A remoção física de bridges/roots prevista em G2 está substancialmente concluída no snapshot acima; G2 ainda não deve ser declarado certificado até finalizar a classificação documental pendente e executar a certificação no mesmo SHA alvo.
