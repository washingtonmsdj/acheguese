// Edge Function: tryon-generate
// Processa uma geração de Virtual Try-On de forma assíncrona.
// Lê o registro em `tryon_generations`, marca como processing, chama o
// Lovable AI gateway (image edit) com a foto do produto + prompt construído,
// faz upload das imagens geradas no bucket `tryon` e atualiza o status.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Category =
  | "clothing_upper" | "clothing_lower" | "clothing_full"
  | "footwear" | "accessory_eyewear" | "accessory_headwear"
  | "accessory_other" | "swimwear";

const targetInstruction: Record<string, string> = {
  upper_body: "wearing the exact garment from the reference image on the upper body",
  lower_body: "wearing the exact garment from the reference image on the lower body",
  full_body: "wearing the exact outfit from the reference image, full body visible",
  feet: "wearing the exact footwear from the reference image, feet clearly visible",
  head: "wearing the exact headwear from the reference image, face and head visible",
  eyes: "wearing the exact eyewear from the reference image on the face",
  hand: "using the exact accessory from the reference image, hands visible",
};

function categoryToBodyTarget(c: Category): string {
  switch (c) {
    case "clothing_upper": return "upper_body";
    case "clothing_lower": return "lower_body";
    case "clothing_full":
    case "swimwear": return "full_body";
    case "footwear": return "feet";
    case "accessory_eyewear": return "eyes";
    case "accessory_headwear": return "head";
    case "accessory_other": return "hand";
  }
}

function buildPrompt(category: Category, gender: string, style: string): string {
  const subject =
    gender === "male" ? "a young adult male model"
      : gender === "female" ? "a young adult female model"
        : "a young adult androgynous model";
  const tgt = targetInstruction[categoryToBodyTarget(category)];
  const ctx = category === "swimwear"
    ? "beach photoshoot, tasteful fashion editorial, fully appropriate"
    : `${style} fashion photoshoot, studio quality lighting`;
  return [
    `Photorealistic editorial photograph of ${subject}, ${tgt}.`,
    "Preserve the product color, texture, pattern and shape with high fidelity.",
    "Realistic body proportions, natural pose, coherent shadows and scale.",
    `Scene: ${ctx}.`,
    "Sharp focus, high resolution, professional fashion photography, 85mm lens.",
    "The generated person must be a synthetic model (not a real identifiable person).",
    "No nudity, no explicit content, no minors.",
  ].join(" ");
}

async function callLovableImage(productImageUrl: string, prompt: string): Promise<string> {
  // Retorna data URL base64 PNG.
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")?.trim();
  if (!lovableApiKey) {
    throw new Error("LOVABLE_API_KEY não está configurada no backend.");
  }
  if (!lovableApiKey.startsWith("sk_")) {
    throw new Error("LOVABLE_API_KEY inválida no backend. Rotacione a chave de IA e redeploye a função.");
  }

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: productImageUrl } },
          ],
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  const text = await resp.text();
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit do AI gateway. Tente em instantes.");
    if (resp.status === 402) throw new Error("Créditos da IA esgotados. Adicione créditos no workspace.");
    throw new Error(`AI gateway erro ${resp.status}: ${text.slice(0, 200)}`);
  }
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error("Resposta inválida do AI gateway"); }
  const url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("AI gateway não retornou imagem");
  return url;
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!m) throw new Error("data URL inválida");
  const mime = m[1];
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

async function imageRefToBytes(imageRef: string): Promise<{ bytes: Uint8Array; mime: string }> {
  if (imageRef.startsWith("data:")) return dataUrlToBytes(imageRef);

  const imgResp = await fetch(imageRef);
  if (!imgResp.ok) {
    throw new Error(`Falha ao baixar imagem gerada: HTTP ${imgResp.status}`);
  }
  const mime = imgResp.headers.get("content-type")?.split(";")[0] || "image/png";
  const bytes = new Uint8Array(await imgResp.arrayBuffer());
  return { bytes, mime };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { generationId } = await req.json();
    if (!generationId || typeof generationId !== "string") {
      return new Response(JSON.stringify({ error: "generationId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Carrega a geração e valida ownership
    const { data: gen, error: gErr } = await admin
      .from("tryon_generations").select("*").eq("id", generationId).maybeSingle();
    if (gErr) throw gErr;
    if (!gen) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (gen.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marca processing
    await admin.from("tryon_generations").update({
      status: "processing", error_message: null, generated_urls: [],
    }).eq("id", generationId);

    // Resposta imediata (assíncrono para o cliente — Realtime atualizará UI)
    const work = (async () => {
      try {
        const variations = Math.min(5, Math.max(1, Number(gen.metadata?.variations ?? 4)));
        const prompt = buildPrompt(gen.category as Category, gen.target_gender, gen.style);

        const generatedUrls: string[] = [];
        for (let i = 0; i < variations; i++) {
          const imageRef = await callLovableImage(gen.product_image_url, prompt);
          const { bytes, mime } = await imageRefToBytes(imageRef);
          const ext = mime === "image/png" ? "png" : (mime === "image/jpeg" ? "jpg" : "png");
          const path = `${user.id}/outputs/${generationId}/${i}-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await admin.storage.from("tryon").upload(path, bytes, {
            contentType: mime, upsert: false,
          });
          if (upErr) throw upErr;
          const url = admin.storage.from("tryon").getPublicUrl(path).data.publicUrl;
          generatedUrls.push(url);
          // atualização incremental
          await admin.from("tryon_generations").update({ generated_urls: generatedUrls }).eq("id", generationId);
        }

        await admin.from("tryon_generations").update({
          status: "completed", generated_urls: generatedUrls,
        }).eq("id", generationId);
      } catch (err) {
        console.error("tryon-generate worker error", err);
        await admin.from("tryon_generations").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
        }).eq("id", generationId);
      }
    })();
    // Garante que o runtime não derrube antes
    // @ts-ignore EdgeRuntime global no Supabase
    if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(work);
    else await work;

    return new Response(JSON.stringify({ ok: true, generationId }), {
      status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("tryon-generate fatal", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
