import {
  DEFAULT_CAMERA,
  DEFAULT_TILE_STYLE,
  MAP_PRODUCT_SURFACES,
  MAP_RUNTIME_LAYER_KEYS,
  type MapProductSurface,
} from "@/core/maps";
import { getLayerConfig } from "@/core/maps/config/markerConfig";
import {
  locationAdminService,
  locationGeocodingService,
  type AdminLocationRecord,
} from "@/core/location";
import {
  TerritorialManagementService,
  type TerritoryNode,
} from "@/core/territorial";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

type VisibilityStatus = "official" | "compatibility" | "attention";
type TouristPointPublicationStatus = "draft" | "published" | "archived";

interface TouristPoint {
  id: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
}

const TouristPointPublicationStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;

const CATEGORY_LABELS: Record<string, string> = {
  historico: "Histórico",
  natural: "Natural",
  religioso: "Religioso",
  cultural: "Cultural",
  gastronomico: "Gastronômico",
  praia: "Praia",
  parque: "Parque",
  mirante: "Mirante",
  museu: "Museu",
  monumento: "Monumento",
  arquitetonico: "Arquitetônico",
  esportivo: "Esportivo",
  entretenimento: "Entretenimento",
  compras: "Compras",
  outro: "Outro",
};

export type AdminMapGovernanceIssue =
  | "missing_coordinates"
  | "needs_refinement"
  | "selector_hidden"
  | "route_disabled"
  | "group_without_members";

export interface AdminMapGovernanceStats {
  totalLocations: number;
  mappedLocations: number;
  locationsNeedingRefinement: number;
  visibleTerritories: number;
  navigableTerritories: number;
  totalGroups: number;
  touristPointsTotal: number;
  touristPointsMapped: number;
  touristPointsNonPublic: number;
  attentionItems: number;
}

export interface AdminMapProviderSummary {
  id: "tiles" | "geocoding" | "projection" | "territory";
  label: string;
  owner: string;
  status: VisibilityStatus;
  detail: string;
}

export interface AdminMapLayerSummary {
  key: string;
  label: string;
  source: string;
  route: string;
  status: VisibilityStatus;
  note: string;
}

export interface AdminMapCoverageSummary {
  scope: "country" | "state" | "city" | "district" | "group";
  total: number;
  active: number;
  mapped: number | null;
  selectorVisible: number;
  navigable: number;
  needsRefinement: number | null;
}

export interface AdminMapTouristPointCategorySummary {
  category: string;
  label: string;
  total: number;
  mapped: number;
}

export interface AdminMapGovernanceHotspot {
  id: string;
  entityKind: "location" | "group";
  entityId: string;
  name: string;
  scope: string;
  geographicPath: string | null;
  issue: AdminMapGovernanceIssue;
  issueLabel: string;
  status: string;
  selectorVisible: boolean;
  navigable: boolean;
  hasCoordinates: boolean | null;
  coordinatesSource: string | null;
  needsRefinement: boolean;
  memberCount: number | null;
  anchorCityName: string | null;
}

export interface AdminMapGovernanceSnapshot {
  stats: AdminMapGovernanceStats;
  providers: AdminMapProviderSummary[];
  layers: AdminMapLayerSummary[];
  coverage: AdminMapCoverageSummary[];
  touristPointCategories: AdminMapTouristPointCategorySummary[];
  hotspots: AdminMapGovernanceHotspot[];
  surfaces: MapProductSurface[];
  notes: string[];
}

export interface AdminMapHotspotResolutionResult {
  hotspotId: string;
  action: "reconciled_coordinates" | "enabled_selector" | "enabled_route";
  message: string;
}

type LocationCoverageRecord = AdminLocationRecord & {
  is_selector_active: boolean;
  is_navigable: boolean;
  is_landing_enabled: boolean;
};

const HOTSPOT_PRIORITY: Record<AdminMapGovernanceIssue, number> = {
  missing_coordinates: 1,
  needs_refinement: 2,
  group_without_members: 3,
  route_disabled: 4,
  selector_hidden: 5,
};

