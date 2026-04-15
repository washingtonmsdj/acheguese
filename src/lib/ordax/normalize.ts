/**
 * NORMALIZAÇÃO DE SPECS - VERSÃO 100% GENÉRICA
 * 
 * Normaliza qualquer input para um GameSpec válido.
 * Aceita QUALQUER gênero (string), sem lógica específica por gênero.
 */

import type { 
  GameSpec, 
  GameGenre,
  OrdaxEntity,
  OrdaxVisualTheme,
  OrdaxBackgroundLayer,
  GameConfig
} from "./types";

import { GENRE_PROFILES } from "./config";
import { DEFAULT_LAYERS_BY_GENRE, resolveCanonicalGenre } from "./normalize-config";

import { 
  GenericNormalizer,
  normalizeGeneric,
  type NormalizerConfig,
  type NormalizationResult as GenericNormalizationResult,
  createMinimalGameSpec as createMinimalGameSpecGeneric,
  isValidGameSpec
} from "./normalize-generic";

import type { 
  NormalizeOptions, 
  PartialOrdaxSpec 
} from "./normalize-types";

export type { 
  NormalizeOptions, 
  PartialOrdaxSpec 
} from "./normalize-types";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const COMPATIBILITY_CONFIG: Partial<NormalizerConfig> = {
  extensibility: {
    genreProfiles: GENRE_PROFILES
  }
};

// ============================================================================
// CONVERSÃO DE INPUT LEGADO → GameSpec
// ============================================================================

/**
 * Detecta se um input é um spec no formato legado (com gameType/title no top-level)
 * e converte para GameSpec se necessário.
 */
function coerceToGameSpec(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  
  const obj = input as Record<string, unknown>;
  
  // Se já tem metadata, é um GameSpec - retorna como está
  if (obj.metadata && typeof obj.metadata === 'object') return input;
  
  // Se tem gameType/title no top-level, coerce para GameSpec
  if (typeof obj.gameType === 'string' && typeof obj.title === 'string') {
    const scene = obj.scene as { gravity: { x: number; y: number }; entities: unknown[] } | undefined;
    return {
      metadata: {
        title: obj.title as string,
        description: (obj.description as string) || '',
        genre: obj.gameType as string
      },
      scene: scene || { gravity: { x: 0, y: 0 }, entities: [] },
      systems: obj.systems,
      ...(obj.gameplay && { gameplay: obj.gameplay }),
      ...(obj.player && { player: obj.player }),
      ...(obj.visual && { visual: obj.visual }),
      ...(obj.audio && { audio: obj.audio }),
      ...(obj.ui && { ui: obj.ui }),
      ...(obj.runtime && { runtime: obj.runtime }),
      ...(obj.spawners && { spawners: obj.spawners })
    };
  }
  
  return input;
}

/**
 * Garante que o resultado tenha gameType/title/description no top-level
 * para backward compatibility com código que acessa spec.gameType
 */
function ensureTopLevelFields(spec: GameSpec): GameSpec {
  const result = { ...spec };
  
  if (spec.metadata) {
    if (!result.gameType) result.gameType = spec.metadata.genre;
    if (!result.title) result.title = spec.metadata.title;
    if (!result.description) result.description = spec.metadata.description;
  }
  
  // Canonicalize gameType (resolve aliases like space_shooter → shooter)
  const genre = String(resolveCanonicalGenre(result.gameType || spec.metadata?.genre || 'unknown'));
  result.gameType = genre;
  
  // Garante systems como array
  if (!result.systems) result.systems = [];
  
  // Garante visual com background layers baseado no gênero canônico
  if (!result.visual?.background?.layers?.length) {
    const genreLayers = DEFAULT_LAYERS_BY_GENRE[genre as keyof typeof DEFAULT_LAYERS_BY_GENRE]
      ?? DEFAULT_LAYERS_BY_GENRE.unknown
      ?? [{ type: "solid", parallax: 0 }];
    result.visual = {
      ...result.visual,
      background: { layers: genreLayers }
    };
  }
  
  return result;
}

// ============================================================================
// NORMALIZADOR
// ============================================================================

