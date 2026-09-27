import type { ReactNode } from "react";
import { Route } from "react-router-dom";

import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "@/app/config/lifecycleRegistry";
import type { PlatformCapabilityKey } from "@/app/config/platformCapabilityRegistry";
import type { ProductModuleKey } from "@/app/config/productModuleRegistry";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildScopedTerritorialModuleRoutePath,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";

import * as P from "../activeLazyImports";

const TERRITORIAL_PARAMS = TERRITORIAL_ROUTE_PARAMS;
const TERRITORIAL_STATIC = TERRITORIAL_ROUTE_STATIC_SEGMENTS;

type RouteOwner =
  | { readonly kind: "product"; readonly key: ProductModuleKey }
  | { readonly kind: "capability"; readonly key: PlatformCapabilityKey };

type AppLayoutRouteDescriptor = {
  readonly id: string;
  readonly path: string;
  readonly element: ReactNode;
  readonly indexElement?: ReactNode;
  readonly owner: RouteOwner;
};

function isRouteOwnerEnabled(owner: RouteOwner): boolean {
  return owner.kind === "product"
    ? isProductModuleEnabled(owner.key)
    : isPlatformCapabilityEnabled(owner.key);
}

const APP_LAYOUT_BUSINESS_ROUTES: readonly AppLayoutRouteDescriptor[] = [
  {
    id: "business-detail",
    owner: { kind: "product", key: "business" },
    path: buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
      TERRITORIAL_PARAMS.slug,
    ]),
    element: (
      <P.BusinessRouteResolver
        BusinessDetailComponent={P.EmpresaDetailLandingPage}
      />
    ),
  },
  {
    id: "business-category-city",
    owner: { kind: "product", key: "business" },
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
      TERRITORIAL_STATIC.category,
      TERRITORIAL_PARAMS.category,
    ]),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialCategoryBusinessPage />,
  },
  {
    id: "business-category-territory",
    owner: { kind: "product", key: "business" },
    path: buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
      TERRITORIAL_STATIC.category,
      TERRITORIAL_PARAMS.category,
    ]),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialCategoryBusinessPage />,
  },
  {
    id: "business-territory",
    owner: { kind: "product", key: "business" },
    path: buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.business),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialBusinessPortalPage />,
  },
  {
    id: "business-city",
    owner: { kind: "product", key: "business" },
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialBusinessPortalPage />,
  },
];

const APP_LAYOUT_MAP_TERRITORIAL_ROUTES: readonly AppLayoutRouteDescriptor[] = [
  {
    id: "map-territory",
    owner: { kind: "capability", key: "map" },
    path: buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.map),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialMapPage />,
  },
  {
    id: "map-city",
    owner: { kind: "capability", key: "map" },
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialMapPage />,
  },
];

const APP_LAYOUT_NEARBY_TERRITORIAL_ROUTES: readonly AppLayoutRouteDescriptor[] = [
  {
    id: "nearby-territory",
    owner: { kind: "capability", key: "nearby" },
    path: buildScopedTerritorialModuleRoutePath(APP_MODULE_SLUGS.nearby),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialNearbyPortalPage />,
  },
  {
    id: "nearby-city",
    owner: { kind: "capability", key: "nearby" },
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.nearby),
    element: <P.ActiveTerritorialLayout />,
    indexElement: <P.TerritorialNearbyPortalPage />,
  },
];

export const APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES: readonly AppLayoutRouteDescriptor[] =
  [
    ...APP_LAYOUT_BUSINESS_ROUTES,
    ...APP_LAYOUT_MAP_TERRITORIAL_ROUTES,
    ...APP_LAYOUT_NEARBY_TERRITORIAL_ROUTES,
  ];

export function renderAppLayoutRouteDescriptors(
  routes: readonly AppLayoutRouteDescriptor[],
): ReactNode[] {
  return routes
    .filter((route) => isRouteOwnerEnabled(route.owner))
    .map((route) => {
      if (!route.indexElement) {
        return <Route key={route.id} path={route.path} element={route.element} />;
      }

      return (
        <Route key={route.id} path={route.path} element={route.element}>
          <Route index element={route.indexElement} />
        </Route>
      );
    });
}