function hasCoordinates(metadata: Record<string, unknown> | null | undefined): boolean {
  if (!metadata) return false;
  return metadata.center_latitude != null && metadata.center_longitude != null;
}

function getCoordinatesSource(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const source = metadata?.coordinates_source;
  return typeof source === "string" && source.trim().length > 0 ? source : null;
}

function resolveProviderHost(styleUrl: string): string {
  try {
    return new URL(styleUrl).host;
  } catch {
    return styleUrl;
  }
}

function issueLabel(issue: AdminMapGovernanceIssue): string {
  switch (issue) {
    case "missing_coordinates":
      return "Sem coordenadas";
    case "needs_refinement":
      return "Coordenadas pedem refinamento";
    case "selector_hidden":
      return "Oculto do seletor";
    case "route_disabled":
      return "Rota publica desativada";
    case "group_without_members":
      return "Grupo sem membros";
    default:
      return "Nao informado";
  }
}

function layerSource(layerKey: string): { source: string; route: string; note: string } {
  switch (layerKey) {
    case "businesses":
      return {
        source: "BusinessService.getBusinesses",
        route: "/mapa",
        note: "Camada principal de descoberta comercial do mapa.",
      };
    case "gastronomy":
      return {
        source: "gastronomyMapService.getByBounds",
        route: "/mapa",
        note: "Camada de gastronomia dedicada, derivada do vertical oficial.",
      };
    case "events":
      return {
        source: "EventsService.getByBounds",
        route: "/mapa",
        note: "Eventos entram por viewport e projection canonica.",
      };
    case "alerts":
      return {
        source: "communityAlertService.getBySpatialRadius",
        route: "/mapa",
        note: "Alertas comunitarios entram por bounds e territorio.",
      };
    case "tourist_points":
      return {
        source: "useTouristPointsByBounds / TouristPointService.list",
        route: "/mapa",
        note: "Pontos turisticos aparecem como camada transversal do mapa.",
      };
    case "mobility":
      return {
        source: "AdminMobilityService.getOperationalSnapshot",
        route: "/admin/mapa",
        note: "Mobilidade operacional permanece em superficie administrativa dedicada.",
      };
    default:
      return {
        source: "Nao catalogado",
        route: "/mapa",
        note: "Camada sem mapeamento administrativo explicito.",
      };
  }
}

function createLocationCoverageRecord(
  location: AdminLocationRecord,
  visibilityNode?: TerritoryNode,
): LocationCoverageRecord {
  return {
    ...location,
    is_selector_active:
      visibilityNode?.is_selector_active ?? location.metadata?.is_selector_active === true,
    is_navigable:
      visibilityNode?.is_navigable ?? location.metadata?.is_navigable !== false,
    is_landing_enabled:
      visibilityNode?.is_landing_enabled ?? location.metadata?.is_landing_enabled !== false,
  };
}

function buildLocationHotspots(location: LocationCoverageRecord): AdminMapGovernanceHotspot[] {
  if (location.type === "country") {
    return [];
  }

  const hotspots: AdminMapGovernanceHotspot[] = [];
  const metadata = location.metadata ?? {};
  const coordinates = hasCoordinates(metadata);
  const needsRefinement = metadata.coordinates_needs_refinement === true;
  const coordinatesSource = getCoordinatesSource(metadata);
  const isActive = location.status === "active";

  const push = (issue: AdminMapGovernanceIssue) => {
    hotspots.push({
      id: `location:${location.id}:${issue}`,
      entityKind: "location",
      entityId: location.id,
      name: location.name,
      scope: location.type,
      geographicPath: location.geographic_path,
      issue,
      issueLabel: issueLabel(issue),
      status: location.status,
      selectorVisible: location.is_selector_active,
      navigable: location.is_navigable,
      hasCoordinates: coordinates,
      coordinatesSource,
      needsRefinement,
      memberCount: null,
      anchorCityName: null,
    });
  };

  if (isActive && !coordinates) {
    push("missing_coordinates");
  }

  if (isActive && coordinates && needsRefinement) {
    push("needs_refinement");
  }

  if (isActive && !location.is_selector_active && ["state", "city", "district"].includes(location.type)) {
    push("selector_hidden");
  }

  if (isActive && !location.is_navigable && ["city", "district"].includes(location.type)) {
    push("route_disabled");
  }

  return hotspots;
}

