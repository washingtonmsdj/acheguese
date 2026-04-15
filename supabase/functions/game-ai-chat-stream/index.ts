// @ts-expect-error - Deno import, will be resolved at runtime
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CompilerSessionStore } from "../_shared/compiler-session-store.ts";
import type { ChatMessage as GroqChatMessage } from "../_shared/groq-client.ts";
import { parseJsonLenient } from "../_shared/json-utils.ts";
import { validateRequestBody, type ValidatedRequest, type ValidationError } from "../_shared/request-validator.ts";
import { HTTP_STATUS, LOG_LIMITS } from "../_shared/constants.ts";
import type { GamePlan } from "../_shared/genreContracts.ts";
import { createLogger } from "../_shared/logger.ts";
import { isRecord, isString, isNonEmptyString, isGamePlanInput } from "../_shared/type-guards.ts";
import { validateSession } from "../_shared/session-validator.ts";
import { getSystemPrompt } from "../_shared/prompts/system-prompt.ts";
import { convertToNormalizedGamePlan } from "../_shared/game-plan-converter.ts";
import { validateAndNormalizeSpec } from "../_shared/spec-validator.ts";
import { callGroqWithRetry } from "../_shared/groq-api.ts";

// Deno global type declaration
interface DenoEnv {
  get(name: string): string | undefined;
}
interface DenoNamespace {
  env: DenoEnv;
  addSignalListener(signal: string, handler: () => void): void;
  exit(code: number): void;
}

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

// Helper function to get CORS origins from env var with fallback
function getCorsOrigins(): string[] {
  const globalDeno = (globalThis as { Deno?: DenoNamespace }).Deno;
  const corsOriginsEnv = globalDeno?.env?.get("CORS_ORIGINS");
  
  if (corsOriginsEnv) {
    try {
      // Parse comma-separated list from env var
      const origins = corsOriginsEnv.split(',').map((origin: string) => origin.trim()).filter((origin: string) => origin.length > 0);
      if (origins.length > 0) {
        return origins;
      }
    } catch (error) {
      // Keep console.warn for initialization errors (runs once at startup before any logger is available)
      console.warn("Failed to parse CORS_ORIGINS env var, using default:", error);
    }
  }
  
  // Default fallback for development
  return ["*"];
}

const CONFIG = {
  // CORS configuration
  CORS: {
    ORIGINS: getCorsOrigins(),
    ALLOWED_HEADERS: "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    ALLOWED_METHODS: "POST, OPTIONS",
    MAX_AGE: "86400"
  },
  
  // Default values
  DEFAULTS: {
    GAME_TYPE: "platformer",
    LOOP_TYPE: "winlose",
    TITLE: "Untitled Game",
    DESCRIPTION: "",
    CORE_LOOP: ""
  },
  
  // Validation
  VALIDATION: {
    MIN_SESSION_ID_LENGTH: 1,
    MIN_GAME_ID_LENGTH: 1
  }
} as const;

const isWildcardOrigin = CONFIG.CORS.ORIGINS.includes("*");

const resolveAllowedOrigin = (req: Request): string => {
  if (isWildcardOrigin) return "*";

  const origin = req.headers.get("origin");
  if (origin && CONFIG.CORS.ORIGINS.some(allowedOrigin => allowedOrigin === origin)) {
    return origin;
  }

  // Fallback to first origin or "*" if array is empty
  return CONFIG.CORS.ORIGINS[0] || "*";
};

const corsHeaders = (req: Request): Record<string, string> => {
  const allowedOrigin = resolveAllowedOrigin(req);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": CONFIG.CORS.ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": CONFIG.CORS.ALLOWED_METHODS,
    "Access-Control-Max-Age": CONFIG.CORS.MAX_AGE,
  };

  // Credentials are only valid with an explicit origin (never with "*").
  if (allowedOrigin !== "*") {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  return headers;
};

// ============================================================================
// TIPOS E TYPE GUARDS
// ============================================================================

interface StreamingRequest extends ValidatedRequest {
  gameId?: string;
  approvedPlan?: unknown;
  approvedPlanHuman?: string;
}

interface StreamingResponse {
  raw: string;
}

