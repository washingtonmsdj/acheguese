// ai-text — geração de texto e structured output (tool-calling) via Lovable AI Gateway.
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
  AI_TEXT_REQUEST_LIMITS,
  hasAllowedTextMessages,
  hasAllowedToolSchema,
  jsonByteLength,
} from "../_ai/requestGuards.ts";
import { rateLimitMiddleware, readJsonBody } from "../_shared/security.ts";

interface Body {
  feature: string;
  model?: string;
  system?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: unknown }>;
  /** Se fornecido, força tool-calling para retornar JSON conforme schema. */
  schema?: {
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  };
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: "minimal" | "low" | "medium" | "high" | "xhigh" | "none";
}

const DEFAULT_MODEL = "google/gemini-3-flash-preview";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getAiCorsHeaders(req) });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, req);

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    AI_RATE_LIMITS.text.maxRequests,
    AI_RATE_LIMITS.text.windowMs,
  );
  if (rateLimitResponse) return rateLimitResponse;

  const rawBody = await readJsonBody<Body>(req, {
    maxBytes: AI_TEXT_REQUEST_LIMITS.maxRequestBytes,
    methods: "POST, OPTIONS",
  });
  if (!rawBody.ok) return rawBody.response;
  const body = rawBody.data;

  if (!body?.feature || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: "feature e messages são obrigatórios.", code: "bad_request" }, 400, req);
  }

  if (body.messages.length > AI_TEXT_REQUEST_LIMITS.maxMessages) {
    return jsonResponse(
      { error: `maximo ${AI_TEXT_REQUEST_LIMITS.maxMessages} mensagens por chamada.`, code: "bad_request" },
      400,
      req,
    );
  }
  if (!hasAllowedTextMessages(body.messages)) {
    return jsonResponse({ error: "messages contem role ou content invalidos.", code: "bad_request" }, 400, req);
  }
  if (!hasAllowedToolSchema(body.schema)) {
    return jsonResponse({ error: "schema invalido.", code: "bad_request" }, 400, req);
  }
  if (
    jsonByteLength({ system: body.system, messages: body.messages, schema: body.schema }) >
      AI_TEXT_REQUEST_LIMITS.maxRequestBytes
  ) {
    return jsonResponse({ error: "payload acima do limite permitido.", code: "payload_too_large" }, 413, req);
  }
  if (
    body.maxTokens !== undefined &&
    (!Number.isInteger(body.maxTokens) || body.maxTokens < 1 || body.maxTokens > AI_TEXT_REQUEST_LIMITS.maxTokens)
  ) {
    return jsonResponse(
      { error: `maxTokens deve ficar entre 1 e ${AI_TEXT_REQUEST_LIMITS.maxTokens}.`, code: "bad_request" },
      400,
      req,
    );
  }
  if (
    body.temperature !== undefined &&
    (
      !Number.isFinite(body.temperature) ||
      body.temperature < 0 ||
      body.temperature > AI_TEXT_REQUEST_LIMITS.maxTemperature
    )
  ) {
    return jsonResponse(
      { error: `temperature deve ficar entre 0 e ${AI_TEXT_REQUEST_LIMITS.maxTemperature}.`, code: "bad_request" },
      400,
      req,
    );
  }

  const { user, admin } = await getUserAndAdmin(req);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401, req);
  const model = body.model ?? DEFAULT_MODEL;

  const messages = body.system
    ? [{ role: "system", content: body.system }, ...body.messages]
    : body.messages;

  const gatewayBody: Record<string, unknown> = {
    model,
    messages,
  };
  if (typeof body.temperature === "number") gatewayBody.temperature = body.temperature;
  if (typeof body.maxTokens === "number") gatewayBody.max_tokens = body.maxTokens;
  if (body.reasoningEffort) gatewayBody.reasoning = { effort: body.reasoningEffort };

  if (body.schema) {
    gatewayBody.tools = [
      {
        type: "function",
        function: {
          name: body.schema.name,
          description: body.schema.description ?? "Structured output",
          parameters: body.schema.parameters,
        },
      },
    ];
    gatewayBody.tool_choice = { type: "function", function: { name: body.schema.name } };
  }

  const result = await callAiGateway({
    feature: body.feature,
    capability: body.schema ? "structured" : "text",
    userId: user?.id,
    body: gatewayBody,
  });

  await logAiUsage(admin, {
    userId: user?.id,
    feature: body.feature,
    capability: body.schema ? "structured" : "text",
    model,
    result,
    metadata: { hasSchema: !!body.schema },
  });

  if (!result.ok) return mapGatewayErrorToResponse(result, req);

  // deno-lint-ignore no-explicit-any
  const choice = (result.data as any)?.choices?.[0];
  const message = choice?.message ?? {};
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
