# Community Page Concept Implementation Plan

Status: in progress
Last update: 2026-07-10

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
- [x] Added concept-style public header with logo, primary navigation, location, weather, notifications and account control in the same top row.
- [x] Added concept-aligned module navigation for `Visão geral`, `Discussões`, `Empresas`, `Classificados`, `Gastronomia`, `Serviços`, `Sobre`, and `Regras`, without promoting paused launch surfaces in the primary sidebar.
- [x] Replaced the old commercial shortcut row with a feed-first focus row while keeping `Empresas`, `Classificados`, `Gastronomia`, and `Serviços` available through canonical module navigation.
- [x] Reordered the first content columns to prioritize the composer/feed, `Grupos da comunidade`, `Discussões em alta`, and then commercial/support modules, matching the updated community concept.
- [x] Updated the community concept to feed-first: sidebar, mobile rail and focus shortcuts now prioritize `Feed`, `Grupos` and `Discussões` before commercial modules.
- [x] Tightened the feed-first hierarchy after concept review: desktop sidebar now shows participation actions instead of a large business ad block, and the right rail now carries `Grupos`, `Discussões`, `Próximos eventos`, and `Empresas úteis hoje` in one canonical stack without duplicated support panels.
- [x] Converted the mobile focus shortcuts into a horizontal rail before the main grid so the feed starts earlier without dropping `Feed`, `Grupos`, `Discussões`, `Achados`, or `Enquetes`.
- [x] Matched the approved desktop concept geometry at `1536x1024`: sidebar `230px`, hero `left=250 width=870 height=191`, right rail `left=1136 width=380`, and composer/feed starting immediately under the hero at `top=275`.
- [x] Moved the desktop focus navigation (`Feed`, `Grupos`, `Discussões`, `Achados`, `Enquetes`) into the hero block, removed the extra desktop module row, and kept full module navigation in the sidebar/mobile rail.
- [x] Added a dev-only visual fixture for concept QA at `?visualMock=community-concept`, isolated in `communityOverviewVisualFixture.ts`, without changing real route behavior or seeding fake Supabase data.
- [x] Removed the old first-fold `Membros em destaque` support panel from the primary column because the approved feed-first concept does not include that block above the feed.
- [x] Aligned composer controls with the concept: avatar visual, `Post`, `Foto`, `Enquete`, `Pergunta`, and `Recomendação`, still gated by the existing login/security handlers.
- [x] Wired `Grupos da comunidade` to the canonical `CommunityGroupsService` and `useCommunityUrls`, with real group detail URLs instead of local placeholder anchors.
- [x] Fixed `CommunityGroupsService.getGroupsPage(sortBy: "populares")` so it does not order by an aggregate alias that Supabase/PostgREST rejects at runtime.
- [x] Added `Discussões em alta` from the canonical public feed data, ranked only by real public interaction counters already present on posts.
- [x] Reorganized the desktop content grid so the feed is the primary column and groups/discussions/events/businesses are the right rail; member display remains withheld until a public consent/aggregate contract exists.
- [x] Fixed the community public header at small mobile widths so brand, city, weather, notification and account stay on the first row without overlap.
- [x] Unified community status policy for alias and canonical routes: public community surfaces render for every non-`inactive` status; `launching`, `coming_soon`, and `waiting_list` no longer replace the page with the interest screen automatically.
- [x] Updated canonical `/comunidade/:state/:city/:slug` resolution to try the public community alias/territory resolver first, then fall back to the generic territorial resolver, avoiding route divergence for `/comunidade/ba/salvador/pituba` vs `/comunidade/pituba`.
- [x] Removed the portal-mode banner from the public territorial shell so canonical and alias community pages render the same public surface without escape/redirect noise.
- [x] Added public mode with composer prompt, public feed cards, gated interaction actions, businesses, about, rules and sponsored ad slot.
- [x] Added privacy-safe blocks for members, events and albums so every concept area exists without fake private data.
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
- Albums block: rendered as a moderation-safe empty state until public media/gallery scope and rules are defined.
- Events module: full navigation, creation, favorites, participation and check-in remain gated by `events=false`; the community page only exposes the read-only `communityEventsPreview` surface.
- Community ranking: belongs to Home/discovery ranking; the community page should not invent a local gamification metric.

## Verification

- `npm run typecheck:app`
- `npx eslint src/core/community/components/page/CommunityOverviewSurface.tsx src/core/community/components/page/communityOverviewVisualFixture.ts src/core/community/hooks/feed/useCommunityFeed.ts`
- `npx eslint src/core/community/components/page/CommunityOverviewSurface.tsx`
- `npx eslint src/app/components/AppLayoutSidebar.tsx src/app/pages/CidadeLandingPage.tsx src/core/community/components/page/CommunityOverviewSurface.tsx src/core/routing/components/CommunityAliasShellRoute.tsx src/core/routing/components/__tests__/CommunityAliasRoute.spec.tsx`
- `npx eslint src/app/pages/CidadeLandingPage.tsx src/core/community/components/page/CommunityOverviewSurface.tsx`
- `npx vitest --run src/app/routes/__tests__/communityRoutesCanonical.spec.ts src/core/routing/components/__tests__/CommunityAliasRoute.spec.tsx --reporter=dot`
- Browser QA at `http://127.0.0.1:5174/comunidade/pituba` in the in-app browser mobile viewport.
- Browser QA confirmed `communityEventsPreview`: mobile showed `Agenda em leitura`, `#eventos` present and hero at about `281px` in a `555px` viewport.
- Browser QA confirmed desktop shell: header `60px`, sidebar `254px`, hero about `253px`, `#eventos` present and no framework overlay.
- Playwright QA confirmed updated feed-first desktop at `/comunidade/pituba`: hero about `221px`, `#feed` in the primary column, `#grupos` and `#discussoes` in the right rail, no runtime errors from the component.
- Playwright QA confirmed `/comunidade/ba/salvador/pituba` no longer falls back to the interest/coming-soon screen and no longer shows the portal-mode banner; it renders the same `community-first` surface with `#feed` and `#grupos`.
- Playwright QA confirmed updated mobile at `390x844`: no horizontal overflow, brand/actions header overlap is false, `Feed` renders before `Grupos` and `Discussões`.
- Playwright desktop QA at `1440x980` for `http://127.0.0.1:5174/comunidade/pituba`.
- Playwright DOM QA confirmed top nav labels, members/events/albums blocks, no legacy shell and no pre-launch placeholder copy.
- Browser DOM QA measured the compact hero at roughly `335px` in the in-app browser's narrow viewport; Playwright screenshots confirmed roughly `337px` at `555x760` and `323px` at `1440x900`.
- Playwright concept QA at `1536x1024` confirmed no cookie banner, no skeletons, no horizontal overflow, CTA `Participar da comunidade`, composer actions `Post` and `Pergunta`, hero `left=250 width=870 height=191`, feed `top=275`, and right rail `left=1136 width=380`.
- Playwright mobile QA at `390x844` confirmed no cookie banner, no skeletons, no horizontal overflow, and the feed composer remains reachable before the right-rail support modules.
- Pending current pass: visual fixture QA at `http://127.0.0.1:5174/comunidade/ba/salvador/pituba?visualMock=community-concept`.
