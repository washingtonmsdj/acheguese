/**
 * Edge Function: admin-highlights-rpc
 *
 * Admin-only lifecycle broker for territorial_highlights.
 * Public clients read only active/current editorial rows through RLS.
 * All complete-list and mutation authority remains service_role-owned here.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";
import {
  getSupabaseAdminClient,
  requireAdmin,
} from "../_shared/adminAuth.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_BODY_BYTES = 20_000;

const ACTIONS = {
  listAll: true,
  getById: true,
  create: true,
  update: true,
  delete: true,
} as const;

const HIGHLIGHT_TYPES = new Set([
  "business",
  "service",
  "classified",
  "event",
  "creator",
  "notice",
]);

const TERRITORY_TYPES = new Set(["location", "group"]);
const HIGHLIGHT_STATUSES = new Set(["active", "inactive"]);

const PUBLIC_COLUMNS = [
  "id",
  "territory_type",
  "territory_ref_id",
  "highlight_type",
  "entity_id",
  "title",
  "subtitle",
  "image_url",
  "cta_label",
  "cta_url",
  "position",
  "status",
  "starts_at",
  "ends_at",
  "created_at",
  "updated_at",
].join(",");

type Action = keyof typeof ACTIONS;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface HighlightInput {
  territory_type: "location" | "group";
  territory_ref_id: string;
  highlight_type: string;
  entity_id: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  position: number;
  status: "active" | "inactive";
  starts_at: string | null;
  ends_at: string | null;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders(ALLOWED_METHODS, req);
}

function cleanRequiredText(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return trimmed;
}

function cleanOptionalText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return trimmed;
}

function cleanUuid(value: unknown, field: string): string {
  if (!isValidUUID(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value as string;
}

function cleanOptionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  return cleanUuid(value, field);
}

function cleanTerritoryType(value: unknown): "location" | "group" {
  if (typeof value !== "string" || !TERRITORY_TYPES.has(value)) {
    throw new RequestValidationError("Invalid territory type");
  }
  return value as "location" | "group";
}

function cleanHighlightType(value: unknown): string {
  if (typeof value !== "string" || !HIGHLIGHT_TYPES.has(value)) {
    throw new RequestValidationError("Invalid highlight type");
  }
  return value;
}

function cleanStatus(value: unknown): "active" | "inactive" {
  if (typeof value !== "string" || !HIGHLIGHT_STATUSES.has(value)) {
    throw new RequestValidationError("Invalid highlight status");
  }
  return value as "active" | "inactive";
}

function cleanPosition(value: unknown): number {
  const position =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : 0;

  if (
    !Number.isInteger(position) ||
    position < 0 ||
    position > 10_000
  ) {
    throw new RequestValidationError("Invalid highlight position");
  }

  return position;
}

function cleanOptionalDate(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return new Date(timestamp).toISOString();
}

function cleanOptionalUrl(
  value: unknown,
  field: string,
  allowRelative: boolean,
): string | null {
  const text = cleanOptionalText(value, field, 2_048);
  if (!text) return null;

  if (allowRelative && text.startsWith("/")) return text;

  let parsed: URL;
  try {
    parsed = new URL(text);
  } catch {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return parsed.toString();
}

function assertDateOrder(startsAt: string | null, endsAt: string | null): void {
  if (
    startsAt &&
    endsAt &&
    new Date(startsAt).getTime() >= new Date(endsAt).getTime()
  ) {
    throw new RequestValidationError(
      "Highlight start must be before highlight end",
    );
  }
}

function assertCtaPair(label: string | null, url: string | null): void {
  if (Boolean(label) !== Boolean(url)) {
    throw new RequestValidationError(
      "Highlight CTA label and URL must be provided together",
    );
  }
}

function normalizeCreate(params: Record<string, unknown>): HighlightInput {
  const input: HighlightInput = {
    territory_type: cleanTerritoryType(params.territory_type),
    territory_ref_id: cleanUuid(params.territory_ref_id, "territory ref id"),
    highlight_type: cleanHighlightType(params.highlight_type),
    entity_id: cleanOptionalUuid(params.entity_id, "entity id"),
    title: cleanRequiredText(params.title, "title", 160),
    subtitle: cleanOptionalText(params.subtitle, "subtitle", 500),
    image_url: cleanOptionalUrl(params.image_url, "image URL", true),
    cta_label: cleanOptionalText(params.cta_label, "CTA label", 80),
    cta_url: cleanOptionalUrl(params.cta_url, "CTA URL", true),
    position: cleanPosition(params.position),
    status: cleanStatus(params.status ?? "active"),
    starts_at: cleanOptionalDate(params.starts_at, "starts at"),
    ends_at: cleanOptionalDate(params.ends_at, "ends at"),
  };

  assertDateOrder(input.starts_at, input.ends_at);
  assertCtaPair(input.cta_label, input.cta_url);
  return input;
}

function normalizeUpdate(
  existing: HighlightInput,
  params: Record<string, unknown>,
): HighlightInput {
  const next: HighlightInput = {
    territory_type:
      params.territory_type === undefined
        ? existing.territory_type
        : cleanTerritoryType(params.territory_type),
    territory_ref_id:
      params.territory_ref_id === undefined
        ? existing.territory_ref_id
        : cleanUuid(params.territory_ref_id, "territory ref id"),
    highlight_type:
      params.highlight_type === undefined
        ? existing.highlight_type
        : cleanHighlightType(params.highlight_type),
    entity_id:
      params.entity_id === undefined
        ? existing.entity_id
        : cleanOptionalUuid(params.entity_id, "entity id"),
    title:
      params.title === undefined
        ? existing.title
        : cleanRequiredText(params.title, "title", 160),
    subtitle:
      params.subtitle === undefined
        ? existing.subtitle
        : cleanOptionalText(params.subtitle, "subtitle", 500),
    image_url:
      params.image_url === undefined
        ? existing.image_url
        : cleanOptionalUrl(params.image_url, "image URL", true),
    cta_label:
      params.cta_label === undefined
        ? existing.cta_label
        : cleanOptionalText(params.cta_label, "CTA label", 80),
    cta_url:
      params.cta_url === undefined
        ? existing.cta_url
        : cleanOptionalUrl(params.cta_url, "CTA URL", true),
    position:
      params.position === undefined
        ? existing.position
        : cleanPosition(params.position),
    status:
      params.status === undefined
        ? existing.status
        : cleanStatus(params.status),
    starts_at:
      params.starts_at === undefined
        ? existing.starts_at
        : cleanOptionalDate(params.starts_at, "starts at"),
    ends_at:
      params.ends_at === undefined
        ? existing.ends_at
        : cleanOptionalDate(params.ends_at, "ends at"),
  };

  assertDateOrder(next.starts_at, next.ends_at);
  assertCtaPair(next.cta_label, next.cta_url);
  return next;
}

async function requireTerritory(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  territoryType: "location" | "group",
  territoryRefId: string,
): Promise<void> {
  const query =
    territoryType === "location"
      ? supabaseAdmin
          .from("locations")
          .select("id")
          .eq("id", territoryRefId)
          .maybeSingle()
      : supabaseAdmin
          .from("territorial_groups")
          .select("id")
          .eq("id", territoryRefId)
          .maybeSingle();

  const { data, error } = await query;

  if (error) throw error;
  if (!data) {
    throw new RequestValidationError("Territory not found");
  }
}

function rowToInput(row: Record<string, unknown>): HighlightInput {
  return normalizeCreate({
    territory_type: row.territory_type,
    territory_ref_id: row.territory_ref_id,
    highlight_type: row.highlight_type,
    entity_id: row.entity_id,
    title: row.title,
    subtitle: row.subtitle,
    image_url: row.image_url,
    cta_label: row.cta_label,
    cta_url: row.cta_url,
    position: row.position,
    status: row.status,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
  });
}

async function getById(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  id: string,
) {
  const { data, error } = await supabaseAdmin
    .from("territorial_highlights")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function executeAction(
  action: Action,
  params: Record<string, unknown>,
) {
  const supabaseAdmin = getSupabaseAdminClient();

  if (action === "listAll") {
    const territoryType = cleanTerritoryType(params.territory_type);
    const territoryRefId = cleanUuid(
      params.territory_ref_id,
      "territory ref id",
    );

    const { data, error } = await supabaseAdmin
      .from("territorial_highlights")
      .select(PUBLIC_COLUMNS)
      .eq("territory_type", territoryType)
      .eq("territory_ref_id", territoryRefId)
      .order("position", { ascending: true })
      .order("starts_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  if (action === "getById") {
    const id = cleanUuid(params.id, "highlight id");
    return await getById(supabaseAdmin, id);
  }

  if (action === "create") {
    const input = normalizeCreate(params);
    await requireTerritory(
      supabaseAdmin,
      input.territory_type,
      input.territory_ref_id,
    );

    const { data, error } = await supabaseAdmin
      .from("territorial_highlights")
      .insert(input)
      .select(PUBLIC_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  }

  if (action === "update") {
    const id = cleanUuid(params.id, "highlight id");
    const existing = await getById(supabaseAdmin, id);
    if (!existing) {
      throw new RequestValidationError("Highlight not found");
    }

    const next = normalizeUpdate(
      rowToInput(existing as Record<string, unknown>),
      params,
    );
    await requireTerritory(
      supabaseAdmin,
      next.territory_type,
      next.territory_ref_id,
    );

    const { data, error } = await supabaseAdmin
      .from("territorial_highlights")
      .update(next)
      .eq("id", id)
      .select(PUBLIC_COLUMNS)
      .single();

    if (error) throw error;
    return data;
  }

  const id = cleanUuid(params.id, "highlight id");
  const { data, error } = await supabaseAdmin
    .from("territorial_highlights")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  return { removed: Boolean(data?.id) };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders(req) });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    80,
    60_000,
    ALLOWED_METHODS,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req, ALLOWED_METHODS);
  if (auth instanceof Response) return auth;

  const body = await readJsonBody<RequestBody>(req, {
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const action = body.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: "Invalid action" }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as Action;
  const params =
    typeof body.data.params === "object" && body.data.params !== null
      ? body.data.params
      : {};

  try {
    const data = await executeAction(safeAction, params);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_highlights_${safeAction}`,
      resource: "admin-highlights-rpc",
      status: "success",
      details: {
        highlightId:
          typeof params.id === "string" ? params.id : undefined,
        territoryType:
          typeof params.territory_type === "string"
            ? params.territory_type
            : undefined,
        territoryRefId:
          typeof params.territory_ref_id === "string"
            ? params.territory_ref_id
            : undefined,
      },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error("[admin-highlights-rpc]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `admin_highlights_${safeAction}`,
      resource: "admin-highlights-rpc",
      status: "failure",
      details: { reason: "operation_failed" },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      { error: "Internal server error" },
      500,
      ALLOWED_METHODS,
      req,
    );
  }
});
