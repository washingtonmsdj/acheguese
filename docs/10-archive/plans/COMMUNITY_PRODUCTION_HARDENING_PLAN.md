# Community Production Hardening Plan

Status: complete
Risk: Critical at start; no known Critical/High issue remains in this scope
Started: 2026-07-13

## Objective

Harden the existing Community First runtime for production without creating a
parallel community domain, duplicating canonical services or treating product
features that do not exist yet as refactoring work.

This plan covers the complete technical review requested for community
identity, feed, posts, comments, reactions, groups, alerts, issues,
recommendations, lost and found, moderation, notifications and the public
community shell.

## Canonical Sources

- `docs/CURRENT_RULES.md`
- `docs/architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`
- `docs/architecture/CORE_LAYER_SSOT.md`
- `docs/governance/security/SECURITY_AUTHORITY.md`
- `src/core/community-experience`
- `src/core/community/access`
- `src/core/posts`
- `src/core/feed`
- explicit `src/core/community-*` boundaries
- `supabase/migrations/`

`src/core/community` is a compatibility bounded context. New external
consumers must use explicit facades such as `core/community-feed`,
`core/community-groups`, `core/community-experience` or the owning domain.

## Scope Control

Production hardening includes correcting existing behavior, authorization,
validation, auditability, query shape, pagination, cache, errors, boundaries,
tests and dead code.

The following are product capabilities, not implicit refactor tasks. They may
only be enabled when a canonical data model, authorization model, moderation
contract and launch decision exist:

- repost as a new social aggregate;
- complete private-community lifecycle;
- new invitation and role hierarchy;
- new automatic moderation engine;
- new administrative moderation product;
- new realtime behavior where the existing owner has no contract.

Their absence must be reported honestly and must not be hidden with mocks,
redirects, client-only checks or placeholder persistence.

## Baseline Inventory

- `src/core/community`: 272 TypeScript files, approximately 37,166 lines.
- `CommunityOverviewSurface.tsx`: approximately 88 KB.
- `CreatePostModal.tsx`: approximately 49 KB.
- `ComunidadePage.tsx`: approximately 21 KB.
- Canonical Local Community identity already lives in
  `src/core/community-experience`.
- Database access found in service/repository owners, not in community UI.
- Explicit transversal boundary validator already exists at
  `scripts/validate-community-transversal-boundaries.ts`.
- Existing security regression coverage includes
  `CommunitySupabaseSecurityAudit.spec.ts`.
- Previous broad architecture audit identified community component aliases and
  oversized files as remaining debt; current runtime must be remeasured before
  deleting compatibility paths.

## Phase 0 - Evidence Baseline

- [x] Run community architecture, taxonomy, governance and SSOT validators.
- [x] Run current unit/security tests for community, posts and experience.
- [x] Run focused lint/typecheck and record failures before edits.
- [x] Inventory database tables, RPCs, RLS, grants, indexes and audit triggers.
- [x] Inventory route consumers and compatibility facades before deleting code.

## Phase 1 - Architecture And Ownership

- [x] Remove confirmed orphan files and false/empty module surfaces.
- [x] Eliminate duplicate active implementations; retain only documented thin
  compatibility facades where consumers still exist.
- [x] Move business rules out of pages/hooks into existing canonical services.
- [x] Split oversized files only along real responsibility boundaries.
- [x] Keep community identity, membership and entity links in
  `community-experience`.
- [x] Keep post persistence and eligibility in `core/posts`.
- [x] Add executable boundary checks for every corrected regression class.

## Phase 2 - Security And Anti-Abuse

- [x] Verify least-privilege RLS for communities, memberships, posts, comments,
  reactions, groups, reports, moderation, notifications and uploads.
- [x] Verify mutating RPCs authenticate, authorize ownership/role/territory and
  use a fixed `search_path` when `SECURITY DEFINER` is required.
- [x] Verify UI gates are convenience only and server enforcement is complete.
- [x] Verify public/private visibility fails closed and does not expose PII.
- [x] Verify upload owner, MIME, size, path and storage policies.
- [x] Verify canonical server-side anti-flood/idempotency for writes where the
  threat model requires it.
- [x] Add migrations only for confirmed remote/schema gaps and validate drift.

## Phase 3 - Audit And Moderation

- [x] Inventory audit coverage for create/update/delete/report/moderate/join/
  leave/role/ban/suspend/admin actions.
- [x] Consolidate audit writes behind canonical server-side contracts.
- [x] Ensure audit records are append-oriented, actor-aware, target-aware and
  safe for a future admin read model.
- [x] Ensure moderation decisions and permission changes cannot be forged from
  the browser.

## Phase 4 - Social Runtime Correctness

- [x] Posts: validate create/edit/delete/share/media/mentions/hashtags,
  pagination, cache invalidation and errors.
- [x] Comments: validate tree constraints, edit/delete/report/moderation,
  pagination and anti-spam.
- [x] Reactions: validate uniqueness, atomic counters, idempotency and cache.
- [x] Groups: validate membership, roles, private visibility, invitations where
  implemented, notification consistency and canonical URLs.
- [x] Notifications/alerts: validate deduplication, read state, bounded queries
  and realtime lifecycle where implemented.

## Phase 5 - Performance And Scale

- [x] Remove unbounded list queries and client-side full-table filtering.
- [x] Confirm cursor/keyset pagination for high-volume social lists.
- [x] Confirm indexes match territorial, visibility, status and chronological
  access paths.
- [x] Scope React Query keys, stale times and invalidation by canonical identity
  and territory.
- [x] Remove hidden queries for non-rendered views and duplicate realtime
  subscriptions.
- [x] Split large UI bundles at route/modal boundaries where measurable.
- [x] Add list virtualization only when rendered volume justifies it.

