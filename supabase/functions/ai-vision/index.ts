// ai-vision — análise multimodal (texto + imagens) via Lovable AI Gateway.
// Útil para: classificar fotos, extrair atributos de produto, gerar descrição de prato, etc.
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
  prompt: string;
  /** URLs públicas ou data URLs. */
  imageUrls: string[];
  schema?: { name: string; description?: string; parameters: Record<string, unknown> };
  system?: string;
}

const DEFAULT_MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: getAiCorsHeaders(req) });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, req);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json", code: "bad_request" }, 400, req);
  }

  if (!body?.feature || !body?.prompt || !Array.isArray(body.imageUrls) || body.imageUrls.length === 0) {
    return jsonResponse(
      { error: "feature, prompt e imageUrls são obrigatórios.", code: "bad_request" },
      400,
      req,
    );
  }
  if (body.imageUrls.length > 6) {
    return jsonResponse({ error: "máximo 6 imagens por chamada.", code: "bad_request" }, 400, req);
  }

  const { user, admin } = await getUserAndAdmin(req);
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

  const message = result.data?.choices?.[0]?.message ?? {};
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
