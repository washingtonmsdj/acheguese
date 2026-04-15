/**
 * Spec Validator
 * 
 * Valida e normaliza specs gerados pela IA.
 * Extraído de game-ai-chat-stream/index.ts para ser reutilizável e testável.
 */

import type { GamePlan } from "./genreContracts.ts";
import { normalizeOrdaxSpec } from "./spec-normalizer.ts";
import { isRecord } from "./type-guards.ts";
import { createLogger } from "./logger.ts";

// ============================================================================
// TYPES
// ============================================================================

export interface SpecValidationResult {
  valid: boolean;
  missingFields?: string[];
  normalizedSpec?: unknown;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valida e normaliza spec gerado pela IA
 * 
 * @param parsed - Output parseado da IA
 * @param gamePlan - Game plan validado
 * @param logger - Logger instance
 * @param sessionId - Session ID para logging
 * @returns Resultado da validação
 */
export function validateAndNormalizeSpec(
  parsed: unknown,
  gamePlan: GamePlan,
  logger: ReturnType<typeof createLogger>,
  sessionId?: string
): SpecValidationResult {
  if (!parsed || typeof parsed !== "object") {
    logger.error("AI output is not an object", { parsedType: typeof parsed }, sessionId);
    return { valid: false, missingFields: ["root"] };
  }

  if (!isRecord(parsed)) {
    logger.error("AI output is not a valid object", { parsedType: typeof parsed }, sessionId);
    return { valid: false, missingFields: ["root"] };
  }
  
  const parsedObj = parsed;
  
  // ✅ CORREÇÃO: Aceitar spec diretamente OU dentro de um wrapper
  // Se parsed já é um spec (tem gameType, title, etc), usar diretamente
  // Se parsed tem um campo spec, usar parsed.spec
  let specToNormalize: unknown;
  
  if (parsedObj.spec && typeof parsedObj.spec === "object") {
    // Formato esperado: { spec: {...}, assistantSummary: "...", ... }
    specToNormalize = parsedObj.spec;
  } else if (parsedObj.gameType || parsedObj.title || parsedObj.scene) {
    // Formato alternativo: IA retornou spec diretamente
    logger.warn("AI returned spec directly (without wrapper), accepting it", null, sessionId);
    specToNormalize = parsedObj;
  } else {
    logger.error("AI output missing spec field", { 
      hasSpec: !!parsedObj.spec,
      hasGameType: !!parsedObj.gameType,
      keys: Object.keys(parsedObj)
    }, sessionId);
    return { valid: false, missingFields: ["spec"] };
  }

  let normalizationResult;
  try {
    normalizationResult = normalizeOrdaxSpec(specToNormalize, {
      gamePlan,
      fillMissingEntities: true,
      fillMissingSystems: true,
      strictMode: false
    });
  } catch (error) {
    logger.error("Failed to normalize spec", { error: error instanceof Error ? error.message : String(error) }, sessionId);
    return { 
      valid: false, 
      missingFields: ["normalization_failed"],
      normalizedSpec: specToNormalize // Fallback to original spec
    };
  }
  
  const normalizedSpec = normalizationResult.spec;

  // Valida campos obrigatórios
  const missingFields: string[] = [];
  if (typeof normalizedSpec.gameType !== "string") missingFields.push("gameType");
  if (typeof normalizedSpec.title !== "string") missingFields.push("title");
  if (typeof normalizedSpec.description !== "string") missingFields.push("description");
  if (!Array.isArray(normalizedSpec.systems)) missingFields.push("systems");
  if (!normalizedSpec.scene || typeof normalizedSpec.scene !== "object") missingFields.push("scene");
  if (!normalizedSpec.scene?.gravity || typeof normalizedSpec.scene.gravity !== "object") missingFields.push("scene.gravity");
  if (!Array.isArray(normalizedSpec.scene?.entities)) missingFields.push("scene.entities");

  if (missingFields.length > 0) {
    logger.warn("AI output missing required spec fields", { missingFields }, sessionId);
    return { 
      valid: false, 
      missingFields,
      normalizedSpec // Still return normalized spec even if incomplete
    };
  }

  return {
    valid: true,
    normalizedSpec
  };
}
