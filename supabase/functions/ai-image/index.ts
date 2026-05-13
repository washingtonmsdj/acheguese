// Edge Function: ai-image
// Geração e edição de imagens via Lovable AI Gateway (Nano Banana 2 / Pro).
// Mantém histórico em ai_image_generations e armazena resultados em storage `ai-images`.

import { z } from "https://esm.sh/zod@3.23.8";
import {
  callAiGateway,
  corsHeaders,
  getUserAndAdmin,
  jsonResponse,
  logAiUsage,
  mapGatewayErrorToResponse,
} from "../_ai/gateway.ts";

const BodySchema = z.object({
  feature: z.string().min(1).max(80),
  mode: z.enum(["generate", "edit"]).default("generate"),
  prompt: z.string().min(3).max(4000),
  negativePrompt: z.string().max(2000).optional(),
  referenceUrls: z.array(z.string().url()).max(4).optional(),
  count: z.number().int().min(1).max(4).default(1),
  quality: z.enum(["fast", "pro"]).default("fast"),
  metadata: z.record(z.unknown()).optional(),
});

type Body = z.infer<typeof BodySchema>;

const MODEL_FAST = "google/gemini-3.1-flash-image-preview"; // Nano Banana 2
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

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("data URL inválida retornada pela IA");
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime: m[1] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { user, admin } = await getUserAndAdmin(req);
    if (!user) return jsonResponse({ error: "unauthorized" }, 401);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonResponse({ error: parsed.error.flatten().fieldErrors }, 400);
    }
    const body = parsed.data;
    const model = modelFor(body.quality);

    // 1) Cria registro pendente
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
    if (insErr || !row) throw insErr ?? new Error("Falha ao registrar geração");

    const generationId = row.id as string;
    const generatedUrls: string[] = [];

    // 2) Gera N variações em série (cada uma é uma chamada ao gateway)
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
        return mapGatewayErrorToResponse(result);
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
        return jsonResponse({ error: "IA não retornou imagem." }, 502);
      }

      const { bytes, mime } = dataUrlToBytes(dataUrl);
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

    return jsonResponse({ ok: true, generationId, model, urls: generatedUrls });
  } catch (err) {
    console.error("ai-image fatal", err);
    return jsonResponse(
      { error: err instanceof Error ? err.message : "unknown" },
      500,
    );
  }
});
