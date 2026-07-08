# Supabase Remote Migration Drift - 2026-07-06

Commands:

```bash
supabase migration list --linked
supabase db push --linked --dry-run
npm run validate:migrations:remote
supabase db push --linked --dry-run --include-all
supabase db push --linked --include-all --yes
npm run verify:deploy
```

## Initial Result

The linked remote Supabase project was reachable, but migration history was not
in sync with `supabase/migrations/`.

Remote-only versions before recovery:

- `20260416130000`
- `20260416140000`
- `20260425030000`
- `20260426010000`

Local-only versions before remote application:

- 41 versions from `20260412000000` through `20260706163017`.

The 4 remote-only files were recovered with `supabase migration fetch --linked`
and then normalized for readable ASCII comments/messages while preserving SQL
intent.

## Remote Application - 2026-07-07

The 41 local-only migrations were reviewed through
`supabase db push --linked --dry-run --include-all` and applied to the linked
remote with `supabase db push --linked --include-all --yes`.

Three older local migrations needed compatibility fixes before the remote batch
could apply cleanly:

- `20260522133000_add_unique_ibge_district_index.sql`: compares
  `locations.type::text` because the remote column is `text`, not the local
  enum type assumed by the migration.
- `20260526024500_create_community_moderation_reports.sql`: uses the current
  `posts.content` column and removes references to legacy `posts.texto`,
  `is_hidden`, and `is_removed` columns that do not exist remotely.
- `20260530120000_ensure_complexo_nordeste_membership.sql`: uses the remote
  unique constraints for conflicts and updates
  `check_territorial_group_member()` so the existing group membership model can
  include both district and neighborhood locations within the anchor city.

`supabase db dump --linked --schema public` was attempted before applying the
batch, but the CLI requires Docker for that operation and this shell has no
available Docker daemon/pipe.

## Guardrail Added

`npm run validate:migrations:remote` now runs
`supabase migration list --linked` and fails when either side has missing
versions. This keeps remote deployment blocked if local and linked remote
migration history drift again.

`npm run verify:deploy` now executes both migration checks:

```bash
npm run validate:migrations
npm run validate:migrations:remote
```

## Current Result

As of 2026-07-07:

- `npm run validate:migrations` passes.
- `npm run validate:migrations:remote` passes.
- `supabase migration list --linked` shows local and remote history in sync.
- `npm run verify:deploy` passes.

Remote migration drift is no longer the active blocker. Remaining Supabase work
is tracked in the security advisor audit.
