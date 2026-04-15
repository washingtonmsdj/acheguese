/**
 * Game Plan Converter
 * 
 * Converte raw game plan para GamePlan normalizado.
 * Extraído de game-ai-chat-stream/index.ts para ser reutilizável e testável.
 */

import type { GamePlan } from "./genreContracts.ts";
import type { GameLoopType } from "./constants/genre-contracts-constants.ts";
import { validateSystems, validateEntities } from "./genre-contracts-config.ts";
import { isGamePlanInput } from "./type-guards.ts";
import { validateGameType, type GameType } from "./genre-utils.ts";
import { createLogger } from "./logger.ts";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULTS = {
  GAME_TYPE: "platformer" as GameType,
  LOOP_TYPE: "winlose" as GameLoopType,
  TITLE: "Untitled Game",
  DESCRIPTION: "",
  CORE_LOOP: ""
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Valida e converte loop type
 */
function validateLoopType(value: unknown): GameLoopType {
  if (typeof value !== "string") return DEFAULTS.LOOP_TYPE;
  
  const validLoopTypes: GameLoopType[] = ["winlose", "survival", "objective"];
  return validLoopTypes.includes(value as GameLoopType) 
    ? value as GameLoopType 
    : DEFAULTS.LOOP_TYPE;
}

// ============================================================================
// MAIN CONVERTER
// ============================================================================

/**
 * Converte raw game plan para GamePlan normalizado
 * 
 * @param rawGamePlan - Game plan não validado
 * @returns GamePlan normalizado ou null se inválido
 */
export function convertToNormalizedGamePlan(rawGamePlan: unknown): GamePlan | null {
  if (!isGamePlanInput(rawGamePlan)) {
    return null;
  }

  const gamePlan = rawGamePlan;
  const logger = createLogger("convertToNormalizedGamePlan");
  
  // Validate and convert gameType using centralized function
  const gameTypeResult = validateGameType(gamePlan.gameType, DEFAULTS.GAME_TYPE);
  const gameType = gameTypeResult.gameType;
  
  // Log if gameType was converted
  if (gameTypeResult.wasConverted) {
    logger.info("GameType converted", {
      original: gameTypeResult.originalValue,
      converted: gameType
    });
  }
  
  // Validate and convert systems
  const systems = Array.isArray(gamePlan.requiredSystems) ? gamePlan.requiredSystems : [];
  const { valid: validSystems } = validateSystems(systems);
  
  // Validate and convert entities
  const entities = Array.isArray(gamePlan.requiredEntities) ? gamePlan.requiredEntities : [];
  const { valid: validEntities } = validateEntities(entities);

  // Create minimal GamePlan object
  return {
    kind: "GAME_PLAN",
    gameType,
    title: typeof gamePlan.title === "string" ? gamePlan.title : DEFAULTS.TITLE,
    description: typeof gamePlan.description === "string" ? gamePlan.description : DEFAULTS.DESCRIPTION,
    coreLoop: typeof gamePlan.coreLoop === "string" ? gamePlan.coreLoop : DEFAULTS.CORE_LOOP,
    requiredSystems: validSystems,
    requiredEntities: validEntities,
    loopType: validateLoopType(gamePlan.loopType),
    lifecycle: {
      requiredStates: ["start", "playing", "gameover"],
      requiredTransitions: ["start->playing", "playing->gameover", "gameover->restart"],
      requiredUI: ["hud", "gameover_screen"],
      requiredSignalsAnyOf: [],
      signal: "player_health",
      requiredControls: ["start_game", "restart_game"],
      startCondition: "player_press_start",
      loseCondition: typeof gamePlan.loseCondition === "string" ? gamePlan.loseCondition : "player_health <= 0",
      winCondition: typeof gamePlan.winCondition === "string" ? gamePlan.winCondition : "objective_completed",
      scoreRule: "points_per_enemy"
    },
    mustHave: {
      hasEnemies: typeof gamePlan.hasEnemies === "boolean" ? gamePlan.hasEnemies : false,
      hasAI: typeof gamePlan.hasAI === "boolean" ? gamePlan.hasAI : false,
      hasScore: typeof gamePlan.hasScore === "boolean" ? gamePlan.hasScore : true,
      hasHUD: typeof gamePlan.hasHUD === "boolean" ? gamePlan.hasHUD : true,
      hasSpawner: typeof gamePlan.hasSpawner === "boolean" ? gamePlan.hasSpawner : false
    }
  };
}
