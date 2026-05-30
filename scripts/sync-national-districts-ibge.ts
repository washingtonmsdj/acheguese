import { config } from "dotenv";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", override: false });
config({ path: ".env", override: false });

type JsonObject = Record<string, unknown>;

interface IbgeDistrictRow {
  "distrito-id": number;
  "distrito-nome": string;
  "municipio-id": number;
  "municipio-nome": string;
  "UF-sigla": string;
  "UF-nome": string;
}

interface LocationRow {
  id: string;
  parent_id: string | null;
  type: string;
  slug: string;
  name: string;
  geographic_path?: string;
  metadata: JsonObject | null;
}

interface DistrictPayload {
  id?: string;
  parent_id: string;
  type: "district";
  slug: string;
  name: string;
  full_name: string;
  geographic_path: string;
  status: "active";
  metadata: JsonObject;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const IBGE_DISTRICTS_URL = readRequiredEnv("IBGE_DISTRICTS_URL");
const NOMINATIM_BASE_URL = readRequiredHttpsBaseUrl("NOMINATIM_BASE_URL");
const NOMINATIM_USER_AGENT = readRequiredEnv("NOMINATIM_USER_AGENT");
const NOMINATIM_DEFAULT_FORMAT = readRequiredEnv("NOMINATIM_DEFAULT_FORMAT");
const NOMINATIM_DEFAULT_LIMIT = readRequiredEnv("NOMINATIM_DEFAULT_LIMIT");
const NOMINATIM_DEFAULT_COUNTRY_NAME = readRequiredEnv("NOMINATIM_DEFAULT_COUNTRY_NAME");

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error(
    "Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Defina ${name}.`);
  return value;
}

function readRequiredHttpsBaseUrl(name: string): string {
  const value = readRequiredEnv(name).replace(/\/+$/, "");
  const parsed = new URL(value);
  if (parsed.protocol !== "https:") {
    throw new Error(`${name} deve usar HTTPS.`);
  }

  return parsed.toString().replace(/\/+$/, "");
}

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

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

async function fetchAllLocationsByType(type: "state" | "city" | "district"): Promise<LocationRow[]> {
  const pageSize = 1000;
  const all: LocationRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("locations")
      .select("id,parent_id,type,slug,name,geographic_path,metadata")
      .eq("type", type)
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Erro ao buscar locations(${type}) [${from}-${from + pageSize - 1}]: ${error.message}`);
    }

    const page = (data ?? []) as LocationRow[];
    if (page.length === 0) break;
    all.push(...page);
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

async function fetchIbgeDistricts(): Promise<IbgeDistrictRow[]> {
  const response = await fetch(IBGE_DISTRICTS_URL);

  if (!response.ok) {
    throw new Error(`Falha ao buscar distritos do IBGE: HTTP ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error("Resposta inválida do IBGE para distritos.");
  }

  return data as IbgeDistrictRow[];
}

