import { Route } from "react-router-dom";
import type { ReactNode } from "react";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityAliasRoutePath,
  buildCommunityTerritoryRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/app/config/launchScope";
import * as P from "../lazyImports";

const TERRITORIAL_PARAMS = TERRITORIAL_ROUTE_PARAMS;
const TERRITORIAL_STATIC = TERRITORIAL_ROUTE_STATIC_SEGMENTS;

const buildCommunityScopedRoutePath = (suffixSegments: readonly string[] = []) =>
  buildCommunityTerritoryRoutePath([
    TERRITORIAL_PARAMS.groupSlugOrDistrict,
    ...suffixSegments,
  ]);

type CommunityRouteLaunchScope = {
  launchSurface?: LaunchSurfaceKey;
  pausedModuleName?: string;
};

type CommunityRouteDefinition = CommunityRouteLaunchScope &
  (
    | {
      kind: "direct";
      key: string;
      segments: readonly string[];
      element: ReactNode;
    }
    | {
      kind: "shell";
      key: string;
      segments: readonly string[];
      indexElement: ReactNode;
    }
  );

const COMMUNITY_ROUTE_DEFINITIONS: readonly CommunityRouteDefinition[] = [
  {
    kind: "direct",
    key: "interest",
    launchSurface: "community",
    segments: [TERRITORIAL_STATIC.interest],
    element: <P.CommunityInterestPage />,
  },
  {
    kind: "shell",
    key: "issues",
    launchSurface: "communityIssues",
    pausedModuleName: "Problemas",
    segments: [TERRITORIAL_STATIC.issues],
    indexElement: <P.TerritorialCommunityIssuesPage />,
  },
  {
    kind: "shell",
    key: "communication",
    launchSurface: "communityCommunication",
    pausedModuleName: "Comunicação",
    segments: [TERRITORIAL_STATIC.communication],
    indexElement: <P.TerritorialCommunityCommunicationPage />,
  },
  {
    kind: "shell",
    key: "business",
    launchSurface: "business",
    segments: [APP_MODULE_SLUGS.business],
    indexElement: <P.TerritorialBusinessPage />,
  },
  {
    kind: "shell",
    key: "services",
    launchSurface: "services",
    segments: [APP_MODULE_SLUGS.services],
    indexElement: <P.TerritorialServicesPage />,
  },
  {
    kind: "shell",
    key: "classifieds",
    launchSurface: "classifieds",
    segments: [APP_MODULE_SLUGS.classifieds],
    indexElement: <P.TerritorialClassificadosPage />,
  },
  {
    kind: "shell",
    key: "gastronomy",
    launchSurface: "gastronomy",
    segments: [APP_MODULE_SLUGS.gastronomy],
    indexElement: <P.TerritorialGastronomyPage />,
  },
  {
    kind: "shell",
    key: "education",
    launchSurface: "education",
    pausedModuleName: "Educação",
    segments: [APP_MODULE_SLUGS.education],
    indexElement: <P.TerritorialEducationPage />,
  },
  {
    kind: "shell",
    key: "jobs",
    launchSurface: "jobs",
    pausedModuleName: "Vagas",
    segments: [APP_MODULE_SLUGS.jobs],
    indexElement: <P.TerritorialVagasPage />,
  },
  {
    kind: "direct",
    key: "jobs-publish",
    launchSurface: "jobs",
    pausedModuleName: "Vagas",
    segments: [APP_MODULE_SLUGS.jobs, TERRITORIAL_STATIC.publish],
    element: <P.PublicarVagaPage />,
  },
  {
    kind: "shell",
    key: "events",
    launchSurface: "events",
    pausedModuleName: "Eventos",
    segments: [APP_MODULE_SLUGS.events],
    indexElement: <P.TerritorialEventosPage />,
  },
  {
    kind: "shell",
    key: "map",
    launchSurface: "map",
    segments: [APP_MODULE_SLUGS.map],
    indexElement: <P.TerritorialMapPage />,
  },
  {
    kind: "shell",
    key: "mobility",
    launchSurface: "mobility",
    pausedModuleName: "Mobilidade",
    segments: [APP_MODULE_SLUGS.mobility],
    indexElement: <P.TerritorialMobilidadePage />,
  },
  {
    kind: "shell",
    key: "feed",
    launchSurface: "community",
    segments: [TERRITORIAL_STATIC.feed],
    indexElement: <P.TerritorialCommunityPage />,
  },
  {
    kind: "shell",
    key: "groups",
    launchSurface: "community",
    segments: [TERRITORIAL_STATIC.groups],
    indexElement: <P.TerritorialCommunityPage />,
  },
  {
    kind: "shell",
    key: "groups-detail",
    launchSurface: "community",
    segments: [TERRITORIAL_STATIC.groups, TERRITORIAL_PARAMS.id],
    indexElement: <P.GrupoDetailPage />,
  },
  {
    kind: "shell",
    key: "lost-and-found",
    launchSurface: "communityLostFound",
    pausedModuleName: "Achados e perdidos",
    segments: [TERRITORIAL_STATIC.lostAndFound],
    indexElement: <P.AchadosPerdidosPage />,
  },
];

