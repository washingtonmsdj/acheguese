# Community Portal and Public Entity Routing SSOT

Status: target architecture for implementation  
Date: 2026-07-05  
Owner: routing, community, business, SEO, auth/security  
Related task plan: `docs/tasks/TASK_COMMUNITY_PORTAL_ROUTING_CLEANUP.md`

This document defines the target architecture for separating the public site from
the community portal. It intentionally does not describe the current runtime as
correct. The current runtime still contains legacy rules that route public
entities through community aliases.

## 1. Official Decision

The public site and the community portal are separate contexts.

The public site is the default surface for:

1. businesses;
2. gastronomy;
3. education;
4. services;
5. classifieds;
6. public search;
7. city, district, and territorial group landing pages;
8. public SEO entry points.

The community portal is a contextual and permissioned surface for:

1. local feed;
2. resident groups;
3. community posts and comments;
4. local issues;
5. lost and found;
6. resident recommendations;
7. community alerts;
8. community-specific actions on public entities.

Public entity URLs must not automatically canonicalize into the community
portal. A public business remains public even if it belongs to a district,
territorial group, or community alias.

## 2. Non-Negotiable Rules

1. Public entity canonical URLs remain outside the community context.
2. Community URLs are generated only when the user is inside the community
   portal or the feature is inherently community-only.
3. Community-only actions must pass through a single access policy.
4. No component, page, or hook may decide URL intent ad hoc.
5. Legacy redirects must be isolated in routing redirect components, not mixed
   into domain services.
6. SEO canonical for community-scoped entity pages points to the public entity
   canonical URL.
7. Direct community links may open a portal/preview, but restricted actions
   require login and, when needed, verified residence.
8. Documentation that contradicts this SSOT must be updated, archived, or
   deleted during the cleanup task.

## 3. Vocabulary

| Term | Meaning |
|---|---|
| Public site | Default Achegue-se experience for open content and SEO. |
| Public entity | A business, restaurant, school, service provider, classified, or similar public record. |
| Community portal | A contextual area for residents and local interactions. |
| Community-scoped entity | A public entity viewed from inside a community portal with community actions enabled. |
| Canonical public URL | The URL search engines and external shares should prefer for a public entity. |
| Legacy alias | A route kept temporarily only to preserve old inbound links. |
| Verified resident | A user with an approved residence tied to the relevant territory. |

## 4. Route Intent Model

Every route builder and navigation call must declare intent.

```ts
export type PublicUrlIntent =
  | "public_module"
  | "public_entity"
  | "community_portal"
  | "community_scoped_entity"
  | "private_operation";
```

Target files:

1. `src/core/routing/policies/PublicRoutePolicy.ts`
2. `src/core/routing/policies/CommunityRoutePolicy.ts`
3. `src/core/routing/policies/EntityUrlPolicy.ts`
4. `src/core/routing/config/territorialRoutePatterns.ts`

The policy layer is the only place allowed to decide whether an entity URL is
public, community-scoped, private, or legacy.

## 5. Canonical Route Matrix

| Surface | Canonical target | Community scoped target | Legacy treatment |
|---|---|---|---|
| Business detail | `/empresas/:state/:city/:territory/:slug` | `/comunidade/:alias/empresas/:slug` | Old community short entity routes are not emitted and fail visibly when non-canonical. |
| Gastronomy detail | `/gastronomia/:state/:city/:territory/:slug` or public company detail when gastronomy is not a separate detail surface | `/comunidade/:alias/gastronomia/:slug` | Old detail routes resolve to canonical public entity. |
| Education detail | `/educacao/:state/:city/:territory/:slug` | `/comunidade/:alias/educacao/:slug`, only if community action exists | No automatic community redirect. |
| Services detail | `/servicos/:state/:city/:territory/:slug` | `/comunidade/:alias/servicos/:slug`, only if community action exists | No automatic community redirect. |
| Classified detail | `/classificados/:id` or the existing classified canonical route | `/comunidade/:alias/classificados/:id`, only if community posting context exists | No automatic community redirect. |
| Community home | `/comunidade/:alias` | same | Public preview allowed. |
| Community feed | `/comunidade/:alias/feed` | same | Requires access policy. |
| Community groups | `/comunidade/:alias/grupos` | same | Requires access policy. |
| Community issue | `/comunidade/:alias/problemas` | same | Requires access policy. |

