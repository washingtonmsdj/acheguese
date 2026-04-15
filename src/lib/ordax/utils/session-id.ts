/**
 * Session ID Generation Utilities
 * Centralized, testable session ID generation
 */

const SESSION_CONFIG = { PREFIX: 'sess', ID_PREFIX: 'sess', RANDOM_LENGTH: 8 };

/**
 * Generate a unique session ID
 * Format: {prefix}_{userId}_{timestamp}_{random}
 */
export function generateSessionId(userId?: string): string {
  const timestamp = Date.now();
  const random = generateRandomString(SESSION_CONFIG.RANDOM_LENGTH);
  const userPart = (userId || "anon").replace(/[^a-zA-Z0-9]/g, ""); // Remove caracteres especiais
  return `${SESSION_CONFIG.ID_PREFIX}_${userPart}_${timestamp}_${random}`;
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
  const random = generateRandomString(SESSION_CONFIG.RANDOM_LENGTH);
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
  // NOTA: userId pode conter underscores/hífens, então precisamos pegar as últimas 2 partes
  const parts = sessionId.split("_");
  if (parts.length < 3) {
    return false;
  }
  
  // O prefixo é a primeira parte
  const prefix = parts[0];
  if (prefix !== SESSION_CONFIG.ID_PREFIX) {
    return false;
  }
  
  // O timestamp é a PENÚLTIMA parte
  const timestampIndex = parts.length - 2;
  const timestamp = parts[timestampIndex];
  if (isNaN(Number(timestamp))) {
    return false;
  }
  
  // O random é a ÚLTIMA parte
  const random = parts[parts.length - 1];
  if (random.length !== SESSION_CONFIG.RANDOM_LENGTH) {
    return false;
  }
  
  return true;
}
