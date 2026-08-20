# Product Modules (SSOT)

`src/modules` contains only product bounded contexts.

## Canonical top-level modules

- `admin`
- `ai`
- `business`
- `central`
- `classifieds`
- `communication-territorial`
- `community-events`
- `community-feed`
- `community-groups`
- `community-issues`
- `community-lost-found`
- `community-recommendations`
- `guide`
- `mobility`
- `professionals`
- `profile`
- `work-opportunities`

## Canonical source layout

- `src/app`: composição da aplicação, providers, router e shells.
- `src/app/features`: fluxos de aplicação/landings que não são bounded contexts de produto.
- `src/modules`: páginas, componentes e API pública dos bounded contexts de produto.
- `src/core`: regras de domínio reutilizáveis, serviços, state machines e contratos compartilhados entre superfícies.
- `src/integrations`: adapters de serviços externos e infraestrutura de integração.
- `src/shared`: primitives realmente transversais, sem ownership de domínio.
- `src/config`: configuração de runtime/build que não pertence a um domínio.

`src/features` **não é um namespace canônico**. Ele existe apenas por compatibilidade enquanto o domínio legado de Eventos é migrado. Nenhum novo bounded context, página, service ou hook deve ser criado ali.

## Taxonomy rules

- `business` is the horizontal base domain for business entities.
- `business` is **not** a vertical.
- Official business verticals are declared only in `src/core/verticals/config.ts`.
- Current official vertical state: `gastronomy` and `education`.
- Community First core domain is `Comunidade Local`.
- Local Community identity belongs to `src/core/community-experience`, not to a top-level aggregate module.

## Domain nesting rules

- Business-derived domains stay inside `business`.
: `business/company`, `business/gastronomy`, `business/promotions`
- Community product experiences use explicit top-level bounded contexts.
: `community-feed`, `community-issues`, `community-groups`, `community-events`, `community-lost-found`, `community-recommendations`
- Community alert infrastructure belongs directly to `src/core/community/alerts`; it has no compatibility module facade.
- Mobility derived domains stay inside `mobility`.
: `mobility/delivery`
- Quick work opportunities stay in the explicit top-level bounded context.
: `work-opportunities`
- Structured classified jobs stay inside `classifieds`.
: `classifieds/jobs`
- Services capability stays consolidated in `professionals`.
: `professionals/services`

## Out of `src/modules`

App-level flows and landings do not belong to domain modules.
They live in `src/app/features` (for example: onboarding, dashboard, landings).

Infrastructure reusable by more than one surface belongs to `src/core` or `src/integrations`, according to ownership. Moving code to `core` only to avoid deciding ownership is prohibited.

## Legacy migration policy

Known structural debt must shrink, never expand:

- `src/features/events` is a legacy implementation namespace. Its product surface must converge on `src/modules/community-events`; reusable contracts/services must converge on an appropriately named `src/core` domain.
- Non-business namespaces under `src/core/verticals` such as `events`, `guide` and `jobs` are compatibility debt and do not define official business verticals.
- Compatibility paths may remain only while an existing caller still requires them. New callers must use the canonical owner.
- A migration is complete only after callers, tests, docs and exports have moved; only then can the compatibility path be removed.

## Boundary rules

- Modules can import from `shared`, `core`, and `integrations` through approved boundaries.
- Cross-module implementation imports are not allowed.
- Shared contracts and canonical services must come from `core`.
- `src/core` must not import or reexport `src/modules`. When a module UI/hook is needed by more than one bounded context, promote the reusable contract to `core` and migrate every consumer before removing the old module path.
- `index.ts` files in modules must expose a real public contract. Empty `export {};` indexes are prohibited because they create false SSOT surfaces.
- There is no `src/core -> src/modules` allowlist. Shared Mobility UI and hooks used by Central live in `src/core/mobility`.
- No new top-level source organization axis may be introduced without changing this SSOT and its architecture tests first.
