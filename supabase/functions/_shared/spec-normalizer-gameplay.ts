/**
 * Spec Normalizer - Gameplay Configuration
 * 
 * Normalizes gameplay, player, spawner, UI, and background configurations
 * based on gameType to provide intelligent defaults.
 * 
 * @version 2.0.0
 * @since 2026-02-19
 * @lastUpdated 2026-02-19
 */

import type {
  OrdaxGameType,
  PlayerConfig,
  SpawnerConfig,
  UIConfig,
  BackgroundConfigExtended
} from "./spec-normalizer-types.ts";

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PLAYER_SPEED = 220;
const DEFAULT_PLAYER_HEALTH = 100;
const DEFAULT_PLAYER_MAX_HEALTH = 100;

// Legacy game types for backward compatibility
const LEGACY_GAME_TYPES = ["racing", "shooter", "platformer", "topdown", "puzzle", "sports"] as const;

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates if a string is a valid game type
 */
function isValidGameType(gameType: string): boolean {
  return typeof gameType === 'string' && gameType.trim().length > 0;
}

/**
 * Validates if a value is a valid object
 */
function isValidObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// ============================================================================
// DEFAULT CONFIGURATIONS BY GAME TYPE
// ============================================================================

/**
 * Get default player configuration based on game type
 * @param gameType - The game type (any string, but validated)
 * @returns Player configuration
 * @throws {Error} If gameType is invalid
 */
export function getDefaultPlayerConfig(gameType: OrdaxGameType): PlayerConfig {
  // Input validation
  if (!isValidGameType(gameType)) {
    throw new Error(`Invalid gameType: ${gameType}. Must be a non-empty string.`);
  }

  const baseConfig: PlayerConfig = {
    speed: DEFAULT_PLAYER_SPEED,
    health: DEFAULT_PLAYER_HEALTH,
    maxHealth: DEFAULT_PLAYER_MAX_HEALTH,
  };

  // For backward compatibility with legacy game types
  if (LEGACY_GAME_TYPES.includes(gameType)) {
    switch (gameType) {
      case "racing":
        return {
          ...baseConfig,
          speed: 260,
          forceMult: 1.5,
          canMoveVertical: true,
          canMoveHorizontal: true,
          movementType: "topdown",
        };

      case "shooter":
        return {
          ...baseConfig,
          speed: 220,
          forceMult: 2,
          canShoot: true,
          fireRate: 7,
          bulletSpeed: 520,
          bulletSize: { w: 6, h: 14 },
          bulletSpawnOffset: { x: 0, y: -0.7 },
          spreadAngle: 140,
          spreadSpeedMult: 0.95,
          canMoveVertical: true,
          canMoveHorizontal: true,
          movementType: "topdown",
        };

      case "platformer":
        return {
          ...baseConfig,
          speed: 200,
          forceMult: 2,
          jumpForce: 300,
          canJump: true,
          canMoveVertical: false,
          canMoveHorizontal: true,
          movementType: "platformer",
        };

      case "topdown":
        return {
          ...baseConfig,
          speed: 220,
          forceMult: 2,
          canMoveVertical: true,
          canMoveHorizontal: true,
          movementType: "topdown",
        };

      case "puzzle":
      case "sports":
      default:
        return {
          ...baseConfig,
          speed: 180,
          forceMult: 2,
          canMoveVertical: true,
          canMoveHorizontal: true,
          movementType: "topdown",
        };
    }
  }

  // For custom game types, return a generic configuration
  return {
    ...baseConfig,
    speed: 200,
    forceMult: 1.5,
    canMoveVertical: true,
    canMoveHorizontal: true,
    movementType: "topdown",
  };
}

/**
 * Get default spawner configuration based on game type
 * @param gameType - The game type (any string, but validated)
 * @returns Spawner configuration or undefined if not applicable
 * @throws {Error} If gameType is invalid
 */