interface ErrorResponse {
  error: string;
  message: string;
  engineLimitationsHit?: string[];
  field?: string;
  value?: unknown;
}

// Session type based on CompilerSessionStore usage
interface CompilerSession {
  id?: string; // Optional because session from store may not have id
  approvedByUser: boolean;
  gamePlan?: unknown; // Optional because session may not have gamePlan
  phase?: string;
  createdAt?: string | number; // Can be string (ISO) or number (timestamp)
  updatedAt?: string | number; // Can be string (ISO) or number (timestamp)
  // Note: CompilerSessionState may have additional properties
}

// ============================================================================
// CONVERSÃO DE GAME PLAN
// ============================================================================

function validateStreamingRequest(rawBody: unknown): 
  { success: true; data: StreamingRequest } | { success: false; error: ValidationError } {
  
  const validationResult = validateRequestBody(rawBody);
  
  if (!validationResult.success) {
    return validationResult;
  }

  // Validate rawBody is a record before accessing properties
  if (!isRecord(rawBody)) {
    return {
      success: false,
      error: {
        error: "INVALID_REQUEST_BODY",
        message: "Request body must be an object",
        field: "body"
      }
    };
  }

  const data = validationResult.data;

  // Extract approvedPlan from rawBody if present
  const approvedPlan = isRecord(rawBody) ? (rawBody as Record<string, unknown>).approvedPlan : undefined;
  const approvedPlanHuman = isRecord(rawBody) && isString((rawBody as Record<string, unknown>).approvedPlanHuman) 
    ? (rawBody as Record<string, unknown>).approvedPlanHuman as string 
    : undefined;

  // sessionId is required UNLESS approvedPlan is provided inline
  if (!data.sessionId && !approvedPlan) {
    return {
      success: false,
      error: {
        error: "SESSION_ID_REQUIRED",
        message: "sessionId is required for streaming compilation (or provide approvedPlan inline)",
        field: "sessionId"
      }
    };
  }

  // Valida gameId se fornecido
  let gameId: string | undefined;
  const gameIdValue = rawBody.gameId;
  if (gameIdValue !== undefined) {
    if (!isNonEmptyString(gameIdValue)) {
      return {
        success: false,
        error: {
          error: "INVALID_GAME_ID",
          message: "Game ID must be a non-empty string",
          field: "gameId",
          value: gameIdValue
        }
      };
    }
    gameId = gameIdValue;
  }

  return {
    success: true,
    data: {
      ...data,
      gameId,
      approvedPlan,
      approvedPlanHuman
    }
  };
}

// ============================================================================
// ERROR RESPONSE HELPERS
// ============================================================================

function createErrorResponse(
  req: Request,
  errorCode: string,
  message: string,
  status: number = HTTP_STATUS.BAD_REQUEST,
  additionalFields?: Partial<ErrorResponse>
): Response {
  const errorResponse: ErrorResponse = {
    error: errorCode,
    message,
    ...additionalFields
  };

  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    }
  );
}

// ============================================================================
// POST-PROCESSING: SYSTEM NAME NORMALIZATION + CONTROLSHINT FIX
// ============================================================================

/**
 * Maps snake_case / lowercase system aliases (commonly generated by the AI)
 * to their canonical PascalCase names used by the Ordax engine.
 */
