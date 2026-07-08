# Task: Community Portal and Public Entity Routing Cleanup

Status: in progress  
Date: 2026-07-05  
Source SSOT: `docs/architecture/COMMUNITY_PORTAL_PUBLIC_ENTITY_SSOT.md`  
Goal: separate public site routes from community portal routes without legacy
drift, ambiguous canonical URLs, or ad hoc access rules.

## 1. Objective

Implement a clean, scalable, auditable routing and access model where:

1. businesses, gastronomy, education, services, classifieds, search, city, and
   district pages remain on the public site by default;
2. community portal routes are used only for community-specific surfaces and
   actions;
3. public entities do not automatically redirect to community aliases;
4. community actions are gated by a single access policy;
5. conflicting legacy docs and runtime paths are updated, archived, or removed.

## 2. Non-Negotiable Execution Rules

1. Do not create a second URL service parallel to the routing SSOT.
2. Do not leave `/:communitySlug/:slug` as the preferred public entity route.
3. Do not put route-intent decisions inside UI components.
4. Do not use community access checks directly in pages when a shared gate or
   policy can own the decision.
5. Do not delete legacy support until tests prove the replacement behavior.
6. Do not update docs to claim production readiness before validation passes.
7. Do not add temporary compatibility redirects while the project is still in
   development without real user traffic to preserve.

## 3. Baseline Drift That Started This Task

The following findings are the reason this task exists:

1. `src/app/routes/README.md` documents `/:communitySlug/:slug` as preferred
   public detail for business/restaurant.
2. `src/core/routing/components/BusinessCanonicalRoute.tsx` redirects public
   territorial business routes to community aliases when available.
3. `src/core/business/services/BusinessUrlService.ts` resolves community alias
   globally through `getCanonicalUrlWithResolvedCommunityAlias`.
4. `src/core/community/components/CommunityRolloutGate.tsx` says community is
   restricted, but the main route stack does not use it as the single portal
   gate.
5. `src/core/routing/utils/territoryVisibility.ts` makes navigability public by
   default, which is correct for territory visibility but insufficient for
   community action access.
6. Several docs still describe the old alias-first public identity model.

## 4. Phase 0 - Baseline Audit

- [x] Run `git status --short` and record unrelated dirty files.
- [x] Search all usages of `getCanonicalUrlWithResolvedCommunityAlias`.
- [x] Search all references to `/:communitySlug/:slug`.
- [x] Search all docs that call community short aliases the preferred public
      entity route.
- [x] Run the current tests that describe existing behavior:
      - `vitest --run src/core/business/services/__tests__/BusinessUrlService.spec.ts`
      - `vitest --run src/core/routing/components/__tests__/BusinessCanonicalRoute.spec.tsx`
      - `vitest --run src/app/routes/__tests__/communityRoutesCanonical.spec.ts`
- [x] Save a short baseline note in the final implementation report.

Baseline note:

- The task started from a dirty worktree with unrelated routing, community,
  business, gastronomy, docs, sitemap, and migration changes already present.
  This implementation continues in-place without reverting unrelated user
  work. The baseline drift was an alias-first public identity model:
  public entity routes could resolve into community aliases, short community
  paths were treated as preferred identity in docs/runtime, and community
  action access was spread across pages instead of a single policy/gate.

## 5. Phase 1 - Create Routing Intent Policy

Create:

- [x] `src/core/routing/policies/PublicRoutePolicy.ts`
- [x] `src/core/routing/policies/CommunityRoutePolicy.ts`
- [x] `src/core/routing/policies/EntityUrlPolicy.ts`
- [x] `src/core/routing/policies/index.ts`

Implement:

- [x] `PublicUrlIntent`
- [x] public entity route builders
- [x] community portal route builders
- [x] community-scoped entity route builders
- [x] explicit legacy route decisions

Tests:

- [x] Add unit tests for every route intent.
- [x] Verify public entity intent never emits community URL.
- [x] Verify community-scoped entity intent requires community alias/context.
- [x] `decideLegacyEntityRoute(...)` documents and tests the remaining legacy
      decisions: public entity canonicalization renders on the public site
      without redirecting into community, while non-canonical community entity
      aliases fail visibly instead of redirecting.

## 6. Phase 2 - Stop Public Entity Auto-Redirects

Update:

- [x] `src/core/routing/components/BusinessCanonicalRoute.tsx`
- [x] `src/core/business/services/BusinessUrlService.ts`
- [x] `src/core/business/hooks/useBusinessNavigation.ts`
- [x] `src/core/business/hooks/useBusinessUrls.ts`
- [x] `src/core/business/hooks/useResolvedBusinessPublicUrl.ts`
- [x] `src/app/pages/EmpresaDetailLandingPage.tsx`
- [x] `src/core/verticals/gastronomy/services/GastronomyUrlService.ts`

Remove or replace:

- [x] global calls to `getCanonicalUrlWithResolvedCommunityAlias`
- [x] tests that assert forced community canonicalization
- [x] code comments that call community alias the preferred public entity route

Expected behavior:

- [x] `/empresas/:state/:city/:territory/:slug` renders or canonicalizes to a
      public entity URL.
