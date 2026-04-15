// Type guards and validation utilities for feature-validator.ts

import type {
  UnsupportedFeature,
  PlannerResponse
} from "./feature-validator.ts";

// Structured logger for consistent logging
interface StructuredLogger {
  warn: (message: string, data?: Record<string, unknown>) => void;
}

const logger: StructuredLogger = {
  warn: (message, data) => console.warn(`[feature-validator-utils] WARN: ${message}`, data),
};

// Type guards
export function isPlannerResponseStatus(value: unknown): value is PlannerResponse["status"] {
  return typeof value === "string" && [
    "success", "partial", "rejected"
  ].includes(value);
}

export function isUnsupportedFeature(value: unknown): value is UnsupportedFeature {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  return typeof obj.feature === "string" &&
         typeof obj.reason === "string" &&
         (obj.alternative === undefined || typeof obj.alternative === "string");
}

export function isPlannerResponse(value: unknown): value is PlannerResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  
  const obj = value as Record<string, unknown>;
  
  // Check required fields
  if (!isPlannerResponseStatus(obj.status)) {
    return false;
  }
  
  if (!Array.isArray(obj.unsupportedFeatures) || 
      !obj.unsupportedFeatures.every(isUnsupportedFeature)) {
    return false;
  }
  
  if (!Array.isArray(obj.engineNotes) || 
      !obj.engineNotes.every((note): note is string => typeof note === "string")) {
    return false;
  }
  
  if (typeof obj.userFeedback !== "string") {
    return false;
  }
  
  // Check optional fields
  if (obj.warnings !== undefined && 
      (!Array.isArray(obj.warnings) || 
       !obj.warnings.every((w): w is string => typeof w === "string"))) {
    return false;
  }
  
  return true;
}

// Validation functions
export function validatePlannerResponseStatus(value: unknown): PlannerResponse["status"] {
  if (isPlannerResponseStatus(value)) {
    return value;
  }
  logger.warn(`Invalid PlannerResponse status`, { value });
  return "partial";
}

export function validateUnsupportedFeature(value: unknown): UnsupportedFeature {
  if (isUnsupportedFeature(value)) {
    return value;
  }
  
  logger.warn("Invalid UnsupportedFeature, returning default");
  return {
    feature: "unknown",
    reason: "Invalid feature data",
    alternative: "Please check your request"
  };
}

// String utilities with safety
export function escapeForFeedback(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  
  // Escape characters that could break the feedback message
  return str
    .replace(/\\/g, "\\\\")
    .replace(/[\n\r\t]/g, " ")
    .trim();
}

export function safeToLowerCase(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  return str.toLowerCase();
}

export function containsFeature(prompt: string, feature: string): boolean {
  if (typeof prompt !== "string" || typeof feature !== "string") {
    return false;
  }
  
  const promptLower = safeToLowerCase(prompt);
  const featureLower = safeToLowerCase(feature);
  
  // Use word boundaries to avoid false positives
  // Example: "audio" should match "audio" but not "audiovisual"
  const regex = new RegExp(`\\b${featureLower}\\b`, "i");
  return regex.test(promptLower);
}

// Feature detection utilities
export function normalizeFeatureName(feature: string): string {
  if (typeof feature !== "string") {
    return "";
  }
  
  const normalized = safeToLowerCase(feature)
    .normalize("NFD") // Normalize accents
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, " ") // Remove special chars
    .trim();
  
  return normalized;
}

export function getFeatureSynonyms(feature: string): string[] {
  const synonyms: Record<string, string[]> = {
    "audio": ["som", "áudio", "audio", "sound", "música", "musica", "music"],
    "multiplayer": ["multijogador", "online", "local", "jogadores", "players"],
    "3d": ["3d", "three dimensional", "tridimensional", "3-d"],
    "procedural": ["procedural", "geração procedural", "procedural generation"],
    "isometric": ["isométrico", "isometrico", "isometric"]
  };
  
  const normalized = normalizeFeatureName(feature);
  
  for (const [key, synList] of Object.entries(synonyms)) {
    if (synList.includes(normalized)) {
      return synList;
    }
  }
  
  return [normalized];
}

// Validation helpers
export function validateStringParam(param: unknown, paramName: string, defaultValue: string = ""): string {
  if (typeof param === "string" && param.trim().length > 0) {
    return param.trim();
  }
  logger.warn(`Invalid string parameter`, { paramName, param, defaultValue });
  return defaultValue;
}

export function validateArrayParam<T>(param: unknown, paramName: string, validator: (value: unknown) => value is T): T[] {
  if (Array.isArray(param)) {
    return param.filter(validator);
  }
  logger.warn(`Invalid array parameter`, { paramName, param });
  return [];
}

// Performance utilities with enhanced error handling
export function createCachedFeatureDetector() {
  const cache = new Map<string, boolean>();
  const MAX_CACHE_SIZE = 100;
  
  return {
    detect: (prompt: string, feature: string): boolean => {
      try {
        const cacheKey = `${prompt}|${feature}`;
        
        if (cache.has(cacheKey)) {
          return cache.get(cacheKey)!;
        }
        
        const result = containsFeature(prompt, feature);
        cache.set(cacheKey, result);
        
        // Limit cache size with LRU eviction
        if (cache.size > MAX_CACHE_SIZE) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
        
        return result;
      } catch (error) {
        logger.warn(`Error in cached feature detection`, { prompt, feature, error });
        return false;
      }
    },
    clear: () => {
      cache.clear();
    },
    getSize: (): number => {
      return cache.size;
    }
  };
}