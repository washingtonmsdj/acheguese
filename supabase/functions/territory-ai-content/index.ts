import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getSupabaseAdminClient,
  requireAdmin,
} from "../_shared/adminAuth.ts";
import {
  auditLog,
  checkRateLimit,
  getAllSecurityHeaders,
  getAuditInfo,
  isOriginAllowed,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const FUNCTION_NAME = "territory-ai-content";
const MAX_BODY_BYTES = 32_768;

const ADMIN_COLUMNS = [
  "id",
  "territory_slug",
  "territory_name",
  "description",
  "history",
  "demographics",
  "events",
  "ai_generated_at",
  "manually_edited_at",
  "is_manual_override",
  "created_at",
  "updated_at",
].join(",");

const ACTIONS = {
  get: true,
  generate: true,
  update: true,
} as const;

type Action = keyof typeof ACTIONS;
type Params = Record<string, unknown>;
type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

interface RequestBody {
  action?: string;
  params?: Params;
}

interface TerritoryEvent {
  name: string;
  description: string;
  frequency: string;
  category: "cultura" | "esporte" | "religioso" | "comunitário";
}

interface TerritoryDemographics {
  estimated_population?: number;
  area_km2?: number;
  density?: string;
  main_characteristics?: string[];
  infrastructure?: string[];
  economy?: string;
}

interface TerritoryContext {
  territoryName: string;
  cityName: string;
  members: string[];
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSlugCharacter(character: string): boolean {
  const code = character.charCodeAt(0);
  const isDigit = code >= 48 && code <= 57;
  const isLowercaseLetter = code >= 97 && code <= 122;
  return isDigit || isLowercaseLetter || character === "-";
}

function isValidTerritorySlug(slug: string): boolean {
  if (slug.length < 2 || slug.length > 120) return false;
  if (slug.startsWith("-") || slug.endsWith("-") || slug.includes("--")) {
    return false;
  }
  return Array.from(slug).every(isSlugCharacter);
}

function cleanSlug(value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid territory_slug");
  }

  const slug = value.trim().toLowerCase();
  if (!isValidTerritorySlug(slug)) {
    throw new RequestValidationError("Invalid territory_slug");
  }

  return slug;
}

function cleanNullableText(
  value: unknown,
  field: string,
  maxLength: number,
): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`${field} is too long`);
  }

  return normalized || null;
}

function cleanOptionalString(
  value: unknown,
  field: string,
  maxLength: number,
): string | undefined {
  return cleanNullableText(value, field, maxLength) ?? undefined;
}

function cleanOptionalNumber(
  value: unknown,
  field: string,
  max: number,
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  ) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxLength: number,
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const cleaned = value.map((item) => {
    if (typeof item !== "string") {
      throw new RequestValidationError(`Invalid ${field}`);
    }

    const normalized = item.trim();
    if (!normalized || normalized.length > maxLength) {
      throw new RequestValidationError(`Invalid ${field}`);
    }

    return normalized;
  });

  return [...new Set(cleaned)];
}

function cleanDemographics(value: unknown): TerritoryDemographics {
  if (!isRecord(value)) {
    throw new RequestValidationError("Invalid demographics");
  }

  return {
    estimated_population: cleanOptionalNumber(
      value.estimated_population,
      "estimated_population",
      100_000_000,
    ),
    area_km2: cleanOptionalNumber(value.area_km2, "area_km2", 1_000_000),
    density: cleanOptionalString(value.density, "density", 240),
    main_characteristics: cleanStringArray(
      value.main_characteristics,
      "main_characteristics",
      20,
      160,
    ),
    infrastructure: cleanStringArray(
      value.infrastructure,
      "infrastructure",
      30,
      200,
    ),
    economy: cleanOptionalString(value.economy, "economy", 2_000),
  };
}

function cleanCategory(value: unknown): TerritoryEvent["category"] {
  const normalized = value === "comunitario" ? "comunitário" : value;
  if (
    normalized === "cultura" ||
    normalized === "esporte" ||
    normalized === "religioso" ||
    normalized === "comunitário"
  ) {
    return normalized;
  }

  throw new RequestValidationError("Invalid event category");
}

