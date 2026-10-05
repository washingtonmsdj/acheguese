import TerritoryPortalPage, {
  type TerritoryPortalView,
} from "@/app/pages/TerritoryPortalPage";
import NotFound from "@/app/pages/NotFound";
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
import { useParams } from "react-router-dom";
import {
  MODULE_SLUGS,
  buildModuleTerritoryUrl,
} from "@/core/routing/utils/territoryUrls";

function slugToLabel(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolvePortalView(value: string | undefined): TerritoryPortalView | null {
  if (!value) return "home";
  if (value === MODULE_SLUGS.map) return "map";
  if (value === MODULE_SLUGS.business) return "business";
  if (value === MODULE_SLUGS.nearby) return "nearby";
  if (value === MODULE_SLUGS.search) return "search";
  return null;
}

export default function TerritoryHomePage({
  activeView,
}: {
  activeView?: TerritoryPortalView;
}) {
  const { resolved, baseUrl, activeMemberIds } = useTerritorialContext();
  const { portalView } = useParams<{ portalView?: string }>();
  const resolvedView = activeView ?? resolvePortalView(portalView);

  if (!resolvedView) return <NotFound />;

  const territoryName =
    resolved.kind === "group" ? resolved.group.name : resolved.location.name;

  const parts = baseUrl.split("/").filter(Boolean);
  const state = parts[0]?.toUpperCase() ?? "";
  const city = parts[1] ? slugToLabel(parts[1]) : territoryName;
  const contextLabel = [city, state].filter(Boolean).join(", ");

  const businessUrl = buildModuleTerritoryUrl(
    MODULE_SLUGS.business,
    baseUrl,
  );
  const mapUrl = buildModuleTerritoryUrl(MODULE_SLUGS.map, baseUrl);
  const nearbyUrl = buildModuleTerritoryUrl(MODULE_SLUGS.nearby, baseUrl);
  const searchUrl = buildModuleTerritoryUrl(MODULE_SLUGS.search, baseUrl);

  const memberLabels =
    resolved.kind === "group"
      ? resolved.group.members.map((member) => member.name)
      : [];

  return (
    <TerritoryPortalPage
      territoryName={territoryName}
      contextLabel={contextLabel}
      memberLabels={memberLabels}
      resolvedTerritory={resolved}
      activeMemberIds={activeMemberIds}
      activeView={resolvedView}
      urls={{
        home: baseUrl,
        business: businessUrl,
        map: mapUrl,
        nearby: nearbyUrl,
        search: searchUrl,
      }}
    />
  );
}