export function getDefaultSpawnerConfig(gameType: OrdaxGameType): SpawnerConfig | undefined {
  // Input validation
  if (!isValidGameType(gameType)) {
    throw new Error(`Invalid gameType: ${gameType}. Must be a non-empty string.`);
  }

  // For backward compatibility with legacy game types
  if (LEGACY_GAME_TYPES.includes(gameType)) {
    // Only shooter and racing typically have spawners in legacy system
    if (gameType === "shooter") {
      return {
        spawnRate: 1.5,
        waveScoreInterval: 200,
        waveRateIncrease: 0.25,
        spawnTypes: [
          {
            type: "enemy",
            chance: 0.45,
            chancePerWave: 0.06,
            maxChance: 0.85,
            variants: [
              {
                name: "scout",
                chance: 0.55,
                size: 24,
                hp: 1,
                speed: 90,
                speedPerWave: 8,
                speedVariation: 35
              },
              {
                name: "tank",
                chance: 0.30,
                size: 30,
                hp: 2,
                speed: 70,
                speedPerWave: 6,
                speedVariation: 20
              },
              {
                name: "sniper",
                chance: 0.15,
                size: 22,
                hp: 1,
                speed: 85,
                speedPerWave: 7,
                speedVariation: 25,
                lateralSpeed: 60
              }
            ]
          },
          {
            type: "asteroid",
            chance: 0.55,
            size: { base: 20, variation: 18 },
            hp: 1,
            speed: { base: 70, perWave: 6, variation: 30 }
          }
        ],
        powerups: {
          enabled: true,
          interval: 6.5,
          chance: 0.22,
          types: [
            { kind: "shield", chance: 0.5 },
            { kind: "spread", chance: 0.5 }
          ]
        }
      };
    }

    if (gameType === "racing") {
      return {
        spawnRate: 2.0,
        waveScoreInterval: 150,
        waveRateIncrease: 0.3,
        spawnTypes: [
          {
            type: "obstacle_car",
            chance: 0.7,
            chancePerWave: 0.05,
            maxChance: 0.9,
            variants: [
              {
                name: "slow",
                chance: 0.6,
                size: 40,
                hp: 1,
                speed: 100,
                speedPerWave: 10,
                speedVariation: 20
              },
              {
                name: "fast",
                chance: 0.4,
                size: 35,
                hp: 1,
                speed: 150,
                speedPerWave: 15,
                speedVariation: 30
              }
            ]
          },
          {
            type: "oil_spill",
            chance: 0.3,
            size: { base: 30, variation: 10 },
            hp: 1,
            speed: { base: 80, perWave: 8, variation: 15 }
          }
        ],
        powerups: {
          enabled: true,
          interval: 8.0,
          chance: 0.3,
          types: [
            { kind: "turbo", chance: 0.6 },
            { kind: "shield", chance: 0.4 }
          ]
        }
      };
    }
  }

  // For custom game types, return undefined (no spawners by default)
  // Callers should handle undefined return value appropriately
  return undefined;
}

/**
 * Get default UI configuration based on game type
 * @param gameType - The game type (any string, validated)
 * @returns UIConfig with default values
 * @throws {Error} If gameType is invalid
 */
export function getDefaultUIConfig(gameType: OrdaxGameType): UIConfig {
  // Input validation
  if (!isValidGameType(gameType)) {
    throw new Error(`Invalid gameType: ${gameType}. Must be a non-empty string.`);
  }

  const baseConfig: UIConfig = {
    showHealth: true,
    showScore: true,
    showShield: false,
    healthBarWidth: 150,
    healthBarHeight: 12,
    healthThresholds: {
      danger: 25,
      warning: 50
    }
  };

  // For backward compatibility with legacy game types
  if (LEGACY_GAME_TYPES.includes(gameType)) {
    switch (gameType) {
      case "racing":
        return {
          ...baseConfig,
          healthBarWidth: 180,
          healthBarHeight: 14,
          controlsHint: {
            movement: "Setas / WASD",
            gameOver: "Game Over — Pressione R para reiniciar"
          }
        };

      case "shooter":
        return {
          ...baseConfig,
          showShield: true,
          controlsHint: {
            movement: "WASD / Arrows",
            action: "Space",
            gameOver: "Game Over — pressione Enter ou R para reiniciar"
          }
        };

      case "platformer":
        return {
          ...baseConfig,
          controlsHint: {
            movement: "WASD / Arrows",
            action: "Space (Jump)",
            gameOver: "Game Over — pressione Enter ou R para reiniciar"
          }
        };

      default:
        return {
          ...baseConfig,
          controlsHint: {
            movement: "WASD / Arrows",
            gameOver: "Game Over — pressione Enter ou R para reiniciar"
          }
        };
    }
  }

  // For custom game types, return a generic configuration
  return {
    ...baseConfig,
    controlsHint: {
      movement: "WASD / Arrows",
      gameOver: "Game Over — pressione Enter ou R para reiniciar"
    }
  };
}

/**
 * Get default background configuration based on game type
 * @param gameType - The game type (any string, validated)
 * @returns BackgroundConfigExtended with default values
 * @throws {Error} If gameType is invalid
 */
