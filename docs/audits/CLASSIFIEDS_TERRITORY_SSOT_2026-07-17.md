# Classifieds territory SSOT - 2026-07-17

## Decision

`public.locations` is the only owner of Classifieds territory identity and
labels. Every classified must reference one valid location through the required
`public.classifieds.location_id` foreign key.

The domain read model exposes the relation as `ClassifiedData.territory`.
`ClassifiedData.location`, `ClassifiedData.neighborhood` and the flattened
`ClassifiedData.geographic_path` no longer exist.

## Before

- the table stored both `location_id` and a nullable free-text `neighborhood`;
- create and edit forms allowed the label to diverge from the selected location;
- queries and mutations had separate spread-based mappers;
- generic read payloads leaked physical legacy columns into the domain model;
- one unused creation hook and three unused type/component files duplicated the
  active flow.

## After

- `classifieds.read-model.ts` owns the shared PostgREST projection and strict
  relation mapper;
- `classifieds.write-model.ts` allowlists writable fields and prevents mass
  assignment of ownership, status defaults and legacy properties;
- create and edit surfaces display the canonical location and never accept a
  parallel neighborhood label;
- search, profiles, seller lists, URL generation and map layers consume the
  same `territory` object;
- migration `20260717150000` makes `location_id` required and drops
  `neighborhood` after validating every existing relation and label;
- generated Supabase types reflect the remote schema.

## Remote evidence

Preflight before migration:

- total rows: 23;
- rows without `location_id`: 0;
- orphan `location_id`: 0;
- rows with a legacy label: 4;
- labels disagreeing with `locations.name`: 0.

`supabase db push --dry-run` listed only migration `20260717150000`. The linked
push completed successfully. The regenerated schema exposes
`location_id: string` and no Classifieds `neighborhood` column. An anonymous
PostgREST probe returned 23 visible records; five sampled rows all resolved a
matching `territory.id`, with zero invalid relations.

## Security and rollback

RLS policies and grants were not broadened. Explicit write builders discard
unexpected payload properties such as `seller_id`, `is_active`, `status` on
create and free-text location labels.

If an emergency application rollback requires the former schema, use a new
forward migration that re-adds `neighborhood`, backfills it from
`locations.name` and only then deploys the old application. Do not edit or
revert the applied migration. Normal rollback is the current application plus
the canonical schema.

## Validation

```text
npm run test:classifieds:ssot
npm run typecheck:app
npx eslint src/core/classifieds src/modules/classifieds
npm run validate:migrations
```

The dedicated suite contains 28 tests covering canonical mapping, missing/mismatched relations,
mass-assignment resistance, URL/report regressions, messaging ownership,
territorial copy and migration/schema contracts.
