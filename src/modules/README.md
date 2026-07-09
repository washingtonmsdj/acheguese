# Product Modules (SSOT)

`src/modules` contains only product bounded contexts.

## Canonical top-level modules

- `admin`
- `ai`
- `business`
- `central`
- `classifieds`
- `communication-territorial`
- `community-alerts`
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

## Taxonomy rules

- `business` is the horizontal base domain for business entities.
- `business` is **not** a vertical.
- Official business verticals are declared only in `src/core/verticals/config.ts`.
- Current official vertical state: `gastronomy` and `education`.
- Community First core domain is `Comunidade Local`.
- Local Community identity belongs to `src/core/community-experience`, not to a
  top-level aggregate module.

## Domain nesting rules

- Business-derived domains stay inside `business`.
: `business/company`, `business/gastronomy`, `business/promotions`
- Community product experiences use explicit top-level bounded contexts.
: `community-feed`, `community-alerts`, `community-issues`,
  `community-groups`, `community-events`, `community-lost-found`,
  `community-recommendations`
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

## Boundary rules

- Modules can import from `shared`, `core`, and `integrations` through approved boundaries.
- Cross-module implementation imports are not allowed.
- Shared contracts and canonical services must come from `core`.
- `src/core` must not import or reexport `src/modules`. When a module UI/hook is
  needed by more than one bounded context, promote the reusable contract to
  `core` and keep the old module path as a compatibility reexport only.
- `index.ts` files in modules must expose a real public contract. Empty
  `export {};` indexes are prohibited because they create false SSOT surfaces.
- There is no `src/core -> src/modules` allowlist. Shared Mobility UI and hooks
  used by Central live in `src/core/mobility`; module paths are thin
  compatibility reexports.
