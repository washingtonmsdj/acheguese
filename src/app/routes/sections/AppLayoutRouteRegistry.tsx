import type { ReactNode } from "react";
import { Route } from "react-router-dom";
import {
  isLaunchSurfaceEnabled,
  type LaunchSurfaceKey,
} from "@/config/launchScope";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildTerritorialModuleRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { TerritorialLayout } from "@/core/routing/components/TerritorialLayout";

import * as P from "../lazyImports";

const TERRITORIAL_PARAMS = TERRITORIAL_ROUTE_PARAMS;
const TERRITORIAL_STATIC = TERRITORIAL_ROUTE_STATIC_SEGMENTS;

type AppLayoutRouteDescriptor = {
  id: string;
  path: string;
  element: ReactNode;
  indexElement?: ReactNode;
  launchSurface?: LaunchSurfaceKey;
  pausedModuleName?: string;
};

const APP_LAYOUT_BUSINESS_SERVICE_CLASSIFIED_ROUTES: readonly AppLayoutRouteDescriptor[] =
  [
    {
      id: "business-detail",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
        TERRITORIAL_PARAMS.district,
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
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
        TERRITORIAL_STATIC.category,
        TERRITORIAL_PARAMS.category,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialCategoryBusinessPage />,
    },
    {
      id: "business-category-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
        TERRITORIAL_PARAMS.district,
        TERRITORIAL_STATIC.category,
        TERRITORIAL_PARAMS.category,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialCategoryBusinessPage />,
    },
    {
      id: "business-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business, [
        TERRITORIAL_PARAMS.district,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.EmpresasLandingPage />,
    },
    {
      id: "business-city",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.business),
      element: <TerritorialLayout />,
      indexElement: <P.EmpresasLandingPage />,
    },
    {
      id: "services-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.services, [
        TERRITORIAL_PARAMS.district,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialServicesPage />,
    },
    {
      id: "services-city",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.services),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialServicesPage />,
    },
    {
      id: "classified-detail",
      path: "/classificados/:uf/:cidade/:bairro/:categoria/:subcategoria/:slug/:publicId",
      element: <P.ClassifiedCanonicalRoute />,
    },
    {
      id: "classified-subcategory-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.classifieds, [
        TERRITORIAL_PARAMS.district,
        TERRITORIAL_PARAMS.category,
        TERRITORIAL_PARAMS.subcategory,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialClassificadosPage />,
    },
    {
      id: "classified-category-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.classifieds, [
        TERRITORIAL_PARAMS.district,
        TERRITORIAL_PARAMS.category,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialClassificadosPage />,
    },
    {
      id: "classified-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.classifieds, [
        TERRITORIAL_PARAMS.district,
      ]),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialClassificadosPage />,
    },
    {
      id: "classified-city",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.classifieds),
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialClassificadosPage />,
    },
  ];

export const APP_LAYOUT_EVENT_TERRITORIAL_ROUTES: readonly AppLayoutRouteDescriptor[] =
  [
    {
      id: "events-detail",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
        TERRITORIAL_STATIC.eventDetail,
        TERRITORIAL_PARAMS.eventId,
      ]),
      launchSurface: "events",
      pausedModuleName: "Eventos",
      element: <TerritorialLayout />,
      indexElement: (
        <P.EventsErrorBoundary>
          <P.EventDetailPage />
        </P.EventsErrorBoundary>
      ),
    },
    {
      id: "events-favorites",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
        TERRITORIAL_STATIC.favorites,
      ]),
      launchSurface: "events",
      pausedModuleName: "Eventos",
      element: <TerritorialLayout />,
      indexElement: (
        <P.EventsErrorBoundary>
          <P.EventsFavoritesPage />
        </P.EventsErrorBoundary>
      ),
    },
    {
      id: "events-calendar",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
        TERRITORIAL_STATIC.calendar,
      ]),
      launchSurface: "events",
      pausedModuleName: "Eventos",
      element: <TerritorialLayout />,
      indexElement: (
        <P.EventsErrorBoundary>
          <P.EventsCalendarPage />
        </P.EventsErrorBoundary>
      ),
    },
    {
      id: "events-map",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
        TERRITORIAL_STATIC.map,
      ]),
      launchSurface: "events",
      pausedModuleName: "Eventos",
      element: <TerritorialLayout />,
      indexElement: (
        <P.EventsErrorBoundary>
          <P.EventsMapPage />
        </P.EventsErrorBoundary>
      ),
    },
    {
      id: "events-district",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events, [
        TERRITORIAL_PARAMS.district,
      ]),
      launchSurface: "events",
      pausedModuleName: "Eventos",
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialEventosPage />,
    },
    {
      id: "events-city",
      path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.events),
      launchSurface: "events",
      pausedModuleName: "Eventos",
      element: <TerritorialLayout />,
      indexElement: <P.TerritorialEventosPage />,
    },
  ];

const APP_LAYOUT_MAP_TERRITORIAL_ROUTES: readonly AppLayoutRouteDescriptor[] = [
  {
    id: "map-district",
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map, [
      TERRITORIAL_PARAMS.district,
    ]),
    element: <TerritorialLayout />,
    indexElement: <P.TerritorialMapPage />,
  },
  {
    id: "map-city",
    path: buildTerritorialModuleRoutePath(APP_MODULE_SLUGS.map),
    element: <TerritorialLayout />,
    indexElement: <P.TerritorialMapPage />,
  },
];

export const APP_LAYOUT_TERRITORIAL_DOMAIN_ROUTES: readonly AppLayoutRouteDescriptor[] =
  [
    ...APP_LAYOUT_BUSINESS_SERVICE_CLASSIFIED_ROUTES,
    ...APP_LAYOUT_EVENT_TERRITORIAL_ROUTES,
    ...APP_LAYOUT_MAP_TERRITORIAL_ROUTES,
  ];

export function renderAppLayoutRouteDescriptors(
  routes: readonly AppLayoutRouteDescriptor[],
): ReactNode[] {
  return routes.map((route) => {
    const isPaused =
      route.launchSurface !== undefined &&
      !isLaunchSurfaceEnabled(route.launchSurface);
    const element = isPaused ? (
      <P.LaunchPausedPage moduleName={route.pausedModuleName ?? "Módulo"} />
    ) : (
      route.element
    );

    if (!route.indexElement || isPaused) {
      return <Route key={route.id} path={route.path} element={element} />;
    }

    return (
      <Route key={route.id} path={route.path} element={element}>
        <Route index element={route.indexElement} />
      </Route>
    );
  });
}
