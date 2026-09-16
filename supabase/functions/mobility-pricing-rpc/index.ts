import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthenticatedUser } from "../_shared/businessAuth.ts";
import {
  getAllSecurityHeaders,
  isOriginAllowed,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")?.trim() ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_PROFILE_REGEX = /^[a-z0-9_-]{1,32}$/i;
const MODES = new Set(["ride", "motoboy"]);
const ROUTING_TIMEOUT_MS = 5_000;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase server credentials are not configured");
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type RequestBody = {
  action?: string;
  params?: Record<string, unknown>;
};

type QuoteParams = {
  passengerProfileId: string;
  mode: "ride" | "motoboy";
  pickupAddressId: string;
  dropoffAddressId: string;
};

type CanonicalAddressRow = {
  id: string;
  location_id: string;
  latitude: number | string | null;
  longitude: number | string | null;
};

type CanonicalRoute = {
  pickupLocationId: string;
  dropoffLocationId: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
};

type PricingRuleRow = {
  id: string;
  metadata: Record<string, unknown> | null;
};

type OsrmResponse = {
  code?: string;
  routes?: Array<{ distance?: number; duration?: number }>;
};

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function parseQuoteParams(params: Record<string, unknown>): QuoteParams {
  const mode = typeof params.mode === "string" ? params.mode : "";
  if (!MODES.has(mode)) throw new Error("Invalid mode");

  return {
    passengerProfileId: requireUuid(params.passengerProfileId, "passengerProfileId"),
    mode: mode as QuoteParams["mode"],
    pickupAddressId: requireUuid(params.pickupAddressId, "pickupAddressId"),
    dropoffAddressId: requireUuid(params.dropoffAddressId, "dropoffAddressId"),
  };
}

function normalizeCanonicalCoordinate(
  value: number | string | null,
  field: string,
  min: number,
  max: number,
): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`Canonical address is missing valid ${field}`);
  }
  return parsed;
}

function commercialRoutingBaseUrl(): string {
  const raw = Deno.env.get("MOBILITY_ROUTING_BASE_URL")?.trim() ?? "";
  if (!raw) throw new Error("Commercial routing is not configured");

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("Commercial routing URL is invalid");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Commercial routing must use HTTPS");
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "router.project-osrm.org" || hostname === "demo.project-osrm.org") {
    throw new Error("Public OSRM demo cannot authorize commercial mobility quotes");
  }

  return raw.replace(/\/+$/, "");
}

async function requireOwnedProfile(userId: string, profileId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Passenger profile is not owned by authenticated user");
}

async function loadCanonicalRoute(params: QuoteParams): Promise<CanonicalRoute> {
  const { data, error } = await supabaseAdmin
    .from("addresses")
    .select("id, location_id, latitude, longitude")
    .in("id", [params.pickupAddressId, params.dropoffAddressId]);

  if (error) throw error;
  const rows = (data ?? []) as CanonicalAddressRow[];
  const pickup = rows.find((row) => row.id === params.pickupAddressId) ?? null;
  const dropoff = rows.find((row) => row.id === params.dropoffAddressId) ?? null;

  if (!pickup || !dropoff) {
    throw new Error("Canonical pickup or dropoff address was not found");
  }
  if (!pickup.location_id || !dropoff.location_id) {
    throw new Error("Canonical address is not linked to a territory");
  }

  return {
    pickupLocationId: pickup.location_id,
    dropoffLocationId: dropoff.location_id,
    originLat: normalizeCanonicalCoordinate(pickup.latitude, "pickup latitude", -90, 90),
    originLng: normalizeCanonicalCoordinate(pickup.longitude, "pickup longitude", -180, 180),
    destinationLat: normalizeCanonicalCoordinate(dropoff.latitude, "dropoff latitude", -90, 90),
    destinationLng: normalizeCanonicalCoordinate(dropoff.longitude, "dropoff longitude", -180, 180),
  };
}

async function requireEffectiveMobilityRollout(locationId: string): Promise<void> {
  let currentLocationId: string | null = locationId;

  for (let depth = 0; depth < 16 && currentLocationId; depth += 1) {
    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("id, parent_id, status")
      .eq("id", currentLocationId)
      .maybeSingle();

    if (locationError) throw locationError;
    if (!location) throw new Error("Pickup location was not found");
    if (depth === 0 && location.status !== "active") {
      throw new Error("Mobility is unavailable in an inactive location");
    }

    if (location.status === "active") {
      const { data: rollout, error: rolloutError } = await supabaseAdmin
        .from("module_rollouts")
        .select("status, config")
        .eq("module_key", "mobility")
        .eq("location_id", currentLocationId)
        .maybeSingle();

      if (rolloutError) throw rolloutError;
      if (rollout) {
        if (rollout.status !== "active") {
          throw new Error("Mobility rollout is disabled for this location");
        }
        return;
      }
    }

    currentLocationId = typeof location.parent_id === "string" ? location.parent_id : null;
  }

  throw new Error("Mobility rollout is not active for this location");
}