function buildGroupHotspots(group: TerritoryNode): AdminMapGovernanceHotspot[] {
  const hotspots: AdminMapGovernanceHotspot[] = [];
  const isActive = group.status === "active";

  const push = (issue: AdminMapGovernanceIssue) => {
    hotspots.push({
      id: `group:${group.id}:${issue}`,
      entityKind: "group",
      entityId: group.id,
      name: group.name,
      scope: "group",
      geographicPath: null,
      issue,
      issueLabel: issueLabel(issue),
      status: group.status,
      selectorVisible: group.is_selector_active,
      navigable: group.is_navigable,
      hasCoordinates: null,
      coordinatesSource: null,
      needsRefinement: false,
      memberCount: group.member_count ?? null,
      anchorCityName: group.anchor_city_name ?? null,
    });
  };

  if ((group.member_count ?? 0) === 0) {
    push("group_without_members");
  }

  if (isActive && !group.is_selector_active) {
    push("selector_hidden");
  }

  if (isActive && !group.is_navigable) {
    push("route_disabled");
  }

  return hotspots;
}

function compareHotspots(
  left: AdminMapGovernanceHotspot,
  right: AdminMapGovernanceHotspot,
): number {
  const leftPriority = HOTSPOT_PRIORITY[left.issue];
  const rightPriority = HOTSPOT_PRIORITY[right.issue];

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.name.localeCompare(right.name);
}

async function listTouristPointsByStatus(status: TouristPointPublicationStatus): Promise<TouristPoint[]> {
  const { data, error } = await supabase
    .from("tourist_points")
    .select("id, category, latitude, longitude")
    .eq("status", status);

  if (error) {
    logger.error("AdminMapGovernanceService.listTouristPointsByStatus", error);
    return [];
  }

  return (data || []) as TouristPoint[];
}

class AdminMapGovernanceService {
  async resolveHotspot(
    hotspot: Pick<AdminMapGovernanceHotspot, "id" | "entityKind" | "entityId" | "issue" | "name">,
  ): Promise<AdminMapHotspotResolutionResult> {
    switch (hotspot.issue) {
      case "missing_coordinates":
      case "needs_refinement":
        return this.reconcileLocationCoordinates(hotspot.id, hotspot.entityId);
      case "selector_hidden":
        await TerritorialManagementService.updateMetadataFlag(
          hotspot.entityKind === "group" ? "territorial_groups" : "locations",
          hotspot.entityId,
          "is_selector_active",
          true,
        );
        return {
          hotspotId: hotspot.id,
          action: "enabled_selector",
          message: `${hotspot.name}: seletor territorial reabilitado no runtime canonico.`,
        };
      case "route_disabled":
        await TerritorialManagementService.updateMetadataFlag(
          hotspot.entityKind === "group" ? "territorial_groups" : "locations",
          hotspot.entityId,
          "is_navigable",
          true,
        );
        return {
          hotspotId: hotspot.id,
          action: "enabled_route",
          message: `${hotspot.name}: navegacao publica reabilitada no runtime canonico.`,
        };
      case "group_without_members":
        throw new Error(
          "Grupo sem membros exige curadoria estrutural em /admin/territory-management.",
        );
      default:
        throw new Error("Hotspot administrativo sem acao de resolucao registrada.");
    }
  }

