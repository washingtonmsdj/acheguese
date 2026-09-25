# G5 — Redundant UNIQUE-shadow indexes — 2026-08-31

## Authority

This checkpoint extends `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` and the G5 checkpoints already active on `main`.

- branch: `main`;
- HEAD immediately before this documentation write: `106c83ce9c64890e9bb5e66621ba3420bee97a75`;
- Supabase project: `xhdowzacfujckjelqhtd`;
- phase: **G5 EM EXECUÇÃO**;
- this cleanup class is an optimization/reconciliation improvement and does **not** create a new G5 launch blocker.

## 1. Finding class

The previous schema-integrity checkpoint reported zero **exact duplicate indexes** because uniqueness was part of the structural identity used by that audit. This narrower check intentionally compares a different class:

> a normal non-UNIQUE B-tree index whose table, key columns, access method, operator classes, collations, options, expressions and predicate are identical to a healthy UNIQUE index on the same table.

When the UNIQUE index is owned by a UNIQUE constraint, the normal index does not add uniqueness authority and does not widen query key/predicate coverage. It adds a second write-maintenance path and extra storage.

This finding must not be confused with `unused_index`: scan count alone is **not** removal authority.

## 2. Provenance-backed cuts

### 2.1 First cut

Direct migration provenance and live structural equivalence supported removal of:

1. `idx_communication_channels_slug`
   - retained: `communication_channels_slug_key`;
   - source: `20260515090000_create_communication_territorial_mvp.sql`.
2. `idx_stripe_webhook_events_stripe_id`
   - retained: `stripe_webhook_events_stripe_event_id_key`;
   - source: `20260418160000_create_billing_webhooks.sql`.
3. `idx_subscription_plans_code`
   - retained: `subscription_plans_plan_code_key`;
   - source: `20260416100001_create_subscription_plans.sql`.

### 2.2 Second cut

After the same provenance and catalog checks:

1. `idx_site_settings_key`
   - retained: `site_settings_key_key`;
   - source: `20260422000000_create_site_settings.sql`.
2. `idx_notification_preferences_user`
   - retained: `notification_preferences_user_id_key`;
   - source: `20260418170001_alter_notifications_system.sql`.

### 2.3 Third cut

Two more source-proven cases were removed in a deliberately small batch:

1. `idx_categories_slug`
   - retained: the constraint-owned UNIQUE index for `categories.slug`.
2. `idx_business_operation_config_business`
   - retained: the constraint-owned UNIQUE index for `business_operation_config.business_id`.

This cut was applied as remote migration `20260831170445_remove_redundant_unique_shadow_indexes_batch3_g5` and mirrored to `main` by commit `edf33809c51b4e09ebeee75e63fb03ba3dc0f4e1`.

### 2.4 Fourth cut — QR + Analytics

A fresh live check plus direct creation-migration provenance proved two additional pairs:

1. `qr_codes.token`
   - `20260413110000_create_qr_codes_system.sql` declares `token TEXT NOT NULL UNIQUE`;
   - the same migration later creates `idx_qr_codes_token ON qr_codes(token)`;
   - retained: `qr_codes_token_key` — UNIQUE, valid, ready and owned by a `contype = 'u'` constraint;
   - removed: `idx_qr_codes_token`.

2. `analytics_sessions.session_id`
   - `20260413170000_create_analytics_system.sql` declares `session_id TEXT NOT NULL UNIQUE`;
   - the same migration later creates `idx_analytics_sessions_session_id ON analytics_sessions(session_id)`;
   - retained: `analytics_sessions_session_id_key` — UNIQUE, valid, ready and owned by a `contype = 'u'` constraint;
   - removed: `idx_analytics_sessions_session_id`.

Immediately before removal, the live catalog confirmed for both pairs:

- drop candidate: non-UNIQUE, valid, ready and not constraint-owned;
- retained index: UNIQUE, valid, ready and UNIQUE-constraint-owned;
- exact equality of table, `indnatts`, `indnkeyatts`, `indkey`, `indclass`, `indcollation`, `indoption`, `indexprs`, `indpred` and access method.

## 3. Migration lifecycle

All cuts use the official Supabase migration lifecycle and are mirrored into `supabase/migrations`.

- first cut: `20260831120040_remove_redundant_unique_shadow_indexes_g5`;
- second cut: `20260831170039_remove_more_redundant_unique_shadow_indexes_g5`;
- third cut: `20260831170445_remove_redundant_unique_shadow_indexes_batch3_g5`;
- fourth cut: `20260831235001_remove_qr_analytics_redundant_unique_shadow_indexes_g5`.

Fourth-cut source commit:

- `106c83ce9c64890e9bb5e66621ba3420bee97a75` — `perf(g5): remove qr analytics shadow indexes`;
- source file: `supabase/migrations/20260831235001_remove_qr_analytics_redundant_unique_shadow_indexes_g5.sql`.

The current fail-closed pattern verifies before removal that:

- both intended indexes exist;
- the retained index is UNIQUE and owned by a UNIQUE constraint;
- the drop candidate is not constraint-owned;
- both indexes are valid/ready;
- table, key count, keys, operator classes, collations, options, expressions, predicate and access method match;
- the drop candidate is non-UNIQUE and the retained authority is UNIQUE.

