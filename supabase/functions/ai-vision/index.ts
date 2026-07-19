// ai-vision: multimodal analysis through the shared Lovable AI Gateway.
import {
  callAiGateway,
  getAiCorsHeaders,
  getUserAndAdmin,
  jsonResponse,
  logAiUsage,
  mapGatewayErrorToResponse,
} from "../_ai/gateway.ts";
import {
  AI_RATE_LIMITS,
  AI_VISION_REQUEST_LIMITS,
  hasAllowedToolSchema,
  isAllowedImageReference,
  jsonByteLength,
} from "../_ai/requestGuards.ts";
import { rateLimitMiddleware, readJsonBody } from "../_shared/security.ts";

interface Body {
  feature: string;
  model?: string;
  prompt: string;
  imageUrls: string[];
  schema?: { name: string; description?: string; parameters: Record<string, unknown> };
  system?: string;
}

const DEFAULT_MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getAiCorsHeaders(req) });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, req);

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    AI_RATE_LIMITS.vision.maxRequests,
    AI_RATE_LIMITS.vision.windowMs,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const rawBody = await readJsonBody<Body>(req, {
    maxBytes: AI_VISION_REQUEST_LIMITS.maxRequestBytes,
    methods: "POST, OPTIONS",
  });
  if (!rawBody.ok) return rawBody.response;
  const body = rawBody.data;

  if (
    typeof body?.feature !== "string" ||
    typeof body?.prompt !== "string" ||
    !Array.isArray(body.imageUrls) ||
    body.imageUrls.length === 0
  ) {
    return jsonResponse(
      { error: "feature, prompt e imageUrls sao obrigatorios.", code: "bad_request" },
      400,
      req,
    );
  }
  if (body.imageUrls.length > AI_VISION_REQUEST_LIMITS.maxImages) {
    return jsonResponse(
      { error: `maximo ${AI_VISION_REQUEST_LIMITS.maxImages} imagens por chamada.`, code: "bad_request" },
      400,
      req,
    );
  }
  if (body.prompt.length > AI_VISION_REQUEST_LIMITS.maxPromptChars) {
    return jsonResponse(
      { error: `prompt deve ter no maximo ${AI_VISION_REQUEST_LIMITS.maxPromptChars} caracteres.`, code: "bad_request" },
      400,
      req,
    );
  }
  if (!hasAllowedToolSchema(body.schema)) {
    return jsonResponse({ error: "schema invalido.", code: "bad_request" }, 400, req);
  }
  if (
    jsonByteLength({ system: body.system, prompt: body.prompt, imageUrls: body.imageUrls, schema: body.schema }) >
      AI_VISION_REQUEST_LIMITS.maxRequestBytes
  ) {
    return jsonResponse({ error: "payload acima do limite permitido.", code: "payload_too_large" }, 413, req);
  }
  if (!body.imageUrls.every((url) => typeof url === "string" && isAllowedImageReference(url))) {
    return jsonResponse(
      { error: "imageUrls aceita apenas URLs HTTPS ou data URLs de imagem permitidas.", code: "bad_request" },
      400,
      req,
    );
  }

  const { user, admin } = await getUserAndAdmin(req);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401, req);
  const model = body.model ?? DEFAULT_MODEL;

  const userContent: unknown[] = [{ type: "text", text: body.prompt }];
  for (const url of body.imageUrls) {
    userContent.push({ type: "image_url", image_url: { url } });
  }

  const messages: Array<{ role: string; content: unknown }> = [];
  if (body.system) messages.push({ role: "system", content: body.system });
  messages.push({ role: "user", content: userContent });

  const gatewayBody: Record<string, unknown> = { model, messages };
  if (body.schema) {
    gatewayBody.tools = [
      {
        type: "function",
        function: {
          name: body.schema.name,
          description: body.schema.description ?? "Structured vision output",
          parameters: body.schema.parameters,
        },
      },
    ];
    gatewayBody.tool_choice = { type: "function", function: { name: body.schema.name } };
  }

  const result = await callAiGateway({
    feature: body.feature,
    capability: "vision",
    userId: user?.id,
    body: gatewayBody,
  });

  await logAiUsage(admin, {
    userId: user?.id,
    feature: body.feature,
    capability: "vision",
    model,
    result,
    metadata: { images: body.imageUrls.length, hasSchema: !!body.schema },
  });

  if (!result.ok) return mapGatewayErrorToResponse(result, req);

  // deno-lint-ignore no-explicit-any
  const message = (result.data as any)?.choices?.[0]?.message ?? {};
  let structured: unknown = null;
  const toolCall = message.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      structured = JSON.parse(toolCall.function.arguments);
    } catch {
      structured = { _raw: toolCall.function.arguments };
    }
  }

  return jsonResponse({
    text: typeof message.content === "string" ? message.content : "",
    structured,
    model,
    // deno-lint-ignore no-explicit-any
    usage: (result.data as any)?.usage ?? null,
    requestId: result.requestId ?? null,
  }, 200, req);
});
