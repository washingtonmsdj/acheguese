# Territory-first public routing SSOT

Status: canonical architecture  
Date: 2026-09-27  
Owners: Territory, Routing, Community, Business, SEO

## 1. Official decision

Achegue-se is a territorial platform. The territory is the public container and
modules are children of that territory.

Canonical shape:

```txt
/:state/:city
/:state/:city/:territory
/:state/:city/:territory/:module
/:state/:city/:territory/:module/:entitySlug
```

Example:

```txt
/ba/salvador/complexo-do-nordeste-de-amaralina
/ba/salvador/complexo-do-nordeste-de-amaralina/mapa
/ba/salvador/complexo-do-nordeste-de-amaralina/empresas
/ba/salvador/complexo-do-nordeste-de-amaralina/comunidade
```

Community is a sibling module of Empresas, Mapa, Perto de mim, Serviços,
Eventos and future modules. It is not the container of the territory.

## 2. Non-negotiable routing rules

1. Territory comes before the module in every territorial public URL.
2. Public URL builders must use the routing SSOT; ad-hoc concatenation is not
   allowed.
3. Module-first territorial URLs such as
   `/mapa/ba/salvador/complexo-do-nordeste-de-amaralina` are not part of the
   application contract.
4. There are no compatibility redirects or aliases for the retired
   module-first territorial architecture.
5. Unknown or retired URLs fall through to the canonical 404.
6. Global non-territorial entry points may exist when they represent a real
   product surface, such as `/mapa`, `/empresas`, `/perto-de-mim`,
   `/busca` and `/buscar`.
7. Once a territory is known, navigation must remain inside the territorial
   hierarchy.

## 3. Territory home

The territory home is:

```txt
/:state/:city/:territory
```

It composes previews and shortcuts from active modules without taking ownership
of those modules.

For the current MVP it may expose:

- Empresas;
- Mapa;
- Perto de mim;
- Busca.

When Community, Serviços, Eventos, Gastronomia, Mobilidade or other product
modules are activated, they enter as additional children of the same territory.

## 4. Community

Community remains paused in the current MVP.

When activated, its canonical root is:

```txt
/:state/:city/:territory/comunidade
```

Possible children:

```txt
/:state/:city/:territory/comunidade/feed
/:state/:city/:territory/comunidade/grupos
/:state/:city/:territory/comunidade/alertas
/:state/:city/:territory/comunidade/problemas
/:state/:city/:territory/comunidade/achados-e-perdidos
```

Community owns social interaction: feed, posts, comments, resident groups,
local issues, alerts, lost and found, moderation and related policies.

It must not own Empresa, Mapa, Serviços or other sibling module URLs.

## 5. Public entity routes

Public entities stay inside their owning module.

Examples:

```txt
/ba/salvador/pituba/empresas/tone-pizzaria
/ba/salvador/pituba/servicos/profissional-x
/ba/salvador/pituba/eventos/evento-x
```

A business does not gain an alternate canonical URL merely because it is
referenced by Community.

## 6. Access and lifecycle

Lifecycle ownership remains centralized in the product/capability registries.

A paused module:

- has no public route in the active graph;
- has no navigation item;
- has no sitemap entry;
- has no active provider/layer/prefetch;
- does not receive a placeholder or redirect.

Community-specific write actions may require authentication, residence,
verification or moderation permissions when the module is reactivated.

## 7. SEO

1. Territory homes and active public module listings use their canonical
   territory-first URLs.
2. Public entity canonical URLs use the territory-first hierarchy.
3. Paused modules are absent from sitemap generation.
4. Retired module-first URLs are not emitted as canonical, alternate or
   compatibility URLs.

## 8. Implementation SSOT

Primary runtime authorities:

- `src/core/routing/config/territorialRoutePatterns.ts`
- `src/core/routing/utils/territoryUrls.ts`
- `src/shared/config/moduleSlugs.ts`
- `src/app/routes/sections/AppLayoutRoutes.tsx`
- `src/app/routes/sections/AppLayoutRouteRegistry.tsx`
- `src/core/routing/seo/generateSitemap.ts`

No second routing model should be introduced for an individual module.

## 9. Acceptance criteria

The structure is correct when:

1. `/ba/salvador/complexo-do-nordeste-de-amaralina` renders the territory
   portal;
2. its active module links resolve to
   `.../empresas`, `.../mapa`, `.../perto-de-mim` and `.../busca`;
3. module-first territorial URLs do not resolve through compatibility logic;
4. browser back/forward and direct links work per page;
5. sitemap and canonical metadata emit only territory-first territorial URLs;
6. paused modules remain outside the active route tree;
7. architecture tests, typecheck, lint and MVP E2E pass.