const SYSTEM_NAME_ALIASES: Record<string, string> = {
  physics: "PhysicsSystem", physics_system: "PhysicsSystem",
  physics_arcade: "PhysicsSystem", physics_2d: "PhysicsSystem",
  collision: "CollisionSystem", collision_system: "CollisionSystem",
  animation: "AnimationSystem", animation_system: "AnimationSystem",
  audio: "AudioSystem", audio_system: "AudioSystem",
  sound: "AudioSystem", sound_system: "AudioSystem",
  camera: "CameraSystem", camera_system: "CameraSystem",
  camera_sideview: "CameraSystem", camera_2d: "CameraSystem",
  render: "CameraSystem", render_2d: "CameraSystem", renderer: "CameraSystem",
  input: "InputSystem", input_system: "InputSystem",
  ui: "UISystem", ui_system: "UISystem",
  hud: "UISystem", hud_system: "UISystem",
  score: "ScoreSystem", score_system: "ScoreSystem",
  timer: "TimerSystem", timer_system: "TimerSystem",
  spawner: "SpawnerSystem", spawner_system: "SpawnerSystem",
  spawn: "SpawnerSystem", spawn_system: "SpawnerSystem",
  particle: "ParticleSystem", particle_system: "ParticleSystem",
  ai: "AISystem", ai_system: "AISystem",
  save: "SaveSystem", save_system: "SaveSystem",
  time: "TimeSystem", time_system: "TimeSystem",
  fsm: "FSMSystem", fsm_system: "FSMSystem",
  game_state: "FSMSystem", game_state_system: "FSMSystem",
  gamestate: "FSMSystem", gamestatesystem: "FSMSystem",
  vehicle: "VehicleSystem", vehicle_system: "VehicleSystem",
  viewport: "ViewportSystem", viewport_system: "ViewportSystem",
  dialogue: "DialogueSystem", dialogue_system: "DialogueSystem",
  dialog: "DialogueSystem", dialog_system: "DialogueSystem",
  inventory: "InventorySystem", inventory_system: "InventorySystem",
};

const VALID_SYSTEM_NAMES = new Set([
  "PhysicsSystem", "CollisionSystem", "ParticleSystem", "AnimationSystem",
  "AudioSystem", "CameraSystem", "AISystem", "SpawnerSystem", "ScoreSystem",
  "UISystem", "TimerSystem", "DialogueSystem", "InventorySystem", "SaveSystem",
  "GameStateSystem", "InputSystem", "TimeSystem", "FSMSystem", "VehicleSystem",
  "ViewportSystem", "SpawnSystem",
]);

function normalizeSystemName(name: string): string {
  if (VALID_SYSTEM_NAMES.has(name)) return name;
  return SYSTEM_NAME_ALIASES[name.toLowerCase()] ?? name;
}

/**
 * Post-processes the normalized spec to fix known AI output issues:
 * 1. Converts snake_case system names to PascalCase
 * 2. Converts controlsHint string → object
 */
