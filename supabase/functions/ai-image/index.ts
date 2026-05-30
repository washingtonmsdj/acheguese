// Edge Function: ai-image
// Image generation and editing through the shared Lovable AI Gateway.

import { z } from "https://esm.sh/zod@3.23.8";
import {
  callAiGateway,
  getAiCorsHeaders,
  getUserAndAdmin,
  jsonResponse,
  logAiUsage,
  mapGatewayErrorToResponse,
} from "../_ai/gateway.ts";
import {
  AI_IMAGE_REQUEST_LIMITS,
  AI_RATE_LIMITS,
  dataUrlToImageBytes,
  isAllowedImageReference,
} from "../_ai/requestGuards.ts";
import { rateLimitMiddleware, readJsonBody } from "../_shared/security.ts";

const BodySchema = z.object({
  feature: z.string().min(1).max(80),
  mode: z.enum(["generate", "edit"]).default("generate"),
  prompt: z.string().min(3).max(AI_IMAGE_REQUEST_LIMITS.maxPromptChars),
  negativePrompt: z.string().max(AI_IMAGE_REQUEST_LIMITS.maxNegativePromptChars).optional(),
  referenceUrls: z.array(
    z.string().refine(isAllowedImageReference, "referencia de imagem invalida"),
  ).max(AI_IMAGE_REQUEST_LIMITS.maxReferenceImages).optional(),
  count: z.number().int().min(1).max(4).default(1),
  quality: z.enum(["fast", "pro"]).default("fast"),
  metadata: z.record(z.unknown()).optional(),
});

type Body = z.infer<typeof BodySchema>;

const MODEL_FAST = "google/gemini-3.1-flash-image-preview";
const MODEL_PRO = "google/gemini-3-pro-image-preview";

function modelFor(quality: Body["quality"]): string {
  return quality === "pro" ? MODEL_PRO : MODEL_FAST;
}

function buildMessages(body: Body) {
  const userContent: Array<Record<string, unknown>> = [
    { type: "text", text: body.prompt + (body.negativePrompt ? `\n\nEvite: ${body.negativePrompt}` : "") },
  ];

  for (const url of body.referenceUrls ?? []) {
    userContent.push({ type: "image_url", image_url: { url } });
  }

  return [{ role: "user", content: userContent.length === 1 ? userContent[0].text : userContent }];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: getAiCorsHeaders(req) });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405, req);

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    AI_RATE_LIMITS.image.maxRequests,
    AI_RATE_LIMITS.image.windowMs,
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { user, admin } = await getUserAndAdmin(req);
    if (!user) return jsonResponse({ error: "unauthorized" }, 401, req);

    const rawBody = await readJsonBody(req, {
      maxBytes: AI_IMAGE_REQUEST_LIMITS.maxRequestBytes,
      methods: "POST, OPTIONS",
    });
    if (!rawBody.ok) return rawBody.response;

    const parsed = BodySchema.safeParse(rawBody.data);
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400, req);
    }
    const body = parsed.data;
    const model = modelFor(body.quality);

    const { data: row, error: insErr } = await admin
      .from("ai_image_generations")
      .insert({
        user_id: user.id,
        feature: body.feature,
        mode: body.mode,
        prompt: body.prompt,
        negative_prompt: body.negativePrompt ?? null,
        model,
        reference_urls: body.referenceUrls ?? [],
        status: "processing",
        metadata: body.metadata ?? {},
      })
      .select("id")
      .single();
    if (insErr || !row) throw insErr ?? new Error("Falha ao registrar geracao");

    const generationId = row.id as string;
    const generatedUrls: string[] = [];

    for (let i = 0; i < body.count; i++) {
      const result = await callAiGateway({
        feature: body.feature,
        capability: "image",
        userId: user.id,
        body: {
          model,
          messages: buildMessages(body),
          modalities: ["image", "text"],
        },
      });

      await logAiUsage(admin, {
        userId: user.id,
        feature: body.feature,
        capability: "image",
        model,
        result,
        metadata: { generationId, variation: i },
      });

      if (!result.ok) {
        await admin
          .from("ai_image_generations")
          .update({
            status: "failed",
            error_message: result.errorMessage ?? "Falha desconhecida",
            generated_urls: generatedUrls,
          })
          .eq("id", generationId);
        return mapGatewayErrorToResponse(result, req);
      }

      const images = result.data?.choices?.[0]?.message?.images ?? [];
      const dataUrl: string | undefined = images[0]?.image_url?.url;
      if (!dataUrl) {
        await admin
          .from("ai_image_generations")
          .update({
            status: "failed",
            error_message: "Resposta da IA sem imagem.",
            generated_urls: generatedUrls,
          })
          .eq("id", generationId);
        return jsonResponse({ error: "IA nao retornou imagem." }, 502, req);
      }

      const { bytes, mime } = dataUrlToImageBytes(dataUrl);
      const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
      const path = `${user.id}/${body.feature}/${generationId}/${i}-${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await admin.storage.from("ai-images").upload(path, bytes, {
        contentType: mime,
        upsert: false,
      });
      if (upErr) throw upErr;

      const publicUrl = admin.storage.from("ai-images").getPublicUrl(path).data.publicUrl;
      generatedUrls.push(publicUrl);

      await admin
        .from("ai_image_generations")
        .update({ generated_urls: generatedUrls })
        .eq("id", generationId);
    }

    await admin
      .from("ai_image_generations")
      .update({ status: "completed", generated_urls: generatedUrls })
      .eq("id", generationId);

    return jsonResponse({ ok: true, generationId, model, urls: generatedUrls }, 200, req);
  } catch (err) {
    console.error("ai-image fatal", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "unknown" },
      500,
      req,
    );
  }
});