- [x] Public cards and search results link to public URLs.
- [x] External share URLs use public entity URLs.
- [x] Community URLs are emitted only from community context.

## 7. Phase 3 - Isolate Legacy Community Entity Routes

Inspect and refactor:

- [x] `src/core/routing/components/CommunityShortEntityRoute.tsx`
- [x] `src/core/routing/components/CommunityEntityAliasRoute.tsx`
- [x] `src/core/routing/components/CommunityAliasRoute.tsx`
- [x] `src/core/routing/components/CommunityShortAliasShellRoute.tsx`
- [x] `src/core/routing/services/CommunityBusinessEntityResolver.ts`
- [x] `src/app/routes/sections/CommunityTerritoryRoutes.tsx`

Target:

- [x] Keep `/comunidade/:alias` as portal entry.
- [x] Prefer `/comunidade/:alias/empresas/:slug` for community-scoped entity
      views.
- [x] Remove `/:communitySlug/:slug` from preferred route generation.
- [x] Old naked short entity links are not accepted as a second surface in dev;
      non-canonical entity aliases fail visibly.
- [x] Legacy route behavior is tested.
- [x] Community alias entity resolver is directly tested for group membership,
      same-city checks, and explicit neighborhood alias resolution.

## 8. Phase 4 - Implement Community Access Policy

Create:

- [x] `src/core/community/access/CommunityAccessPolicy.ts`
- [x] `src/core/community/access/useCommunityAccess.ts`
- [x] `src/core/community/access/CommunityPortalGate.tsx`
- [x] `src/core/community/access/index.ts`

Access levels:

- [x] `public_preview`
- [x] `authenticated`
- [x] `resident`
- [x] `verified_resident`
- [x] `moderator`
- [x] `admin`

Apply to:

- [x] feed
- [x] groups
- [x] comments
- [x] post creation
- [x] local issues
- [x] lost and found
- [x] resident recommendations
- [x] community alerts
- [x] community messages

Tests:

- [x] visitor sees preview/gate
- [x] authenticated user without address sees address setup CTA
- [x] resident without verification gets limited behavior
- [x] verified resident can use allowed community actions
- [x] moderator/admin can access moderation actions

Validation run:

- [x] `npx vitest --run src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts src/core/routing/policies/__tests__/EntityUrlPolicy.spec.ts`
- [x] focused eslint for community access files and `ComunidadePage`
- [x] `npm run typecheck:app`
- [x] `npx vitest --run src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts`
- [x] focused eslint for community access, feed, comment modal, detail modal, and
      `ComunidadePage`
- [x] `npx vitest --run src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts src/core/community/utils/__tests__/communityFeedTab.spec.ts src/modules/business/public/__tests__/PublicBusinessSnapshotService.spec.ts src/core/routing/__tests__/publicBusinessUrlPolicy.spec.ts`
- [x] `npx vitest --run src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts`
- [x] focused eslint for community access, rollout, recommendations, and
      lost/found pages
- [x] `npm run typecheck:app`
- [x] `npx vitest --run src/core/community/components/composer/CreatePostModal.spec.ts src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts`
- [x] focused eslint for composer permission files, unified composer, and
      `ComunidadePage`
- [x] `npx vitest --run src/core/routing/seo/__tests__/TerritorialSEO.spec.ts src/core/routing/seo/__tests__/generateSitemap.spec.ts`
- [x] focused eslint for SEO policy, sitemap generator, and
      `CommunityTerritorialShell`
- [x] `npm run test:e2e:seo`

Implementation notes:

- [x] `CommunityAction` now covers create issue, create alert, and send message.
- [x] Unverified residents can view/react/save/report but cannot create posts,
      issues, alerts, comments, or direct community messages.
- [x] `CommunityFeed`, `UnifiedFeedWithMessages`, comment modals, post detail
      modal, and unified detail modal receive centralized access decisions.
- [x] `UnifiedPostCard` no longer fires local interaction handlers and external
      page handlers for the same like/save/share click.
- [x] Issue/alert feed sections, modals, and legacy composer now accept access
      props and block creation before submit when permission is denied.
- [x] Group list and group detail routes now use the community route territory
      context and `CommunityPortalGate` instead of deriving the list from the
      user's home district.
- [x] Recommendations and lost/found pages now use the community route
      territory filter and block create flows through the central access policy.
- [x] New recommendation and new lost/found forms prioritize the route
      `location_id` for writes instead of defaulting to the user's home
      district.
- [x] Legacy community pages outside `TerritorialLayout` now use a minimal
      access target by canonical `location_id` instead of pretending the user's
      residence snapshot is a full routed territory.
- [x] Community rollout checks can now run directly by `location_id`, so
      fallback pages validate the same target used by the access policy.
- [x] The real community issues page is wired behind `communityIssues` launch
      scope and uses the central policy for feed access and issue creation.
- [x] Alert creation paths in feed sections, unified composer, and the main
      create-post modal now require the centralized `create_alert` permission.
- [x] Create-post modal permission logic was extracted into a pure helper with
      tests for normal posts, urgent alerts, and urban issue reporting.
- [x] Community SEO now treats portal, feed, groups, issues, and lost/found
      surfaces as `noindex, follow` by default.