function postProcessSpec(spec: unknown): unknown {
  if (!spec || typeof spec !== "object" || Array.isArray(spec)) return spec;

  const s = spec as Record<string, unknown>;

  // 1. Normalize system names
  if (Array.isArray(s.systems)) {
    const seen = new Set<string>();
    s.systems = (s.systems as unknown[]).reduce<string[]>((acc, sys) => {
      if (typeof sys !== "string" || !sys.trim()) return acc;
      const normalized = normalizeSystemName(sys.trim());
      if (!seen.has(normalized)) {
        seen.add(normalized);
        acc.push(normalized);
      }
      return acc;
    }, []);
  }

  // 2. Fix controlsHint type mismatch (AI sometimes sends a plain string)
  if (s.ui && typeof s.ui === "object" && !Array.isArray(s.ui)) {
    const ui = s.ui as Record<string, unknown>;
    if (typeof ui.controlsHint === "string") {
      ui.controlsHint = { description: ui.controlsHint };
    }
  }

  return s;
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

async function handleStreamingRequest(req: Request): Promise<Response> {
  const logger = createLogger("game-ai-chat-stream");
  logger.info("Function called", { method: req.method });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: HTTP_STATUS.OK,
      headers: corsHeaders(req)
    });
  }

  try {
    logger.info("Parsing request...");
    
    // Parse e valida request
    const rawBody = await req.json();
    const requestValidationResult = validateStreamingRequest(rawBody);
    
    if (!requestValidationResult.success) {
      const error = requestValidationResult.error;
      logger.warn("Request validation failed", error);
      
      return createErrorResponse(
        req,
        error.error,
        error.message,
        HTTP_STATUS.BAD_REQUEST,
        {
          field: error.field,
          value: error.value
        }
      );
    }

    const { messages, currentSpec, sessionId, gameId, mode, approvedPlan: inlineApprovedPlan } = requestValidationResult.data;
    logger.info("Request validated", { sessionId, gameId, mode, hasMessages: !!messages }, sessionId);

    // Valida credenciais Supabase
    const globalDeno = (globalThis as { Deno?: DenoNamespace }).Deno;
    const SUPABASE_URL = globalDeno?.env?.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = globalDeno?.env?.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      logger.error("Supabase credentials not configured", { 
        hasUrl: !!SUPABASE_URL, 
        hasKey: !!SUPABASE_SERVICE_ROLE_KEY 
      }, sessionId);
      throw new Error("Supabase credentials not configured");
    }

    // ✅ INLINE PLAN BYPASS: If approvedPlan is provided inline, skip session lookup
    let rawGamePlan: unknown;
    let sessionStore: CompilerSessionStore | null = null;
    
    if (inlineApprovedPlan && isGamePlanInput(inlineApprovedPlan)) {
      const planRecord = inlineApprovedPlan as Record<string, unknown>;
      logger.info("Using inline approvedPlan (skipping session lookup)", { 
        gameType: planRecord?.gameType 
      }, sessionId);
      rawGamePlan = inlineApprovedPlan;
    } else {
      // Valida sessão from store using imported validator
      const sessionValidation = await validateSession(sessionId!, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      if (!sessionValidation.success) {
        logger.warn("Session validation failed", { 
          errorCode: sessionValidation.errorCode,
          errorMessage: sessionValidation.errorMessage
        }, sessionId);
        
        return createErrorResponse(
          req,
          sessionValidation.errorCode,
          sessionValidation.errorMessage,
          sessionValidation.statusCode
        );
      }
      
      rawGamePlan = sessionValidation.rawGamePlan;
      sessionStore = sessionValidation.sessionStore;
      
      // ✅ LOG: Verificar rawGamePlan da sessão
      const rawGamePlanRecord = rawGamePlan ? rawGamePlan as Record<string, unknown> : undefined;
      logger.debug("Session validated", {
        hasGamePlan: !!rawGamePlan,
        gameType: rawGamePlanRecord?.gameType,
        gameTypeType: typeof rawGamePlanRecord?.gameType,
        keys: rawGamePlan && typeof rawGamePlan === 'object' ? Object.keys(rawGamePlan).slice(0, 10) : []
      }, sessionId);
    }

    // Converte game plan
    const gamePlan = convertToNormalizedGamePlan(rawGamePlan);
    
    if (!gamePlan) {
      logger.error("Failed to convert game plan", { rawGamePlan }, sessionId);
      return createErrorResponse(
        req,
        "INVALID_GAME_PLAN",
        "Game plan is invalid",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    logger.info("Plan ready, generating spec...", { gameType: gamePlan.gameType }, sessionId);

    // Prepara system prompt
    const systemPromptText = getSystemPrompt(gamePlan);

    // Prepara mensagens para Groq
    const groqMessages: GroqChatMessage[] = [...messages];
    
    // Adiciona currentSpec como system message se fornecido e válido
    if (currentSpec !== undefined && currentSpec !== null) {
      try {
        const specString = typeof currentSpec === "string" ? currentSpec : JSON.stringify(currentSpec);
        groqMessages.unshift({
          role: "system",
          content: `currentSpec (JSON): ${specString}`
        });
      } catch (error) {
        logger.warn("Failed to stringify currentSpec", { error }, sessionId);
        // Continua sem currentSpec
      }
    }
    
    // Chama Groq API
    const text = await callGroqWithRetry(groqMessages, systemPromptText, logger, sessionId);

    if (!text) {
      logger.error("Empty AI response", null, sessionId);
      return createErrorResponse(
        req,
        "EMPTY_AI_RESPONSE",
        "AI returned empty response",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    // Parse resposta da IA
    const parseResult = parseJsonLenient(text);
    
    if (!parseResult.success) {
      logger.error("AI output could not be parsed as JSON", { 
        textLength: text.length,
        textPreview: text.slice(0, LOG_LIMITS.MAX_PREVIEW_CHARS),
        error: parseResult.error.message
      }, sessionId);
      
      return createErrorResponse(
        req,
        "COMPILER_ERROR",
        "AI output is not valid JSON",
        HTTP_STATUS.BAD_REQUEST,
        {
          engineLimitationsHit: ["ai_output_invalid_json"]
        }
      );
    }

    // Valida e normaliza spec
    const specValidationResult = validateAndNormalizeSpec(parseResult.data, gamePlan, logger, sessionId);
    
    if (!specValidationResult.valid) {
      return createErrorResponse(
        req,
        "COMPILER_ERROR",
        `AI output missing required spec fields: ${specValidationResult.missingFields?.join(", ")}`,
        HTTP_STATUS.BAD_REQUEST,
        {
          engineLimitationsHit: ["ai_output_incomplete_spec"]
        }
      );
    }

    // Cria payload final
    // parseResult.data já foi validado como objeto JSON válido por parseJsonLenient
    const parsedData = parseResult.data;
    const normalizedPayload = {
      ...(isRecord(parsedData) ? parsedData : {}),
      spec: postProcessSpec(specValidationResult.normalizedSpec),
    };
    
    const cleanedNormalized = JSON.stringify(normalizedPayload);

    // Atualiza sessão (only if sessionStore is available)
    if (sessionStore && sessionId) {
      await sessionStore.updateSession(sessionId, {
        phase: "compilation",
      });
    }

    logger.info("Compilation complete", { sessionId }, sessionId);

    return new Response(
      JSON.stringify({ raw: cleanedNormalized } as StreamingResponse),
      {
        status: HTTP_STATUS.OK,
        headers: { ...corsHeaders(req), "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    logger.error("Unexpected error", error);
    
    // Map specific error types
    let errorCode = "UNKNOWN_ERROR";
    let errorMessage = "Unknown error";
    let statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR;

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Map Groq errors
      if (error.message.includes("Groq rate limit")) {
        errorCode = "GROQ_RATE_LIMIT";
        statusCode = HTTP_STATUS.RATE_LIMIT;
      } else if (error.message.includes("Groq request timeout")) {
        errorCode = "GROQ_TIMEOUT";
        statusCode = HTTP_STATUS.GATEWAY_TIMEOUT;
      } else if (error.message.includes("Groq API key")) {
        errorCode = "GROQ_AUTH_ERROR";
        statusCode = HTTP_STATUS.UNAUTHORIZED;
      } else if (error.message.includes("session")) {
        errorCode = "SESSION_ERROR";
        statusCode = HTTP_STATUS.BAD_REQUEST;
      }
    }
    
    return createErrorResponse(
      req,
      errorCode,
      errorMessage,
      statusCode
    );
  }
}

// ============================================================================
// CLEANUP AND RESOURCE MANAGEMENT
// ============================================================================

// Global cleanup registry
const cleanupHandlers: (() => void)[] = [];

// Register cleanup handler
// Note: Currently no cleanup handlers are registered, but the infrastructure is in place
// for future resource cleanup (database connections, file handles, etc.)
function registerCleanup(handler: () => void): void {
  cleanupHandlers.push(handler);
}

// Execute all cleanup handlers
function executeCleanup(): void {
  const cleanupLogger = createLogger("cleanup");
  for (const handler of cleanupHandlers) {
    try {
      handler();
    } catch (error) {
      cleanupLogger.error("Cleanup handler error", { error: error instanceof Error ? error.message : String(error) });
    }
  }
  cleanupHandlers.length = 0; // Clear array
}

// Enhanced handler with cleanup
async function handleStreamingRequestWithCleanup(req: Request): Promise<Response> {
  try {
    return await handleStreamingRequest(req);
  } finally {
    executeCleanup();
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

serve(handleStreamingRequestWithCleanup);

// Register global cleanup for process termination
// Use type assertion to avoid TypeScript errors in non-Deno environments
const denoCleanup = (globalThis as { Deno?: DenoNamespace }).Deno;
if (denoCleanup && typeof denoCleanup.addSignalListener === "function") {
  const signalLogger = createLogger("signal-handler");
  
  denoCleanup.addSignalListener("SIGINT", () => {
    signalLogger.info("Received SIGINT, executing cleanup...");
    executeCleanup();
    denoCleanup.exit(0);
  });

  denoCleanup.addSignalListener("SIGTERM", () => {
    signalLogger.info("Received SIGTERM, executing cleanup...");
    executeCleanup();
    denoCleanup.exit(0);
  });
}