function cleanEvents(value: unknown): TerritoryEvent[] {
  if (!Array.isArray(value) || value.length > 30) {
    throw new RequestValidationError("Invalid events");
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new RequestValidationError("Invalid event");
    }

    const name = cleanNullableText(item.name, "event name", 180);
    if (!name) {
      throw new RequestValidationError("Invalid event name");
    }

    return {
      name,
      description:
        cleanNullableText(item.description, "event description", 1_000) ?? "",
      frequency:
        cleanNullableText(item.frequency, "event frequency", 120) ?? "",
      category: cleanCategory(item.category),
    };
  });
}

function cleanEditorialContent(params: Params) {
  return {
    description: cleanNullableText(params.description, "description", 8_000),
    history: cleanNullableText(params.history, "history", 8_000),
    demographics: cleanDemographics(params.demographics),
    events: cleanEvents(params.events),
  };
}

function parseAction(body: RequestBody): { action: Action; params: Params } {
  if (typeof body.action !== "string" || !(body.action in ACTIONS)) {
    throw new RequestValidationError("Invalid action");
  }

  if (!isRecord(body.params)) {
    throw new RequestValidationError("Invalid params");
  }

  return {
    action: body.action as Action,
    params: body.params,
  };
}

async function resolveTerritoryContext(
  supabaseAdmin: AdminClient,
  territorySlug: string,
): Promise<TerritoryContext> {
  const { data: group, error: groupError } = await supabaseAdmin
    .from("territorial_groups")
    .select("id,slug,name,anchor_city_id,status")
    .eq("slug", territorySlug)
    .maybeSingle();

  if (groupError) throw groupError;
  if (!group || group.status !== "active") {
    throw new RequestValidationError("Territory group not found or inactive");
  }

  const [
    { data: city, error: cityError },
    { data: memberRows, error: membersError },
  ] = await Promise.all([
    supabaseAdmin
      .from("locations")
      .select("name,status")
      .eq("id", group.anchor_city_id)
      .maybeSingle(),
    supabaseAdmin
      .from("territorial_group_members")
      .select("locations(name,status)")
      .eq("group_id", group.id),
  ]);

  if (cityError) throw cityError;
  if (membersError) throw membersError;
  if (!city || city.status !== "active") {
    throw new RequestValidationError("Anchor city not found or inactive");
  }

  const members = (memberRows ?? [])
    .map((row) => {
      const location = row.locations as
        | { name?: unknown; status?: unknown }
        | { name?: unknown; status?: unknown }[]
        | null;
      const resolved = Array.isArray(location) ? location[0] : location;
      return resolved?.status === "active" && typeof resolved.name === "string"
        ? resolved.name.trim()
        : "";
    })
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .slice(0, 30);

  return {
    territoryName: group.name,
    cityName: city.name,
    members,
  };
}

