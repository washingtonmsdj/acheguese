/**
 * Session Utilities for Deno
 * Session ID generation and validation
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const SESSION_PREFIX = "ordax";
const RANDOM_LENGTH = 15;

// ============================================================================
// SESSION ID GENERATION
// ============================================================================

/**
 * Generate a unique session ID
 * Format: ordax_{userId}_{timestamp}_{random}
 */
export function generateSessionId(userId?: string): string {
  const timestamp = Date.now();
  const random = generateRandomString(RANDOM_LENGTH);
  const userPart = (userId || "anon").replace(/[^a-zA-Z0-9]/g, ""); // Remove caracteres especiais
  return `${SESSION_PREFIX}_${userPart}_${timestamp}_${random}`;
}

/**
 * Generate a random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a request ID for tracking individual requests
 * Format: {timestamp}_{random}
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(RANDOM_LENGTH);
  return `${timestamp}_${random}`;
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  if (!sessionId || typeof sessionId !== "string") {
    return false;
  }
  
  // Format: ordax_{userId}_{timestamp}_{random}
  const parts = sessionId.split("_");
  if (parts.length !== 4) {
    return false;
  }
  
  const [prefix, , timestamp, random] = parts;
  
  if (prefix !== SESSION_PREFIX) {
    return false;
  }
  
  if (isNaN(Number(timestamp))) {
    return false;
  }
  
  if (random.length !== RANDOM_LENGTH) {
    return false;
  }
  
  return true;
}

/**
 * Extract user ID from session ID
 */
export function extractUserIdFromSessionId(sessionId: string): string | null {
  if (!isValidSessionId(sessionId)) {
    return null;
  }
  
  const parts = sessionId.split("_");
  return parts[1] || null;
}

/**
 * Extract timestamp from session ID
 */
export function extractTimestampFromSessionId(sessionId: string): number | null {
  if (!isValidSessionId(sessionId)) {
    return null;
  }
  
  const parts = sessionId.split("_");
  const timestamp = Number(parts[2]);
  return isNaN(timestamp) ? null : timestamp;
}
