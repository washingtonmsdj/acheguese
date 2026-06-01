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
import * as P from "../lazyImports";

const TERRITORIAL_PARAMS = TERRITORIAL_ROUTE_PARAMS;
const TERRITORIAL_STATIC = TERRITORIAL_ROUTE_STATIC_SEGMENTS;

const buildCommunityScopedRoutePath = (suffixSegments: readonly string[] = []) =>
  buildCommunityTerritoryRoutePath([
    TERRITORIAL_PARAMS.groupSlugOrDistrict,
    ...suffixSegments,
  ]);

type CommunityRouteDefinition =
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
    };

const COMMUNITY_ROUTE_DEFINITIONS: readonly CommunityRouteDefinition[] = [
  {
    kind: "direct",
    key: "interest",
    segments: [TERRITORIAL_STATIC.interest],
    element: <P.CommunityInterestPage />,
  },
  {
    kind: "shell",
    key: "issues",
    segments: [TERRITORIAL_STATIC.issues],
    indexElement: <P.TerritorialCommunityIssuesPage />,
  },
  {
    kind: "shell",
    key: "communication",
    segments: [TERRITORIAL_STATIC.communication],
    indexElement: <P.TerritorialCommunityCommunicationPage />,
  },
  {
    kind: "shell",
    key: "business",
    segments: [APP_MODULE_SLUGS.business],
    indexElement: <P.TerritorialBusinessPage />,
  },
  {
    kind: "shell",
    key: "services",
    segments: [APP_MODULE_SLUGS.services],
    indexElement: <P.TerritorialServicesPage />,
  },
  {
    kind: "shell",
    key: "classifieds",
    segments: [APP_MODULE_SLUGS.classifieds],
    indexElement: <P.TerritorialClassificadosPage />,
  },
  {
    kind: "shell",
    key: "gastronomy",
    segments: [APP_MODULE_SLUGS.gastronomy],
    indexElement: <P.TerritorialGastronomyPage />,
  },
  {
    kind: "shell",
    key: "education",
    segments: [APP_MODULE_SLUGS.education],
    indexElement: <P.TerritorialEducationPage />,
  },
  {
    kind: "shell",
    key: "jobs",
    segments: [APP_MODULE_SLUGS.jobs],
    indexElement: <P.TerritorialVagasPage />,
  },
  {
    kind: "direct",
    key: "jobs-publish",
    segments: [APP_MODULE_SLUGS.jobs, TERRITORIAL_STATIC.publish],
    element: <P.PublicarVagaPage />,
  },
  {
    kind: "shell",
    key: "events",
    segments: [APP_MODULE_SLUGS.events],
    indexElement: <P.TerritorialEventosPage />,
  },
  {
    kind: "shell",
    key: "map",
    segments: [APP_MODULE_SLUGS.map],
    indexElement: <P.TerritorialMapPage />,
  },
  {
    kind: "shell",
    key: "mobility",
    segments: [APP_MODULE_SLUGS.mobility],
    indexElement: <P.TerritorialMobilidadePage />,
  },
  {
    kind: "shell",
    key: "feed",
    segments: [TERRITORIAL_STATIC.feed],
    indexElement: <P.TerritorialCommunityPage />,
  },
  {
    kind: "shell",
    key: "groups",
    segments: [TERRITORIAL_STATIC.groups],
    indexElement: <P.TerritorialCommunityPage />,
  },
  {
    kind: "shell",
    key: "groups-detail",
    segments: [TERRITORIAL_STATIC.groups, TERRITORIAL_PARAMS.id],
    indexElement: <P.GrupoDetailPage />,
  },
  {
    kind: "shell",
    key: "lost-and-found",
    segments: [TERRITORIAL_STATIC.lostAndFound],
    indexElement: <P.AchadosPerdidosPage />,
  },
];

const COMMUNITY_ALIAS_REDIRECT_PREFIXES: readonly (readonly string[])[] = [
  [TERRITORIAL_STATIC.interest],
  [TERRITORIAL_STATIC.issues],
  [TERRITORIAL_STATIC.communication],
  [APP_MODULE_SLUGS.business],
  [APP_MODULE_SLUGS.services],
  [APP_MODULE_SLUGS.classifieds],
  [APP_MODULE_SLUGS.gastronomy],
  [APP_MODULE_SLUGS.education],
  [APP_MODULE_SLUGS.jobs],
  [APP_MODULE_SLUGS.events],
  [APP_MODULE_SLUGS.map],
  [APP_MODULE_SLUGS.mobility],
  [TERRITORIAL_STATIC.feed],
  [TERRITORIAL_STATIC.groups],
  [TERRITORIAL_STATIC.lostAndFound],
];

function renderCommunityRoutes(
  scope: "territory" | "scoped",
  buildPath: (suffixSegments?: readonly string[]) => string,
): ReactNode {
  return COMMUNITY_ROUTE_DEFINITIONS.map((definition) => {
    const path = buildPath(definition.segments);
    if (definition.kind === "direct") {
      return <Route key={`${scope}-${definition.key}`} path={path} element={definition.element} />;
    }

    return (
      <Route
        key={`${scope}-${definition.key}`}
        path={path}
        element={<P.CommunityTerritorialShell />}
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
          element={<P.CommunityShortAliasShellRoute />}
        >
          <Route
            index
            element={
              definition.kind === "direct"
                ? definition.element
                : definition.indexElement
            }
          />
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
      {COMMUNITY_ALIAS_REDIRECT_PREFIXES.map((segments) => (
        <Route
          key={`alias-prefix-${segments.join("-")}`}
          path={buildCommunityAliasRoutePath([...segments, "*"])}
          element={<P.CommunityAliasRoute />}
        />
      ))}
      {COMMUNITY_ROUTE_DEFINITIONS.map((definition) => (
        <Route
          key={`alias-${definition.key}`}
          path={buildCommunityAliasRoutePath(definition.segments)}
          element={<P.CommunityAliasRoute />}
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
