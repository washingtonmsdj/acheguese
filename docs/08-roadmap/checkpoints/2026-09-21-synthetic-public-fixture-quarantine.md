# Checkpoint — Persistent fixture quarantine — 2026-09-21

## Context

The canonical Supabase project is still a development/runtime environment with persistent synthetic fixtures.

Current provenance supplied for the project:

- school Business rows are the only current business dataset intended to represent external real-world entities;
- the remaining store/company rows are synthetic fixtures;
- current Professional rows are synthetic fixtures;
- the original administrative personal profile is resolved by active `user_roles.admin` plus the stable handle `washingtonmsdj`; test admins are not preserved merely because they also hold an admin role.

This provenance is a data-hygiene rule for the current dataset, not a permanent product rule.

## Root correction

Migration:

`20260921103540_quarantine_synthetic_public_business_professional_fixtures.sql`

The migration does not delete fixtures and does not hardcode generated IDs.

It:

- keeps `educacao/education` Business rows untouched;
- changes every other current Business fixture to `status=inactive`;
- sets the linked synthetic Business profile to `is_public=false`;
- changes every current Professional fixture to `visibility=private`;
- sets `is_accepting_clients=false`;
- sets linked Professional profiles to `is_public=false`;
- fails if any of those synthetic extensions remain public after the migration.

## Important boundary

Schools remain data records, but `education=false` still owns launch behavior.

Therefore preserving school data does **not** reactivate Education in the MVP and does not create a category redirect or special public route.

## Remote result

After the migration:

- active `educacao` rows: 15;
- active non-Education Business rows: 0;
- Professional public/accepting rows: 0;
- linked public synthetic Business profiles: 0;
- linked public synthetic Professional profiles: 0.

The data remains available internally for development inspection, but it no longer represents public product content.

## Why this is cleaner

Product code no longer needs to accommodate bad fixture state with redirects, aliases or exception lists.

The intended model is:

1. production/public read models expose only valid product data;
2. synthetic data is isolated from public surfaces;
3. tests create or select fixtures explicitly and never convert those fixtures into product truth;
4. invalid identity/URL state fails closed instead of redirecting elsewhere.

## Public profile quarantine

A second migration,
`20260921103912_quarantine_synthetic_public_profiles_mvp.sql`,
uses the actual authority relation `user_roles`.

After it:

- public Personal profiles: 1, the active admin profile `washingtonmsdj`;
- public Business profiles: 15, each backed by an active `educacao/education` Business row;
- public Professional profiles: 0;
- public Driver profiles: 0.

Profiles remain active internally where needed for development fixtures; only public exposure changes.