async function getAdminContent(
  supabaseAdmin: AdminClient,
  territorySlug: string,
) {
  await resolveTerritoryContext(supabaseAdmin, territorySlug);

  const { data, error } = await supabaseAdmin
    .from("territory_ai_content")
    .select(ADMIN_COLUMNS)
    .eq("territory_slug", territorySlug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

function normalizeGeneratedPayload(value: unknown) {
  if (!isRecord(value)) {
    throw new Error("AI response is not an object");
  }

  return {
    description: cleanNullableText(value.description, "description", 8_000),
    history: cleanNullableText(value.history, "history", 8_000),
    demographics: cleanDemographics(value.demographics ?? {}),
    events: cleanEvents(value.events ?? []),
  };
}

async function generateContent(
  supabaseAdmin: AdminClient,
  territorySlug: string,
) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY")?.trim() ?? "";
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  const context = await resolveTerritoryContext(supabaseAdmin, territorySlug);
  const membersText = context.members.length
    ? `O território é formado pelos bairros/localidades: ${context.members.join(", ")}.`
    : "";

  const prompt = `Você é um especialista em geografia urbana e cultura local no Brasil.
Gere informações factuais e úteis sobre o território "${context.territoryName}", localizado em ${context.cityName}.
${membersText}

Retorne JSON puro, sem markdown, exatamente com esta estrutura:
{
  "description": "Descrição geral do território em 2-3 parágrafos",
  "history": "História do território em 1-2 parágrafos",
  "demographics": {
    "estimated_population": 0,
    "area_km2": 0,
    "density": "descrição",
    "main_characteristics": ["característica"],
    "infrastructure": ["item"],
    "economy": "descrição breve"
  },
  "events": [
    {
      "name": "nome",
      "description": "descrição breve",
      "frequency": "frequência",
      "category": "cultura|esporte|religioso|comunitário"
    }
  ]
}

Não invente precisão quando não houver base suficiente. Omita dados incertos e não inclua dados pessoais.`;

  const aiResponse = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Responda em JSON puro. Priorize informação urbana factual e não inclua dados pessoais.",
          },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      throw new RequestValidationError("AI rate limit exceeded");
    }
    if (aiResponse.status === 402) {
      throw new RequestValidationError("AI workspace requires funds");
    }

    console.error(
      "[territory-ai-content] AI gateway error",
      aiResponse.status,
    );
    throw new Error("AI gateway error");
  }

  const aiData = await aiResponse.json();
  const rawContent = aiData?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string") {
    throw new Error("AI response missing content");
  }

  const serialized = rawContent
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("AI response is not valid JSON");
  }

  const generated = normalizeGeneratedPayload(parsed);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("territory_ai_content")
    .upsert(
      {
        territory_slug: territorySlug,
        territory_name: context.territoryName,
        ...generated,
        ai_generated_at: now,
        manually_edited_at: null,
        is_manual_override: false,
        updated_at: now,
      },
      { onConflict: "territory_slug" },
    )
    .select(ADMIN_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

async function updateContent(
  supabaseAdmin: AdminClient,
  territorySlug: string,
  params: Params,
) {
  const context = await resolveTerritoryContext(supabaseAdmin, territorySlug);
  const editorial = cleanEditorialContent(params);
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("territory_ai_content")
    .upsert(
      {
        territory_slug: territorySlug,
        territory_name: context.territoryName,
        ...editorial,
        is_manual_override: true,
        manually_edited_at: now,
        updated_at: now,
      },
      { onConflict: "territory_slug" },
    )
    .select(ADMIN_COLUMNS)
    .single();

  if (error) throw error;
  return data;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const origin = req.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return jsonResponse(
      { error: "Origin not allowed" },
      403,
      ALLOWED_METHODS,
      req,
    );
  }

  const perimeterLimit = await rateLimitMiddleware(
    req,
    120,
    60_000,
    ALLOWED_METHODS,
  );
  if (perimeterLimit) return perimeterLimit;

  const auth = await requireAdmin(req, ALLOWED_METHODS);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  let action: Action;
  let params: Params;
  let territorySlug: string;

  try {
    ({ action, params } = parseAction(rawBody.data ?? {}));
    territorySlug = cleanSlug(params.territory_slug);
  } catch (error) {
    return jsonResponse(
      {
        error:
          error instanceof RequestValidationError
            ? error.message
            : "Invalid request",
      },
      400,
      ALLOWED_METHODS,
      req,
    );
  }

  const actionLimit = await checkRateLimit(
    `territory-ai:${action}:${auth.userId}`,
    action === "generate" ? 10 : 120,
    action === "generate" ? 60 * 60 * 1000 : 60 * 1000,
  );
  if (!actionLimit.allowed) {
    return jsonResponse(
      { error: "Rate limit exceeded" },
      429,
      ALLOWED_METHODS,
      req,
    );
  }

  const supabaseAdmin = getSupabaseAdminClient();

  try {
    const data =
      action === "get"
        ? await getAdminContent(supabaseAdmin, territorySlug)
        : action === "update"
          ? await updateContent(supabaseAdmin, territorySlug, params)
          : await generateContent(supabaseAdmin, territorySlug);

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `territory_ai_${action}`,
      resource: FUNCTION_NAME,
      status: "success",
      details: { territorySlug },
      ...getAuditInfo(req),
    });

    return jsonResponse({ data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    const isValidation = error instanceof RequestValidationError;

    console.error("[territory-ai-content]", action, error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `territory_ai_${action}`,
      resource: FUNCTION_NAME,
      status: "failure",
      details: {
        territorySlug,
        reason: isValidation ? error.message : "operation_failed",
      },
      ...getAuditInfo(req),
    });

    return jsonResponse(
      {
        error: isValidation ? error.message : "Internal server error",
      },
      isValidation ? 400 : 500,
      ALLOWED_METHODS,
      req,
    );
  }
});
