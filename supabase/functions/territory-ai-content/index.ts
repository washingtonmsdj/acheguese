import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, getAllSecurityHeaders, isOriginAllowed } from "../_shared/security.ts";
import { jsonSecurityResponse, requireAuthenticatedUser } from "../_shared/businessAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TerritoryPayload {
  territory_slug: string;
  territory_name: string;
  members?: string[];
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (origin && !isOriginAllowed(origin)) {
    return jsonSecurityResponse({ error: "Origin not allowed" }, 403);
  }

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 204,
      headers: getAllSecurityHeaders("POST, OPTIONS"),
    });
  }

  if (!LOVABLE_API_KEY) {
    return jsonSecurityResponse({ error: "LOVABLE_API_KEY not configured" }, 500);
  }

  const authResult = await requireAuthenticatedUser(req, supabase);
  if (authResult instanceof Response) {
    return authResult;
  }

  const rateLimit = checkRateLimit(`territory-ai:${authResult.user.id}`, 10, 60 * 60 * 1000);
  if (!rateLimit.allowed) {
    return jsonSecurityResponse(
      { error: "Rate limit exceeded. Try again later." },
      429,
    );
  }

  try {
    const { territory_slug, territory_name, members }: TerritoryPayload = await req.json();

    const territorySlug = (territory_slug || "").trim().toLowerCase();
    const territoryName = (territory_name || "").trim();

    if (!territorySlug || !territoryName) {
      return jsonSecurityResponse(
        { error: "territory_slug and territory_name are required" },
        400,
      );
    }

    const sanitizedMembers = Array.isArray(members)
      ? members
          .map((member) => String(member).trim())
          .filter((member) => member.length > 0)
          .slice(0, 30)
      : [];

    const membersText = sanitizedMembers.length
      ? `O territorio e formado pelos bairros: ${sanitizedMembers.join(", ")}.`
      : "";

    const prompt = `Voce e um especialista em geografia urbana e cultura de Salvador, Bahia, Brasil.
Gere informacoes detalhadas e atualizadas sobre o bairro/regiao "${territoryName}" em Salvador, BA.
${membersText}

Retorne um JSON com esta estrutura exata (sem markdown, apenas JSON puro):
{
  "description": "Descricao geral do bairro em 2-3 paragrafos, incluindo localizacao, caracteristicas e vida cotidiana",
  "history": "Historia do bairro em 1-2 paragrafos, incluindo origem do nome e marcos importantes",
  "demographics": {
    "estimated_population": numero estimado,
    "area_km2": area estimada em km2,
    "density": "descricao da densidade",
    "main_characteristics": ["caracteristica 1", "caracteristica 2", "caracteristica 3"],
    "infrastructure": ["item 1", "item 2", "item 3"],
    "economy": "descricao breve da economia local"
  },
  "events": [
    {
      "name": "nome do evento/atividade cultural",
      "description": "descricao breve",
      "frequency": "frequencia (anual, mensal, etc)",
      "category": "cultura|esporte|religioso|comunitario"
    }
  ]
}

Seja preciso e use informacoes reais sobre Salvador. Se nao tiver dados exatos, faca estimativas razoaveis baseadas no contexto urbano de Salvador.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              "Voce e um assistente especializado em dados urbanos de Salvador, BA. Sempre responda em JSON puro, sem markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return jsonSecurityResponse({ error: "Rate limit exceeded. Try again later." }, 429);
      }
      if (aiResponse.status === 402) {
        return jsonSecurityResponse({ error: "Payment required. Add funds to workspace." }, 402);
      }

      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return jsonSecurityResponse({ error: "AI gateway error" }, 502);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return jsonSecurityResponse({ error: "Failed to parse AI response" }, 500);
    }

    const { data, error } = await supabase
      .from("territory_ai_content")
      .upsert(
        {
          territory_slug: territorySlug,
          territory_name: territoryName,
          description: parsed.description || "",
          history: parsed.history || "",
          demographics: parsed.demographics || {},
          events: parsed.events || [],
          ai_generated_at: new Date().toISOString(),
          is_manual_override: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "territory_slug" },
      )
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return jsonSecurityResponse({ error: "Failed to save content" }, 500);
    }

    return jsonSecurityResponse({ success: true, data }, 200);
  } catch (e) {
    console.error("Error:", e);
    return jsonSecurityResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      500,
    );
  }
});


