// Edge Function: tryon-generate
// Processes Virtual Try-On generations asynchronously.
// Provider: Replicate / cuuupid/idm-vton.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  AI_RATE_LIMITS,
  dataUrlToImageBytes,
  isAllowedImageReference,
  isAllowedTryOnProductImageReference,
} from "../_ai/requestGuards.ts";
import { requireOperationalAccount } from "../_shared/accountOperational.ts";
import {
  getAllSecurityHeaders,
  isValidUUID,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from "../_shared/security.ts";

function responseHeaders(req: Request): Record<string, string> {
  return getAllSecurityHeaders("POST, OPTIONS", req);
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const REPLICATE_MODEL_VERSION = Deno.env.get("TRYON_REPLICATE_MODEL_VERSION")?.trim() ?? "";

type Category =
  | "clothing_upper"
  | "clothing_lower"
  | "clothing_full"
  | "footwear"
  | "accessory_eyewear"
  | "accessory_headwear"
  | "accessory_other"
  | "swimwear";

interface GenerateRequest {
  generationId: string;
}

interface ReplicatePrediction {
  status?: string;
  error?: string | null;
  output?: unknown;
  urls?: {
    get?: string | null;
  };
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toReplicatePrediction(value: unknown): ReplicatePrediction {
  const record = toRecord(value);
  const urls = toRecord(record?.urls);
  return {
    status: typeof record?.status === "string" ? record.status : undefined,
    error: typeof record?.error === "string" ? record.error : null,
    output: record?.output,
    urls: urls ? { get: typeof urls.get === "string" ? urls.get : null } : undefined,
  };
}

function categoryToReplicateCategory(category: Category): "upper_body" | "lower_body" | "dresses" {
  switch (category) {
    case "clothing_upper":
      return "upper_body";
    case "clothing_lower":
      return "lower_body";
    case "clothing_full":
    case "swimwear":
      return "dresses";
    default:
      throw new Error(
        "Provider Replicate atual suporta apenas roupas superiores, inferiores, corpo inteiro e moda praia.",
      );
  }
}

function parseUrlList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function humanImageForGender(gender: string, index: number): string {
  const genderKey =
    gender === "male"
      ? "TRYON_REPLICATE_HUMAN_IMAGE_MALE_URL"
      : gender === "female"
        ? "TRYON_REPLICATE_HUMAN_IMAGE_FEMALE_URL"
        : "TRYON_REPLICATE_HUMAN_IMAGE_NEUTRAL_URL";

  const urls = [
    ...parseUrlList(Deno.env.get(genderKey)),
    ...parseUrlList(Deno.env.get("TRYON_REPLICATE_HUMAN_IMAGE_URL")),
  ];

  if (urls.length === 0) {
    throw new Error("Imagem humana base do Try-On nao configurada no backend.");
  }

  return urls[index % urls.length];
}

function garmentDescription(category: Category, style: string): string {
  switch (category) {
    case "clothing_upper":
      return `${style} upper-body garment`;
    case "clothing_lower":
      return `${style} lower-body garment`;
    case "clothing_full":
      return `${style} full-body outfit or dress`;
    case "swimwear":
      return "tasteful fashion swimwear";
    default:
      return `${style} fashion garment`;
  }
}

function outputUrl(output: unknown): string | null {
  if (typeof output === "string") return output;
  if (Array.isArray(output)) {
    const first = output.find((item) => typeof item === "string");
    return typeof first === "string" ? first : null;
  }
  if (output && typeof output === "object") {
    const first = Object.values(output as Record<string, unknown>).find((item) => typeof item === "string");
    return typeof first === "string" ? first : null;
  }
  return null;
}

async function replicateRequest(path: string, init?: RequestInit): Promise<unknown> {
  const token = Deno.env.get("REPLICATE_API_TOKEN")?.trim();
  if (!token) throw new Error("REPLICATE_API_TOKEN nao esta configurado no backend.");
  if (!token.startsWith("r8_")) throw new Error("REPLICATE_API_TOKEN invalido no backend.");

  const resp = await fetch(`https://api.replicate.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await resp.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!resp.ok) {
    if (resp.status === 401) throw new Error("Replicate recusou a API key. Verifique REPLICATE_API_TOKEN.");
    if (resp.status === 402) throw new Error("Replicate sem creditos suficientes para gerar a imagem.");
    if (resp.status === 429) throw new Error("Rate limit do Replicate. Tente novamente em instantes.");
    throw new Error(`Replicate erro ${resp.status}: ${text.slice(0, 240)}`);
  }

  return data;
}

async function makeImageAvailableToReplicate(imageUrl: string): Promise<string> {
  if (!isAllowedImageReference(imageUrl) || imageUrl.startsWith("data:")) {
    throw new Error("URL da imagem do produto invalida.");
  }

  const sourceResp = await fetch(imageUrl, {
    headers: {
      "User-Agent": "acheguese-tryon/1.0",
      Accept: "image/*",
    },
  });
  if (!sourceResp.ok) {
    throw new Error(`Falha ao ler imagem do produto no storage: HTTP ${sourceResp.status}`);
  }

  const contentType = sourceResp.headers.get("content-type")?.split(";")[0] || "image/jpeg";
  const bytes = await sourceResp.arrayBuffer();
  if (bytes.byteLength < 1024) {
    throw new Error("Imagem do produto parece invalida ou vazia.");
  }

  let binary = "";
  const chunk = 0x8000;
  const data = new Uint8Array(bytes);
  for (let i = 0; i < data.length; i += chunk) {
    binary += String.fromCharCode(...data.subarray(i, i + chunk));
  }

  return `data:${contentType};base64,${btoa(binary)}`;
}

function assertTryOnProductImageUrl(imageUrl: string, userId: string): string {
  if (!isAllowedTryOnProductImageReference(imageUrl, userId, SUPABASE_URL)) {
    throw new Error("Imagem do produto deve vir do storage tryon do proprio usuario.");
  }

  return imageUrl;
}

async function waitForPrediction(prediction: ReplicatePrediction): Promise<ReplicatePrediction> {
  let current = prediction;

  for (let attempt = 0; attempt < 36; attempt++) {
    if (current.status === "succeeded") return current;
    if (current.status === "failed" || current.status === "canceled") {
      throw new Error(`Replicate falhou: ${current.error ?? "erro desconhecido"}`);
    }
    if (!current.urls?.get) break;

    await new Promise((resolve) => setTimeout(resolve, 5000));
    const path = current.urls.get.replace("https://api.replicate.com/v1", "");
    current = toReplicatePrediction(await replicateRequest(path));
  }

  throw new Error("Replicate demorou mais que o limite para concluir a geracao.");
}

async function callReplicateTryOn(
  productImageUrl: string,
  category: Category,
  gender: string,
  style: string,
  seed: number,
): Promise<string> {
  if (!REPLICATE_MODEL_VERSION) {
    throw new Error("TRYON_REPLICATE_MODEL_VERSION nao esta configurado no backend.");
  }

  const prediction = toReplicatePrediction(await replicateRequest("/predictions", {
    method: "POST",
    headers: { Prefer: "wait=60" },
    body: JSON.stringify({
      version: REPLICATE_MODEL_VERSION,
      input: {
        crop: true,
        seed,
        steps: 30,
        garm_img: await makeImageAvailableToReplicate(productImageUrl),
        human_img: humanImageForGender(gender, seed),
        category: categoryToReplicateCategory(category),
        garment_des: garmentDescription(category, style),
      },
    }),
  }));

  const completed = await waitForPrediction(prediction);
  const url = outputUrl(completed.output);
  if (!url) throw new Error("Replicate nao retornou URL de imagem.");
  return url;
}

async function imageRefToBytes(imageRef: string): Promise<{ bytes: Uint8Array; mime: string }> {
  if (imageRef.startsWith("data:")) return dataUrlToImageBytes(imageRef);

  if (!isAllowedImageReference(imageRef)) {
    throw new Error("URL de imagem gerada invalida.");
  }

  const imgResp = await fetch(imageRef);
  if (!imgResp.ok) throw new Error(`Falha ao baixar imagem gerada: HTTP ${imgResp.status}`);

  const mime = imgResp.headers.get("content-type")?.split(";")[0] || "image/png";
  const bytes = new Uint8Array(await imgResp.arrayBuffer());
  return { bytes, mime };
}

Deno.serve(async (req) => {
  const headers = responseHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers });

  const methodError = requireHttpMethod(req, ["POST"], "POST, OPTIONS");
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(
    req,
    AI_RATE_LIMITS.tryOnGenerate.maxRequests,
    AI_RATE_LIMITS.tryOnGenerate.windowMs,
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const rawBody = await readJsonBody<GenerateRequest>(req, {
      maxBytes: 4096,
      methods: "POST, OPTIONS",
    });
    if (!rawBody.ok) return rawBody.response;

    const { generationId } = rawBody.data;
    if (!generationId || typeof generationId !== "string" || !isValidUUID(generationId)) {
      return new Response(JSON.stringify({ error: "generationId required" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const accountOperationalError = await requireOperationalAccount(
      admin,
      user.id,
      req,
      "POST, OPTIONS",
    );
    if (accountOperationalError) return accountOperationalError;

    const { data: gen, error: genError } = await admin
      .from("tryon_generations")
      .select("*")
      .eq("id", generationId)
      .maybeSingle();
    if (genError) throw genError;

    if (!gen) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (gen.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("tryon_generations")
      .update({
        status: "processing",
        provider: "replicate",
        error_message: null,
        generated_urls: [],
      })
      .eq("id", generationId);

    const work = (async () => {
      try {
        const variations = Math.min(5, Math.max(1, Number(gen.metadata?.variations ?? 4)));
        const generatedUrls: string[] = [];

        for (let i = 0; i < variations; i++) {
          const imageRef = await callReplicateTryOn(
            assertTryOnProductImageUrl(gen.product_image_url, user.id),
            gen.category as Category,
            gen.target_gender,
            gen.style,
            Date.now() + i,
          );

          const { bytes, mime } = await imageRefToBytes(imageRef);
          const ext = mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "png";
          const path = `${user.id}/outputs/${generationId}/${i}-${crypto.randomUUID()}.${ext}`;
          const { error: uploadError } = await admin.storage.from("tryon").upload(path, bytes, {
            contentType: mime,
            upsert: false,
          });
          if (uploadError) throw uploadError;

          const url = admin.storage.from("tryon").getPublicUrl(path).data.publicUrl;
          generatedUrls.push(url);

          await admin
            .from("tryon_generations")
            .update({ generated_urls: generatedUrls })
            .eq("id", generationId);
        }

        await admin
          .from("tryon_generations")
          .update({ status: "completed", provider: "replicate", generated_urls: generatedUrls })
          .eq("id", generationId);
      } catch (err) {
        console.error("tryon-generate worker error", err);
        await admin
          .from("tryon_generations")
          .update({
            status: "failed",
            provider: "replicate",
            error_message: err instanceof Error ? err.message : String(err),
          })
          .eq("id", generationId);
      }
    })();

    // @ts-ignore EdgeRuntime is available in Supabase Edge Functions.
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
    else await work;

    return new Response(JSON.stringify({ ok: true, generationId, provider: "replicate" }), {
      status: 202,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tryon-generate fatal", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "unknown" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
