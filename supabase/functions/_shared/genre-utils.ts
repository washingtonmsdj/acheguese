/**
 * Genre Utilities
 * 
 * SSOT para validação e normalização de GameType/Genre.
 * Centraliza lógica de aliases e conversões.
 */

// ============================================================================
// TYPES
// ============================================================================

export type GameType = "platformer" | "topdown" | "shooter" | "puzzle" | "racing" | "sports";

export const VALID_GAME_TYPES: readonly GameType[] = [
  "platformer",
  "topdown", 
  "shooter",
  "puzzle",
  "racing",
  "sports"
] as const;

// ============================================================================
// GENRE ALIASES
// ============================================================================

/**
 * Mapa de aliases de gênero para GameType canônico
 * 
 * Permite que usuários usem nomes alternativos que são automaticamente
 * convertidos para o GameType correto.
 */
export const GENRE_ALIAS: Record<string, GameType> = {
  // Shooter
  space_shooter: "shooter",
  shmup: "shooter",
  "shoot-em-up": "shooter",
  shootemup: "shooter",
  bullet_hell: "shooter",
  "bullet-hell": "shooter",
  spaceshooter: "shooter",
  "space-shooter": "shooter",
  "twin-stick": "shooter",
  twin_stick: "shooter",
  arcade_shooter: "shooter",
  "arcade-shooter": "shooter",
  scrolling_shooter: "shooter",
  vertical_shooter: "shooter",
  horizontal_shooter: "shooter",
  galaga: "shooter",
  asteroids: "shooter",
  invaders: "shooter",
  schmup: "shooter",
  stg: "shooter",
  
  // Platformer
  platform: "platformer",
  sidescroller: "platformer",
  "side-scroller": "platformer",
  side_scroller: "platformer",
  metroidvania: "platformer",
  runner: "platformer",
  endless_runner: "platformer",
  "endless-runner": "platformer",
  jump_and_run: "platformer",
  "jump-and-run": "platformer",
  "2d-platformer": "platformer",
  "2d_platformer": "platformer",
  
  // Racing
  race: "racing",
  driving: "racing",
  racer: "racing",
  kart: "racing",
  "kart-racing": "racing",
  kart_racing: "racing",
  car_game: "racing",
  "car-game": "racing",
  drift: "racing",
  corrida: "racing",
  velocidade: "racing",
  
  // Top-down
  "top-down": "topdown",
  top_down: "topdown",
  overhead: "topdown",
  "top-down-shooter": "topdown",
  top_down_shooter: "topdown",
  birds_eye: "topdown",
  "birds-eye": "topdown",
  birdseye: "topdown",
  isometric: "topdown",
  dungeon_crawler: "topdown",
  "dungeon-crawler": "topdown",
  zelda: "topdown",
  
  // Puzzle
  logic: "puzzle",
  brain: "puzzle",
  match3: "puzzle",
  "match-3": "puzzle",
  tetris: "puzzle",
  sokoban: "puzzle",
  word_game: "puzzle",
  quebra_cabeca: "puzzle",
  logica: "puzzle",
  
  // Sports
  sport: "sports",
  football: "sports",
  soccer: "sports",
  basketball: "sports",
  tennis: "sports",
  baseball: "sports",
  futebol: "sports",
  basquete: "sports",
  esporte: "sports",
} as const;

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidateGameTypeResult {
  gameType: GameType;
  wasConverted: boolean;
  originalValue: string;
}

/**
 * Valida e normaliza um GameType
 * 
 * Resolve aliases automaticamente e retorna o GameType canônico.
 * Se não reconhecer, retorna "platformer" como fallback.
 * 
 * @param value - Valor a validar (pode ser alias)
 * @param defaultGameType - GameType padrão se não reconhecer (default: "platformer")
 * @returns GameType canônico
 */
export function validateGameType(
  value: unknown,
  defaultGameType: GameType = "platformer"
): ValidateGameTypeResult {
  // Se não é string, usar default
  if (typeof value !== "string") {
    return {
      gameType: defaultGameType,
      wasConverted: true,
      originalValue: String(value)
    };
  }

  const lower = value.toLowerCase().trim();
  const original = value;

  // 1. Direct canonical match
  if (VALID_GAME_TYPES.includes(lower as GameType)) {
    return {
      gameType: lower as GameType,
      wasConverted: false,
      originalValue: original
    };
  }

  // 2. Alias match
  if (GENRE_ALIAS[lower]) {
    return {
      gameType: GENRE_ALIAS[lower],
      wasConverted: true,
      originalValue: original
    };
  }

  // 3. Partial match: check if any canonical type is a substring
  for (const canonical of VALID_GAME_TYPES) {
    if (lower.includes(canonical)) {
      return {
        gameType: canonical,
        wasConverted: true,
        originalValue: original
      };
    }
  }

  // 4. Special case: "unknown" → default
  if (lower === "unknown") {
    return {
      gameType: defaultGameType,
      wasConverted: true,
      originalValue: original
    };
  }

  // 5. Fallback to default
  return {
    gameType: defaultGameType,
    wasConverted: true,
    originalValue: original
  };
}

/**
 * Verifica se um valor é um GameType válido (canônico)
 */
export function isValidGameType(value: unknown): value is GameType {
  return typeof value === "string" && VALID_GAME_TYPES.includes(value as GameType);
}

/**
 * Resolve um alias para GameType canônico
 * Retorna undefined se não for um alias conhecido
 */
export function resolveAlias(alias: string): GameType | undefined {
  const lower = alias.toLowerCase().trim();
  return GENRE_ALIAS[lower];
}