- [x] Community-embedded public modules still canonicalize to their public
      module URL and remain `noindex, follow`.
- [x] Public sitemap generation no longer emits `/comunidade/...` URLs; public
      territory and module URLs remain the indexable surface.
- [x] `public/manifest.json` no longer exposes a community feed shortcut as an
      app entry point.
- [x] Public neighborhood/group landings no longer redirect automatically into
      `/comunidade/...`; only community CTAs enter the portal.
- [x] Short community entity aliases no longer preserve a second live entity
      surface; non-canonical entity aliases fail visibly instead of redirecting.
- [x] Business URL hooks detect community context by explicit `/comunidade/:alias`
      pathname and keep public territorial pages on `/empresas/...`.
- [x] Home/community href resolution normalizes stored or resolved short aliases
      to `/comunidade/:alias` before returning navigation targets.
- [x] Community module URL helper normalizes legacy short alias bases to
      `/comunidade/:alias` before returning scoped module links.
- [x] Short alias shell compatibility was removed from the active entity route
      path; `/comunidade/:alias` is the explicit community base.
- [x] `communityAlerts` and `communityIssues` remain disabled in
      `PUBLIC_LAUNCH_SURFACES`, and their global/territorial routes are covered
      by launch-scope tests so they cannot bypass `launchElement` or route
      `launchSurface` metadata before E2E/RLS validation. Validated with
      `npx vitest --run src/app/routes/__tests__/communityLaunchScope.spec.ts src/config/__tests__/launchScope.spec.ts --reporter=dot`,
      focused eslint, and `npm run typecheck:app`.
- [x] Keep `communityAlerts` and `communityIssues` paused in `launchScope`
      until E2E and RLS validation cover the full moderation workflow.
- [x] Remove or archive unused quick-action/composer alert/issue components once
      the launch scope decision is final.
- [x] Removed unused `QuickAccessButtons` and `PanicAlertButton` after confirming
      no active imports remained. Composer alert/issue modals were kept because
      active gated paths still reference them through `UnifiedComposer`,
      `IssueFeedSection`, and paused issue routes. Validated with
      `rg -n "QuickAccessButtons|PanicAlertButton" src -g "*.ts" -g "*.tsx"`
      returning no matches and `npm run typecheck:app`.

## 9. Phase 5 - UI and Navigation Cleanup

Public surfaces:

- [x] Business page shows public actions first.
- [x] Gastronomy page keeps public order/cart/checkout flow when enabled.
- [x] Education and services use public module URLs.
- [x] Classifieds use public marketplace URLs.
- [x] Community-only CTAs are secondary and clearly labeled.

Community portal:

- [x] Portal header or visual state makes community mode obvious.
- [x] Community entity pages show resident actions only when policy allows.
- [x] Blocked actions show clear login/address/verification CTA.
- [x] Add "ver no site publico" or equivalent escape route where useful.
- [x] Avoid duplicated cards and sections between public and community mode.

Responsive:

- [x] Verify 360px mobile.
- [x] Verify 768px tablet.
- [x] Verify 1366px desktop.
- [x] Verify 1920px desktop.
- [x] No horizontal overflow.

Validation run:

- [x] `npm run test:e2e:mobile-core-layout` passed on 2026-07-05 (`12/12`).
- [x] `npx playwright test tests/e2e/mobile-core-layout.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`15/15`) after adding 768px tablet coverage for
      `/`, `/servicos/ba/salvador/complexo-do-nordeste-de-amaralina`, and
      `/gastronomia/ba/salvador`.
- [x] `npm run test:e2e:mobile-auth-dashboards` passed on 2026-07-05
      (`13/13`).
- [x] `npm run validate:mobile:phase` timed out at the wrapper level after
      5 minutes with `EPIPE`, but both Playwright suites passed when run
      separately. Superseded by the 2026-07-06 direct Playwright passes below.
- [x] Business listing cards are semantic `article`s with a separate open
      action and independent favorite button; the main search input now uses
      the `searchbox` role via `type="search"`.
- [x] Public Empresas landing was visually checked on 2026-07-05 at
      `360x780`, `1366x768`, and `1920x1080` against
      `/empresas/ba/salvador/nordeste-de-amaralina`; no horizontal overflow
      was detected, the mobile stats label no longer clips, and the desktop
      hero aside was compacted so category/product sections are visible sooner.
- [x] Public company detail was visually checked on 2026-07-05 at `360x780`,
      `1366x768`, and `1920x1080` against
      `/empresas/ba/salvador/complexo-do-nordeste-de-amaralina/tone-cos-loja`;
      no horizontal overflow was detected, the desktop page fits the viewport,
      and the duplicated "Esta e a sua empresa?" claim card was removed from
      the short desktop sidebar because the hero already owns that CTA.
      The 1920px row layout for "Empresas proximas" was also adjusted so
      "Ver todas" no longer collides with the section title.
- [x] In-app Browser connection failed during the 2026-07-05 visual pass with
      a local runtime asset-path error, so viewport evidence for this pass was
      captured with Playwright fallback. Superseded by the 2026-07-06
      Playwright visual/responsive pass.
- [x] Gastronomy public discovery links were realigned on 2026-07-06:
      landing restaurant cards, food catalog cards, favorite restaurant cards,
      and the sticky cart checkout CTA now use
      `GastronomyUrlService.getPublicDetailUrlFromTerritory(...)`, keeping
      menu/cart/checkout on `/gastronomia/:state/:city/:territory/:slug`
      instead of falling back to `/empresas/...`. Validated with focused
      typecheck, eslint, and Vitest route/gastronomy suites.
- [x] Education, services, and classifieds public URL contracts were locked on
      2026-07-06. `EducationUrlService` stays on public education module URLs,
      services discovery avoids community URL builders, and classifieds listing
      plus detail URLs stay on `/classificados/...` marketplace paths. Validated
      with `npx vitest --run src/core/routing/policies/__tests__/PublicModuleUrlContracts.spec.ts src/modules/business/education/services/__tests__/EducationUrlService.test.ts src/core/classifieds/services/__tests__/ClassifiedUrlService.spec.ts --reporter=dot`.
- [x] Community portal mode now has a persistent visual marker on both
      territorial and alias shells. `CommunityPortalModeBanner` identifies the
      active community context and exposes `Ver no site publico` back to the
      public territory URL. Validated with
      `npx vitest --run src/core/routing/components/__tests__/CommunityPortalModeBanner.spec.tsx src/core/routing/components/__tests__/CommunityAliasRoute.spec.tsx --reporter=dot`,
      focused eslint, and `npm run typecheck:app`.
- [x] Blocked community actions now have explicit, tested CTAs through the
      central `CommunityPortalGate`: visitors see `Entrar`, authenticated users
      without local residence see `Cadastrar endereco`, and unverified
      residents see `Verificar residencia`. Gate copy was normalized to clean
      ASCII text to avoid broken encoding in the UI. Validated with
      `npx vitest --run src/core/community/access/__tests__/CommunityPortalGate.spec.tsx src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts --reporter=dot`,
      focused eslint, and `npm run typecheck:app`.
- [x] Resident-only actions on active community pages are wired through the
      centralized access SSOT. A source contract now covers community feed,
      groups, recommendations, and lost/found pages, and asserts that feed
      actions/modals receive `communityAccess.can.*` flags instead of local
      ad hoc permission checks. Validated with
      `npx vitest --run src/core/community/access/__tests__/CommunityAccessWiring.spec.ts src/core/community/access/__tests__/CommunityPortalGate.spec.tsx src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts --reporter=dot`,
      focused eslint, and `npm run typecheck:app`.
- [x] Community CTAs on public surfaces are now labeled as portal entry points
      and the territorial landing CTA uses a secondary outline treatment.
      Labels now say `Abrir portal comunitario` or
      `Publicar no portal comunitario` instead of generic community entry copy.
      Validated with
      `npx vitest --run src/core/routing/policies/__tests__/CommunityCtaContracts.spec.ts --reporter=dot`,
      focused eslint, and `npm run typecheck:app`.

## 10. Phase 6 - SEO and Sitemap

Update:

- [x] `src/core/routing/seo/territorialSeoPolicy.ts`
- [x] `src/core/routing/seo/generateSitemap.ts`
- [x] `src/core/routing/components/CommunityTerritorialShell.tsx`
- [x] `src/app/pages/CidadeLandingPage.tsx`

Rules:

- [x] Public territory pages are indexable.
- [x] Public entity pages are indexable.
- [x] Community-scoped module pages canonicalize to public module pages.
- [x] Community feed/groups/issues/lost-found pages are `noindex, follow`
      unless explicitly approved as public previews.
- [x] Sitemap excludes private and legacy community entity URLs.

Tests:

- [x] Update `src/core/routing/seo/__tests__/TerritorialSEO.spec.ts`.
- [x] Update `src/core/routing/seo/__tests__/generateSitemap.spec.ts`.
- [x] Run `npm run test:e2e:seo`.
- [x] Run focused route/business/SEO suite after alias normalization
      (`54` tests passed on 2026-07-05).
- [x] Added explicit SEO policy coverage on 2026-07-06 for public entity
      detail pages (`/empresas/.../:slug` and `/gastronomia/.../:slug`) to
      assert `index, follow` and canonical self. Validated with
      `npx vitest --run src/core/routing/seo/__tests__/TerritorialSEO.spec.ts src/core/routing/seo/__tests__/generateSitemap.spec.ts src/modules/business/gastronomy/__tests__/GastronomySeoAudit.spec.ts`.

## 11. Phase 7 - Supabase, RLS, and Permission Audit

Audit:

- [x] `user_residences`
- [x] `profiles`
- [x] `business_data`
- [x] `territory_communities`
- [x] `community_public_aliases`
- [x] community posts/comments/reactions/reports/groups/alerts/issues/lost-found

Validate:

- [x] public reads expose only public fields;
- [x] community writes require authenticated profile;
- [x] verified-resident actions check canonical residence verification;
- [x] moderator/admin actions check explicit roles;
- [x] full resident addresses are never exposed on public surfaces;
- [x] `SECURITY DEFINER` RPCs validate ownership and return minimal payload.

Only add migrations if the audit proves a schema/RLS gap.

Validation run:

- [x] `npm run validate:migrations` passed on 2026-07-05. Coverage includes
      public tables without RLS, public views granted to anon/authenticated
      without `security_invoker`, and exposed mutating `SECURITY DEFINER` RPCs
      without auth guard.
- [x] `npx vitest --run src/modules/business/gastronomy/__tests__/GastronomySupabaseSecurityAudit.spec.ts`
      passed on 2026-07-05 for orders/delivery RPCs, public gastronomy views,
      engagement RPCs, active profile RPCs, and review mutation RPCs.
- [x] `npx vitest --run src/app/pages/__tests__/businessGastronomySeparation.spec.ts src/app/pages/__tests__/premiumBusinessSite.spec.ts src/modules/business/company/sections/__tests__/EmpresaGastronomiaPreviewSection.spec.tsx`
      passed on 2026-07-05 (`8/8`).
- [x] `npx playwright test tests/e2e/business-recommendation-operational.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-05 (`1/1`).
- [x] Added `supabase/migrations/20260706100000_harden_community_creation_residence_authorization.sql`
      on 2026-07-06 to require canonical verified residence before
      `create_community_alert` and `create_community_issue` create rows.
