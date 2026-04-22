# Product Modules (SSOT)

`src/modules` contains only product bounded contexts.

## Canonical top-level modules

- `admin`
- `business`
- `classifieds`
- `community`
- `guide`
- `mobility`
- `professionals`
- `profile`

## Taxonomy rules

- `business` is the horizontal base domain for business entities.
- `business` is **not** a vertical.
- Official business verticals are declared only in `src/core/verticals/config.ts`.
- Current official vertical state: only `gastronomy`.

## Domain nesting rules

- Business-derived domains stay inside `business`.
: `business/company`, `business/gastronomy`, `business/promotions`
- Community derived domains stay inside `community`.
: `community/alerts`, `community/issues`
- Mobility derived domains stay inside `mobility`.
: `mobility/delivery`
- Classified jobs stay inside `classifieds`.
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