The naked pattern `/:communitySlug/:businessSlug` must not be a canonical public
entity URL. It is ambiguous and does not scale across modules, cities, brands,
campaigns, and future public pages.

## 6. Public Entity URL Policy

Public business-like entities use public module namespaces.

Examples:

```txt
/empresas/sp/sao-jose-dos-campos/jardim-aquarius/tone-pizzaria
/gastronomia/sp/sao-jose-dos-campos/jardim-aquarius/tone-pizzaria
/educacao/sp/sao-jose-dos-campos/jardim-aquarius/escola-x
```

Rules:

1. Cards on public surfaces generate public URLs.
2. Search results generate public URLs.
3. SEO metadata uses public URLs.
4. External share buttons use public URLs.
5. Premium mini-sites remain separate when the product explicitly chooses
   `/p/:slug`; premium does not replace the public canonical entity.

## 7. Community Portal URL Policy

Community URLs are generated only from community context.

Examples:

```txt
/comunidade/complexo-do-nordeste-de-amaralina
/comunidade/complexo-do-nordeste-de-amaralina/feed
/comunidade/complexo-do-nordeste-de-amaralina/empresas/tone-pizzaria
```

Rules:

1. Entering the community is explicit.
2. The header, navigation, copy, and available actions must make community mode
   visible.
3. Community-scoped entity pages may show extra actions such as recommend to
   neighbors, comment as resident, report local issue, and see related posts.
4. Community-scoped entity pages must not replace the public canonical entity
   in SEO.
5. A direct community portal URL may show a public preview, but restricted
   actions remain gated.

## 8. Access Policy

Create a single policy contract for community access.

```ts
export type CommunityAccessLevel =
  | "public_preview"
  | "authenticated"
  | "resident"
  | "verified_resident"
  | "moderator"
  | "admin";
```

Access states:

| State | Allowed | Blocked |
|---|---|---|
| Visitor | Preview, public landing, sign-in CTA | post, comment, join group, report local issue |
| Authenticated without address | Profile setup CTA, preview | local actions |
| Resident not verified | Limited read, verification CTA | sensitive actions if policy requires verification |
| Verified resident | Full resident actions in the territory | admin/moderation actions |
| Moderator/admin | Moderation, audit, escalation | actions outside assigned privileges |

Target files:

1. `src/core/community/access/CommunityAccessPolicy.ts`
2. `src/core/community/access/useCommunityAccess.ts`
3. `src/core/community/access/CommunityPortalGate.tsx`

The existing `CommunityRolloutGate` may be replaced or reduced to an internal
implementation detail after the new access policy exists.

## 9. Module Behavior Matrix

| Module | Public site behavior | Community behavior |
|---|---|---|
| Businesses | Public listing, public detail, SEO, contact actions | Same entity with resident actions and local context. |
| Gastronomy | Public discovery, menu, cart, checkout, orders when enabled | Community recommendations and local discussions only when relevant. |
| Education | Public institution profile, leads, programs | Resident recommendations, local questions, neighborhood signals. |
| Services | Public professionals and service requests | Resident recommendations and trusted local referrals. |
| Classifieds | Public marketplace flow | Community posting context and resident trust signals. |
| Community feed | Not part of public entity navigation | Portal-only, gated by policy. |
| Local issues | Not part of public entity navigation | Portal-only, gated by policy. |

## 10. Physical Organization Target

Target structure:

```txt
src/core/routing/
  config/
  guards/
  policies/
  redirects/
  seo/
  services/
  utils/

src/core/community/
  access/
  moderation/
  services/
  hooks/
  pages/
  components/

src/modules/business/
  company/
  gastronomy/
  education/
  public/
  premium/
  shared/

src/app/routes/
  sections/
  territorial/
  redirects/
```

Ownership rules:

1. `src/app/routes` composes routes only.
2. `src/core/routing` owns route patterns, canonical URLs, redirects, SEO
   policy, and navigation intent.
3. `src/core/community` owns community access, resident actions, moderation,
   feed, and community-specific UI.
4. `src/modules/business/company` owns the default public company page.
5. `src/modules/business/gastronomy` owns menu, cart, checkout, orders, and
   gastronomy operations.
6. `src/modules/business/education` owns education-specific product flows.
7. Business domain services must not decide community access.

## 11. Legacy Cleanup Map

The cleanup task must inspect and update these runtime areas:

1. `src/core/routing/components/BusinessCanonicalRoute.tsx`
2. `src/core/routing/components/CommunityShortEntityRoute.tsx`
3. `src/core/routing/components/CommunityShortAliasShellRoute.tsx`
4. `src/core/routing/components/CommunityAliasRoute.tsx`
5. `src/core/routing/services/CommunityBusinessEntityResolver.ts`
6. `src/core/business/services/BusinessUrlService.ts`
7. `src/core/business/hooks/useBusinessNavigation.ts`
8. `src/core/business/hooks/useBusinessUrls.ts`
9. `src/core/business/hooks/useResolvedBusinessPublicUrl.ts`
10. `src/app/pages/EmpresaDetailLandingPage.tsx`
11. `src/core/verticals/gastronomy/services/GastronomyUrlService.ts`
12. `src/modules/profile/hooks/useProfileHub.ts`
13. `src/modules/profile/hooks/usePerfilPageV3.ts`
14. `src/core/ai/actions/SearchBusinessesActionHandler.ts`
15. `src/modules/admin/pages/AdminReivindicacoes.tsx`

Documentation that must be reconciled:

1. `docs/ROTAS_PUBLICAS_CANONICAS.md`
2. `docs/TERRITORIAL_FOUNDATION.md`
3. `docs/IMPLEMENTACAO_IDENTIDADE_PUBLICA_CANONICA.md`
4. `docs/CONSOLIDACAO_FINAL_URLS_E_PERMISSOES.md`
5. `docs/DECISAO_ROTEAMENTO_TERRITORIAL.md`
6. `src/app/routes/README.md`
7. `docs/audits/PROJECT_INVENTORY.md`
8. `docs/audits/QUICK_WINS.md`

Any document that states that `/:communitySlug/:slug` is the preferred public
business URL is obsolete after this SSOT.

## 12. SEO Policy

1. Public entity pages are indexable.
2. Public module listings are indexable when they are stable and useful.
3. Community feed, groups, issues, lost and found, and resident-only pages are
   `noindex, follow`, unless a specific public preview is approved.
4. Community-scoped entity pages use canonical links pointing to the public
   entity URL.
5. The sitemap must not list private, resident-only, or legacy community scoped
   entity URLs.
6. Legacy redirects must preserve query/hash only when safe and useful.

Target files:

1. `src/core/routing/seo/territorialSeoPolicy.ts`
2. `src/core/routing/seo/generateSitemap.ts`
3. `src/core/routing/seo/TerritorialSEO.tsx`

## 13. Supabase and Security Policy

Audit these tables and related RPCs before release:

1. `user_residences`
2. `profiles`
3. `business_data`
4. `territory_communities`
5. `community_public_aliases`
6. `posts` or the current community posts table
7. community comments, reactions, reports, groups, alerts, issues, and lost
   found tables

Security rules:

1. Public reads expose only public fields.
2. Community writes require authenticated profile.
3. Local community actions must validate territory/residence where applicable.
4. Verified-resident-only actions must check `user_residences.is_verified` or
   the canonical residence verification contract.
5. Moderation actions require moderator/admin role.
6. Full addresses must never be exposed on public resident surfaces.
7. `SECURITY DEFINER` RPCs must validate ownership and return minimal payloads.

## 14. Test Coverage Required

Unit tests:

1. public business URL does not redirect to community;
2. public gastronomy URL does not redirect to community;
3. community entity URL is generated only with community intent;
4. legacy short route redirects or noindexes according to policy;
5. `CommunityAccessPolicy` returns correct access level for visitor,
   authenticated user, resident, verified resident, moderator, and admin;
6. SEO canonical points to public entity for community-scoped entity pages;
7. sitemap excludes restricted community URLs.

E2E tests:

1. visitor opens public business from `/empresas`;
2. visitor enters community portal and sees preview/gate;
3. authenticated user without address is sent to address setup;
4. verified resident can post/comment/join where allowed;
5. community-scoped business page shows community actions;
6. public business page does not show restricted community actions as primary
   actions;
7. mobile and desktop layouts have no horizontal overflow.

## 15. Acceptance Criteria

The migration is complete only when:

1. no public entity link is forced into a community URL;
2. community mode is explicit in URL, UI, and available actions;
3. all community-only actions use the same access policy;
4. legacy short entity routes are isolated and documented as redirects or
   removed;
5. docs do not contradict the implemented routing model;
6. tests cover routing, SEO, access, mobile, and legacy behavior;
7. architecture validation, lint, typecheck, SSOT validation, and targeted E2E
   tests pass.
