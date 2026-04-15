/**
 * NORMALIZADOR GENÉRICO - 100% DATA-DRIVEN
 * 
 * Importa valores compartilhados de config.ts central.
 */

import type { 
  GameSpec, 
  BaseGameSpec,
  GameGenre,
  VisualShape,
  BackgroundType,
  SystemId,
  EntityType,
  OrdaxEntity,
  OrdaxVisual,
  OrdaxVisualTheme,
  OrdaxBackgroundLayer,
  GameConfig,
  GameplayConfig,
  PlayerConfig,
  EntityConfig,
  UIConfig,
  RuntimeSpec,
  ValidatedGameSpec,
  SchemaValidation
} from "./types";

import {
  WORLD,
  ENGINE_PERFORMANCE,
  ENTITY_LIMITS,
  ENTITY_DEFAULTS,
  VALIDATION_RANGES,
  VISUAL_DEFAULTS,
  AUDIO_DEFAULTS,
  GENRE_PROFILES,
  LOG_DEFAULTS,
} from "./config";

import { DEFAULT_LAYERS_BY_GENRE, resolveCanonicalGenre } from "./normalize-config";

// ============================================================================
// CONFIGURAÇÃO HIERÁRQUICA (100% CONFIGURÁVEL)
// ============================================================================

export interface NormalizerConfig {
  defaults: {
    minimalSpec: {
      title: string;
      description: string;
      genre: string;
      gravity: { x: number; y: number };
    };
    entityDefaults: {
      position: { x: number; y: number };
      size: { w: number; h: number };
      player: {
        health: number;
        speed: number;
      };
    };
    visualDefaults: {
      theme: OrdaxVisualTheme;
      backgroundLayers: OrdaxBackgroundLayer[];
    };
    audioDefaults: {
      music: string;
      sounds: Record<string, string>;
    };
  };
  validation: {
    limits: {
      maxEntities: number;
      maxSystems: number;
      maxTitleLength: number;
      maxDescriptionLength: number;
      positionRange: { min: number; max: number };
      gravityRange: { min: number; max: number };
      playerHealthRange: { min: number; max: number };
      playerSpeedRange: { min: number; max: number };
    };
    schemas?: {
      gameSpec?: Record<string, unknown>;
      entity?: Record<string, unknown>;
      visual?: Record<string, unknown>;
    };
  };
  extensibility: {
    featurePlugins?: Array<{
      id: string;
      appliesTo: (genre: string, spec: Partial<GameSpec>) => boolean;
      apply: (spec: GameSpec) => GameSpec;
    }>;
    genreProfiles?: Record<string, {
      name: string;
      description: string;
      suggestedSystems?: SystemId[];
      suggestedEntities?: EntityType[];
      defaultVisual?: Partial<OrdaxVisualTheme>;
      defaultPhysics?: { gravity: { x: number; y: number } };
    }>;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    logChanges: boolean;
  };
}

// Configuração padrão derivada do config central
export const DEFAULT_NORMALIZER_CONFIG: NormalizerConfig = {
  defaults: {
    minimalSpec: {
      title: "Jogo",
      description: "",
      genre: "custom",
      gravity: { x: 0, y: 0 }
    },
    entityDefaults: {
      position: ENTITY_DEFAULTS.POSITION,
      size: { w: ENTITY_DEFAULTS.WIDTH, h: ENTITY_DEFAULTS.HEIGHT },
      player: {
        health: ENTITY_DEFAULTS.PLAYER_HEALTH,
        speed: ENTITY_DEFAULTS.PLAYER_SPEED
      }
    },
    visualDefaults: {
      theme: VISUAL_DEFAULTS.THEME,
      backgroundLayers: [
        { type: "solid", parallax: 0 }
      ]
    },
    audioDefaults: {
      music: AUDIO_DEFAULTS.MUSIC,
      sounds: AUDIO_DEFAULTS.SOUNDS
    }
  },
  validation: {
    limits: {
      maxEntities: ENTITY_LIMITS.MAX_ENTITIES,
      maxSystems: ENTITY_LIMITS.MAX_SYSTEMS,
      maxTitleLength: VALIDATION_RANGES.TITLE_MAX_LENGTH,
      maxDescriptionLength: VALIDATION_RANGES.DESCRIPTION_MAX_LENGTH,
      positionRange: { min: VALIDATION_RANGES.COORDINATE.MIN, max: VALIDATION_RANGES.COORDINATE.MAX },
      gravityRange: { min: VALIDATION_RANGES.GRAVITY.MIN, max: VALIDATION_RANGES.GRAVITY.MAX },
      playerHealthRange: { min: VALIDATION_RANGES.HEALTH.MIN, max: VALIDATION_RANGES.HEALTH.MAX },
      playerSpeedRange: { min: VALIDATION_RANGES.PLAYER_SPEED.MIN, max: VALIDATION_RANGES.PLAYER_SPEED.MAX }
    }
  },
  extensibility: {
    featurePlugins: [],
    genreProfiles: GENRE_PROFILES
  },
  logging: {
    enabled: LOG_DEFAULTS.ENABLE_DEBUG,
    level: 'debug',
    logChanges: true
  }
};

