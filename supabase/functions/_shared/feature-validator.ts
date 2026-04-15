// Feature Validator - Valida features solicitadas contra capacidades da engine
// Import type guards and validation utilities
import {
  isPlannerResponseStatus,
  isUnsupportedFeature as utilsIsUnsupportedFeature,
  isPlannerResponse as utilsIsPlannerResponse,
  validatePlannerResponseStatus,
  validateUnsupportedFeature,
  escapeForFeedback,
  safeToLowerCase,
  containsFeature,
  normalizeFeatureName,
  getFeatureSynonyms,
  validateStringParam,
  validateArrayParam,
  createCachedFeatureDetector
} from "./feature-validator-utils.ts";

// Import configuration
import {
  ENGINE_CAPABILITIES,
  FEATURE_TO_CAPABILITY_MAP,
  FEATURE_ALTERNATIVES,
  type EngineCapability,
  getCapabilityStatus,
  getFeatureAlternative,
  getCapabilitiesForFeature,
  getAllFeatures
} from "./feature-validator-config.ts";

// Logger estruturado
interface StructuredLogger {
  debug: (message: string, data?: Record<string, unknown>) => void;
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

const logger: StructuredLogger = {
  debug: (message, data) => console.debug(`[feature-validator] DEBUG: ${message}`, data),
  info: (message, data) => console.info(`[feature-validator] INFO: ${message}`, data),
  warn: (message, data) => console.warn(`[feature-validator] WARN: ${message}`, data),
  error: (message, data) => console.error(`[feature-validator] ERROR: ${message}`, data),
};

// Fallback configuration in case imports fail
const FALLBACK_CONFIG = {
  ENGINE_CAPABILITIES: {
    render_2d: true,
    render_3d: false,
    physics_arcade: true,
    physics_realistic: false,
    vehicle_system: true,
    weapon_system: true,
    ai_basic: true,
    ai_advanced: false,
    particle_system: true,
    animation_system: true,
    audio_system: false,
    audio_music: false,
    audio_sfx: false,
    multiplayer: false,
    online_multiplayer: false,
    local_multiplayer: false,
    save_system: true,
    dialogue_system: true,
    inventory_system: true,
    procedural_generation: false,
    ui_system: true,
    hud_system: true,
    menu_system: true,
    camera_topdown: true,
    camera_sideview: true,
    camera_isometric: false,
    camera_3d: false,
  } as const,

  FEATURE_TO_CAPABILITY_MAP: {
    "audio": ["audio_system", "audio_music", "audio_sfx"],
    "som": ["audio_system", "audio_music", "audio_sfx"],
    "áudio": ["audio_system", "audio_music", "audio_sfx"],
    "sound": ["audio_system", "audio_music", "audio_sfx"],
    "música": ["audio_music"],
    "musica": ["audio_music"],
    "music": ["audio_music"],
    "efeitos sonoros": ["audio_sfx"],
    "sound effects": ["audio_sfx"],
    "sfx": ["audio_sfx"],
    "multiplayer": ["multiplayer", "online_multiplayer"],
    "multijogador": ["multiplayer", "online_multiplayer"],
    "online": ["online_multiplayer"],
    "local": ["local_multiplayer"],
    "2 jogadores": ["local_multiplayer"],
    "dois jogadores": ["local_multiplayer"],
    "two players": ["local_multiplayer"],
    "players": ["multiplayer"],
    "jogadores": ["multiplayer"],
    "procedural": ["procedural_generation"],
    "geração procedural": ["procedural_generation"],
    "procedural generation": ["procedural_generation"],
    "gerado proceduralmente": ["procedural_generation"],
    "3d": ["render_3d", "camera_3d"],
    "3-d": ["render_3d", "camera_3d"],
    "three dimensional": ["render_3d", "camera_3d"],
    "tridimensional": ["render_3d", "camera_3d"],
    "isométrico": ["camera_isometric"],
    "isometrico": ["camera_isometric"],
    "isometric": ["camera_isometric"],
    "física realista": ["physics_realistic"],
    "realistic physics": ["physics_realistic"],
    "física avançada": ["physics_realistic"],
    "ia avançada": ["ai_advanced"],
    "advanced ai": ["ai_advanced"],
    "inteligência artificial avançada": ["ai_advanced"],
  } as const,

  FEATURE_ALTERNATIVES: {
    "audio": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
    "som": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
    "áudio": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
    "sound": "Jogo será criado sem áudio. Você pode adicionar sons manualmente depois.",
    "música": "Jogo será criado sem música. Você pode adicionar trilha sonora manualmente depois.",
    "musica": "Jogo será criado sem música. Você pode adicionar trilha sonora manualmente depois.",
    "music": "Jogo será criado sem música. Você pode adicionar trilha sonora manualmente depois.",
    "multiplayer": "Jogo será criado no modo single-player.",
    "multijogador": "Jogo será criado no modo single-player.",
    "online": "Jogo será criado no modo single-player offline.",
    "local": "Jogo será criado no modo single-player.",
    "3d": "Jogo será criado em 2D top-down.",
    "isométrico": "Jogo será criado em 2D top-down.",
    "isometrico": "Jogo será criado em 2D top-down.",
    "isometric": "Jogo será criado em 2D top-down.",
    "procedural": "Níveis serão criados manualmente (não procedurais).",
    "geração procedural": "Níveis serão criados manualmente (não procedurais).",
    "procedural generation": "Níveis serão criados manualmente (não procedurais).",
    "física realista": "Jogo usará física arcade simplificada.",
    "realistic physics": "Jogo usará física arcade simplificada.",
    "ia avançada": "Jogo usará IA básica para comportamento de inimigos.",
    "advanced ai": "Jogo usará IA básica para comportamento de inimigos.",
  } as const,
};

// Safe wrapper for configuration functions
function safeGetCapabilityStatus(capability: EngineCapability): boolean {
  try {
    return getCapabilityStatus(capability);
  } catch (error) {
    logger.error(`Error getting capability status`, { capability, error });
    // Check fallback config
    const fallbackCapability = capability as keyof typeof FALLBACK_CONFIG.ENGINE_CAPABILITIES;
    return FALLBACK_CONFIG.ENGINE_CAPABILITIES[fallbackCapability] ?? false;
  }
}

function safeGetFeatureAlternative(feature: string): string | undefined {
  try {
    return getFeatureAlternative(feature);
  } catch (error) {
    logger.error(`Error getting feature alternative`, { feature, error });
    const normalized = feature.toLowerCase().trim();
    return FALLBACK_CONFIG.FEATURE_ALTERNATIVES[normalized as keyof typeof FALLBACK_CONFIG.FEATURE_ALTERNATIVES];
  }
}

function safeGetAllFeatures(): string[] {
  try {
    return getAllFeatures();
  } catch (error) {
    logger.error(`Error getting all features`, { error });
    return Object.keys(FALLBACK_CONFIG.FEATURE_TO_CAPABILITY_MAP);
  }
}

function safeGetCapabilitiesForFeature(feature: string): EngineCapability[] {
  try {
    return getCapabilitiesForFeature(feature);
  } catch (error) {
    logger.error(`Error getting capabilities for feature`, { feature, error });
    const normalized = feature.toLowerCase().trim();
    const fallbackCaps = FALLBACK_CONFIG.FEATURE_TO_CAPABILITY_MAP[normalized as keyof typeof FALLBACK_CONFIG.FEATURE_TO_CAPABILITY_MAP];
    return fallbackCaps ? (fallbackCaps as EngineCapability[]) : [];
  }
}

export interface UnsupportedFeature {
  feature: string;
  reason: string;
  alternative?: string;
}

export interface PlannerResponse {
  status: "success" | "partial" | "rejected";
  plan?: Record<string, unknown>;
  unsupportedFeatures: UnsupportedFeature[];
  engineNotes: string[];
  userFeedback: string;
  warnings?: string[];
  diff?: Record<string, unknown>;
}

// Enhanced type guards that include validation
export function isUnsupportedFeature(value: unknown): value is UnsupportedFeature {
  return utilsIsUnsupportedFeature(value);
}

export function isPlannerResponse(value: unknown): value is PlannerResponse {
  return utilsIsPlannerResponse(value);
}

// Create cached feature detector for performance with size limits
const featureDetector = createCachedFeatureDetector();

export function validateRequestedFeatures(userPrompt: string): UnsupportedFeature[] {
  try {
    logger.debug("Validating requested features", { 
      userPromptLength: userPrompt?.length,
      userPromptPreview: userPrompt?.substring(0, 100) 
    });
    
    // Validate input with proper error handling
    const validatedPrompt = validateStringParam(userPrompt, "userPrompt", "");
    if (!validatedPrompt) {
      logger.warn("Empty or invalid user prompt, returning empty unsupported features");
      return [];
    }
    
    const unsupported: UnsupportedFeature[] = [];
    const allFeatures = safeGetAllFeatures();
    
    if (allFeatures.length === 0) {
      logger.error("No features available in configuration");
      return [];
    }
    
    logger.debug(`Checking ${allFeatures.length} features against prompt`);
    
    for (const featureName of allFeatures) {
      try {
        // Use cached detection with word boundaries
        if (featureDetector.detect(validatedPrompt, featureName)) {
          const capabilities = safeGetCapabilitiesForFeature(featureName);
          
          if (capabilities.length === 0) {
            logger.debug(`Feature ${featureName} has no capability requirements`);
            continue;
          }
          
          const missingCapabilities: string[] = [];
          
          for (const cap of capabilities) {
            try {
              if (!safeGetCapabilityStatus(cap)) {
                missingCapabilities.push(cap);
              }
            } catch (capError) {
              logger.error(`Error checking capability status`, { 
                capability: cap, 
                feature: featureName,
                error: capError 
              });
              missingCapabilities.push(cap);
            }
          }
          
          if (missingCapabilities.length > 0) {
            const alternative = safeGetFeatureAlternative(featureName);
            
            const unsupportedFeature: UnsupportedFeature = {
              feature: escapeForFeedback(featureName),
              reason: `${missingCapabilities.join(", ")} não implementado(s) na engine`,
              alternative: alternative ? escapeForFeedback(alternative) : undefined
            };
            
            unsupported.push(unsupportedFeature);
            logger.info(`Found unsupported feature`, { 
              feature: featureName, 
              missingCapabilities,
              hasAlternative: !!alternative 
            });
          }
        }
      } catch (featureError) {
        logger.error(`Error processing feature`, { 
          feature: featureName, 
          error: featureError 
        });
      }
    }
    
    logger.debug(`Found ${unsupported.length} unsupported features`);
    return unsupported;
    
  } catch (error) {
    logger.error("Critical error in validateRequestedFeatures", { error });
    return [];
  }
}

export function generateUserFeedback(unsupported: UnsupportedFeature[]): string {
  try {
    logger.debug("Generating user feedback", { 
      unsupportedCount: unsupported?.length 
    });
    
    // Validate input
    const validatedUnsupported = validateArrayParam(unsupported, "unsupported", isUnsupportedFeature);
    
    if (validatedUnsupported.length === 0) {
      return "Jogo criado com sucesso! Todas as features solicitadas estão disponíveis.";
    }
    
    // Collect feature names with error handling
    const featureNames: string[] = [];
    for (const u of validatedUnsupported) {
      try {
        const escaped = escapeForFeedback(u.feature);
        if (escaped) featureNames.push(escaped);
      } catch (error) {
        logger.error("Error escaping feature name", { 
          feature: u.feature, 
          error 
        });
      }
    }
    
    if (featureNames.length === 0) {
      return "Algumas features solicitadas não estão disponíveis nesta versão da engine.";
    }
    
    // Collect alternatives with error handling
    const alternatives: string[] = [];
    for (const u of validatedUnsupported) {
      if (u.alternative) {
        try {
          const escaped = escapeForFeedback(u.alternative);
          if (escaped) alternatives.push(escaped);
        } catch (error) {
          logger.error("Error escaping alternative", { 
            alternative: u.alternative, 
            error 
          });
        }
      }
    }
    
    const featureList = featureNames.join(", ");
    const baseMessage = `${featureList} ainda não disponível(is) nesta versão da engine.`;
    
    let fullMessage = baseMessage;
    if (alternatives.length > 0) {
      const alternativeText = alternatives.join(" ");
      fullMessage = `${baseMessage} ${alternativeText}`.trim();
    }
    
    // Limit message length to prevent UI issues
    const MAX_MESSAGE_LENGTH = 500;
    if (fullMessage.length > MAX_MESSAGE_LENGTH) {
      fullMessage = fullMessage.substring(0, MAX_MESSAGE_LENGTH - 3) + "...";
      logger.warn("Feedback message truncated", { 
        originalLength: fullMessage.length,
        truncatedLength: MAX_MESSAGE_LENGTH 
      });
    }
    
    const finalMessage = escapeForFeedback(fullMessage);
    logger.debug("Generated feedback message", { 
      length: finalMessage.length,
      hasAlternatives: alternatives.length > 0 
    });
    
    return finalMessage;
    
  } catch (error) {
    logger.error("Critical error in generateUserFeedback", { error });
    return "Erro ao gerar feedback. Por favor, tente novamente.";
  }
}

// Re-export type guard for external use
export { isPlannerResponseStatus } from "./feature-validator-utils.ts";