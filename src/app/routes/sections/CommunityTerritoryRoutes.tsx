import { Route } from "react-router-dom";
import type { ReactNode } from "react";
import { APP_MODULE_SLUGS } from "@/config/moduleSlugs";
import {
  TERRITORIAL_ROUTE_PARAMS,
  TERRITORIAL_ROUTE_STATIC_SEGMENTS,
  buildCommunityAliasRoutePath,
  buildCommunityRootAliasRoutePath,
  buildCommunityTerritoryRoutePath,
} from "@/core/routing/config/territorialRoutePatterns";
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from "@/config/launchScope";
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

const COMMUNITY_ALIAS_REDIRECT_PREFIXES: readonly (readonly string[])[] =
  COMMUNITY_ROUTE_DEFINITIONS.map((definition) => definition.segments);

function renderLaunchScopedElement(
  definition: CommunityRouteDefinition,
  element: ReactNode,
): ReactNode {
  if (!definition.launchSurface || isLaunchSurfaceEnabled(definition.launchSurface)) {
    return element;
  }

  return <P.LaunchPausedPage moduleName={definition.pausedModuleName ?? "Módulo"} />;
}

function isCommunityRouteLaunchEnabled(definition: CommunityRouteDefinition): boolean {
  return !definition.launchSurface || isLaunchSurfaceEnabled(definition.launchSurface);
}

function renderCommunityRoutes(
  scope: "territory" | "scoped",
  buildPath: (suffixSegments?: readonly string[]) => string,
): ReactNode {
  return COMMUNITY_ROUTE_DEFINITIONS.map((definition) => {
    const path = buildPath(definition.segments);
    if (definition.kind === "direct") {
      return (
        <Route
          key={`${scope}-${definition.key}`}
          path={path}
          element={renderLaunchScopedElement(definition, definition.element)}
        />
      );
    }

    return (
      <Route
        key={`${scope}-${definition.key}`}
        path={path}
        element={renderLaunchScopedElement(definition, <P.CommunityTerritorialShell />)}
      >
        <Route index element={definition.indexElement} />
      </Route>
    );
  });
}

function renderCommunityTerritoryRoutes() {
  return (
    <>
      <Route
        path={buildCommunityRootAliasRoutePath([APP_MODULE_SLUGS.business, TERRITORIAL_PARAMS.slug])}
        element={<P.CommunityShortEntityRoute />}
      />
      <Route
        path={buildCommunityRootAliasRoutePath([APP_MODULE_SLUGS.gastronomy, TERRITORIAL_PARAMS.slug])}
        element={<P.CommunityShortEntityRoute />}
      />
      {COMMUNITY_ROUTE_DEFINITIONS.map((definition) => (
        <Route
          key={`root-alias-${definition.key}`}
          path={buildCommunityRootAliasRoutePath(definition.segments)}
          element={renderLaunchScopedElement(definition, <P.CommunityShortAliasShellRoute />)}
        >
          <Route index element={definition.kind === "direct" ? definition.element : definition.indexElement} />
        </Route>
      ))}
      <Route path={buildCommunityRootAliasRoutePath()} element={<P.CommunityShortAliasShellRoute />}>
        <Route index element={<P.TerritorialCommunityEntryPage />} />
      </Route>

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
      {COMMUNITY_ALIAS_REDIRECT_PREFIXES.map((segments, index) => {
        const definition = COMMUNITY_ROUTE_DEFINITIONS[index];
        return (
          <Route
            key={`alias-prefix-${definition.key}`}
            path={buildCommunityAliasRoutePath([...segments, "*"])}
            element={
              isCommunityRouteLaunchEnabled(definition)
                ? <P.CommunityAliasRoute />
                : <P.LaunchPausedPage moduleName={definition.pausedModuleName ?? "Módulo"} />
            }
          />
        );
      })}
      {COMMUNITY_ROUTE_DEFINITIONS.map((definition) => (
        <Route
          key={`alias-${definition.key}`}
          path={buildCommunityAliasRoutePath(definition.segments)}
          element={
            isCommunityRouteLaunchEnabled(definition)
              ? <P.CommunityAliasRoute />
              : <P.LaunchPausedPage moduleName={definition.pausedModuleName ?? "Módulo"} />
          }
        />
      ))}
      <Route path={buildCommunityScopedRoutePath()} element={<P.CommunityTerritorialShell />}>
        <Route index element={<P.TerritorialCommunityEntryPage />} />
      </Route>
      <Route path={buildCommunityTerritoryRoutePath()} element={<P.CommunityTerritorialShell />}>
        <Route index element={<P.TerritorialCommunityEntryPage />} />
      </Route>
      <Route path={buildCommunityAliasRoutePath()} element={<P.CommunityAliasRoute />} />
      <Route path={buildCommunityAliasRoutePath(["*"])} element={<P.CommunityAliasRoute />} />
    </>
  );
}

export function CommunityTerritoryRoutes() {
  return renderCommunityTerritoryRoutes();
}