export function getDefaultBackgroundConfig(gameType: OrdaxGameType): BackgroundConfigExtended {
  // Input validation
  if (!isValidGameType(gameType)) {
    throw new Error(`Invalid gameType: ${gameType}. Must be a non-empty string.`);
  }

  // For backward compatibility with legacy game types
  if (LEGACY_GAME_TYPES.includes(gameType)) {
    switch (gameType) {
      case "racing":
        return {
          type: "racing_road",
          racingRoad: {
            roadWidth: 0.52,
            scrollSpeed: 260,
            colors: {
              grass: "rgba(20, 90, 40, 0.35)",
              road: "rgba(35, 35, 40, 0.85)",
              border: "rgba(255,255,255,0.18)",
              centerLine: "rgba(255,255,255,0.35)"
            },
            centerLine: {
              dashHeight: 26,
              gap: 18,
              width: 4
            }
          }
        };

      case "shooter":
        return {
          type: "starfield",
          layers: [
            {
              type: "starfield",
              parallax: 0.3,
              density: 100,
              speedY: 50
            },
            {
              type: "nebula",
              parallax: 0.5
            }
          ]
        };

      case "platformer":
        return {
          type: "platformer_gradient",
          layers: [
            {
              type: "gradient",
              parallax: 0
            }
          ]
        };

      default:
        return {
          type: "gradient",
          layers: [
            {
              type: "gradient",
              parallax: 0
            }
          ]
        };
    }
  }

  // For custom game types, return a generic gradient background
  return {
    type: "gradient",
    layers: [
      {
        type: "gradient",
        parallax: 0
      }
    ]
  };
}

/**
 * Merge user config with defaults (deep merge with validation)
 * @param userConfig - User configuration (partial or undefined)
 * @param defaultConfig - Default configuration (complete)
 * @returns Merged configuration
 * @throws {Error} If userConfig is invalid or incompatible with defaultConfig
 */
export function mergeWithDefaults<T extends Record<string, unknown>>(
  userConfig: Partial<T> | undefined,
  defaultConfig: T
): T {
  // Validate inputs
  if (userConfig === null) {
    throw new Error("userConfig cannot be null");
  }

  if (!userConfig) {
    return defaultConfig;
  }

  if (!isValidObject(userConfig)) {
    throw new Error("userConfig must be a valid object");
  }

  if (!isValidObject(defaultConfig)) {
    throw new Error("defaultConfig must be a valid object");
  }

  const merged = { ...defaultConfig };

  for (const key in userConfig) {
    const userValue = userConfig[key];
    const defaultValue = defaultConfig[key];

    if (userValue === undefined) {
      continue;
    }

    // Validate that key exists in defaultConfig
    if (!(key in defaultConfig)) {
      console.warn(`Warning: Key "${key}" not found in defaultConfig, skipping merge`);
      continue;
    }

    // Type validation
    const expectedType = typeof defaultValue;
    const actualType = typeof userValue;

    if (expectedType !== actualType) {
      // Special case: null is considered object but we handle it separately
      if (userValue === null && expectedType === "object") {
        // null is allowed for object fields
        merged[key] = userValue as unknown as T[Extract<keyof T, string>];
        continue;
      }

      // Special case: number vs string conversion
      if (expectedType === "number" && actualType === "string") {
        const parsed = parseFloat(userValue as string);
        if (!isNaN(parsed)) {
          merged[key] = parsed as unknown as T[Extract<keyof T, string>];
          continue;
        }
      }

      // Special case: boolean vs string conversion
      if (expectedType === "boolean" && actualType === "string") {
        const lower = (userValue as string).toLowerCase();
        if (lower === "true" || lower === "false") {
          merged[key] = (lower === "true") as unknown as T[Extract<keyof T, string>];
          continue;
        }
      }

      // Special case: string → object for known hint/label fields
      // The AI sometimes sends controlsHint as a plain string instead of an object.
      if (expectedType === "object" && actualType === "string") {
        // Wrap the string as a generic description field so data is not lost
        merged[key] = { description: userValue } as unknown as T[Extract<keyof T, string>];
        continue;
      }

      throw new Error(
        `Type mismatch for key "${key}": expected ${expectedType}, got ${actualType}`
      );
    }

    // Deep merge for objects
    if (typeof userValue === "object" && userValue !== null && !Array.isArray(userValue)) {
      if (typeof defaultValue === "object" && defaultValue !== null && !Array.isArray(defaultValue)) {
        // Recursive deep merge
        merged[key] = mergeWithDefaults(
          userValue as Record<string, unknown>,
          defaultValue as Record<string, unknown>
        ) as T[Extract<keyof T, string>];
      } else {
        // Type mismatch - override with user value
        merged[key] = userValue as T[Extract<keyof T, string>];
      }
    } else {
      // Override primitives and arrays
      merged[key] = userValue as T[Extract<keyof T, string>];
    }
  }

  return merged;
}
