import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAuthenticatedUser } from "../_shared/businessAuth.ts";
import {
  MobilityCreationAuthorizationError,
  MobilityCreationValidationError,
  requireDeliveryCreationAuthority,
  requireEffectiveMobilityRollout,
  requireGastronomyOrderSourceBinding,
  requireRequestingProfile,
  type MobilityDeliverySourceType,
} from "../_shared/mobilityCreationAuthorization.ts";
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
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DELIVERY_SOURCE_TYPES = new Set([
  "passenger",
  "business",
  "gastronomy",
  "service",
]);
const PACKAGE_SIZES = new Set(["small", "medium", "large"]);

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

type MobilityCreateAction = "createRide" | "createDelivery";

type QuoteRow = {
  id: string;
  passenger_profile_id: string;
  mode: "ride" | "motoboy";
  pickup_location_id: string;
  expires_at: string;
  consumed_at: string | null;
  consumed_by_ride_id: string | null;
};

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_REGEX.test(value)) {
    throw new MobilityCreationValidationError(`Invalid ${field}`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requireUuid(value, field);
}

function optionalTrimmedString(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new MobilityCreationValidationError(`Invalid ${field}`);
  }
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new MobilityCreationValidationError(`${field} is too long`);
  }
  return normalized;
}

function requireTrimmedString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  const normalized = optionalTrimmedString(value, field, maxLength);
  if (!normalized) {
    throw new MobilityCreationValidationError(`Invalid ${field}`);
  }
  return normalized;
}

function optionalTimestamp(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new MobilityCreationValidationError(`Invalid ${field}`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new MobilityCreationValidationError(`Invalid ${field}`);
  }
  return parsed.toISOString();
}

function optionalInteger(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new MobilityCreationValidationError(`Invalid ${field}`);
  }
  return value;
}

async function loadQuote(quoteId: string): Promise<QuoteRow> {
  const { data, error } = await supabaseAdmin
    .from("mobility_price_quotes")
    .select(
      "id, passenger_profile_id, mode, pickup_location_id, expires_at, consumed_at, consumed_by_ride_id",
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new MobilityCreationValidationError("Mobility price quote was not found");
  }

  const quote = data as QuoteRow;
  if (quote.consumed_at || quote.consumed_by_ride_id) {
    throw new MobilityCreationValidationError("Mobility price quote was already consumed");
  }

  const expiresAt = new Date(quote.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    throw new MobilityCreationValidationError("Mobility price quote has expired");
  }

  return quote;
}

async function createRide(
  userId: string,
  params: Record<string, unknown>,
) {
  const quote = await loadQuote(requireUuid(params.quoteId, "quoteId"));
  if (quote.mode !== "ride") {
    throw new MobilityCreationValidationError("Quote mode does not match ride creation");
  }

  await requireRequestingProfile(
    supabaseAdmin,
    userId,
    quote.passenger_profile_id,
  );
  await requireEffectiveMobilityRollout(
    supabaseAdmin,
    quote.pickup_location_id,
    false,
  );

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_create_ride_atomic",
    {
      p_quote_id: quote.id,
      p_origin: optionalTrimmedString(params.origin, "origin", 500),
      p_destination: optionalTrimmedString(params.destination, "destination", 500),
      p_available_seats:
        optionalInteger(params.availableSeats, "availableSeats", 1, 8) ?? 1,
      p_observation: optionalTrimmedString(params.observation, "observation", 1000),
      p_payment_method: optionalTrimmedString(
        params.paymentMethod,
        "paymentMethod",
        80,
      ),
      p_departure_time: optionalTimestamp(params.departureTime, "departureTime"),
    },
  );

  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("Ride creation returned no receipt");
  }
  return data;
}

async function createDelivery(
  userId: string,
  params: Record<string, unknown>,
) {
  const quote = await loadQuote(requireUuid(params.quoteId, "quoteId"));
  if (quote.mode !== "motoboy") {
    throw new MobilityCreationValidationError(
      "Quote mode does not match delivery creation",
    );
  }

  const sourceType =
    typeof params.sourceType === "string" ? params.sourceType : "";
  if (!DELIVERY_SOURCE_TYPES.has(sourceType)) {
    throw new MobilityCreationValidationError("Invalid sourceType");
  }

  const sourceId = optionalUuid(params.sourceId, "sourceId");
  const authoritySourceId = optionalUuid(
    params.authorizationSourceId ?? sourceId,
    "authorizationSourceId",
  );

  await requireEffectiveMobilityRollout(
    supabaseAdmin,
    quote.pickup_location_id,
    true,
  );

  const businessAuthority = await requireDeliveryCreationAuthority(
    supabaseAdmin,
    userId,
    sourceType as MobilityDeliverySourceType,
    authoritySourceId,
    quote.passenger_profile_id,
  );

  if (sourceType === "gastronomy") {
    await requireGastronomyOrderSourceBinding(
      supabaseAdmin,
      sourceId,
      businessAuthority,
    );
  }

  const packageSize =
    typeof params.packageSize === "string" ? params.packageSize : "small";
  if (!PACKAGE_SIZES.has(packageSize)) {
    throw new MobilityCreationValidationError("Invalid packageSize");
  }

  const { data, error } = await supabaseAdmin.rpc(
    "mobility_create_delivery_atomic",
    {
      p_quote_id: quote.id,
      p_source_type: sourceType,
      p_source_id: sourceId,
      p_recipient_name: requireTrimmedString(
        params.recipientName,
        "recipientName",
        200,
      ),
      p_recipient_phone: optionalTrimmedString(
        params.recipientPhone,
        "recipientPhone",
        80,
      ),
      p_delivery_notes: optionalTrimmedString(
        params.deliveryNotes,
        "deliveryNotes",
        1000,
      ),
      p_package_description: optionalTrimmedString(
        params.packageDescription,
        "packageDescription",
        1000,
      ),
      p_package_size: packageSize,
      p_origin: optionalTrimmedString(params.origin, "origin", 500),
      p_destination: optionalTrimmedString(params.destination, "destination", 500),
      p_observation: optionalTrimmedString(params.observation, "observation", 1000),
      p_payment_method: optionalTrimmedString(
        params.paymentMethod,
        "paymentMethod",
        80,
      ),
      p_departure_time: optionalTimestamp(params.departureTime, "departureTime"),
    },
  );

  if (error) throw error;
  if (!data || typeof data !== "object") {
    throw new Error("Delivery creation returned no receipt");
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
    30,
    60_000,
    ALLOWED_METHODS,
  );
  if (perimeterLimit) return perimeterLimit;

  const auth = await requireAuthenticatedUser(req, supabaseAdmin);
  if (auth instanceof Response) return auth;

  const body = await readJsonBody<RequestBody>(req, {
    maxBytes: 24_576,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const action = body.data.action as MobilityCreateAction | undefined;
  if (action !== "createRide" && action !== "createDelivery") {
    return respond({ error: "Unsupported mobility creation action" }, 400);
  }

  try {
    const params = body.data.params ?? {};
    const data =
      action === "createRide"
        ? await createRide(auth.user.id, params)
        : await createDelivery(auth.user.id, params);
    return respond({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mobility creation failed";
    console.error("[mobility-create-rpc] creation failed", {
      action,
      errorName: error instanceof Error ? error.name : "unknown",
    });

    if (error instanceof MobilityCreationAuthorizationError) {
      return respond({ error: message }, 403);
    }
    if (error instanceof MobilityCreationValidationError) {
      return respond({ error: message }, 400);
    }

    return respond({ error: "Unable to create mobility operation" }, 500);
  }
});