- [x] Added `supabase/migrations/20260706101000_harden_community_social_rls_author_checks.sql`
      on 2026-07-06 to add explicit `WITH CHECK` author/profile guards for
      community posts, comments, likes/reactions, groups, memberships, and
      lost/found updates.
- [x] `npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot`
      passed on 2026-07-06 (`5/5`) covering residence/privacy, profiles,
      business/community identity tables, public aliases, social write RLS,
      reports, and alert/issue RPC hardening.
- [x] `npm run validate:migrations` passed on 2026-07-06 after the RLS
      hardening migrations.
- [x] `npm run typecheck:app` passed on 2026-07-06 after the RLS hardening
      audit test and migrations.
- [x] `supabase db advisors --local --type security` could not run because the
      local Postgres service on `127.0.0.1:54322` was not running.
- [x] Retried `supabase db advisors --local --type security` on 2026-07-06;
      it still failed because `127.0.0.1:54322` refused the Postgres
      connection. This remains an environment prerequisite, not a code finding.
- [x] Confirmed the environment blocker on 2026-07-06: `supabase status`
      cannot inspect local containers because the Docker daemon/pipe is not
      available, and `docker` is not installed or not present in PATH for this
      shell. Remote advisor validation now uses `--linked`.
- [x] Confirmed on 2026-07-06 that `docker.exe` is not available in PATH or
      under the standard `C:\Program Files` / `C:\Program Files (x86)` install
      locations visible to this shell. As a local fallback, reran
      `npm run validate:migrations`,
      `npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot`,
      `npm run validate:architecture:governance`, and
      `npm run validate:docs-structure`; all passed.
- [x] `supabase db advisors --linked --type security --fail-on none` ran
      against the linked remote project on 2026-07-06. It reported 519 total
      security findings: 19 `security_definer_view` errors, 1
      `rls_disabled_in_public` error on extension table `spatial_ref_sys`, and
      warnings for mutable function `search_path`, executable security-definer
      functions, always-true RLS policies, public bucket listing, extensions in
      `public`, and leaked-password protection.
- [x] Added
      `supabase/migrations/20260706102000_harden_remote_advisor_security_definer_views.sql`
      on 2026-07-06 to set all 19 advisor-reported application views to
      `security_invoker = true`. This is intentionally versioned as a migration
      instead of direct remote SQL.
- [x] `supabase migration list --linked` initially showed a broader
      local/remote migration drift starting before this task. The drift was
      reconciled on 2026-07-07 by recovering the 4 remote-only migration files,
      reviewing the 41 local-only migrations with dry-run, applying the batch
      to the linked remote, and revalidating
      `npm run validate:migrations:remote`.
- [x] Added
      `docs/audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md` with the
      linked advisor summary, fixed-in-branch coverage, and separate follow-up
      categories for PostGIS/extensions, always-true RLS policies, public
      bucket listing, and Auth leaked-password protection.
- [x] Added
      `supabase/migrations/20260706103000_harden_remote_advisor_always_true_rls_subset.sql`
      on 2026-07-06 to harden two remote advisor always-true RLS findings with
      clear ownership columns: `addresses.owner_user_id = auth.uid()` and
      `classified_reports.reporter_id` tied to the authenticated user's
      profile.
- [x] `npx vitest --run src/core/community/access/__tests__/CommunitySupabaseSecurityAudit.spec.ts --reporter=dot`
      passed on 2026-07-06 (`7/7`) after adding remote advisor RLS subset
      coverage.

## 12. Phase 8 - Physical Organization Cleanup

Target structure:

- [x] `src/core/routing/policies`
- [x] `src/core/routing/redirects`
- [x] `src/core/community/access`
- [x] keep public company detail under `src/modules/business/company`
- [x] keep gastronomy operations under `src/modules/business/gastronomy`
- [x] keep education under `src/modules/business/education`

Cleanup:

- [x] Remove obsolete barrels after imports migrate.
- [x] Remove dead wrappers around URL services.
- [x] Remove unused components after route replacement.
- [x] Confirm no module imports another module internals for routing.
- [x] Update architecture validation if needed.

Validation run:

- [x] Extracted legacy entity route decisions to
      `src/core/routing/redirects/LegacyEntityRedirectPolicy.ts` on
      2026-07-06 while preserving the existing `src/core/routing/policies`
      facade exports for compatibility.
- [x] `npx vitest --run src/core/routing/policies/__tests__/EntityUrlPolicy.spec.ts src/core/routing/components/__tests__/BusinessCanonicalRoute.spec.tsx src/core/routing/components/__tests__/CommunityEntityAliasRoute.spec.tsx --reporter=dot`
      passed on 2026-07-06 (`11/11`).
- [x] `npx eslint src/core/routing/policies/EntityUrlPolicy.ts src/core/routing/redirects/LegacyEntityRedirectPolicy.ts src/core/routing/redirects/index.ts`
      passed on 2026-07-06.
- [x] `npm run typecheck:app` passed on 2026-07-06 after the legacy route boundary
      extraction.
- [x] Moved the business landing quick-filter decision out of
      `src/app/pages/EmpresasLandingPage.tsx` into
      `src/app/features/business-landing/utils/businessHelpers.ts` on
      2026-07-06 after `validate:architecture:governance` flagged inline
      business logic.
- [x] `npm run validate:architecture:governance` passed on 2026-07-06.
- [x] `npx eslint src/app/pages/EmpresasLandingPage.tsx src/app/features/business-landing/utils/businessHelpers.ts`
      passed on 2026-07-06.
- [x] `npm run typecheck:app` passed on 2026-07-06 after the landing filter
      helper extraction.
- [x] `rg` verification on 2026-07-06 found no active runtime consumers for the
      removed community short routes or gastronomy preview/map wrappers; the
      remaining matches are docs and tests asserting absence.

## 13. Phase 9 - Documentation Cleanup

Update or archive:

- [x] `docs/ROTAS_PUBLICAS_CANONICAS.md`
- [x] `docs/TERRITORIAL_FOUNDATION.md`
- [x] `docs/IMPLEMENTACAO_IDENTIDADE_PUBLICA_CANONICA.md`
- [x] `docs/CONSOLIDACAO_FINAL_URLS_E_PERMISSOES.md`
- [x] `docs/DECISAO_ROTEAMENTO_TERRITORIAL.md`
- [x] `src/app/routes/README.md`
- [x] `docs/audits/PROJECT_INVENTORY.md`
- [x] `docs/audits/QUICK_WINS.md`
- [x] `docs/INDEX_CANONICO.md`
- [x] `docs/CURRENT_RULES.md`, only after implementation matches the new rule

Validation run:

- [x] Updated on 2026-07-06 after implementation and validation matched the
      new routing rule: public business/gastronomy entity pages stay public,
      community context is explicit, non-canonical community entity aliases
      fail visibly instead of redirecting, and verified residence gates
      community write actions.
- [x] `npm run validate:docs-structure` passed on 2026-07-06.
- [x] Follow-up cleanup on 2026-07-06 removed residual wording that still
      described short entity aliases as redirects, fixed the live-doc index
      link shape accepted by `validate:docs-live-links`, and revalidated
      docs/SSOT/hardcodes/typecheck.

Delete or archive any doc that still states:

- [x] `/:communitySlug/:slug` is the preferred public entity URL;
- [x] public business detail should redirect to community alias;
- [x] community route and public entity route are the same product surface.

## 14. Phase 10 - Test Matrix

Unit:

- [x] route policy tests
- [x] business URL service tests
- [x] business navigation tests
- [x] community access policy tests
- [x] SEO policy tests
- [x] sitemap tests

E2E:

- [x] public business detail from `/empresas`
- [x] public gastronomy detail and order entry when enabled
- [x] community portal visitor preview
- [x] community login/address gate
- [x] verified resident community actions
- [x] community-scoped business page actions
- [x] mobile public business page
- [x] mobile community portal page

Commands:

```bash
npm run typecheck:app
npm run lint
npm run validate:ssot
npm run validate:docs-live-links
npm run test:ssot:community
npm run test:e2e:community-territorial
npm run test:e2e:seo
npm run test:e2e:mobile
```

Validation run:

- [x] `npx playwright test tests/e2e/gastronomy-onboarding.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`1/1`). The spec creates a pizzaria, opens the
      public `/gastronomia/:state/:city/:territory/:slug` detail, favorites it,
      reopens it from `/gastronomia/favoritos`, adds a menu item to cart,
      enters checkout, creates a public order at `/gastronomia/pedidos/:orderId`,
      and verifies the merchant route can operate that same order.
- [x] `npx playwright test tests/e2e/community-territorial-operational.spec.ts tests/e2e/community-social-seo.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`6/6`). Coverage includes city community portal
      preview, feed/groups resolution, canonical community social URLs,
      `noindex` SEO for feed/groups, and paused education surface hiding in
      the community sidebar.