  private async reconcileLocationCoordinates(
    hotspotId: string,
    locationId: string,
  ): Promise<AdminMapHotspotResolutionResult> {
    const location = await locationAdminService.getLocationById(locationId);

    if (!location) {
      throw new Error("Location nao encontrado para reconciliacao de coordenadas.");
    }

    const results = await locationGeocodingService.geocode({
      query: location.full_name,
      country: "BR",
      limit: 1,
    });

    const result = results[0];

    if (!result) {
      throw new Error("Geocoding nao retornou coordenadas para reconciliar o hotspot.");
    }

    await locationAdminService.updateLocation(locationId, {
      metadata: {
        ...(location.metadata ?? {}),
        center_latitude: result.coordinates.latitude,
        center_longitude: result.coordinates.longitude,
        coordinates_source: result.source,
        coordinates_confidence: "high",
        coordinates_needs_refinement: false,
        coordinates_updated_at: new Date().toISOString(),
      },
    });

    return {
      hotspotId,
      action: "reconciled_coordinates",
      message: `${location.name}: coordenadas reconciliadas via ${result.source}.`,
    };
  }

  async getSnapshot(): Promise<AdminMapGovernanceSnapshot> {
    try {
      const [locations, territoryTree, publishedPoints, draftPoints, archivedPoints] =
        await Promise.all([
          locationAdminService.listLocations(),
          TerritorialManagementService.fetchTerritoryTree(),
          listTouristPointsByStatus(TouristPointPublicationStatus.PUBLISHED),
          listTouristPointsByStatus(TouristPointPublicationStatus.DRAFT),
          listTouristPointsByStatus(TouristPointPublicationStatus.ARCHIVED),
        ]);

      const visibilityMap = new Map(
        territoryTree.locations.map((item) => [item.id, item]),
      );

      const mergedLocations = locations.map((location) =>
        createLocationCoverageRecord(location, visibilityMap.get(location.id)),
      );

      const allTouristPoints = [...publishedPoints, ...draftPoints, ...archivedPoints];
      const mappedTouristPoints = publishedPoints.filter((point) =>
        Boolean(point.latitude != null && point.longitude != null),
      );

      const hotspots = [
        ...mergedLocations.flatMap(buildLocationHotspots),
        ...territoryTree.groups.flatMap(buildGroupHotspots),
      ].sort(compareHotspots);

      const providers: AdminMapProviderSummary[] = [
        {
          id: "tiles",
          label: "Tiles",
          owner: "MapProvider",
          status: "official",
          detail: `Provider oficial atual: ${resolveProviderHost(DEFAULT_TILE_STYLE.styleUrl)}. Camera padrao em [${DEFAULT_CAMERA.center.join(", ")}] com zoom ${DEFAULT_CAMERA.zoom}.`,
        },
        {
          id: "geocoding",
          label: "Geocoding",
          owner: "LocationGeocodingService",
          status: "compatibility",
          detail: "Maps consome geocoding via MapGeocodingAdapter, mas o SSOT real esta em core/location.",
        },
        {
          id: "projection",
          label: "Projection",
          owner: "MapEntityProjectionService",
          status: "official",
          detail: "Projecao canonica de business, eventos, alertas e pontos turisticos para MapMarker.",
        },
        {
          id: "territory",
          label: "Territorio",
          owner: "core/location + core/territorial",
          status: "official",
          detail: "Mapa respeita TerritoryFilter, TerritoryPolygon e visibilidade administrativa de locations e grupos.",
        },
      ];

      const layers: AdminMapLayerSummary[] = MAP_RUNTIME_LAYER_KEYS.map((layerKey) => {
        const { source, route, note } = layerSource(layerKey);
        return {
          key: layerKey,
          label: getLayerConfig(layerKey).label,
          source,
          route,
          status: "official",
          note,
        };
      });

      const coverage: AdminMapCoverageSummary[] = [
        ...(["country", "state", "city", "district"] as const).map((scope) => {
          const scoped = mergedLocations.filter((location) => location.type === scope);
          return {
            scope,
            total: scoped.length,
            active: scoped.filter((item) => item.status === "active").length,
            mapped: scoped.filter((item) => hasCoordinates(item.metadata)).length,
            selectorVisible: scoped.filter((item) => item.is_selector_active).length,
            navigable: scoped.filter((item) => item.is_navigable).length,
            needsRefinement: scoped.filter(
              (item) => item.metadata?.coordinates_needs_refinement === true,
            ).length,
          };
        }),
        {
          scope: "group",
          total: territoryTree.groups.length,
          active: territoryTree.groups.filter((item) => item.status === "active").length,
          mapped: null,
          selectorVisible: territoryTree.groups.filter((item) => item.is_selector_active).length,
          navigable: territoryTree.groups.filter((item) => item.is_navigable).length,
          needsRefinement: null,
        },
      ];

      const touristPointCategories: AdminMapTouristPointCategorySummary[] = Object.entries(
        publishedPoints.reduce<Record<string, TouristPoint[]>>((acc, point) => {
          const bucket = acc[point.category] ?? [];
          bucket.push(point);
          acc[point.category] = bucket;
          return acc;
        }, {}),
      )
        .map(([category, items]) => ({
          category,
          label: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category,
          total: items.length,
          mapped: items.filter(
            (item) => item.latitude != null && item.longitude != null,
          ).length,
        }))
        .sort((left, right) => right.total - left.total)
        .slice(0, 6);

      const attentionItems =
        hotspots.length +
        providers.filter((item) => item.status !== "official").length +
        MAP_PRODUCT_SURFACES.filter((item) => item.status !== "official").length;

      const notes = [
        MAP_PRODUCT_SURFACES.find((surface) => surface.status === "attention")?.note,
        hotspots.some((item) => item.issue === "missing_coordinates")
          ? "Ha territorios ativos sem centro geografico definido, o que degrada centralizacao, busca e experiencias contextuais."
          : null,
        hotspots.some((item) => item.issue === "group_without_members")
          ? "Existem grupos territoriais sem membros, o que cria cobertura administrativa sem produto operacional correspondente."
          : null,
      ].filter(Boolean) as string[];

      return {
        stats: {
          totalLocations: mergedLocations.length,
          mappedLocations: mergedLocations.filter((item) =>
            hasCoordinates(item.metadata),
          ).length,
          locationsNeedingRefinement: mergedLocations.filter(
            (item) => item.metadata?.coordinates_needs_refinement === true,
          ).length,
          visibleTerritories:
            mergedLocations.filter((item) => item.is_selector_active).length +
            territoryTree.groups.filter((item) => item.is_selector_active).length,
          navigableTerritories:
            mergedLocations.filter((item) => item.is_navigable).length +
            territoryTree.groups.filter((item) => item.is_navigable).length,
          totalGroups: territoryTree.groups.length,
          touristPointsTotal: allTouristPoints.length,
          touristPointsMapped: mappedTouristPoints.length,
          touristPointsNonPublic: draftPoints.length + archivedPoints.length,
          attentionItems,
        },
        providers,
        layers,
        coverage,
        touristPointCategories,
        hotspots,
        surfaces: MAP_PRODUCT_SURFACES,
        notes,
      };
    } catch (error) {
      logger.error("AdminMapGovernanceService.getSnapshot", error);

      return {
        stats: {
          totalLocations: 0,
          mappedLocations: 0,
          locationsNeedingRefinement: 0,
          visibleTerritories: 0,
          navigableTerritories: 0,
          totalGroups: 0,
          touristPointsTotal: 0,
          touristPointsMapped: 0,
          touristPointsNonPublic: 0,
          attentionItems: 0,
        },
        providers: [],
        layers: [],
        coverage: [],
        touristPointCategories: [],
        hotspots: [],
        surfaces: MAP_PRODUCT_SURFACES,
        notes: [],
      };
    }
  }
}

export const adminMapGovernanceService = new AdminMapGovernanceService();