Removal uses ordinary `DROP INDEX` with default restrictive dependency behavior. New G5 cuts do not use `IF EXISTS`, `CASCADE`, swallowed errors, data mutation or constraint removal.

Postconditions require each shadow index to be absent and each retained UNIQUE authority to remain unique, valid, ready and constraint-owned.

## 4. Remote postcheck

After the fourth migration, the live database confirmed:

- `idx_qr_codes_token`: absent;
- `idx_analytics_sessions_session_id`: absent;
- `qr_codes_token_key`: UNIQUE, valid, ready, UNIQUE-constraint-owned;
- `analytics_sessions_session_id_key`: UNIQUE, valid, ready, UNIQUE-constraint-owned.

Earlier retained authorities from cuts 1–3 had already passed the equivalent postconditions.

No application row was modified by these cuts.

## 5. Hosted proof

### First and second cuts

Their Vercel builds reached the known dependency gate after source/security validation, with `lint:security` at 0 errors / 93 warnings and the two existing React Router moderate advisories as the first failure.

### Fourth cut — exact SHA

Commit `106c83ce9c64890e9bb5e66621ba3420bee97a75` triggered production deployment `dpl_9Y8VCVFw8jX6knvZQztdyhtXcksC`.

The build cloned exactly `106c83c`, then:

- package/lock consistency validator: PASS, 111 direct dependencies aligned;
- `npm ci`: PASS, 758 packages installed;
- `security:validate`: PASS with the already-known missing `.env.local` hosted warning;
- `lint:security`: 0 errors, 93 warnings;
- first failing gate: `npm audit --omit=dev --audit-level=moderate`;
- findings: `GHSA-wrjc-x8rr-h8h6` and `GHSA-337j-9hxr-rhxg` through React Router `< 7.18.0`.

Therefore the fourth database/source cut introduced **no new pre-B0 hosted regression**. B0 remains the first real hosted source blocker.

## 6. GitHub Actions / generated-types state

Runner allocation remains **intermittent**, not a reliable source-signal failure:

- an earlier Maps Architecture job on `edf33809c51b4e09ebeee75e63fb03ba3dc0f4e1` obtained a real hosted runner and exposed a genuine meta-test harness defect;
- that harness defect was corrected on `main` by `4d6b0335111b92dca70f3fe08e5c49b1c3328709` without weakening the production Maps rules;
- subsequent automatic hosted jobs again commonly failed before steps were allocated.

For exact fourth-cut SHA `106c83ce9c64890e9bb5e66621ba3420bee97a75`, `Security Check`, `SSOT Enforcement` and `SSOT Territorial Tests` failed before meaningful workflow execution, while the authorized Supabase Types Sync run `33452379821` / `#21` remained `queued`.

The Types Sync authority remains intentionally restricted to:

- `self-hosted`;
- `windows`;
- `x64`;
- `acheguese-heavy-windows`;
- `remote-only`.

Do **not** move generated-types authority to `ubuntu-latest` merely to bypass the unavailable approved runner.

## 7. Remaining similar candidates

A live detector still enumerates additional ordinary indexes structurally shadowed by constraint-owned UNIQUE indexes. They remain **candidates, not an automatic drop list**.

Important exception:

- `locations.idx_locations_geographic_path` must not be removed through generic cleanup. The dedicated location-prefix checkpoint intentionally preserves the standard/UNIQUE indexes while using a separate `text_pattern_ops` index for prefix matching.

Billing, historical-subscription and other domain-sensitive candidates also require separate provenance/retention review.

Do not mass-drop the remaining set.

## 8. G5 consequence

This finding class remains **PARTIALLY CLEANED / NON-BLOCKING**.

The launch-blocking G5 set remains:

- **B0 — React Router production dependency audit:** canonical migration to `react-router-dom@7.18.3`, full npm-generated lockfile, removal of v6-only future flags, complete tests and same-SHA hosted proof. This requires a writable Node 24/npm 11 environment and is appropriate for Codex/local execution when ChatGPT lacks that shell capability.
- **B1 — Supabase generated types:** the canonical workflow exists and is correct, but its approved Windows self-hosted runner is unavailable/queued; do not change authority to bypass it.
- **B2 — `classified-images`:** remove only through official Supabase Storage bucket lifecycle API; no SQL deletion or parallel service-role authority.
- **B3 — GitHub Actions:** hosted allocation is intermittent; post-fix Maps/SSOT/security proof still requires real runner execution.

Do not start G6 while B0–B3 remain open.

## 9. Do not repeat

- do not treat `idx_scan = 0` as sufficient removal authority;
- do not remove UNIQUE/constraint-owned indexes;
- do not use `DROP INDEX IF EXISTS` in new G5 cleanup migrations to hide missing prerequisites;
- do not use `CASCADE`;
- do not remove `idx_locations_geographic_path` through a generic redundancy sweep;
- do not mass-drop remaining candidates without source/provenance review;
- do not move Supabase Types Sync to a different runner class just to get a green job;
- do not manually reconstruct Supabase generated types;
- do not manually patch the React Router lockfile;
- do not let non-blocking index cleanup distract from B0–B3.