class SpecNormalizer {
  private normalizer: GenericNormalizer;
  
  constructor() {
    this.normalizer = new GenericNormalizer(COMPATIBILITY_CONFIG);
  }
  
  normalize(input: unknown, options?: NormalizeOptions): GameSpec {
    try {
      // 1. Coerce legacy format to GameSpec if needed
      const coerced = coerceToGameSpec(input);
      
      // 2. Normalize with generic system
      const result = this.normalizer.normalize(coerced, {
        genreHint: options?.gameType,
        strictMode: options?.strictMode,
        fillMissing: options?.fillMissingEntities !== false
      });
      
      // 3. Ensure top-level fields for backward compat
      const spec = ensureTopLevelFields(result.spec);
      
      if (import.meta.env.DEV && result.changes.length > 0) {
        console.debug('[SpecNormalizer] Changes:', result.changes);
      }
      
      if (result.warnings.length > 0) {
        console.warn('[SpecNormalizer] Warnings:', result.warnings);
      }
      
      return spec;
      
    } catch (error) {
      console.error('[SpecNormalizer] Error:', error);
      
      return {
        gameType: 'unknown',
        title: 'Jogo',
        description: `[Normalization Error] ${error instanceof Error ? error.message : String(error)}`,
        systems: [],
        scene: {
          gravity: { x: 0, y: 0 },
          entities: []
        }
      } as GameSpec;
    }
  }
  
  createMinimalValidSpec(): GameSpec {
    const genericSpec = createMinimalGameSpecGeneric({
      title: 'Jogo',
      description: '',
      genre: 'unknown'
    });
    
    return ensureTopLevelFields(genericSpec);
  }
}

// ============================================================================
// API PÚBLICA
// ============================================================================

const normalizer = new SpecNormalizer();

/**
 * Normaliza qualquer input para um GameSpec válido.
 * Aceita specs legados (gameType/title), specs genéricos (metadata), ou qualquer objeto.
 */
export function normalizeOrdaxSpec(input: unknown, options?: NormalizeOptions): GameSpec {
  return normalizer.normalize(input, options);
}

/**
 * Cria um spec mínimo válido
 */
export function createMinimalValidSpec(): GameSpec {
  return normalizer.createMinimalValidSpec();
}

/**
 * Valida se um objeto é um OrdaxSpec válido
 */
export function isOrdaxSpec(obj: unknown): obj is GameSpec {
  if (!obj || typeof obj !== 'object') return false;
  
  const spec = obj as Record<string, unknown>;
  
  // Accept both legacy format (gameType+title) and new format (metadata)
  const hasLegacyFields = typeof spec.gameType === 'string' && typeof spec.title === 'string';
  const hasMetadata = spec.metadata && typeof spec.metadata === 'object';
  
  if (!hasLegacyFields && !hasMetadata) return false;
  
  if (spec.systems !== undefined && !Array.isArray(spec.systems)) return false;
  
  if (spec.scene !== undefined && typeof spec.scene === 'object') {
    const scene = spec.scene as Record<string, unknown>;
    if (scene.entities !== undefined && !Array.isArray(scene.entities)) return false;
  }
  
  return true;
}

/**
 * Valida se um objeto é um array de OrdaxEntity
 */
export function isOrdaxEntityArray(obj: unknown): obj is OrdaxEntity[] {
  if (!Array.isArray(obj)) return false;
  
  return obj.every(item => {
    if (!item || typeof item !== 'object') return false;
    
    const entity = item as Record<string, unknown>;
    return (
      typeof entity.id === 'string' &&
      typeof entity.type === 'string' &&
      typeof entity.x === 'number' &&
      typeof entity.y === 'number' &&
      typeof entity.w === 'number' &&
      typeof entity.h === 'number'
    );
  });
}

// ============================================================================
// EXPORTAÇÕES PARA SISTEMA GENÉRICO
// ============================================================================

export { GenericNormalizer, normalizeGeneric, createMinimalGameSpecGeneric };
export type { GenericNormalizationResult };

// Log em desenvolvimento
if (import.meta.env.DEV) {
  console.debug('[normalize.ts] Sistema 100% genérico carregado');
}
