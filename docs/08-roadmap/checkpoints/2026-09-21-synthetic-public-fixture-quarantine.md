# Checkpoint — Persistent fixture quarantine — 2026-09-21

## Context

The canonical Supabase project is still a development/runtime environment with persistent synthetic fixtures.

Current provenance supplied for the project:

- school Business rows are the only current business dataset intended to represent external real-world entities;
- the remaining store/company rows are synthetic fixtures;
- current Professional rows are synthetic fixtures;
- user/profile cleanup is handled separately because admin authority must be resolved from an authoritative relation before changing personal profile visibility.

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

## Remaining user/profile cleanup

Personal/user profiles are not changed in this migration.

The current `admin_users` relation is empty, so it cannot safely identify the original administrative identity. Personal-profile quarantine must wait for the actual admin authority/ownership source to be identified; deleting or hiding hundreds of profiles based on names would be a data-integrity shortcut.
