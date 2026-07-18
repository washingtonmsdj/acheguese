# Community Persistent Shell Implementation Plan

Status: implemented
Last update: 2026-07-12

## Goal

Make the community the persistent product context for every community-scoped module. Navigating between Feed, Groups, Discussions, Businesses, Classifieds, Gastronomy and Services must preserve the canonical community header, identity, sidebar and mobile navigation while replacing only the module content region.

## Architecture Contract

- Community URLs remain route-backed and deep-linkable: `/comunidade/:state/:city/:community/:module`.
- Browser history, refresh, SEO metadata and direct access must keep working; module selection is not local-only state.
- `CidadeLandingPage` and `CommunityOverviewSurface` remain the canonical community chrome during this migration.
- Each domain page remains the SSOT for its own queries, filters, permissions and entity links.
- Domain pages expose an explicit embedded presentation contract; community chrome is never hidden through CSS selectors.
- Independent discovery routes such as `/empresas` remain valid and keep their standalone presentation.
- RLS, territorial filters and existing service boundaries are unchanged by the visual composition.
- Mobile keeps compact community identity and navigation; module content must not repeat a large hero or global footer.

## Scope

- [x] Add a route-backed embedded content slot to the canonical community surface.
- [x] Preserve the selected module state in desktop sidebar, hero navigation and mobile controls.
- [x] Embed the canonical Businesses page without its standalone/community duplicate chrome.
- [x] Embed the canonical Classifieds page without its standalone/community duplicate chrome.
- [x] Embed the canonical Gastronomy page without its standalone/community duplicate chrome.
- [x] Embed the canonical Services page without its standalone/community duplicate chrome.
- [x] Embed the canonical Map page without a second community hero.
- [x] Keep Feed, Groups and Discussions using their existing canonical services and permissions.
- [x] Keep one route-parent shell mounted while nested module routes replace only the content outlet.
- [x] Keep launch-paused modules out of the sidebar while exposing the enabled Events preview.
- [x] Verify direct access, refresh, browser back/forward and community alias/canonical URLs.
- [x] Verify responsive behavior at 320, 390, 768, 1024, 1366 and 1536 CSS pixels.
- [x] Update status and architecture documentation after verification.

## Acceptance Criteria

1. Clicking a community module changes the URL and content without visually leaving the community.
2. The community header, compact hero and navigation remain present and aligned.
3. No module renders a second header, community hero, module tab strip or footer inside the content slot.
4. Standalone module URLs retain their current complete layout.
5. The active module is announced through navigation state and is keyboard accessible.
6. Module data continues to use canonical territorial filters and existing Supabase/RLS-backed services.
7. There is no duplicated query/service implementation introduced for community presentation.
8. Lint, typecheck, focused tests and production build pass.

## Non-Goals

- Combining independent domain entities into a community-owned database table.
- Replacing route navigation with a single local state page.
- Rewriting module services, RLS policies or domain repositories.
- Enabling launch-paused modules without their product and security contracts.

## Rollback Boundary

The change is isolated to presentation composition and route wrappers. Domain service contracts and persisted data are not migrated, so rollback does not require database changes.

## Implemented Result

- `CommunityOverviewSurface` owns the persistent community chrome and exposes a typed active section contract.
- `CidadeLandingPage` accepts canonical route content without creating a second community layout.
- Canonical and alias community URLs share one parent route shell with nested module routes; route changes replace only the outlet below `CommunityPersistentPortalLayout`.
- The module loading boundary lives inside the content slot, so a cold lazy import does not replace the community chrome with a full-page loader.
- Businesses, Services, Classifieds and Gastronomy expose an explicit `embedded` presentation while keeping their standalone presentation unchanged.
- Map exposes the same explicit presentation contract and omits its duplicate standalone hero when embedded.
- The global app shell is suppressed for every public community route, eliminating the duplicate mobile header.
- In embedded mode, non-visible city/community support queries are disabled; only canonical territorial and active module data is loaded.
- Active route links expose `aria-current="page"`; mobile secondary sections expose the active state through the compact Sections control.
- Cross-module anchor links restore the overview and focus the requested canonical section; the persistent mobile Sections menu closes after navigation instead of leaking open state into the destination module.
- Community mobile does not render a header hamburger: the community-local Sections control and the global bottom nav cover the two navigation levels without duplicate Businesses, Classifieds, Services or Map entries.
- The bottom nav is strictly city/global (`Inicio`, `Explorar`, `Bairro`, `Busca`, `Mais`); its overflow opens city-level Businesses, Gastronomy, Services, Classifieds and Map, so it cannot duplicate or bypass the community-local Sections contract.
- The launch sidebar contains Feed, Businesses, Services, Classifieds, Gastronomy, Map, Events preview, About and Rules. Groups and Discussions are in-place feed contexts, while Posts remains free of duplicated group or discussion previews; paused modules remain absent until their launch gates are enabled.
- Preview selection is URL-backed (`?view=`), replaces only the primary content region and never substitutes a domain module implementation. `Ver todas` opens the existing nested module route inside the same persistent shell.

### Follow-up: feed context tabs (2026-07-13)

- `Posts`, `Grupos` and `Discussões` are feed-context controls, not module
  navigation. Selecting Groups or Discussions preserves the current URL, hero,
  sidebar and persistent shell while replacing only the content beneath the
  composer.
- Posts contains only the composer, post ordering and post stream. Group and
  discussion previews are not duplicated in the mobile or desktop post view;
  each collection is rendered only in its own context tab.
- Post ordering is local to Posts and uses the canonical options `Melhores`,
  `Recentes` and `Comentados`, with no route mutation.
- The complete groups route remains canonical and deep-linkable. It is reached
  only through the explicit `Ver todos` link, never as a side effect of a feed
  context tab click.
- Group data is queried only while the Groups context is active (or on the
  direct canonical route); no client-side duplicate query or redirect was
  introduced.

## Verification

- `npm run typecheck:app`
- Focused ESLint for every edited implementation file
- `npx vitest --run src/core/community/components/page/CommunityOverviewSurface.spec.tsx src/app/routes/__tests__/communityRoutesCanonical.spec.ts src/app/routes/__tests__/communityLaunchScope.spec.ts src/core/routing/components/__tests__/CommunityAliasShellRoute.spec.tsx` (12 tests)
- `npx playwright test tests/e2e/community-persistent-shell.spec.ts --project=chromium`
- The Playwright contract verifies eight scenarios, including preview-first navigation, DOM identity across module navigation, zero document navigation for the public alias, Map embedding, browser history and the responsive width matrix.
- The same contract verifies accessible `#eventos` focus after cross-module navigation and automatic mobile Sections-menu dismissal.
- `npx vitest --run src/core/community/components/page/CommunityOverviewSurface.spec.tsx` (6 tests), including the no-route-change contract for contextual Groups and Discussions.
- `npx playwright test tests/e2e/community-persistent-shell.spec.ts --project=chromium --reporter=list` (8 tests), including unchanged URL for contextual tabs and the explicit `/grupos` destination for `Ver todos`.
- Community regression from `tests/e2e/mobile-core-layout.spec.ts` at 360px
- `npm run validate:architecture:community`
- `npm run validate:url:ssot`
- `npm run security:validate`
- `npm run build`
