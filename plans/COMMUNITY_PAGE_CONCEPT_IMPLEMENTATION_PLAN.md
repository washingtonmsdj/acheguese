# Community Page Concept Implementation Plan

Status: implemented (contract-deferred items documented below)
Last update: 2026-07-13

## Goal

Implement the Community First community page concept as a real product surface, using canonical services and existing domain contracts. The page must not ship fake member counts, fake events, fake albums, fake rankings, or mock sponsored ads.

## Product Rules

- Community identity comes from `TerritorialCommunityProfile`.
- Territory scoping comes from `useModuleTerritoryFilter` and canonical `TerritoryFilter`.
- Public content can be discoverable; member actions remain gated by `useCommunityAccess`.
- Featured companies and counts come from `LandingFeaturedService`.
- Sponsored content comes from `AdDeliveryService` through `useAdDelivery`.
- Paused launch surfaces stay hidden or non-promoted.
- No public settings/moderation links for normal users.
- Visual mocks are allowed only as explicit development fixtures behind `?visualMock=community-concept`; production/runtime default must keep canonical Supabase services and honest empty states.

## Implemented

- [x] Added `CommunityOverviewSurface` as the reusable community overview layout.
- [x] Added concept-style hero with community title, status, territory label, description, real stats and CTAs.
- [x] Added concept-style public header with logo, primary navigation, location, notifications and account control in the same top row; weather was removed from headers after product review.
- [x] Added concept-aligned module navigation for `Visão geral`, `Discussões`, `Empresas`, `Classificados`, `Gastronomia` and `Serviços`, without promoting paused launch surfaces in the primary sidebar.
- [x] Replaced the old commercial shortcut row with a feed-first focus row while keeping `Empresas`, `Classificados`, `Gastronomia`, and `Serviços` available through canonical module navigation.
- [x] Reordered the first content columns to prioritize the composer/feed, `Grupos da comunidade`, `Discussões em alta`, and then commercial/support modules, matching the updated community concept.
- [x] Updated the final community hierarchy: `Feed` is the social aggregator; `Grupos` and `Discussões` live as previews inside it, while `Empresas`, `Serviços`, `Classificados` and `Gastronomia` are preview-first module views.
- [x] Tightened the feed-first hierarchy after concept review: the desktop right rail and the mobile block immediately after the composer carry limited `Grupos` and `Discussões` previews, without duplicating business discovery inside Feed.
- [x] Converted mobile navigation to `Feed`, `Empresas`, `Serviços` and `Seções`; secondary modules remain available on demand without exposing Grupos/Discussões as peer tabs.
- [x] Matched the approved desktop concept geometry at `1536x1024`: sidebar `230px`, hero `left=250 width=870 height=191`, right rail `left=1136 width=380`, and composer/feed starting immediately under the hero at `top=275`.
- [x] Aligned desktop focus navigation with the domain hierarchy (`Feed`, `Empresas`, `Serviços`, `Classificados`, `Gastronomia`) while keeping social discovery inside Feed.
- [x] Added a dev-only visual fixture for concept QA at `?visualMock=community-concept`, isolated in `communityOverviewVisualFixture.ts`, without changing real route behavior or seeding fake Supabase data.
- [x] Refined community typography and desktop density against the approved `1536x1024` concept: lighter sidebar/metadata weights, compact hero copy, flat feed tabs, avatar-led post hierarchy, type badges, compact social actions, and tighter desktop gaps while preserving mobile spacing.
- [x] Extended the visual fixture with typed author/avatar/title/summary fields and five interactive concept tabs, restricted to the explicit development mock query.
- [x] Corrected mobile hierarchy after visual review: hero reduced from about `302px` to `200px`, metrics consolidated into one row, duplicate focus shortcut rail removed below `sm`, and composer actions converted to a single horizontal rail so the feed starts around `570px` instead of below `670px` at `390x844`.
- [x] Consolidated public/member composer entry in `CommunityComposerEntry`: the page exposes one real text field and every format selector (`midia`, `pergunta`, `enquete`, events and other intents) remains inside the canonical creation modal.
- [x] Replaced the community mobile module overflow rail with three permanent primary destinations (`Feed`, `Empresas`, `Serviços`) plus an on-demand `Seções` menu for secondary modules.
- [x] Converted `CreatePostModal` to a mobile bottom sheet while preserving the centered desktop dialog; intent selection is collapsed by default and opens only through `Alterar tipo`.
- [x] Made authenticated feed sort controls collapsible on mobile through the existing filter control and permanently visible from `sm` upward.
- [x] Removed the unused legacy `CreatePostInput.tsx` composer after confirming it had no consumers.
- [x] Removed the old first-fold `Membros em destaque` support panel from the primary column because the approved feed-first concept does not include that block above the feed.
- [x] Removed exposed composer action buttons from the page after mobile UX review; clicking or focusing the single `Compartilhe algo` field opens `CreatePostModal`, which remains the only SSOT for post formats, validation and persistence.
- [x] Kept `Grupos` and `Discussões` as independent social views reached from previews inside Feed; their queries, permissions and complete views remain canonical and do not become business modules.
- [x] Added route-backed module previews through `?view=business|services|classifieds|gastronomy`; each preview is limited to four canonical records and its CTA opens the complete community-scoped module route without dismantling the shell.
- [x] Added an embedded presentation mode to the canonical `GruposPage`; group hooks, access gates, creation, membership, pagination and detail URLs remain shared with the standalone canonical route.
- [x] Added a dedicated discussion presentation to `CommunityFeed`, filtering only social/conversation post types while reusing the same feed service, action permissions and territorial filter.
- [x] Normalized the community header cascade so logo typography, location, notification, account and mobile menu controls stay aligned on the first row; the primary site navigation alone moves to row two when space is available.
- [x] Wired the main community landing composer to the canonical `CreatePostModal` for verified members, without route navigation; the modal is lazy-loaded and unauthenticated visitors remain protected by the existing access gate.
- [x] Prevented public fallback territory identifiers from reaching UUID-only descendant queries; `CidadeLandingPage` now prefers a persisted canonical location and otherwise keeps the fallback presentation local.
- [x] Routed landing imports to the canonical community UI entrypoints and removed the parallel `core/community-feed` reexport facade; the architecture validator now enforces the explicit public paths.
- [x] Wired `Grupos da comunidade` to the canonical `CommunityGroupsService` and `useCommunityUrls`, with real group detail URLs instead of local placeholder anchors.
- [x] Fixed `CommunityGroupsService.getGroupsPage(sortBy: "populares")` so it does not order by an aggregate alias that Supabase/PostgREST rejects at runtime.
- [x] Added `Discussões em alta` from the canonical public feed data, ranked only by real public interaction counters already present on posts.
- [x] Reorganized the desktop content grid so the feed is the primary column and groups/discussions/events/businesses are the right rail; member display remains withheld until a public consent/aggregate contract exists.
- [x] Fixed the community public header at small mobile widths so brand, city, notification, account and menu stay on the first row without overlap.
- [x] Added one reusable `PublicHeaderMobileMenu` for Home, City and Community headers; complete public navigation is collapsed below the desktop/tablet breakpoint while the bottom nav remains the primary mobile navigation.
- [x] Removed the unused parallel `AppBottomNav` and its stale `MOBILE_NAV_ITEMS`; `src/core/navigation/BottomNav.tsx` is now the only active mobile bottom-navigation implementation and resolves only canonical city/global URLs, never community-local module URLs.
- [x] Standardized navigation typography on the project font SSOT: `DM Sans` for interface/navigation and `Space Grotesk` for brand/display text.
- [x] Removed temperature from Home and Community headers and eliminated the unused Home weather request/cache; city weather remains only in the city content metadata.
- [x] Normalized the mobile primary controls (`Feed`, `Empresas`, `Serviços`, `Seções`) with one typography/geometry contract: vertical icon-label layout below `480px`, horizontal layout when space is sufficient, and no label/icon overflow from `320px` upward.
- [x] Replaced the concept-only `Em alta`/`Perguntas` feed tabs with typed `Grupos`/`Discussões` destinations. They switch the primary content inside the persistent shell, while every real group row opens its canonical group detail route.
- [x] Unified community status policy for alias and canonical routes: public community surfaces render for every non-`inactive` status; `launching`, `coming_soon`, and `waiting_list` no longer replace the page with the interest screen automatically.
- [x] Made the persistent mobile Sections menu close after selecting a module, preventing the expanded menu from covering the newly loaded content.
- [x] Added accessible SPA hash navigation for Events: cross-module links return to the community overview, scroll to the canonical panel and move focus without remounting the shell.
- [x] Replaced the stale per-page mobile header menus with `publicHeaderNavigation.ts`, the launch-gated SSOT used by Home and City and by contextual desktop navigation. Community mobile intentionally omits the hamburger because it duplicates Sections and the bottom nav; Sections owns community-local content and the bottom nav owns global destinations.
- [x] Updated canonical `/comunidade/:state/:city/:slug` resolution to try the public community alias/territory resolver first, then fall back to the generic territorial resolver, avoiding route divergence for `/comunidade/ba/salvador/pituba` vs `/comunidade/pituba`.
- [x] Removed the portal-mode banner from the public territorial shell so canonical and alias community pages render the same public surface without escape/redirect noise.
- [x] Removed the redundant `Sobre`, `Álbuns da comunidade` and `Regras da comunidade` overview panels, together with their local navigation items. Community conduct now lives only in the canonical Terms of Use document.
- [x] Added public mode with composer prompt, public feed cards, gated interaction actions, businesses and sponsored ad slot.
- [x] Consolidated community guidelines into `/termos#diretrizes-da-comunidade`, added versioned mandatory acceptance to self-service signup, server-side rejection for email/phone signup without the current acceptance, server-side recording on `auth.users` creation, and an explicit post-provider acceptance screen for Google OAuth.
- [x] Kept member and event panels privacy-safe, without promoting a gallery surface before its public-media contract exists.
- [x] Added a dedicated `communityEventsPreview` launch surface for read-only community event previews while the full `events` module remains paused.
- [x] Wired `PrÃ³ximos eventos` to the canonical `EventRuntimeService.getEventsPage` with territory filtering, public `upcoming/ongoing` scope and no create/join/check-in actions.
- [x] Added member mode that wraps the existing `CommunityFeed` instead of replacing its action/security contracts.
- [x] Added the concept section title to the real logged-in `CommunityFeed`, preserving existing composer, filters and permission checks.
- [x] Removed the previous inline public feed layout from `ComunidadePage`.
- [x] Wired `/comunidade/:alias` and community-mode `CidadeLandingPage` to the same `CommunityOverviewSurface`.
- [x] Removed legacy alias banner and global app shell chrome from public community alias pages.
- [x] Fixed mobile duplication by keeping one module rail on small screens and desktop tabs below the hero.
- [x] Ignored generic pre-launch community copy (`cadastre interesse`, `esta chegando`, `em breve`) in the overview so the page uses a stable public description.
- [x] Reduced the community hero height on desktop and mobile/tablet without removing concept content: identity, CTAs and stats remain visible, but the next content section appears earlier in the first viewport.
- [x] Reworked desktop fidelity to the approved concept: full-width app-shell layout, sidebar at `254px`, hero starting immediately beside the sidebar, compact `~268px` hero height, tall thumbnail, inline desktop stats and `Participar`/`Compartilhar` CTAs.
- [x] Tightened the hero after visual review: desktop hero now measures about `253px`; the active `555px` browser viewport dropped from `338px` to about `281px` without hiding the concept content.
- [x] Added desktop/mobile visual QA for `/comunidade/pituba`.
- [x] Kept login, posting, comment, reaction, save, report and group permissions in the existing page/access flow.
- [x] Verified `npm run typecheck:app`.
- [x] Verified focused lint for edited route/layout/community files.
- [x] Verified focused route tests for community alias and route SSOT.

