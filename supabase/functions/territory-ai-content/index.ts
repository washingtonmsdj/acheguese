import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  auditLog,
  checkRateLimit,
  getAllSecurityHeaders,
  getAuditInfo,
  isOriginAllowed,
  jsonResponse,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";
import {
  getSupabaseAdminClient,
  requireAdmin,
} from "../_shared/adminAuth.ts";

const ALLOWED_METHODS = "POST, OPTIONS";
const MAX_BODY_BYTES = 32_000;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")?.trim() ?? "";

const ACTIONS = {
  get: true,
  update: true,
  generate: true,
} as const;

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

const EVENT_CATEGORIES = new Set([
  "cultura",
  "esporte",
  "religioso",
  "comunitário",
]);

type Action = keyof typeof ACTIONS;

interface RequestBody {
  action?: string;
  params?: Record<string, unknown>;
}

interface CanonicalTerritory {
  id: string;
  slug: string;
  name: string;
  members: string[];
}

interface TerritoryEvent {
  name: string;
  description: string;
  frequency: string;
  category: string;
}

interface TerritoryDemographics {
  estimated_population?: number;
  area_km2?: number;
  density?: string;
  main_characteristics?: string[];
  infrastructure?: string[];
  economy?: string;
}

interface EditorialContent {
  description: string | null;
  history: string | null;
  demographics: TerritoryDemographics;
  events: TerritoryEvent[];
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RequestValidationError";
  }
}

function respond(
  req: Request,
  body: Record<string, unknown>,
  status = 200,
): Response {
  return jsonResponse(body, status, ALLOWED_METHODS, req);
}

function cleanSlug(value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid territory slug");
  }

  const slug = value.trim().toLowerCase();
  if (
    !slug ||
    slug.length > 120 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  ) {
    throw new RequestValidationError("Invalid territory slug");
  }

  return slug;
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

  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  return normalized;
}

function cleanOptionalNumber(
  value: unknown,
  field: string,
  max: number,
): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  if (value < 0 || value > max) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return value;
}

function cleanStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxItemLength: number,
): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new RequestValidationError(`Invalid ${field}`);
  }

  const result = value.map((item) => {
    if (typeof item !== "string") {
      throw new RequestValidationError(`Invalid ${field}`);
    }
    const normalized = item.trim();
    if (!normalized || normalized.length > maxItemLength) {
      throw new RequestValidationError(`Invalid ${field}`);
    }
    return normalized;
  });

  return [...new Set(result)];
}

function cleanDemographics(value: unknown): TerritoryDemographics {
  if (value === undefined || value === null) return {};
  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new RequestValidationError("Invalid demographics");
  }

  const input = value as Record<string, unknown>;
  return {
    estimated_population: cleanOptionalNumber(
      input.estimated_population,
      "estimated population",
      50_000_000,
    ),
    area_km2: cleanOptionalNumber(input.area_km2, "area", 100_000),
    density:
      cleanOptionalText(input.density, "density", 300) ?? undefined,
    main_characteristics: cleanStringArray(
      input.main_characteristics,
      "main characteristics",
      20,
      160,
    ),
    infrastructure: cleanStringArray(
      input.infrastructure,
      "infrastructure",
      30,
      160,
    ),
    economy:
      cleanOptionalText(input.economy, "economy", 2_000) ?? undefined,
  };
}

function normalizeEventCategory(value: unknown): string {
  if (typeof value !== "string") {
    throw new RequestValidationError("Invalid event category");
  }

  const normalized =
    value.trim().toLowerCase() === "comunitario"
      ? "comunitário"
      : value.trim().toLowerCase();

  if (!EVENT_CATEGORIES.has(normalized)) {
    throw new RequestValidationError("Invalid event category");
  }

  return normalized;
}

function cleanEvents(value: unknown): TerritoryEvent[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 30) {
    throw new RequestValidationError("Invalid events");
  }

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new RequestValidationError("Invalid event");
    }

    const event = item as Record<string, unknown>;
    return {
      name:
        cleanOptionalText(event.name, "event name", 160) ??
        (() => {
          throw new RequestValidationError("Invalid event name");
        })(),
      description:
        cleanOptionalText(event.description, "event description", 600) ?? "",
      frequency:
        cleanOptionalText(event.frequency, "event frequency", 120) ?? "",
      category: normalizeEventCategory(event.category),
    };
  });
}

function cleanEditorialContent(params: Record<string, unknown>): EditorialContent {
  return {
    description: cleanOptionalText(params.description, "description", 8_000),
    history: cleanOptionalText(params.history, "history", 12_000),
    demographics: cleanDemographics(params.demographics),
    events: cleanEvents(params.events),
  };
}