async function geocodeMunicipalityCenter(
  cityName: string,
  ufName: string,
): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${cityName}, ${ufName}, ${NOMINATIM_DEFAULT_COUNTRY_NAME}`);
  const url =
    `${NOMINATIM_BASE_URL}/search` +
    `?format=${encodeURIComponent(NOMINATIM_DEFAULT_FORMAT)}` +
    `&limit=${encodeURIComponent(NOMINATIM_DEFAULT_LIMIT)}` +
    `&q=${query}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": NOMINATIM_USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = payload[0];
  const lat = Number(first?.lat);
  const lng = Number(first?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

async function run(): Promise<void> {
  console.log("Iniciando sincronização nacional de distritos (IBGE)...");

  const [states, cities, existingDistricts, ibgeDistricts] = await Promise.all([
    fetchAllLocationsByType("state"),
    fetchAllLocationsByType("city"),
    fetchAllLocationsByType("district"),
    fetchIbgeDistricts(),
  ]);

  console.log(`Estados carregados: ${states.length}`);
  console.log(`Cidades carregadas: ${cities.length}`);
  console.log(`Distritos IBGE recebidos: ${ibgeDistricts.length}`);

  const stateById = new Map(states.map((state) => [state.id, state]));
  const stateBySlug = new Map(states.map((state) => [state.slug.toLowerCase(), state]));
  const cityByIbgeCode = new Map<string, LocationRow>();
  const cityByStateAndName = new Map<string, LocationRow>();

  for (const city of cities) {
    const metadata = (city.metadata ?? {}) as JsonObject;
    const ibgeCode = String(metadata.ibge_code ?? "").trim();
    if (ibgeCode) {
      cityByIbgeCode.set(ibgeCode, city);
    }

    const parentState = city.parent_id ? stateById.get(city.parent_id) : null;
    const stateSlug = parentState?.slug?.toLowerCase() ?? "";
    if (stateSlug) {
      cityByStateAndName.set(`${stateSlug}:${normalizeText(city.name)}`, city);
    }
  }

  const districtByIbgeId = new Map<string, LocationRow>();
  for (const district of existingDistricts) {
    const metadata = (district.metadata ?? {}) as JsonObject;
    const ibgeDistrictId = String(metadata.ibge_district_id ?? "").trim();
    if (ibgeDistrictId) {
      districtByIbgeId.set(ibgeDistrictId, district);
    }
  }

  const slugUsageByCity = new Map<string, Set<string>>();
  const toInsert: DistrictPayload[] = [];
  const toUpdate: DistrictPayload[] = [];
  const missingCityRefs: string[] = [];
  const resolvedCitiesByMunicipio = new Map<string, LocationRow>();

  const resolveMissingCity = async (
    ufSlug: string,
    municipioNome: string,
    municipioId: string,
  ): Promise<LocationRow | null> => {
    if (resolvedCitiesByMunicipio.has(municipioId)) {
      return resolvedCitiesByMunicipio.get(municipioId) ?? null;
    }

    const state = stateBySlug.get(ufSlug);
    if (!state) return null;

    const center = await geocodeMunicipalityCenter(municipioNome, state.name);
    if (!center) return null;

    const baseCitySlug = slugify(municipioNome) || `cidade-${municipioId}`;
    const citySlug = `${baseCitySlug}-${municipioId}`;
    const geographicPath = `/br/${ufSlug}/${citySlug}`;

    const { error: upsertError } = await supabase.from("locations").upsert(
      {
        parent_id: state.id,
        type: "city",
        slug: citySlug,
        name: municipioNome,
        full_name: `${municipioNome}, ${state.name}, Brasil`,
        geographic_path: geographicPath,
        status: "active",
        metadata: {
          ibge_code: municipioId,
          state_code: ufSlug.toUpperCase(),
          country_code: "BR",
          center_latitude: center.lat,
          center_longitude: center.lng,
          seed_source: "ibge_localidades_distritos_city_fallback",
        },
      },
      { onConflict: "geographic_path", ignoreDuplicates: false },
    );

    if (upsertError) return null;

    const { data: cityRow, error: cityError } = await supabase
      .from("locations")
      .select("id,parent_id,type,slug,name,geographic_path,metadata")
      .eq("geographic_path", geographicPath)
      .maybeSingle();

    if (cityError || !cityRow) return null;

    const resolved = cityRow as LocationRow;
    resolvedCitiesByMunicipio.set(municipioId, resolved);
    cityByIbgeCode.set(municipioId, resolved);
    cityByStateAndName.set(`${ufSlug}:${normalizeText(municipioNome)}`, resolved);
    return resolved;
  };

  for (const row of ibgeDistricts) {
    const ibgeDistrictId = String(row["distrito-id"]);
    const ibgeMunicipioId = String(row["municipio-id"]);
    const ufSlug = String(row["UF-sigla"]).toLowerCase();
    const districtName = String(row["distrito-nome"]).trim();

    let city =
      cityByIbgeCode.get(ibgeMunicipioId) ??
      cityByStateAndName.get(`${ufSlug}:${normalizeText(String(row["municipio-nome"]))}`);

    if (!city) {
      city = await resolveMissingCity(
        ufSlug,
        String(row["municipio-nome"]),
        ibgeMunicipioId,
      );
      if (!city) {
        missingCityRefs.push(`${ibgeMunicipioId}:${row["municipio-nome"]}/${row["UF-sigla"]}`);
        continue;
      }
    }

    const cityUsageKey = city.id;
    const usedSlugs = slugUsageByCity.get(cityUsageKey) ?? new Set<string>();
    slugUsageByCity.set(cityUsageKey, usedSlugs);

    const baseSlug = slugify(districtName) || `distrito-${ibgeDistrictId}`;
    let slug = baseSlug;
    if (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${ibgeDistrictId.slice(-4)}`;
    }
    usedSlugs.add(slug);

    const payload: DistrictPayload = {
      parent_id: city.id,
      type: "district",
      slug,
      name: districtName,
      full_name: `${districtName}, ${city.name}, ${String(row["UF-sigla"]).toUpperCase()}, Brasil`,
      geographic_path: `/br/${ufSlug}/${city.slug}/${slug}`,
      status: "active",
      metadata: {
        ibge_district_id: ibgeDistrictId,
        ibge_municipio_id: ibgeMunicipioId,
        ibge_uf: String(row["UF-sigla"]).toUpperCase(),
        ibge_uf_name: String(row["UF-nome"]),
        source: "ibge_localidades_distritos",
        source_level: "district",
        synced_at: new Date().toISOString(),
      },
    };

    const existing = districtByIbgeId.get(ibgeDistrictId);
    if (existing) {
      payload.id = existing.id;
      toUpdate.push(payload);
    } else {
      toInsert.push(payload);
    }
  }

  if (missingCityRefs.length > 0) {
    console.warn(`Distritos ignorados por cidade não encontrada: ${missingCityRefs.length}`);
    console.warn(`Exemplo: ${missingCityRefs.slice(0, 5).join(" | ")}`);
  }

  console.log(`Distritos para atualizar: ${toUpdate.length}`);
  console.log(`Distritos para inserir: ${toInsert.length}`);

  for (const batch of chunk(toUpdate, 500)) {
    const { error } = await supabase
      .from("locations")
      .upsert(batch, { onConflict: "id", ignoreDuplicates: false });
    if (error) {
      throw new Error(`Erro no upsert de atualização de distritos: ${error.message}`);
    }
  }

  for (const batch of chunk(toInsert, 500)) {
    const { error } = await supabase
      .from("locations")
      .upsert(batch, { onConflict: "geographic_path", ignoreDuplicates: false });
    if (error) {
      throw new Error(`Erro no upsert de inserção de distritos: ${error.message}`);
    }
  }

  const { count, error: countError } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true })
    .eq("type", "district");

  if (countError) {
    throw new Error(`Erro ao contar distritos após sincronização: ${countError.message}`);
  }

  console.log(`Sincronização concluída. Total de distritos ativos em locations: ${count ?? 0}`);
}

run().catch((error) => {
  console.error("Falha na sincronização de distritos IBGE:", error);
  process.exitCode = 1;
});
