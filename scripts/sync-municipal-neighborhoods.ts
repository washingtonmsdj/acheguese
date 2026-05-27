import https from "node:https";
import { config } from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import {
  MUNICIPAL_NEIGHBORHOOD_SOURCES,
  type MunicipalNeighborhoodSource,
} from "./location/municipal-neighborhood-sources";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

type JsonObject = Record<string, unknown>;

interface ArcGisFeature {
  attributes?: Record<string, unknown>;
  geometry?: {
    rings?: number[][][];
  };
}

interface ArcGisQueryResponse {
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  error?: {
    message?: string;
    details?: string[];
  };
}

interface LocationRow {
  id: string;
  parent_id: string | null;
  type: "country" | "state" | "city" | "district" | "neighborhood";
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  status: "active" | "inactive";
  metadata: JsonObject | null;
}

interface NeighborhoodPayload {
  parent_id: string;
  type: "neighborhood";
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  status: "active";
  metadata: JsonObject;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = new Set(process.argv.slice(2));
const selectedKeyArg = process.argv.find((arg) => arg.startsWith("--source="));
const selectedSourceKey = selectedKeyArg?.split("=")[1];
const selectedCityArg = process.argv.find((arg) => arg.startsWith("--city="));
const selectedCityPath = selectedCityArg?.split("=")[1];
const shouldDeactivateStale = !args.has("--keep-stale");
const shouldListSources = args.has("--list-sources");

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function asNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function getGeometryBounds(geometry: ArcGisFeature["geometry"]) {
  const points = geometry?.rings?.flat() ?? [];
  const validPoints = points.filter(
    (point) => Number.isFinite(point[0]) && Number.isFinite(point[1]),
  );

  if (validPoints.length === 0) return null;

  const lngValues = validPoints.map((point) => point[0]);
  const latValues = validPoints.map((point) => point[1]);
  const west = Math.min(...lngValues);
  const east = Math.max(...lngValues);
  const south = Math.min(...latValues);
  const north = Math.max(...latValues);

  return {
    west,
    south,
    east,
    north,
    center_latitude: (south + north) / 2,
    center_longitude: (west + east) / 2,
  };
}

function getStateCityFromPath(cityPath: string): { stateSlug: string; citySlug: string } {
  const parts = cityPath.split("/").filter(Boolean);
  if (parts.length !== 3) {
    throw new Error(`cityPath invalido: ${cityPath}`);
  }

  return { stateSlug: parts[1], citySlug: parts[2] };
}

function getOutFields(source: MunicipalNeighborhoodSource): string {
  return [
    source.objectIdField,
    source.nameField,
    source.officeField,
    source.areaField,
    source.lengthField,
  ]
    .filter(Boolean)
    .join(",");
}

async function fetchArcGisFeatures(source: MunicipalNeighborhoodSource): Promise<ArcGisFeature[]> {
  const pageSize = 2000;
  const features: ArcGisFeature[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: getOutFields(source),
      returnGeometry: "true",
      outSR: "4326",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      f: "json",
    });
    const url = `${source.serviceUrl}/query?${params.toString()}`;
    const response = await fetch(url, {
      agent: new https.Agent({ rejectUnauthorized: false }),
    });

    if (!response.ok) {
      throw new Error(`Falha ao buscar ${source.key}: HTTP ${response.status}`);
    }

    const payload = (await response.json()) as ArcGisQueryResponse;
    if (payload.error) {
      throw new Error(
        `ArcGIS retornou erro para ${source.key}: ${payload.error.message ?? "erro sem mensagem"}`,
      );
    }

    const page = payload.features ?? [];
    features.push(...page);

    if (page.length < pageSize && !payload.exceededTransferLimit) {
      break;
    }

    offset += pageSize;
  }

  return features;
}

async function findCity(cityPath: string): Promise<LocationRow> {
  const { data, error } = await supabase
    .from("locations")
    .select("id,parent_id,type,slug,name,full_name,geographic_path,status,metadata")
    .eq("geographic_path", cityPath)
    .eq("type", "city")
    .maybeSingle();

  if (error) {
    throw new Error(`Erro ao resolver cidade ${cityPath}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Cidade nao encontrada em locations: ${cityPath}`);
  }

  return data as LocationRow;
}