- [x] `npx playwright test tests/e2e/community-access-gate.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`2/2`). Coverage creates confirmed users through
      Supabase admin, verifies that an authenticated user without
      `user_residences` sees the address setup gate, and verifies that a user
      with a primary verified residence in the route territory reaches the
      member feed with post actions available. This pass also fixed
      `useCommunityAccess` so missing residence resolves to the address CTA
      without waiting indefinitely on rollout state that cannot change that
      decision.
- [x] `npx playwright test tests/e2e/community-territorial-operational.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`5/5`) after adding community-scoped business
      entity coverage. The new case opens
      `/comunidade/complexo-do-nordeste-de-amaralina/empresas/tone-cos-loja`,
      verifies the explicit community URL remains active, and verifies the
      `Ver no site publico` escape route. This pass also fixed the community
      business resolver so businesses attached directly to a territorial group
      path are accepted by that group's community alias route.
- [x] `npx playwright test tests/e2e/mobile-core-layout.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`17/17`) after adding 360px coverage for public
      business detail and community portal feed. The pass also fixed a serious
      mobile contrast violation in the shared `CanonicalHero` primary CTA.
- [x] `npx playwright test tests/e2e/mobile-core-layout.spec.ts --project=chromium --reporter=list`
      passed again on 2026-07-06 (`17/17`) after darkening the shared
      `CanonicalHero` primary CTA from `#0f766e` to `#0b5d56` to clear the
      remaining mobile axe contrast violation on `/gastronomia/ba/salvador`.
- [x] `npx playwright test tests/e2e/community-territorial-operational.spec.ts --project=chromium --reporter=list`
      passed on 2026-07-06 (`5/5`), including community-scoped business context
      and the explicit `Ver no site publico` escape route.

## 15. Final Audit Checklist

- [x] Public entity URLs do not silently enter community mode.
- [x] Community URLs are explicit and contextual.
- [x] Community-only actions use the access SSOT.
- [x] Legacy entity route decisions are isolated and tested without automatic
      redirects.
- [x] Docs match runtime.
- [x] No route helper has duplicated intent logic.
- [x] No dead community short entity component remains in active route stack.
- [x] SEO canonical and sitemap match the target route matrix.
- [x] Final audit route/access/SEO subset validated on 2026-07-06 with
      `npx vitest --run src/core/community/access/__tests__/CommunityAccessWiring.spec.ts src/core/community/access/__tests__/CommunityPortalGate.spec.tsx src/core/community/access/__tests__/CommunityAccessPolicy.spec.ts src/app/routes/__tests__/communityRoutesCanonical.spec.ts src/core/routing/seo/__tests__/TerritorialSEO.spec.ts src/core/routing/seo/__tests__/generateSitemap.spec.ts --reporter=dot`
      (`26/26`), focused eslint, and `npm run typecheck:app`.
- [x] Mobile and desktop flows pass visual review.
- [x] Security/RLS audit is versioned and actionable. Application
      `security_definer_view` errors are fixed remotely; remaining advisor
      work is tracked separately because it involves extension placement,
      `SECURITY DEFINER` execute grants, mutable `search_path`, and
      intentionally broad telemetry/audit RLS policies.

## 16. Completion Definition

This task is complete only when all of the following are true:

1. the target SSOT is implemented in code;
2. the old alias-first public entity behavior is removed from runtime;
3. community portal access is centrally gated;
4. stale documentation is updated, archived, or deleted;
5. all required tests and validation commands pass;
6. the final implementation report lists any remaining post-launch items
   explicitly as non-blocking.

## 17. Final Implementation Report

Status: implementation complete for code, routing, access gates, docs, RLS
hardening, and Playwright visual/responsive validation.

Delivered:

- Public entity routes stay public. Business and gastronomy canonical pages
  render under public module URLs and no longer silently enter community mode.
- Community context is explicit. Community-scoped entity pages retain the
  community URL and expose `Ver no site publico` where a public equivalent
  exists.
- Community-scoped entity pages now keep the explicit community URL on-screen
  while their SEO canonical, structured data, and breadcrumb target the public
  entity URL resolved by `BusinessUrlService`.
- Community-scoped entity pages now also emit `robots=noindex, follow` end to
  end, including the underlying business/gastronomy SEO components and the
  global app shell, so runtime head tags no longer leak `index, follow` on
  explicit community entity surfaces.
- `CidadeLandingPage` now derives city/community module URLs from one builder,
  preventing `.../feed/feed`, preserving `?action=publicar` on the community
  root, and keeping tourist-point navigation on the public territorial surface.
- `useTerritoryFilter` now treats explicit route territory as authoritative in
  public surfaces; user `bairro`/`cidade` mode only applies when no explicit
  territorial route is active.
- Public services and tourist-point surfaces now consume
  `useModuleTerritoryFilter` at the page boundary and inject the resolved
  `territoryFilter` into their list hooks, reducing the remaining URL-vs-user
  territory divergence in public discovery flows.
- `TerritorialLandingPage` now resolves its public discovery filter through
  `useModuleTerritoryFilter({ routeResolved })`, so the main territorial
  landing follows the same URL-first contract already enforced in business,
  gastronomy, services, and tourist-point public surfaces.
- `useModuleTerritoryFilter` now accepts `activeMemberIds` for grouped
  territories, so page-boundary URL-first resolution keeps rollout/member
  filtering semantics instead of widening grouped public surfaces back to all
  members.
- Community feed, gastronomy, classifieds, sellers, and jobs surfaces now pass
  `activeMemberIds` through their module territory resolution paths, including
  the paused territorial jobs entry point, so grouped public routes remain
  scoped to module-active members when those modules are enabled.
