/**
 * AI Streaming Validators
 * Validation functions for AI streaming client
 */

import type { ChatMsg } from "./ai-streaming";
import { VALIDATION, ERROR_MESSAGES } from "./ai-streaming-constants";

/**
 * Validates if value is a non-empty string
 */
export function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/**
 * Validates if value is a valid URL string
 */
export function isValidUrl(value: unknown): value is string {
  if (!isValidString(value)) return false;
  if (value.length > VALIDATION.MAX_URL_LENGTH) return false;
  
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates messages array
 */
export function validateMessages(
  messages: unknown
): { valid: boolean; error?: string } {
  if (!Array.isArray(messages)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_MESSAGES };
  }
  
  if (messages.length < VALIDATION.MIN_MESSAGES) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_MESSAGES };
  }
  
  // Validate each message has required fields
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: ERROR_MESSAGES.INVALID_MESSAGES };
    }
    
    const chatMsg = msg as Partial<ChatMsg>;
    if (!chatMsg.role || !chatMsg.content) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_MESSAGES };
    }
    
    if (chatMsg.role !== "user" && chatMsg.role !== "assistant") {
      return { valid: false, error: ERROR_MESSAGES.INVALID_MESSAGES };
    }
    
    if (!isValidString(chatMsg.content)) {
      return { valid: false, error: ERROR_MESSAGES.INVALID_MESSAGES };
    }
  }
  
  return { valid: true };
}

/**
 * Validates environment variables
 */
export function validateEnvVars(
  baseUrl: unknown,
  anonKey: unknown
): { valid: boolean; error?: string } {
  if (!isValidString(baseUrl)) {
    return { valid: false, error: ERROR_MESSAGES.SUPABASE_URL_MISSING };
  }
  
  if (!isValidUrl(baseUrl)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_URL_FORMAT };
  }
  
  if (!isValidString(anonKey)) {
    return { valid: false, error: ERROR_MESSAGES.SUPABASE_KEY_MISSING };
  }
  
  return { valid: true };
}

/**
 * Validates JSON string before parsing
 */
export function isValidJsonString(value: unknown): value is string {
  if (!isValidString(value)) return false;
  
  // Basic JSON validation (starts with { or [)
  const trimmed = value.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}

/**
 * Safe JSON parse with validation
 */
export function safeJsonParse<T = unknown>(
  text: unknown
): { success: true; data: T } | { success: false; error: string } {
  if (!isValidString(text)) {
    return { success: false, error: ERROR_MESSAGES.INVALID_TEXT_INPUT };
  }
  
  if (!isValidJsonString(text)) {
    return { success: false, error: ERROR_MESSAGES.INVALID_JSON_CANDIDATE };
  }
  
  try {
    const data = JSON.parse(text) as T;
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.PARSE_FAILED,
    };
  }
}

/**
 * Validates ReadableStream value
 */
export function isValidStreamValue(value: unknown): value is Uint8Array {
  return value instanceof Uint8Array && value.length > 0;
}