async function fetchCityChildren(cityId: string): Promise<LocationRow[]> {
  const rows: LocationRow[] = [];
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("locations")
      .select("id,parent_id,type,slug,name,full_name,geographic_path,status,metadata")
      .eq("parent_id", cityId)
      .in("type", ["district", "neighborhood"])
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Erro ao carregar filhos da cidade ${cityId}: ${error.message}`);
    }

    const page = (data ?? []) as LocationRow[];
    rows.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function buildPayloads(
  source: MunicipalNeighborhoodSource,
  city: LocationRow,
  features: ArcGisFeature[],
): NeighborhoodPayload[] {
  const { stateSlug, citySlug } = getStateCityFromPath(source.cityPath);
  const slugUsage = new Map<string, number>();

  return features
    .map((feature) => {
      const attributes = feature.attributes ?? {};
      const name = asText(attributes[source.nameField]);
      const objectId = asText(attributes[source.objectIdField]);
      if (!name) return null;

      const baseSlug = slugify(name);
      const nextUsage = (slugUsage.get(baseSlug) ?? 0) + 1;
      slugUsage.set(baseSlug, nextUsage);
      const slug = nextUsage === 1 ? baseSlug : `${baseSlug}-${objectId || nextUsage}`;
      const bounds = getGeometryBounds(feature.geometry);

      return {
        parent_id: city.id,
        type: "neighborhood" as const,
        slug,
        name,
        full_name: `${name}, ${city.name}`,
        geographic_path: `/br/${stateSlug}/${citySlug}/${slug}`,
        status: "active" as const,
        metadata: {
          source: source.key,
          source_name: source.sourceName,
          source_url: source.serviceUrl,
          source_level: "municipal_neighborhood",
          source_object_id: objectId || null,
          prefeitura_bairro: source.officeField ? asText(attributes[source.officeField]) || null : null,
          area_m2: source.areaField ? asNumber(attributes[source.areaField]) : null,
          perimeter_m: source.lengthField ? asNumber(attributes[source.lengthField]) : null,
          center_latitude: bounds?.center_latitude ?? null,
          center_longitude: bounds?.center_longitude ?? null,
          boundary_bbox: bounds
            ? {
                west: bounds.west,
                south: bounds.south,
                east: bounds.east,
                north: bounds.north,
              }
            : null,
          synced_at: new Date().toISOString(),
        },
      };
    })
    .filter((payload): payload is NeighborhoodPayload => Boolean(payload));
}

async function upsertNeighborhood(
  existingBySlug: Map<string, LocationRow>,
  payload: NeighborhoodPayload,
): Promise<"inserted" | "updated" | "converted"> {
  const existing = existingBySlug.get(payload.slug);

  if (!existing) {
    const { error } = await supabase.from("locations").insert(payload);
    if (error) {
      throw new Error(`Erro ao inserir bairro ${payload.name}: ${error.message}`);
    }
    return "inserted";
  }

  const existingMetadata = (existing.metadata ?? {}) as JsonObject;
  if (existing.type === "district" && existingMetadata.ibge_district_id) {
    throw new Error(
      `Conflito protegido: ${payload.geographic_path} ja existe como distrito IBGE.`,
    );
  }

  const { error } = await supabase
    .from("locations")
    .update({
      ...payload,
      metadata: {
        ...existingMetadata,
        ...payload.metadata,
        previous_location_type:
          existing.type === "neighborhood"
            ? existingMetadata.previous_location_type ?? null
            : existing.type,
      },
    })
    .eq("id", existing.id);

  if (error) {
    throw new Error(`Erro ao atualizar bairro ${payload.name}: ${error.message}`);
  }

  return existing.type === "district" ? "converted" : "updated";
}

async function deactivateStaleLocalities(
  source: MunicipalNeighborhoodSource,
  existingChildren: LocationRow[],
  officialSlugs: Set<string>,
): Promise<number> {
  if (!shouldDeactivateStale) return 0;

  const staleRows = existingChildren.filter((row) => {
    if (officialSlugs.has(row.slug)) return false;
    if (row.status !== "active") return false;

    const metadata = (row.metadata ?? {}) as JsonObject;
    if (row.type === "district" && metadata.ibge_district_id) return false;
    return row.type === "district" || row.type === "neighborhood";
  });

  for (const row of staleRows) {
    const metadata = (row.metadata ?? {}) as JsonObject;
    const { error } = await supabase
      .from("locations")
      .update({
        status: "inactive",
        metadata: {
          ...metadata,
          deactivated_by: source.key,
          deactivated_at: new Date().toISOString(),
          deactivation_reason: "municipal_neighborhood_source_not_found",
        },
      })
      .eq("id", row.id);

    if (error) {
      throw new Error(`Erro ao desativar localidade legada ${row.name}: ${error.message}`);
    }
  }

  return staleRows.length;
}

async function syncSource(source: MunicipalNeighborhoodSource): Promise<void> {
  console.log(`Sincronizando bairros municipais: ${source.key}`);

  const [city, features] = await Promise.all([
    findCity(source.cityPath),
    fetchArcGisFeatures(source),
  ]);
  const existingChildren = await fetchCityChildren(city.id);
  const existingBySlug = new Map(existingChildren.map((row) => [row.slug, row]));
  const payloads = buildPayloads(source, city, features);
  const officialSlugs = new Set(payloads.map((payload) => payload.slug));

  let inserted = 0;
  let updated = 0;
  let converted = 0;

  for (const payload of payloads) {
    const result = await upsertNeighborhood(existingBySlug, payload);
    if (result === "inserted") inserted += 1;
    if (result === "updated") updated += 1;
    if (result === "converted") converted += 1;
  }

  const deactivated = await deactivateStaleLocalities(
    source,
    existingChildren,
    officialSlugs,
  );

  console.log(
    [
      `Fonte: ${source.sourceName}`,
      `Bairros recebidos: ${features.length}`,
      `Bairros validos: ${payloads.length}`,
      `Inseridos: ${inserted}`,
      `Atualizados: ${updated}`,
      `Convertidos de district para neighborhood: ${converted}`,
      `Legados desativados: ${deactivated}`,
    ].join("\n"),
  );
}

async function run(): Promise<void> {
  if (shouldListSources) {
    for (const source of MUNICIPAL_NEIGHBORHOOD_SOURCES) {
      console.log(`${source.key}\t${source.cityPath}\t${source.sourceName}`);
    }
    return;
  }

  let sources = MUNICIPAL_NEIGHBORHOOD_SOURCES;
  if (selectedSourceKey) {
    sources = sources.filter((source) => source.key === selectedSourceKey);
  }
  if (selectedCityPath) {
    sources = sources.filter((source) => source.cityPath === selectedCityPath);
  }

  if (sources.length === 0) {
    throw new Error(
      `Fonte municipal nao cadastrada para os filtros informados: source=${selectedSourceKey ?? "*"} city=${selectedCityPath ?? "*"}`,
    );
  }

  for (const source of sources) {
    await syncSource(source);
  }
}

run().catch((error) => {
  console.error("Falha na sincronizacao de bairros municipais:", error);
  process.exitCode = 1;
});