async function resolveCanonicalTerritory(
  slug: string,
): Promise<CanonicalTerritory> {
  const supabase = getSupabaseAdminClient();

  const { data: group, error: groupError } = await supabase
    .from("territorial_groups")
    .select("id,slug,name,status")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (groupError) throw groupError;
  if (!group) {
    throw new RequestValidationError("Active territory group not found");
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("territorial_group_members")
    .select("location_id")
    .eq("group_id", group.id);

  if (membershipError) throw membershipError;

  const locationIds = (memberships ?? []).map((item) => item.location_id);
  let members: string[] = [];

  if (locationIds.length > 0) {
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("id,name,status")
      .in("id", locationIds)
      .eq("status", "active");

    if (locationsError) throw locationsError;

    members = (locations ?? [])
      .map((location) => location.name?.trim())
      .filter((name): name is string => Boolean(name))
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }

  return {
    id: group.id,
    slug: group.slug,
    name: group.name,
    members,
  };
}

async function getAdminContent(slug: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("territory_ai_content")
    .select(ADMIN_COLUMNS)
    .eq("territory_slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function generateContent(territory: CanonicalTerritory) {
  if (!LOVABLE_API_KEY) {
    throw new Error("AI provider is not configured");
  }

  const membersText = territory.members.length
    ? `O territorio e formado pelos bairros: ${territory.members.join(", ")}.`
    : "";

  const prompt = `Voce e um especialista em geografia urbana e cultura de Salvador, Bahia, Brasil.
Gere informacoes editoriais sobre o territorio "${territory.name}" em Salvador, BA.
${membersText}

Retorne JSON puro com esta estrutura:
{
  "description": "Descricao geral do territorio",
  "history": "Historia do territorio",
  "demographics": {
    "estimated_population": 0,
    "area_km2": 0,
    "density": "descricao",
    "main_characteristics": ["item"],
    "infrastructure": ["item"],
    "economy": "descricao"
  },
  "events": [
    {
      "name": "nome",
      "description": "descricao",
      "frequency": "frequencia",
      "category": "cultura|esporte|religioso|comunitario"
    }
  ]
}

Quando um dado factual nao for confiavel, omita-o em vez de inventar precisao.`;

  const aiResponse = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Responda somente em JSON valido. Nao invente precisao factual quando nao houver base confiavel.",
          },
          { role: "user", content: prompt },
        ],
      }),
    },
  );

  if (!aiResponse.ok) {
    if (aiResponse.status === 429) {
      throw new RequestValidationError(
        "Rate limit exceeded. Try again later.",
      );
    }
    if (aiResponse.status === 402) {
      throw new RequestValidationError(
        "AI provider quota is unavailable.",
      );
    }

    console.error(
      "[territory-ai-content] AI gateway failure",
      aiResponse.status,
    );
    throw new Error("AI gateway error");
  }

  const aiData = await aiResponse.json();
  const rawContent = aiData?.choices?.[0]?.message?.content;
  if (typeof rawContent !== "string" || !rawContent.trim()) {
    throw new Error("AI response did not contain content");
  }

  const normalized = rawContent
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(normalized);
  } catch {
    throw new Error("AI response was not valid JSON");
  }

  const editorial = cleanEditorialContent(parsed);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("territory_ai_content")
    .upsert(
      {
        territory_slug: territory.slug,
        territory_name: territory.name,
        ...editorial,
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
  territory: CanonicalTerritory,
  params: Record<string, unknown>,
) {
  const editorial = cleanEditorialContent(params);
  const now = new Date().toISOString();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("territory_ai_content")
    .upsert(
      {
        territory_slug: territory.slug,
        territory_name: territory.name,
        ...editorial,
        manually_edited_at: now,
        is_manual_override: true,
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
  const origin = req.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return respond(req, { error: "Origin not allowed" }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ["POST"], ALLOWED_METHODS);
  if (methodError) return methodError;

  const auth = await requireAdmin(req, ALLOWED_METHODS);
  if (auth instanceof Response) return auth;

  const body = await readJsonBody<RequestBody>(req, {
    maxBytes: MAX_BODY_BYTES,
    methods: ALLOWED_METHODS,
  });
  if (!body.ok) return body.response;

  const action = body.data?.action;
  if (!action || !(action in ACTIONS)) {
    return respond(req, { error: "Invalid action" }, 400);
  }

  const safeAction = action as Action;
  const params =
    body.data.params &&
    typeof body.data.params === "object" &&
    !Array.isArray(body.data.params)
      ? body.data.params
      : {};

  try {
    const slug = cleanSlug(params.territory_slug);

    const rateLimit = await checkRateLimit(
      `territory-ai:${safeAction}:${auth.userId}`,
      safeAction === "generate" ? 10 : 120,
      safeAction === "generate" ? 60 * 60 * 1000 : 60 * 1000,
    );
    if (!rateLimit.allowed) {
      return respond(
        req,
        { error: "Rate limit exceeded. Try again later." },
        429,
      );
    }

    let data: unknown;

    if (safeAction === "get") {
      await resolveCanonicalTerritory(slug);
      data = await getAdminContent(slug);
    } else {
      const territory = await resolveCanonicalTerritory(slug);
      data =
        safeAction === "generate"
          ? await generateContent(territory)
          : await updateContent(territory, params);
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `territory_ai_content_${safeAction}`,
      resource: "territory-ai-content",
      status: "success",
      details: { territorySlug: slug },
      ...getAuditInfo(req),
    });

    return respond(req, { data });
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return respond(req, { error: error.message }, 400);
    }

    console.error("[territory-ai-content]", error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `territory_ai_content_${safeAction}`,
      resource: "territory-ai-content",
      status: "failure",
      details: { reason: "operation_failed" },
      ...getAuditInfo(req),
    });

    return respond(req, { error: "Internal server error" }, 500);
  }
});
