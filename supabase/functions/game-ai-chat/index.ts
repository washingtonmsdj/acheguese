import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

// ── Phase-specific system prompts ──────────────────────────────────

const PHASE_PROMPTS: Record<string, string> = {
  interpretation: `Você é a IA Orquestradora do Ordax (engine de jogos 2D).

Interprete a descrição do usuário e retorne um JSON com a interpretação do jogo.

RETORNE APENAS JSON válido (sem markdown, sem código, sem explicação) com esta estrutura:

{
  "kind": "INTERPRETATION_RESULT",
  "phase": "interpretation",
  "nextPhase": "plan",
  "interpretation": {
    "gameType": "racing" | "shooter" | "platformer" | "puzzle" | "sports" | "topdown",
    "mechanics": ["mechanic1", "mechanic2"],
    "restrictions": [],
    "objective": "descrição do objetivo do jogador"
  }
}

Regras:
- Sempre retorne JSON válido
- gameType deve ser um dos valores listados
- mechanics deve listar as mecânicas principais do jogo
- objective deve descrever o que o jogador faz`,

  plan: `Você é a IA Orquestradora do Ordax (engine de jogos 2D).

Com base na interpretação anterior, crie um plano detalhado do jogo.

RETORNE APENAS JSON válido (sem markdown, sem código, sem explicação) com esta estrutura:

{
  "kind": "GAME_PLAN_RESULT",
  "phase": "plan",
  "nextPhase": "validation",
  "plan": {
    "title": "Título do Jogo",
    "description": "Descrição curta do jogo",
    "gameType": "racing",
    "coreLoop": "Descrição do loop principal do jogo",
    "loopType": "arcade" | "survival" | "progression",
    "requiredSystems": ["PhysicsSystem", "InputSystem", "CollisionSystem", "ScoreSystem", "GameStateSystem"],
    "requiredEntities": ["player", "obstacle", "background"],
    "lifecycle": {
      "startCondition": "Jogador clica em Start",
      "loseCondition": "Colisão com obstáculo",
      "winCondition": "Completar todas as voltas",
      "scoreRule": "Baseado no tempo de conclusão"
    }
  },
  "planWarnings": []
}

REGRAS OBRIGATÓRIAS POR GÊNERO (os itens abaixo DEVEM estar presentes):

racing:
  - requiredEntities DEVE incluir: "player"
  - requiredSystems DEVE incluir: "PhysicsSystem", "CollisionSystem", "TimerSystem"

shooter:
  - requiredEntities DEVE incluir: "player", "enemy"
  - requiredSystems DEVE incluir: "PhysicsSystem", "CollisionSystem", "AISystem"

platformer:
  - requiredEntities DEVE incluir: "player"
  - requiredSystems DEVE incluir: "PhysicsSystem", "CollisionSystem"

puzzle:
  - requiredEntities DEVE incluir: "player"
  - requiredSystems DEVE incluir: "TimerSystem"

sports:
  - requiredEntities DEVE incluir: "player"
  - requiredSystems DEVE incluir: "PhysicsSystem", "CollisionSystem"

topdown:
  - requiredEntities DEVE incluir: "player", "enemy"
  - requiredSystems DEVE incluir: "PhysicsSystem", "CollisionSystem", "AISystem"

Regras gerais:
- Sempre retorne JSON válido
- requiredSystems deve incluir pelo menos: InputSystem, GameStateSystem + os obrigatórios do gênero acima
- requiredEntities deve incluir pelo menos: "player" (use exatamente "player", não "player_car" ou variantes)
- lifecycle deve ter pelo menos startCondition e loseCondition
- O plano deve ser coerente com o tipo de jogo`,

  validation: `Você é a IA Orquestradora do Ordax (engine de jogos 2D).

Valide o plano do jogo contra as regras constitucionais da engine.

RETORNE APENAS JSON válido (sem markdown, sem código, sem explicação) com esta estrutura:

{
  "kind": "VALIDATION_RESULT",
  "phase": "validation",
  "nextPhase": "confirmation",
  "validation": {
    "isValid": true,
    "summary": {
      "critical": 0,
      "severe": 0,
      "minor": 0
    },
    "violations": []
  }
}

Se houver violações, use este formato para cada item em violations:
{ "id": "V001", "pilar": "Nome do Pilar", "level": "CRITICAL" | "SEVERE" | "MINOR", "message": "Descrição" }

Regras:
- Valide que o plano tem todos os campos obrigatórios
- Verifique que os sistemas são compatíveis com o tipo de jogo
- Se tudo estiver ok, retorne isValid: true com zeros nos contadores`,

  confirmation: `Você é o assistente de game design da Ordax.

Fase: CONFIRMAÇÃO

Seu papel: Apresentar o plano final de jogo para aprovação do usuário.

Contexto:
- O usuário já passou pelas fases de interpretação, planejamento e validação
- Todas as informações foram consolidadas em um plano completo
- O plano está pronto para ser apresentado

Sua tarefa:
1. Apresentar o plano de forma clara e organizada
2. Destacar os pontos principais (título, gameType, mecânicas, entidades)
3. Explicar por que este plano atende ao pedido do usuário
4. Aguardar aprovação para prosseguir

IMPORTANTE:
- Use EXATAMENTE esta estrutura de resposta:
{
  "kind": "CONFIRMATION_REQUIRED",
  "phase": "confirmation",
  "nextPhase": "compilation",
  "plan": {
    "title": "Título do Jogo",
    "description": "Descrição do jogo",
    "gameType": "racing",
    "loopType": "arcade",
    "requiredSystems": ["PhysicsSystem", "InputSystem", "CollisionSystem"],
    "requiredEntities": ["player", "obstacle"],
    "lifecycle": {
      "startCondition": "...",
      "loseCondition": "...",
      "winCondition": "...",
      "scoreRule": "..."
    }
  },
  "validation": {
    "isValid": true,
    "summary": { "critical": 0, "severe": 0, "minor": 0 }
  }
}

Regras:
- Consolide todas as informações das fases anteriores
- Mantenha o plano completo e coerente`,

  compilation: `Você é o compilador de jogos da Ordax.

Fase: COMPILAÇÃO

Seu papel: Transformar o plano aprovado em um SPEC COMPLETO E EXECUTÁVEL de jogo.

Contexto:
- O plano foi validado e aprovado pelo usuário
- Você tem todas as informações necessárias (gameType, entidades, sistemas, mecânicas)
- Agora você deve GERAR O JOGO COMPLETO

Sua tarefa:
1. Analisar o plano aprovado e todas as fases anteriores
2. Gerar um SPEC JSON COMPLETO que a engine possa executar
3. Incluir TODAS as entidades, sistemas, configurações visuais e sonoras
4. Garantir que o jogo seja jogável imediatamente

ESTRUTURA OBRIGATÓRIA DO SPEC:
{
  "version": "1.0",
  "gameType": "racing|platformer|shooter|etc",
  "loopType": "arcade|linear|endless",
  "metadata": {
    "title": "Título do Jogo",
    "description": "Descrição completa",
    "author": "Ordax AI"
  },
  "scene": {
    "entities": [
      {
        "id": "player",
        "type": "player",
        "x": 100,
        "y": 300,
        "w": 32,
        "h": 32,
        "props": {
          "health": 100,
          "speed": 5,
          "sprite": "player.png"
        }
      },
      {
        "id": "enemy1",
        "type": "enemy",
        "x": 500,
        "y": 300,
        "w": 32,
        "h": 32,
        "props": {
          "health": 50,
          "ai": "patrol",
          "sprite": "enemy.png"
        }
      }
    ],
    "gravity": { "x": 0, "y": 0.5 }
  },
  "systems": [
    "PhysicsSystem",
    "InputSystem",
    "CollisionSystem",
    "AISystem",
    "ScoreSystem",
    "ParticleSystem",
    "CameraSystem",
    "AudioSystem",
    "UISystem",
    "TimerSystem",
    "AnimationSystem"
  ],
  "visual": {
    "background": {
      "type": "gradient|solid|image",
      "value": "#1a1a2e",
      "layers": [
        { "type": "parallax", "speed": 0.5, "asset": "bg_layer1.png" }
      ]
    },
    "theme": {
      "primary": "#e94560",
      "secondary": "#0f3460",
      "accent": "#533483",
      "background": "#1a1a2e"
    },
    "effects": {
      "particles": true,
      "screenShake": true,
      "flash": true
    }
  },
  "audio": {
    "music": {
      "bgm": {
        "loop": true,
        "volume": 0.5,
        "asset": "music.mp3"
      }
    },
    "sfx": {
      "jump": "jump.wav",
      "shoot": "shoot.wav",
      "explosion": "explosion.wav",
      "collect": "collect.wav"
    }
  },
  "ui": {
    "hud": {
      "health": { "position": "top-left", "style": "bar" },
      "score": { "position": "top-right", "style": "number" },
      "ammo": { "position": "bottom-right", "style": "icons" }
    },
    "screens": {
      "start": { "title": "Pressione ESPAÇO", "subtitle": "para iniciar" },
      "gameover": { "title": "Game Over", "subtitle": "Pontuação final" },
      "victory": { "title": "Vitória!", "subtitle": "Você venceu!" }
    }
  },
  "spawners": {
    "enabled": true,
    "config": {
      "enemies": {
        "interval": 2000,
        "max": 10,
        "types": ["basic", "fast", "tank"]
      },
      "powerups": {
        "interval": 5000,
        "max": 3,
        "types": ["health", "shield", "speed"]
      }
    }
  },
  "lifecycle": {
    "startCondition": "input.space",
    "loseCondition": "player.health <= 0",
    "winCondition": "score >= 1000 OR enemies.defeated >= 20",
    "scoreRule": "enemy.defeat: 100, powerup.collect: 50, time.bonus: 10"
  }
}

REGRAS CRÍTICAS:
1. O SPEC DEVE SER COMPLETO - nenhum campo pode estar faltando ou incompleto
2. Todas as entidades devem ter posições, dimensões e propriedades válidas
3. Todos os sistemas listados devem ser compatíveis com o gameType
4. As URLs de assets podem ser placeholders (ex: "player.png") - a engine usará sprites padrão
5. O jogo deve ser jogável imediatamente quando o spec for carregado
6. Use valores numéricos REALISTAS (não deixe campos como "..." ou "string")
7. Inclua pelo menos 3-5 entidades além do player para tornar o jogo interessante

Responda com EXATAMENTE esta estrutura:
{
  "kind": "COMPILATION_COMPLETE",
  "phase": "compilation",
  "spec": { /* spec completo aqui */ },
  "executable": true,
  "ready": true
}`,
};

