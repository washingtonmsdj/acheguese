import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { territory_slug, territory_name, members } = await req.json();

    if (!territory_slug || !territory_name) {
      return new Response(
        JSON.stringify({ error: "territory_slug and territory_name are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const membersText = members?.length
      ? `O território é formado pelos bairros: ${members.join(", ")}.`
      : "";

    const prompt = `Você é um especialista em geografia urbana e cultura de Salvador, Bahia, Brasil.
Gere informações detalhadas e atualizadas sobre o bairro/região "${territory_name}" em Salvador, BA.
${membersText}

Retorne um JSON com esta estrutura exata (sem markdown, apenas JSON puro):
{
  "description": "Descrição geral do bairro em 2-3 parágrafos, incluindo localização, características e vida cotidiana",
  "history": "História do bairro em 1-2 parágrafos, incluindo origem do nome e marcos importantes",
  "demographics": {
    "estimated_population": número estimado,
    "area_km2": área estimada em km²,
    "density": "descrição da densidade",
    "main_characteristics": ["característica 1", "característica 2", "característica 3"],
    "infrastructure": ["item 1", "item 2", "item 3"],
    "economy": "descrição breve da economia local"
  },
  "events": [
    {
      "name": "nome do evento/atividade cultural",
      "description": "descrição breve",
      "frequency": "frequência (anual, mensal, etc)",
      "category": "cultura|esporte|religioso|comunitário"
    }
  ]
}

Seja preciso e use informações reais sobre Salvador. Se não tiver dados exatos, faça estimativas razoáveis baseadas no contexto urbano de Salvador.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um assistente especializado em dados urbanos de Salvador, BA. Sempre responda em JSON puro, sem markdown." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Add funds to workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Clean markdown fences if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("territory_ai_content")
      .upsert(
        {
          territory_slug,
          territory_name,
          description: parsed.description || "",
          history: parsed.history || "",
          demographics: parsed.demographics || {},
          events: parsed.events || [],
          ai_generated_at: new Date().toISOString(),
          is_manual_override: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "territory_slug" }
      )
      .select()
      .single();

    if (error) {
      console.error("DB error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
