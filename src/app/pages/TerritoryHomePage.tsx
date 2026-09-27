import TerritoryPortalPage from "@/app/pages/TerritoryPortalPage";
import { useTerritorialContext } from "@/core/routing/components/TerritorialLayout";
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

export default function TerritoryHomePage() {
  const { resolved, baseUrl } = useTerritorialContext();
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
