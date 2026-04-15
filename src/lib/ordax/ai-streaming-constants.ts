/**
 * AI Streaming Constants
 * Centralized constants for AI streaming client
 * 
 * @version 2.0.0
 * @changelog
 *   - 2.0.0: SSOT compliance - imports from config.ts
 */

import { TIMEOUTS } from "./config";

// ============================================================================
// SUPABASE FUNCTIONS
// ============================================================================
export const SUPABASE_FUNCTIONS = {
  GAME_AI_CHAT_STREAM: "game-ai-chat-stream",
} as const;

// ============================================================================
// API PATHS
// ============================================================================
export const API_PATHS = {
  GAME_AI_CHAT_STREAM: "/functions/v1/game-ai-chat-stream",
} as const;

// ============================================================================
// HTTP HEADERS
// ============================================================================
export const HTTP_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  CONTENT_TYPE_JSON: "application/json",
  API_KEY: "apikey",
  AUTHORIZATION: "Authorization",
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================
export const ERROR_MESSAGES = {
  INVALID_MESSAGES: "Invalid messages: must be non-empty array",
  INVALID_RESPONSE_FORMAT: "Invalid response format: missing 'files' and 'spec' fields",
  PARSE_FAILED: "Failed to parse AI response",
  NO_DATA_RECEIVED: "No data received from server",
  INVALID_RESPONSE_TYPE: "Invalid response: expected string",
  SUPABASE_URL_MISSING: "VITE_SUPABASE_URL não configurada",
  SUPABASE_KEY_MISSING: "VITE_SUPABASE_PUBLISHABLE_KEY nao configurada (ou legado VITE_SUPABASE_ANON_KEY)",
  INVALID_URL_FORMAT: "Invalid URL format",
  NO_READER_AVAILABLE: "No reader available",
  PARSE_FINAL_RESPONSE_FAILED: "Failed to parse final response (JSON inválido). Tente novamente ou use o fallback.",
  INVALID_TEXT_INPUT: "Invalid text input: expected non-empty string",
  INVALID_JSON_CANDIDATE: "Invalid JSON candidate",
} as const;

// ============================================================================
// STREAMING
// ============================================================================
export const STREAMING = {
  SIMULATED_DELAY_MS: 50,
  SSE_DATA_PREFIX: "data: ",
  SSE_DONE_MARKER: "[DONE]",
  SSE_COMMENT_PREFIX: ":",
} as const;

// ============================================================================
// ERROR DETAILS
// ============================================================================
export const ERROR_DETAILS = {
  MAX_BODY_LENGTH: 2000,
  MAX_MESSAGE_LENGTH: 500,
} as const;

// ============================================================================
// RETRY - SSOT from config.ts
// ============================================================================
export const RETRY = {
  MAX_ATTEMPTS: TIMEOUTS.RETRY_MAX_ATTEMPTS,
  INITIAL_DELAY_MS: TIMEOUTS.RETRY_INITIAL_DELAY_MS,
  MAX_DELAY_MS: TIMEOUTS.RETRY_MAX_DELAY_MS,
  BACKOFF_MULTIPLIER: TIMEOUTS.RETRY_BACKOFF_MULTIPLIER,
} as const;

// ============================================================================
// TIMEOUT - SSOT from config.ts
// ============================================================================
export const TIMEOUT = {
  DEFAULT_MS: TIMEOUTS.DEFAULT_MS,
  STREAMING_MS: TIMEOUTS.STREAMING_MS,
  CONNECTION_MS: TIMEOUTS.CONNECTION_MS,
} as const;

// ============================================================================
// RECONNECT
// ============================================================================
export const RECONNECT = {
  MAX_ATTEMPTS: TIMEOUTS.RETRY_MAX_ATTEMPTS,
  DELAY_MS: TIMEOUTS.RETRY_INITIAL_DELAY_MS * 2,
} as const;

// ============================================================================
// QUEUE
// ============================================================================
export const QUEUE = {
  MAX_SIZE: 10,
  PROCESS_DELAY_MS: 100,
} as const;

// ============================================================================
// METRICS
// ============================================================================
export const METRICS = {
  ENABLED: true,
  LOG_ERRORS: true,
  LOG_PERFORMANCE: true,
} as const;


// ============================================================================
// VALIDATION
// ============================================================================
export const VALIDATION = {
  MIN_MESSAGES: 1,
  MAX_URL_LENGTH: 2048,
} as const;

// ============================================================================
// ENV VARIABLES
// ============================================================================
export const ENV_VARS = {
  SUPABASE_URL: "VITE_SUPABASE_URL",
  SUPABASE_KEY: "VITE_SUPABASE_PUBLISHABLE_KEY",
  SUPABASE_KEY_LEGACY: "VITE_SUPABASE_ANON_KEY",
} as const;