function renderLaunchScopedElement(
  definition: CommunityRouteDefinition,
  element: ReactNode,
): ReactNode {
  if (!definition.launchSurface || isLaunchSurfaceEnabled(definition.launchSurface)) {
    return element;
  }

  return <P.LaunchPausedPage moduleName={definition.pausedModuleName ?? "Módulo"} />;
}

function toRelativeRoutePath(segments: readonly string[]): string {
  return segments.join("/");
}

function renderCommunityRoutes(
  scope: "territory" | "scoped",
  buildPath: (suffixSegments?: readonly string[]) => string,
): ReactNode {
  const directRoutes = COMMUNITY_ROUTE_DEFINITIONS.filter(
    (definition) => definition.kind === "direct",
  );
  const persistentRoutes = COMMUNITY_ROUTE_DEFINITIONS.filter(
    (definition) => definition.kind === "shell",
  );

  return (
    <>
      {directRoutes.map((definition) => (
        <Route
          key={`${scope}-${definition.key}`}
          path={buildPath(definition.segments)}
          element={renderLaunchScopedElement(definition, definition.element)}
        />
      ))}

      <Route path={buildPath()} element={<P.CommunityTerritorialShell />}>
        <Route element={<P.CommunityPersistentPortalLayout />}>
          <Route index element={<P.TerritorialCommunityEntryPage />} />
          {persistentRoutes.map((definition) => (
            <Route
              key={`${scope}-${definition.key}`}
              path={toRelativeRoutePath(definition.segments)}
              element={renderLaunchScopedElement(definition, definition.indexElement)}
            />
          ))}
        </Route>
      </Route>
    </>
  );
}

function renderCommunityTerritoryRoutes() {
  const directRoutes = COMMUNITY_ROUTE_DEFINITIONS.filter(
    (definition) => definition.kind === "direct",
  );
  const persistentRoutes = COMMUNITY_ROUTE_DEFINITIONS.filter(
    (definition) => definition.kind === "shell",
  );

  return (
    <>
      {renderCommunityRoutes("territory", buildCommunityTerritoryRoutePath)}
      {renderCommunityRoutes("scoped", buildCommunityScopedRoutePath)}
      <Route
        path={buildCommunityAliasRoutePath([APP_MODULE_SLUGS.business, TERRITORIAL_PARAMS.slug])}
        element={<P.CommunityEntityAliasRoute />}
      />
      <Route
        path={buildCommunityAliasRoutePath([APP_MODULE_SLUGS.gastronomy, TERRITORIAL_PARAMS.slug])}
        element={<P.CommunityEntityAliasRoute />}
      />
      <Route path={buildCommunityAliasRoutePath()} element={<P.CommunityAliasRoute />}>
        <Route element={<P.CommunityPersistentPortalLayout />}>
          <Route index element={<P.TerritorialCommunityEntryPage />} />
          {persistentRoutes.map((definition) => (
            <Route
              key={`alias-${definition.key}`}
              path={toRelativeRoutePath(definition.segments)}
              element={renderLaunchScopedElement(definition, definition.indexElement)}
            />
          ))}
          <Route path="*" element={<P.NotFound />} />
        </Route>
        {directRoutes.map((definition) => (
          <Route
            key={`alias-${definition.key}`}
            path={toRelativeRoutePath(definition.segments)}
            element={renderLaunchScopedElement(definition, definition.element)}
          />
        ))}
      </Route>
    </>
  );
}

export function CommunityTerritoryRoutes() {
  return renderCommunityTerritoryRoutes();
}