## Phase 6 - Tests And Release Gates

- [x] Add authorization regression tests for cross-user/cross-community access.
- [x] Add concurrency/idempotency tests for reactions and membership writes.
- [x] Add pagination/cache/error-state tests for critical social flows.
- [x] Run community unit and E2E suites.
- [x] Run typecheck, lint, architecture, taxonomy, SSOT, migrations, security,
  deploy verification and production build.
- [x] Run mobile/desktop runtime QA with no console errors or overflow.

## Definition Of Done

The plan is complete only when:

- no known Critical/High issue remains without a documented external blocker;
- no community UI performs direct database access or owns authorization rules;
- all changed writes are server-authorized and auditable;
- high-volume lists are bounded and indexed;
- compatibility facades contain no parallel implementation;
- required tests and release gates pass;
- `docs/STATUS_ATUAL.md` records evidence and honest residual risks;
- no mock, redirect or client-only workaround is used to claim completion.

## Evidence Log

Evidence is appended here as phases close. Exact counts are snapshots and must
not replace rerunning the commands.

### 2026-07-13 - Complete production hardening

- Canonical ownership is enforced: community identity, memberships and entity
  links remain in `core/community-experience`; post eligibility and persistence
  remain in `core/posts`; the public shell keeps its identity while embedded
  modules change view or route.
- Removed false active contracts rather than preserving misleading UI:
  browser-editable reputation/score fields, client-side score mutation,
  nonexistent post mentions, legacy gamification screens and unsupported
  manual reputation administration.
- Applied the confirmed remote schema hardening migrations
  `20260713090000` through `20260713137000`. The final migration adds a
  server-owned guard for profile structure, moderation state and score fields;
  ordinary browser writes cannot forge those values.
- RLS, guards, RPCs, audit triggers and storage rules now protect social,
  group, moderation, notification, alert, issue, lost-and-found and media
  write paths. Audit data is append-oriented and excludes content/media
  payloads.
- Pagination is cursor-based for the community feed and remaining list APIs
  have bounded size/offset constants in `shared/constants/communityRuntime`.
  The UI does not render an unbounded list, so virtualization was intentionally
  not added without a measured need.
- Regression coverage added in
  `src/core/community/access/__tests__/CommunitySocialProductionHardening.spec.ts`:
  23 tests passed. The broader community suite passed with 120 tests in 20
  files; the community SSOT suite passed with 11 tests in 4 files.
- E2E evidence on the local production-like host:
  - `community-persistent-shell.spec.ts`: 8 passed, including desktop route
    changes without remounting the community shell, alias routing and widths
    from 320 to 1536 px.
  - `community-territorial-operational.spec.ts`: 5 passed.
  - `mobile-core-layout.spec.ts`: 18 passed, including header/bottom-nav font
    contracts and serious Axe checks.
  - Direct runtime probe: no page or console errors, no horizontal overflow,
    191 px desktop hero and 200 px mobile hero.
- Release gates passed: production build, full lint, `verify:deploy`, typecheck,
  architecture/taxonomy/governance/SSOT validators, local and remote migration
  validators, Security Authority, security configuration and upload SSOT.
- Honest residuals outside the community release scope:
  - full-repository `npm test` discovery exceeded ten minutes and was not used
    as evidence; all relevant focused suites above passed;
  - the file-size validator reports one non-blocking warning in unrelated
    `src/modules/professionals/services/pages/CadastrarServicoSteps.tsx`
    (431 lines against a 420-line budget);
  - the Supabase advisor has 12 mapped residual findings. They are tracked
    residuals, not newly introduced Critical/High community findings.

### 2026-07-13 - Social interaction reaudit

- Comments now have one runtime owner in `core/comments`: the canonical query
  resolves author profiles, the current viewer like state and a bounded reply
  tree. The feed, detail modal and comments modal reuse `PostCommentsPanel`
  instead of maintaining independent comment state.
- Post and comment reports require an explicit reason in the shared
  `ReportReasonDialog`; group message reports reuse the same contract. Domain
  services remain responsible for persistence, error feedback and audit data.
- Post like/save optimistic updates now mutate the active `posts` cache shape,
  retain compatibility with the bounded `feed` facade and restore every
  affected community query on rollback.
- Group message likes are server-owned through migration
  `20260713153000_add_group_message_reactions.sql`: membership, capabilities,
  actor identity, uniqueness, counters, rate limits and audit are enforced in
  PostgreSQL. Direct browser access to the reaction table is revoked.
- Removed unused duplicate comment, post-action, report and unified-detail
  components after confirming they had no runtime consumers. This does not
  alter canonical routes or preserve a parallel legacy implementation.
- Focused evidence: 39 tests passed in 5 files, including behavioral report
  dialog coverage. Typecheck, production build, focused lint, Security
  Authority, architecture and local/remote migration synchronization also
  passed. The migration was applied to the linked remote project and generated
  Supabase types were refreshed from that schema.
- The canonical persistent-shell E2E suite passed 8/8 scenarios against the
  local host, covering embedded modules, desktop navigation without shell
  remount, the responsive width matrix, mobile feed contexts and public alias.
  Its obsolete expectation of 9 sidebar entries was corrected to the 7 entries
  in the current SSOT; Groups and Discussions belong inside Feed.
- Capacity claims remain outside this completed plan. Distributed Edge rate
  limiting, production metrics and a reproducible staging load test remain in
  `COMMUNITY_SCALE_READINESS_PLAN.md`.
- Full linked-database lint still reports pre-existing errors in unrelated
  functions outside the Community changes. The new group reaction functions
  are not in that error set; repository-wide database cleanup remains separate
  work and is not represented as complete here.
