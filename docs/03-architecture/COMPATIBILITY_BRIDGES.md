# Compatibility Bridges Registry

Status: CANONICAL — runtime compatibility debt closed  
Reviewed: 2026-09-25  
Operational authority: `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`

## Purpose

This file is the current compatibility-debt ledger. It records only compatibility surfaces that still exist in active source and the guardrails for recently retired ones. Detailed historical retirement evidence remains in Git history and `docs/10-archive/**`.

Runtime compatibility debt is currently zero. New compatibility facades are not extension points and must not be introduced without an explicit, time-bounded migration reason.

## Rules

1. Canonical owners never import compatibility facades.
2. A compatibility facade may remain only while it has a current runtime caller and a named canonical replacement.
3. Compatibility code must not own independent persistence, security policy, business rules, route identity, or release state.
4. Retirement means migrating every runtime/test caller, removing barrel exports, deleting the facade, and adding a ratchet where useful.
5. Do not replace one compatibility bridge with another alias.
6. Persisted-data normalization at a read boundary is not a second runtime owner.
7. Retired roots/files must not be recreated merely because historical references remain in archived documentation.

## Live compatibility debt

**None.**

Canonical owners are consumed directly. Any future temporary facade must be documented here with a current caller, canonical replacement and removal gate before it is accepted.

## Retired module bridges — 2026-09-14

The following runtime bridges were proven unnecessary or had their final caller migrated and are now physically removed:

- `src/modules/business/services/BusinessService.ts` → canonical `src/core/business/services/BusinessService.ts`;
- `src/modules/business/gastronomy/services/GastronomyUrlService.ts` → canonical `src/core/verticals/gastronomy/services/GastronomyUrlService.ts`;
- `src/modules/business/gastronomy/services/OrderTrustService.ts` → order feedback now calls `OperationalTrustCommandService.submitOrderFeedback()` directly;
- unused `startSentryTransaction` shim → removed from `src/shared/config/sentry.config.ts`; no runtime caller existed and the legacy `startTransaction` lookup must not return.

`tests/architecture/business-service-canonical-owner.test.ts` guards the Business/Gastronomy bridge removals. `tests/architecture/sentry-optional-telemetry-consent.test.ts` guards removal of the Sentry transaction shim.

## Structural roots that remain retired

The physical reorganization remains valid. These historical compatibility roots must stay absent:

- `src/config/**` — configuration is owned by the responsible `app`, `core`, or `shared` module;
- `scripts/**` — operational tooling is under `tools/**`;
- `e2e/**` — E2E ownership is under `tests/e2e/**`;
- `plans/**` — active roadmaps are under `docs/08-roadmap/**` and completed plans under `docs/10-archive/plans/**`;
- `.kiro/**` — historical planning evidence has no runtime/build/security authority;
- `src/features/**`, `src/test/**`, `src/__tests__/**` — retired source roots remain absent.

Primary guards include `tests/architecture/repository-reorganization-contract.test.ts` and `tests/architecture/compatibility-surface-cleanup.test.ts`.

## Domain state

### Billing

The deprecated root `src/core/billing/SubscriptionService.ts` and the Business subscription alias remain retired. `src/core/billing/BusinessSubscriptionService.ts` owns Business subscriptions. `src/core/billing/services/SubscriptionService.ts` remains valid because it is the separate canonical user-subscription reader.

### Business / Gastronomy

Canonical persistence and reusable domain ownership live in `src/core/business`; public Gastronomy URL ownership lives in `src/core/verticals/gastronomy`. Module UI may import those canonical owners directly. The three module bridges retired on 2026-09-14 must not return.

Intentional Gastronomy module contracts such as cart/checkout presentation types are not automatically compatibility bridges merely because they reuse core types.

### Community / Events

Historical Community and Events path/service bridges remain retired. Canonical reusable owners live in `src/core/community-*`; module UI/application surfaces live in their respective `src/modules/**` owners. Local post drafts may still normalize the historical persisted `savedAt` field on read; current writers emit the current shape only.

### Guide / Tourist Points

The old `src/core/verticals/guide/**` namespace is retired. Public tourist-point route ownership is canonical in `src/core/guide/tourist-points/routes`. The module alias `src/modules/guide/hooks/useGuideUrls.ts` is retired and active callers import the canonical owner directly.

### Profiles

Business extension persistence belongs to `src/core/business/services/business.profile-extension.ts`. The multi-profile editor now consumes that owner directly; `src/core/profiles/services/multi-profile/businessService.ts` is retired.

### Mobility

`getRideWithAddresses()` is owned by `mobility.ride-read-queries.ts`. `BuscandoMotoristaPage` consumes that bounded read owner directly; the temporary `MobilityRuntimeService` forwarding method is retired.

## Closure criteria

Guide, Profile/Business and Mobility compatibility debt is closed and ratcheted. Runtime compatibility debt remains at zero unless a new migration bridge is explicitly registered with a removal gate.

Hosted build/test certification is a separate concern. Provider rate limits, runner failures, or missing logs are not source PASS evidence and do not change the bridge inventory.