// ── Types ──────────────────────────────────────────────────────────

interface ChatMessage {
  role: string;
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  phase?: string;
  mode?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
}

// ── Main handler ───────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, sessionId, requestId, phase = "interpretation" } = body;

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[game-ai-chat] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Select phase-specific system prompt
    const systemPrompt = PHASE_PROMPTS[phase] || PHASE_PROMPTS.interpretation;

    console.log("[game-ai-chat] Phase:", phase, "| Messages:", messages.length, "| RequestId:", requestId);

    // Build AI messages - include conversation context
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: String(m.content),
      })),
    ];

    // Call Lovable AI Gateway with retry for transient errors (503, 500)
    // IMPORTANT: consume body exactly once per attempt to avoid "Unexpected end of JSON input"
    const MAX_RETRIES = 2;
    let aiStatus = 0;
    let aiBodyText = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const aiResponse = await fetch(LOVABLE_AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: aiMessages,
          temperature: 0.7,
          max_tokens: 4096,
        }),
      });

      aiStatus = aiResponse.status;
      aiBodyText = await aiResponse.text(); // consume body exactly once

      if (aiResponse.ok || (aiStatus !== 503 && aiStatus !== 500)) {
        break; // success or non-retryable
      }

      if (attempt < MAX_RETRIES) {
        const delay = (attempt + 1) * 1500;
        console.warn(`[game-ai-chat] AI returned ${aiStatus}, retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    // Handle HTTP errors
    if (aiStatus < 200 || aiStatus >= 300) {
      console.error("[game-ai-chat] AI error:", aiStatus, aiBodyText.substring(0, 200));

      if (aiStatus === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiStatus === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `AI service temporarily unavailable (${aiStatus}). Please try again.` }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "5" } }
      );
    }

    // Parse gateway response
    let aiData: Record<string, unknown>;
    try {
      aiData = JSON.parse(aiBodyText);
    } catch {
      console.error("[game-ai-chat] Failed to parse gateway JSON, length:", aiBodyText.length, "preview:", aiBodyText.substring(0, 200));
      const fallback = buildFallback(phase, "", messages);
      fallback.sessionId = sessionId || `session_${crypto.randomUUID()}`;
      fallback.requestId = requestId || `req_${crypto.randomUUID()}`;
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const choices = aiData.choices as Array<Record<string, unknown>> | undefined;
    const content = (choices?.[0]?.message as Record<string, unknown> | undefined)?.content as string | undefined;

    if (!content) {
      console.warn("[game-ai-chat] Empty AI content for phase:", phase, "- using fallback");
      const fallback = buildFallback(phase, "", messages);
      const newSessionId = sessionId || `session_${crypto.randomUUID()}`;
      fallback.sessionId = newSessionId;
      fallback.requestId = requestId || `req_${crypto.randomUUID()}`;
      console.log("[game-ai-chat] Responding with fallback kind:", fallback.kind, "phase:", fallback.phase, "requestId:", fallback.requestId);
      return new Response(JSON.stringify(fallback), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[game-ai-chat] AI response received, length:", content.length);

    // Parse AI response as JSON
    let parsed: Record<string, unknown>;
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn("[game-ai-chat] AI returned non-JSON for phase:", phase, "| Content preview:", content.substring(0, 200));
      parsed = buildFallback(phase, content, messages);
    }

    // ── Flatten "data" wrapper ─────────────────────────────────────
    // The AI model sometimes wraps phase data inside a "data" object.
    // The frontend renderer expects fields at the top level (e.g. response.interpretation).
    if (parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data)) {
      const inner = parsed.data as Record<string, unknown>;
      for (const [key, value] of Object.entries(inner)) {
        if (!(key in parsed)) {
          parsed[key] = value;
        }
      }
      delete parsed.data;
      console.log("[game-ai-chat] Flattened 'data' wrapper into top-level fields");
    }

    // Ensure the response matches the requested phase
    const expectedKind = PHASE_KIND_MAP[phase];
    if (expectedKind && parsed.kind !== expectedKind) {
      console.warn("[game-ai-chat] Kind mismatch: expected", expectedKind, "got", parsed.kind, "- fixing");
      parsed.kind = expectedKind;
    }

    // Always set the correct phase
    parsed.phase = phase;

    // Echo back session/request IDs from the client
    const newSessionId = sessionId || `session_${crypto.randomUUID()}`;
    parsed.sessionId = newSessionId;
    // CRITICAL: Echo back the client's requestId so autoAdvance doesn't reject it
    if (requestId) {
      parsed.requestId = requestId;
    } else {
      parsed.requestId = `req_${crypto.randomUUID()}`;
    }

    console.log("[game-ai-chat] Responding with kind:", parsed.kind, "phase:", parsed.phase, "requestId:", parsed.requestId);

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[game-ai-chat] Unhandled error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ────────────────────────────────────────────────────────

const PHASE_KIND_MAP: Record<string, string> = {
  interpretation: "INTERPRETATION_RESULT",
  plan: "GAME_PLAN_RESULT",
  validation: "VALIDATION_RESULT",
  confirmation: "CONFIRMATION_REQUIRED",
  compilation: "COMPILATION_COMPLETE",
};

/**
 * Detect gameType from user messages when AI fails to respond
 */
function detectGameTypeFromMessages(messages?: ChatMessage[]): string {
  if (!messages?.length) return "platformer";
  const text = messages.map((m) => m.content).join(" ").toLowerCase();
  
  if (/nave|spaceship|espa[çc]o|space|tir[oa]|shoot|bullet/.test(text)) return "shooter";
  if (/corrid|race|racing|carro|car|pista/.test(text)) return "racing";
  if (/plataforma|platform|pul[ao]|jump/.test(text)) return "platformer";
  if (/puzzle|quebra|enigma/.test(text)) return "puzzle";
  if (/futebol|soccer|sport|esport/.test(text)) return "sports";
  if (/topdown|top.?down|rpg|dungeon|zumbi|zombie/.test(text)) return "topdown";
  
  return "platformer";
}

function buildFallback(phase: string, rawContent: string, messages?: ChatMessage[]): Record<string, unknown> {
  const gameType = detectGameTypeFromMessages(messages);
  
  switch (phase) {
    case "interpretation":
      return {
        kind: "INTERPRETATION_RESULT",
        phase: "interpretation",
        nextPhase: "plan",
        interpretation: {
          gameType,
          mechanics: [],
          restrictions: [],
          objective: rawContent.substring(0, 200),
        },
      };
    case "plan":
      return {
        kind: "GAME_PLAN_RESULT",
        phase: "plan",
        nextPhase: "validation",
        plan: {
          title: "Jogo Gerado",
          description: rawContent.substring(0, 200),
          gameType,
          coreLoop: "Jogador avança pelo cenário",
          loopType: "arcade",
          requiredSystems: ["PhysicsSystem", "InputSystem", "CollisionSystem", "GameStateSystem"],
          requiredEntities: ["player", "obstacle"],
          lifecycle: {
            startCondition: "Jogador clica em Start",
            loseCondition: "Game over",
            scoreRule: "Baseado em progresso",
          },
        },
        planWarnings: ["Plano gerado com fallback - descreva melhor seu jogo"],
      };
    case "validation":
      return {
        kind: "VALIDATION_RESULT",
        phase: "validation",
        nextPhase: "confirmation",
        validation: {
          isValid: true,
          summary: { critical: 0, severe: 0, minor: 0 },
          violations: [],
        },
      };
    case "confirmation":
      return {
        kind: "CONFIRMATION_REQUIRED",
        phase: "confirmation",
        nextPhase: "compilation",
        plan: {
          title: "Jogo",
          description: rawContent.substring(0, 200),
          gameType,
          requiredSystems: ["PhysicsSystem", "InputSystem", "CollisionSystem", "GameStateSystem"],
          requiredEntities: ["player"],
        },
        validation: {
          isValid: true,
          summary: { critical: 0, severe: 0, minor: 0 },
        },
      };
    default:
      return {
        kind: "INTERPRETATION_RESULT",
        phase: "interpretation",
        nextPhase: "plan",
        interpretation: {
          gameType,
          mechanics: [],
          restrictions: [],
          objective: rawContent.substring(0, 200),
        },
      };
  }
}