## Deferred By Contract

- Members block: rendered as a privacy-safe empty state until there is a public aggregate/consent contract.
- Albums: intentionally omitted from the community overview until a public media/gallery scope and rules are defined.
- Events module: full navigation, creation, favorites, participation and check-in remain gated by `events=false`; the community page only exposes the read-only `communityEventsPreview` surface.
- Community ranking: belongs to Home/discovery ranking; the community page should not invent a local gamification metric.

## Verification

- `npm run typecheck:app`
- `npx eslint src/core/community/components/page/CommunityOverviewSurface.tsx src/core/community/components/page/communityOverviewVisualFixture.ts src/core/community/hooks/feed/useCommunityFeed.ts`
- `npx eslint src/core/community/components/page/CommunityOverviewSurface.tsx`
- `npx eslint src/app/components/AppLayoutSidebar.tsx src/app/pages/CidadeLandingPage.tsx src/core/community/components/page/CommunityOverviewSurface.tsx src/core/routing/components/CommunityAliasShellRoute.tsx src/core/routing/components/__tests__/CommunityAliasShellRoute.spec.tsx`
- `npx eslint src/app/pages/CidadeLandingPage.tsx src/core/community/components/page/CommunityOverviewSurface.tsx`
- `npx vitest --run src/app/routes/__tests__/communityRoutesCanonical.spec.ts src/core/routing/components/__tests__/CommunityAliasShellRoute.spec.tsx --reporter=dot`
- Browser QA at `http://127.0.0.1:5174/comunidade/pituba` in the in-app browser mobile viewport.
- Browser QA confirmed `communityEventsPreview`: mobile showed `Agenda em leitura`, `#eventos` present and hero at about `281px` in a `555px` viewport.
- Browser QA confirmed desktop shell: header `60px`, sidebar `254px`, hero about `253px`, `#eventos` present and no framework overlay.
- Playwright QA confirmed updated feed-first desktop at `/comunidade/pituba`: hero about `221px`, `#feed` in the primary column, `#grupos` and `#discussoes` in the right rail, no runtime errors from the component.
- Playwright QA confirmed `/comunidade/ba/salvador/pituba` no longer falls back to the interest/coming-soon screen and no longer shows the portal-mode banner; it renders the same `community-first` surface with `#feed` and `#grupos`.
- Playwright QA confirms updated mobile at `390x844`: no horizontal overflow, Feed exposes compact Grupos/Discussões previews after the composer, and module previews show a bounded list plus one explicit complete-module CTA.
- Playwright desktop QA at `1440x980` for `http://127.0.0.1:5174/comunidade/pituba`.
- Playwright DOM QA confirmed top-nav labels, members/events blocks, no legacy shell and no pre-launch placeholder copy.
- Browser DOM QA measured the compact hero at roughly `335px` in the in-app browser's narrow viewport; Playwright screenshots confirmed roughly `337px` at `555x760` and `323px` at `1440x900`.
- Playwright concept QA at `1536x1024` confirmed no cookie banner, no skeletons, no horizontal overflow, CTA `Participar da comunidade`, hero `left=250 width=870 height=191`, feed `top=275`, and right rail `left=1136 width=380`.
- Playwright mobile QA at `390x844` confirmed no cookie banner, no skeletons, no horizontal overflow, and the feed composer remains reachable before the right-rail support modules.
- Playwright QA at `390x844` confirmed header/brand actions aligned with no overlap, hero at about `200px`, one real composer input, zero exposed composer action buttons, no horizontal overflow, and in-place switching among Feed, Groups and Discussions.
- Playwright QA at `1440x980` confirmed a `60px` header, aligned brand/actions, no overlap or horizontal overflow, `191px` desktop hero and in-place view switching.
- Browser console QA passed with zero errors after preventing fallback territory IDs from reaching UUID-only queries.
- Direct `/feed` QA confirmed the URL remains byte-for-byte unchanged while switching to Groups and Discussions.
- `npx vitest --run src/core/community/components/composer/CommunityComposerEntry.spec.tsx src/core/community/components/page/CommunityOverviewSurface.spec.tsx src/core/routing/utils/__tests__/territoryUrls.spec.ts`: `15 passed`.
- `npm run test:ssot:community`: `11 passed`.
- `npm run typecheck:app`, focused lint, security lint, `npm run security:validate`, `npm run validate:ssot`, `npm run validate:architecture:community`, `npm run validate:architecture:incremental`, docs validators and `npm run build`: passed.
- Responsive browser matrix passed at `320`, `360`, `390`, `768`, `1024` and `1366` px for Home, Community and City: no horizontal overflow, no header weather, correct mobile-menu visibility and stable bottom nav.
- `npm run test:e2e:mobile-core-layout`: `18 passed`, including the permanent `320px` header/font/bottom-nav contract and serious Axe checks.
- Community primary-nav browser QA passed at `320`, `360`, `390`, `430`, `480`, `519`, `520`, `560`, `640`, `768`, `1024` and `1366px`: no page overflow, no header overlap, complete labels and every icon/text box contained by its button.
- Persistent-shell QA confirms Businesses -> Events focuses `#eventos` without replacing the header, and mobile Sections closes after navigating from Businesses to Services.
- Mobile navigation QA confirms the eight-item launch-enabled global menu on Home at `320px`; Community at `390px` confirms no hamburger, a working local Sections control and a visible global bottom nav without overflow.