// ============================================================================
// TIPOS DE ERRO E LOGGING
// ============================================================================

export interface NormalizationError extends Error {
  code: string;
  field?: string;
  value?: unknown;
  details?: Record<string, unknown>;
}

export interface NormalizationChange {
  field: string;
  action: 'added' | 'modified' | 'removed';
  before?: unknown;
  after: unknown;
  reason: string;
}

export interface NormalizationResult {
  spec: GameSpec;
  validated?: ValidatedGameSpec;
  changes: NormalizationChange[];
  warnings: string[];
  validation?: SchemaValidation;
}

// ============================================================================
// CLASSE PRINCIPAL DO NORMALIZADOR
// ============================================================================

export class GenericNormalizer {
  private config: NormalizerConfig;
  private changes: NormalizationChange[] = [];
  private warnings: string[] = [];

  constructor(config?: Partial<NormalizerConfig>) {
    this.config = {
      ...DEFAULT_NORMALIZER_CONFIG,
      ...config
    };
  }

  /**
   * Normaliza qualquer input para um GameSpec válido
   */
  normalize(input: unknown, options?: {
    genreHint?: string;
    strictMode?: boolean;
    fillMissing?: boolean;
  }): NormalizationResult {
    this.changes = [];
    this.warnings = [];

    try {
      // 1. Valida input básico
      const validatedInput = this.validateInput(input);
      
      // 2. Detecta ou valida gênero
      const genre = this.detectOrValidateGenre(validatedInput, options?.genreHint);
      
      // 3. Cria spec base
      const baseSpec = this.createBaseSpec(validatedInput, genre);
      
      // 4. Aplica normalizações genéricas
      const normalizedSpec = this.applyGenericNormalizations(baseSpec, genre);
      
      // 5. Aplica plugins de features (se configurados)
      const finalSpec = this.applyFeaturePlugins(normalizedSpec, genre);
      
      // 6. Valida spec final
      const validation = this.validateSpec(finalSpec);
      
      // 7. Cria resultado
      const result: NormalizationResult = {
        spec: finalSpec,
        changes: this.changes,
        warnings: this.warnings,
        validation
      };
      
      // 8. Adiciona validated spec se validação passar
      if (validation.isValid) {
        result.validated = {
          ...finalSpec,
          _validated: true,
          validation
        };
      }
      
      return result;
      
    } catch (error) {
      // Em caso de erro, retorna spec mínima com erro
      return this.createErrorResult(error);
    }
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS
  // ==========================================================================

  private validateInput(input: unknown): Record<string, unknown> {
    if (input === null || typeof input !== 'object') {
      throw this.createError('Input must be a non-null object', 'INVALID_INPUT_TYPE', {
        type: typeof input,
        isNull: input === null
      });
    }
    
    if (Object.keys(input).length === 0) {
      throw this.createError('Input object cannot be empty', 'EMPTY_INPUT');
    }
    
    return input as Record<string, unknown>;
  }

  private detectOrValidateGenre(input: Record<string, unknown>, hint?: string): string {
    // Aceita QUALQUER string como gênero
    if (input.metadata && typeof input.metadata === 'object') {
      const metadata = input.metadata as Record<string, unknown>;
      if (typeof metadata.genre === 'string') {
        return metadata.genre;
      }
    }
    
    if (typeof input.genre === 'string') {
      return input.genre;
    }
    
    if (typeof input.gameType === 'string') {
      return input.gameType;
    }
    
    // Usa hint se fornecido
    if (hint && typeof hint === 'string') {
      return hint;
    }
    
    // Fallback para gênero padrão
    return this.config.defaults.minimalSpec.genre;
  }

  private createBaseSpec(input: Record<string, unknown>, genre: string): Partial<GameSpec> {
    const baseSpec: Partial<GameSpec> = {
      metadata: {
        title: this.extractString(input, 'title', this.config.defaults.minimalSpec.title),
        description: this.extractString(input, 'description', this.config.defaults.minimalSpec.description),
        genre
      }
    };
    
    // Extrai scene se existir
    if (input.scene && typeof input.scene === 'object') {
      const scene = input.scene as Record<string, unknown>;
      baseSpec.scene = {
        gravity: this.extractGravity(scene),
        entities: this.extractEntities(scene)
      };
    } else {
      // Cena mínima
      baseSpec.scene = {
        gravity: this.config.defaults.minimalSpec.gravity,
        entities: []
      };
    }
    
    // Extrai systems se existirem
    if (Array.isArray(input.systems)) {
      baseSpec.systems = input.systems.filter((s): s is string => typeof s === 'string');
    }
    
    // Extrai visual se existir
    if (input.visual && typeof input.visual === 'object') {
      const visual = input.visual as Record<string, unknown>;
      baseSpec.visual = {
        theme: this.extractTheme(visual),
        background: this.extractBackground(visual, genre)
      };
    }
    
    // Extrai outras seções genéricas
    const genericSections = ['gameplay', 'player', 'ui', 'audio', 'runtime'];
    for (const section of genericSections) {
      if (input[section] && typeof input[section] === 'object') {
        (baseSpec as Record<string, unknown>)[section] = input[section];
      }
    }
    
    return baseSpec;
  }

  private applyGenericNormalizations(spec: Partial<GameSpec>, genre: string): GameSpec {
    // Resolve genre alias for layer/config lookups
    const canonicalGenre = String(resolveCanonicalGenre(genre));
    
    // Garante metadata obrigatória
    const metadata = spec.metadata || {
      title: this.config.defaults.minimalSpec.title,
      description: this.config.defaults.minimalSpec.description,
      genre: canonicalGenre
    };
    // Update metadata genre to canonical
    if (metadata.genre !== canonicalGenre) {
      metadata.genre = canonicalGenre;
    }
    
    // Garante scene obrigatória
    const scene = spec.scene || {
      gravity: this.config.defaults.minimalSpec.gravity,
      entities: []
    };
    
    // Garante entidades válidas
    const entities = this.normalizeEntities(scene.entities || []);
    
    // Garante gravity válida
    const gravity = this.validateGravity(scene.gravity);
    
    // Garante systems (opcional)
    const systems = Array.isArray(spec.systems) ? spec.systems : [];
    
    // Garante visual com genre-specific background layers (use canonical genre)
    const genreLayers = DEFAULT_LAYERS_BY_GENRE[canonicalGenre as keyof typeof DEFAULT_LAYERS_BY_GENRE]
      ?? DEFAULT_LAYERS_BY_GENRE.unknown
      ?? this.config.defaults.visualDefaults.backgroundLayers;
    let visual = spec.visual || {
      theme: this.config.defaults.visualDefaults.theme,
      background: { layers: genreLayers }
    };
    
    // Enrich existing visual if it only has basic layers (no starfield/nebula/gradient)
    if (visual.background?.layers) {
      const hasRichLayers = visual.background.layers.some(
        (l) => l.type === 'starfield' || l.type === 'nebula' || l.type === 'gradient'
      );
      if (!hasRichLayers) {
        const existingTypes = new Set(visual.background.layers.map((l) => l.type));
        const newLayers = genreLayers.filter((l) => !existingTypes.has(l.type));
        visual = {
          ...visual,
          background: { ...visual.background, layers: [...visual.background.layers, ...newLayers] }
        };
      }
    }
    
    // Cria spec final
    const finalSpec: GameSpec = {
      metadata,
      scene: {
        gravity,
        entities
      },
      systems,
      visual,
      // Copia outras seções genéricas
      ...(spec.gameplay && { gameplay: spec.gameplay }),
      ...(spec.player && { player: spec.player }),
      ...(spec.ui && { ui: spec.ui }),
      ...(spec.audio && { audio: spec.audio }),
      ...(spec.runtime && { runtime: spec.runtime }),
      // Permite quaisquer outras extensões
      ...(spec as Record<string, unknown>)
    };
    
    return finalSpec;
  }

  private applyFeaturePlugins(spec: GameSpec, genre: string): GameSpec {
    if (!this.config.extensibility.featurePlugins?.length) {
      return spec;
    }
    
    let result = spec;
    
    for (const plugin of this.config.extensibility.featurePlugins) {
      if (plugin.appliesTo(genre, result)) {
        const before = JSON.stringify(result);
        result = plugin.apply(result);
        const after = JSON.stringify(result);
        
        if (before !== after) {
          this.logChange(`plugin.${plugin.id}`, 'modified', result, `Applied feature plugin: ${plugin.id}`, spec);
        }
      }
    }
    
    return result;
  }

  private validateSpec(spec: GameSpec): SchemaValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Valida metadata obrigatória
    if (!spec.metadata?.title?.trim()) {
      errors.push('metadata.title is required');
    }
    
    if (!spec.metadata?.genre?.trim()) {
      errors.push('metadata.genre is required');
    }
    
    // Valida scene obrigatória
    if (!spec.scene) {
      errors.push('scene is required');
    } else {
      if (!Array.isArray(spec.scene.entities)) {
        errors.push('scene.entities must be an array');
      }
      
      if (!spec.scene.gravity || typeof spec.scene.gravity.x !== 'number' || typeof spec.scene.gravity.y !== 'number') {
        errors.push('scene.gravity must be an object with x and y numbers');
      }
    }
    
    // Valida limites
    const limits = this.config.validation.limits;
    
    if (spec.scene?.entities && spec.scene.entities.length > limits.maxEntities) {
      warnings.push(`Too many entities (${spec.scene.entities.length} > ${limits.maxEntities})`);
    }
    
    if (spec.systems && spec.systems.length > limits.maxSystems) {
      warnings.push(`Too many systems (${spec.systems.length} > ${limits.maxSystems})`);
    }
    
    if (spec.metadata?.title && spec.metadata.title.length > limits.maxTitleLength) {
      warnings.push(`Title too long (${spec.metadata.title.length} > ${limits.maxTitleLength})`);
    }
    
    if (spec.metadata?.description && spec.metadata.description.length > limits.maxDescriptionLength) {
      warnings.push(`Description too long (${spec.metadata.description.length} > ${limits.maxDescriptionLength})`);
    }
    
    // Valida posições das entidades
    if (spec.scene?.entities) {
      for (const entity of spec.scene.entities) {
        if (entity.x < limits.positionRange.min || entity.x > limits.positionRange.max) {
          warnings.push(`Entity ${entity.id} has x position out of range: ${entity.x}`);
        }
        if (entity.y < limits.positionRange.min || entity.y > limits.positionRange.max) {
          warnings.push(`Entity ${entity.id} has y position out of range: ${entity.y}`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings: [...this.warnings, ...warnings]
    };
  }

  // ==========================================================================
  // MÉTODOS HELPER
  // ==========================================================================

  private extractString(input: Record<string, unknown>, key: string, fallback: string): string {
    const value = input[key];
    if (typeof value === 'string') {
      return value;
    }
    
    // Tenta extrair de metadata
    if (input.metadata && typeof input.metadata === 'object') {
      const metadata = input.metadata as Record<string, unknown>;
      if (typeof metadata[key] === 'string') {
        return metadata[key] as string;
      }
    }
    
    return fallback;
  }

  private extractGravity(scene: Record<string, unknown>): { x: number; y: number } {
    if (scene.gravity && typeof scene.gravity === 'object') {
      const gravity = scene.gravity as Record<string, unknown>;
      const x = typeof gravity.x === 'number' ? gravity.x : this.config.defaults.minimalSpec.gravity.x;
      const y = typeof gravity.y === 'number' ? gravity.y : this.config.defaults.minimalSpec.gravity.y;
      return { x, y };
    }
    
    return this.config.defaults.minimalSpec.gravity;
  }

  private extractEntities(scene: Record<string, unknown>): OrdaxEntity[] {
    if (!Array.isArray(scene.entities)) {
      return [];
    }
    
    return scene.entities.filter((item): item is OrdaxEntity => {
      return (
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).type === 'string' &&
        typeof (item as Record<string, unknown>).x === 'number' &&
        typeof (item as Record<string, unknown>).y === 'number' &&
        typeof (item as Record<string, unknown>).w === 'number' &&
        typeof (item as Record<string, unknown>).h === 'number'
      );
    });
  }

  private extractTheme(visual: Record<string, unknown>): OrdaxVisualTheme {
    if (visual.theme && typeof visual.theme === 'object') {
      const theme = visual.theme as Record<string, unknown>;
      return {
        background: typeof theme.background === 'string' ? theme.background : this.config.defaults.visualDefaults.theme.background,
        primary: typeof theme.primary === 'string' ? theme.primary : this.config.defaults.visualDefaults.theme.primary,
        accent: typeof theme.accent === 'string' ? theme.accent : this.config.defaults.visualDefaults.theme.accent,
        font: typeof theme.font === 'string' ? theme.font : this.config.defaults.visualDefaults.theme.font
      };
    }
    
    return this.config.defaults.visualDefaults.theme;
  }

  private extractBackground(visual: Record<string, unknown>, genre?: string): { layers: OrdaxBackgroundLayer[] } {
    let existingLayers: OrdaxBackgroundLayer[] = [];
    
    // Resolve genre to canonical type for layer lookup
    const canonicalGenre = genre ? resolveCanonicalGenre(genre) : undefined;
    
    if (visual.background && typeof visual.background === 'object') {
      const background = visual.background as Record<string, unknown>;
      if (Array.isArray(background.layers)) {
        existingLayers = background.layers.filter((layer): layer is OrdaxBackgroundLayer => {
          return (
            layer &&
            typeof layer === 'object' &&
            typeof (layer as Record<string, unknown>).type === 'string'
          );
        });
      }
    }
    
    // Check if existing layers are only basic types (solid) — enrich with genre defaults
    const hasRichLayers = existingLayers.some(
      (l) => l.type === 'starfield' || l.type === 'nebula' || l.type === 'gradient'
    );
    
    if (!hasRichLayers && canonicalGenre) {
      const genreLayers = DEFAULT_LAYERS_BY_GENRE[canonicalGenre as keyof typeof DEFAULT_LAYERS_BY_GENRE];
      if (genreLayers) {
        const existingTypes = new Set(existingLayers.map((l) => l.type));
        const newLayers = genreLayers.filter((l) => !existingTypes.has(l.type));
        return { layers: [...existingLayers, ...newLayers] };
      }
    }
    
    if (existingLayers.length > 0) {
      return { layers: existingLayers };
    }
    
    // Fallback to genre or config defaults
    if (canonicalGenre) {
      const genreLayers = DEFAULT_LAYERS_BY_GENRE[canonicalGenre as keyof typeof DEFAULT_LAYERS_BY_GENRE];
      if (genreLayers) return { layers: genreLayers };
    }
    
    return { layers: this.config.defaults.visualDefaults.backgroundLayers };
  }

  private normalizeEntities(entities: OrdaxEntity[]): OrdaxEntity[] {
    return entities.map((entity, index) => {
      // Garante ID único
      const id = entity.id?.trim() || `entity_${index}`;
      
      // Garante tipo
      const type = entity.type?.trim() || 'entity';
      
      // Valida posição
      const x = this.clamp(entity.x, this.config.validation.limits.positionRange);
      const y = this.clamp(entity.y, this.config.validation.limits.positionRange);
      
      // Valida tamanho
      const w = Math.max(1, entity.w || this.config.defaults.entityDefaults.size.w);
      const h = Math.max(1, entity.h || this.config.defaults.entityDefaults.size.h);
      
      // Garante props se for player
      let props = entity.props;
      if (type === 'player' || id === 'player') {
        if (!props) props = {};
        if (typeof props.health !== 'number') {
          props.health = this.config.defaults.entityDefaults.player.health;
        }
        if (typeof props.speed !== 'number') {
          props.speed = this.config.defaults.entityDefaults.player.speed;
        }
      }
      
      return {
        ...entity,
        id,
        type,
        x,
        y,
        w,
        h,
        props
      };
    });
  }

  private validateGravity(gravity: { x: number; y: number }): { x: number; y: number } {
    return {
      x: this.clamp(gravity.x, this.config.validation.limits.gravityRange),
      y: this.clamp(gravity.y, this.config.validation.limits.gravityRange)
    };
  }

  private clamp(value: number, range: { min: number; max: number }): number {
    return Math.max(range.min, Math.min(range.max, value));
  }

  private createError(message: string, code: string, details?: Record<string, unknown>): NormalizationError {
    const error = new Error(message) as NormalizationError;
    error.code = code;
    error.details = details;
    return error;
  }

  private createErrorResult(error: unknown): NormalizationResult {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    this.warnings.push(`Normalization error: ${errorMessage}`);
    
    // Cria spec mínima com erro
    const minimalSpec: GameSpec = {
      metadata: {
        title: `Error: ${this.config.defaults.minimalSpec.title}`,
        description: `[Normalization Error] ${errorMessage}`,
        genre: this.config.defaults.minimalSpec.genre
      },
      scene: {
        gravity: this.config.defaults.minimalSpec.gravity,
        entities: []
      },
      systems: []
    };
    
    return {
      spec: minimalSpec,
      changes: this.changes,
      warnings: this.warnings,
      validation: {
        isValid: false,
        errors: [errorMessage],
        warnings: this.warnings
      }
    };
  }

  private logChange(field: string, action: NormalizationChange['action'], after: unknown, reason: string, before?: unknown): void {
    if (!this.config.logging.logChanges) return;
    
    const change: NormalizationChange = {
      field,
      action,
      before,
      after,
      reason
    };
    
    this.changes.push(change);
    
    if (this.config.logging.enabled) {
      console.debug(`[GenericNormalizer] ${action} ${field}:`, { before, after, reason });
    }
  }
}

// ============================================================================
// FUNÇÕES DE CONVENIÊNCIA
// ============================================================================

/**
 * Normaliza um input para GameSpec usando o normalizador padrão
 */
export function normalizeGeneric(input: unknown, options?: {
  genreHint?: string;
  config?: Partial<NormalizerConfig>;
}): NormalizationResult {
  const normalizer = new GenericNormalizer(options?.config);
  return normalizer.normalize(input, {
    genreHint: options?.genreHint
  });
}

/**
 * Cria um GameSpec mínimo com configuração customizada
 */
export function createMinimalGameSpec(config?: {
  title?: string;
  description?: string;
  genre?: string;
  gravity?: { x: number; y: number };
  entities?: OrdaxEntity[];
  systems?: SystemId[];
}): GameSpec {
  const normalizer = new GenericNormalizer();
  
  const input = {
    metadata: {
      title: config?.title || 'Jogo',
      description: config?.description || '',
      genre: config?.genre || 'custom'
    },
    scene: {
      gravity: config?.gravity || { x: 0, y: 0 },
      entities: config?.entities || []
    },
    systems: config?.systems || []
  };
  
  const result = normalizer.normalize(input);
  return result.spec;
}

/**
 * Valida se um objeto é um GameSpec válido
 */
export function isValidGameSpec(obj: unknown): obj is GameSpec {
  if (!obj || typeof obj !== 'object') return false;
  
  const spec = obj as Record<string, unknown>;
  
  // Verifica metadata obrigatória
  if (!spec.metadata || typeof spec.metadata !== 'object') return false;
  
  const metadata = spec.metadata as Record<string, unknown>;
  if (typeof metadata.title !== 'string' || !metadata.title.trim()) return false;
  if (typeof metadata.genre !== 'string' || !metadata.genre.trim()) return false;
  
  // Verifica scene obrigatória
  if (!spec.scene || typeof spec.scene !== 'object') return false;
  
  const scene = spec.scene as Record<string, unknown>;
  if (!scene.gravity || typeof scene.gravity !== 'object') return false;
  
  const gravity = scene.gravity as Record<string, unknown>;
  if (typeof gravity.x !== 'number' || typeof gravity.y !== 'number') return false;
  
  if (!Array.isArray(scene.entities)) return false;
  
  return true;
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default GenericNormalizer;