- Legacy community sidebar widgets now accept an injected `territoryFilter`
  from the page/sidebar boundary and only fall back to `useTerritoryFilter()`
  when rendered standalone, keeping route-owned territory out of leaf widgets.
- `EventosPage` and `ComunidadePage` now read their base territorial filter
  from `useModuleTerritoryFilter`, leaving `useTerritoryFilter` concentrated in
  compatibility hooks and explicitly user-scoped/community-internal flows.
- `MapaPageV4` now resolves territorial context via `useModuleTerritoryFilter`
  and treats `?lat=&lng=` focus-target URLs without an explicit territorial
  route as a separate map mode, so viewport highlighting no longer inherits an
  unrelated territorial filter just because the public map page also supports
  territorial browsing.
- Community access is centralized in `src/core/community/access`, including
  login, address, verified-residence, admin/moderator, and rollout decisions.
- Legacy community entity decisions are isolated in
  `src/core/routing/redirects` while `src/core/routing/policies` remains a
  compatibility facade for existing imports; non-canonical aliases return
  explicit NotFound instead of redirecting.
- Supabase/RLS hardening added verified-residence checks for community
  alerts/issues and explicit authenticated-profile author checks for community
  social writes.
- Documentation was aligned in `docs/CURRENT_RULES.md`,
  `docs/INDEX_CANONICO.md`, `docs/audits/PROJECT_INVENTORY.md`, and
  `docs/audits/QUICK_WINS.md`.

Validated:

- `npx vitest --run src/core/routing/policies/__tests__/EntityUrlPolicy.spec.ts src/core/routing/components/__tests__/BusinessCanonicalRoute.spec.tsx src/core/routing/components/__tests__/CommunityEntityAliasRoute.spec.tsx --reporter=dot`
- focused eslint for route policy, community entity alias route,
  business canonical route, and territorial URL helpers.
- `npx vitest --run src/app/pages/__tests__/territorialPublicSurfaceAudit.spec.ts src/core/location/hooks/useModuleTerritoryFilter.spec.tsx --reporter=dot`
- focused eslint for the territorial public-surface audit, community sidebar
  widgets, gastronomy, classifieds, jobs, and territorial module page files.
- `npm run validate:migrations`
- `npm run validate:architecture:governance`
- `npm run validate:ssot`
- `npm run validate:docs-structure`
- `npm run typecheck:app`
- Focused Vitest suites for routing, SEO, community access, business/gastronomy
  boundaries, and Supabase security audit.
- Playwright suites for gastronomy onboarding, community access gate,
  community territorial operations, community SEO/social routes, and mobile
  core layout.

Remote Supabase advisor status:

- The project uses the linked remote Supabase for advisor validation. The local
  advisor remains unavailable because this shell has no usable Docker
  CLI/daemon, but `supabase db advisors --linked --type security --fail-on none`
  ran successfully on 2026-07-06.
- The linked advisor reported 19 application `security_definer_view` errors and
  1 extension-table `rls_disabled_in_public` error on `spatial_ref_sys`, plus
  warnings. The 19 application view errors are addressed in
  `supabase/migrations/20260706102000_harden_remote_advisor_security_definer_views.sql`.
- A safe subset of remote advisor warnings is now covered by versioned
  migrations:
  `supabase/migrations/20260706103000_harden_remote_advisor_always_true_rls_subset.sql`
  tightens ownership checks for `addresses` and `classified_reports`, and
  `supabase/migrations/20260706104000_harden_public_storage_listing_policies.sql`
  removes broad public `storage.objects` listing policies for public media
  buckets while preserving known public object URL serving.
- The first reviewed `function_search_path_mutable` batch is covered by
  `supabase/migrations/20260706162154_harden_function_search_path_low_risk_subset.sql`,
  which pins `search_path = public, extensions, pg_temp` through `ALTER
  FUNCTION` without recreating function bodies or changing grants.
- Detailed advisor triage is recorded in
  `docs/audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md`.
- `supabase migration list --linked` is now synchronized after the 2026-07-07
  remote batch application. Added `npm run validate:migrations:remote` on
  2026-07-06 to make linked remote drift an explicit failing check instead of a
  manual-only review step. `npm run verify:deploy` now executes the local and
  remote migration checks and passed after the reconciliation.
- Post-sync linked advisor status on 2026-07-07: 160 findings remain. The 19
  application `security_definer_view` errors are gone; the remaining error is
  `public.spatial_ref_sys` without RLS. The remaining `public-assets` listing
  policy, all 22 remaining mutable `search_path` functions, and all remaining
  `rls_policy_always_true` findings were fixed in follow-up migrations.
  Dispatch audit writes now use explicit authorized RPCs instead of broad
  direct table write policies. Reviewed high-risk anonymous RPC grants,
  including `exec_sql`, billing/webhook helpers, cache helpers, session/admin
  helpers, and internal mutation helpers, were revoked or reduced to
  `authenticated`/`service_role`. Remaining warnings are dominated by public or
  authenticated `SECURITY DEFINER` function execute grants, 4 extensions in
  `public`, and leaked-password protection.
