// ai-text — geração de texto e structured output (tool-calling) via Lovable AI Gateway.
import {
  callAiGateway,
  getAiCorsHeaders,
  getUserAndAdmin,
  jsonResponse,
  logAiUsage,
  mapGatewayErrorToResponse,
} from "../_ai/gateway.ts";

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

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", code: "bad_request" }, 400, req);
  }

  if (!body?.feature || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: "feature e messages são obrigatórios.", code: "bad_request" }, 400, req);
  }

  const { user, admin } = await getUserAndAdmin(req);
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

  const choice = result.data?.choices?.[0];
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
    usage: result.data?.usage ?? null,
    requestId: result.requestId ?? null,
  }, 200, req);
});