async function loadApprovedPricingRule(mode: QuoteParams["mode"]): Promise<PricingRuleRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("pricing_rules")
    .select("id, metadata")
    .eq("mode", mode)
    .eq("is_active", true)
    .eq("metadata->>commercial_status", "approved")
    .or(`valid_from.is.null,valid_from.lte.${now}`)
    .or(`valid_until.is.null,valid_until.gte.${now}`)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error(`Commercial pricing is not approved for mode ${mode}`);
  return data as PricingRuleRow;
}

function requireRoutingProfile(rule: PricingRuleRow): string {
  const value = rule.metadata?.routing_profile;
  if (typeof value !== "string" || !SAFE_PROFILE_REGEX.test(value)) {
    throw new Error("Approved pricing rule is missing a valid routing_profile");
  }
  return value;
}

async function calculateAuthoritativeRoute(
  route: CanonicalRoute,
  routingProfile: string,
): Promise<{ distanceMeters: number; durationSeconds: number }> {
  const baseUrl = commercialRoutingBaseUrl();
  const coordinates = `${route.originLng},${route.originLat};${route.destinationLng},${route.destinationLat}`;
  const url = `${baseUrl}/route/v1/${encodeURIComponent(routingProfile)}/${coordinates}?overview=false&steps=false`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ROUTING_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Achegue-se-Mobility-Pricing/1.0" },
    });
    if (!response.ok) {
      throw new Error(`Commercial routing returned HTTP ${response.status}`);
    }

    const payload = (await response.json()) as OsrmResponse;
    const routeResult = payload.code === "Ok" && Array.isArray(payload.routes)
      ? payload.routes[0]
      : undefined;
    const distanceMeters = Math.round(Number(routeResult?.distance));
    const durationSeconds = Math.round(Number(routeResult?.duration));

    if (
      !Number.isFinite(distanceMeters) ||
      distanceMeters <= 0 ||
      distanceMeters > 2_000_000 ||
      !Number.isFinite(durationSeconds) ||
      durationSeconds <= 0 ||
      durationSeconds > 172_800
    ) {
      throw new Error("Commercial routing returned invalid route metrics");
    }

    return { distanceMeters, durationSeconds };
  } finally {
    clearTimeout(timeout);
  }
}

async function issueQuote(userId: string, rawParams: Record<string, unknown>) {
  const params = parseQuoteParams(rawParams);
  await requireOwnedProfile(userId, params.passengerProfileId);

  const canonicalRoute = await loadCanonicalRoute(params);
  await requireEffectiveMobilityRollout(canonicalRoute.pickupLocationId);

  const rule = await loadApprovedPricingRule(params.mode);
  const routingProfile = requireRoutingProfile(rule);
  const routeMetrics = await calculateAuthoritativeRoute(canonicalRoute, routingProfile);

  const { data, error } = await supabaseAdmin.rpc("mobility_issue_price_quote", {
    p_passenger_profile_id: params.passengerProfileId,
    p_mode: params.mode,
    p_pickup_address_id: params.pickupAddressId,
    p_dropoff_address_id: params.dropoffAddressId,
    p_pickup_location_id: canonicalRoute.pickupLocationId,
    p_dropoff_location_id: canonicalRoute.dropoffLocationId,
    p_origin_lat: canonicalRoute.originLat,
    p_origin_lng: canonicalRoute.originLng,
    p_destination_lat: canonicalRoute.destinationLat,
    p_destination_lng: canonicalRoute.destinationLng,
    p_distance_meters: routeMetrics.distanceMeters,
    p_duration_seconds: routeMetrics.durationSeconds,
    p_routing_provider: "osrm",
    p_routing_profile: routingProfile,
  });

  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("Quote issuer returned no data");
  }
  return data;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const respond = (body: unknown, status = 200) =>
    jsonResponse(body, status, ALLOWED_METHODS, req);

  const origin = req.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return respond({ error: "Origin not allowed" }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const perimeterLimit = await rateLimitMiddleware(
    req,
    60,
    60_000,
    ALLOWED_METHODS,
  );
  if (perimeterLimit) return perimeterLimit;

  const auth = await requireAuthenticatedUser(req, supabaseAdmin);
  if (auth instanceof Response) return auth;

  const body = await readJsonBody<RequestBody>(req, {
    maxBytes: 16_384,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  if (body.data.action !== "quote") {
    return respond({ error: "Unsupported mobility pricing action" }, 400);
  }

  try {
    const data = await issueQuote(auth.user.id, body.data.params ?? {});
    return respond({ data });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Mobility pricing unavailable";
    const unavailable =
      message.includes("not approved") ||
      message.includes("not configured") ||
      message.includes("Public OSRM demo") ||
      message.includes("routing_profile") ||
      message.includes("Canonical address") ||
      message.includes("unsupported by quote engine");

    console.error("[mobility-pricing-rpc] quote failed", { message });
    return respond(
      {
        error: unavailable
          ? "Commercial mobility pricing is not available"
          : "Unable to issue mobility quote",
      },
      unavailable ? 503 : 400,
    );
  }
});
