/**
 * Type Guards Centralizados
 * 
 * SSOT para todos os type guards usados no backend.
 * Evita duplicação de lógica de validação.
 */

// ============================================================================
// BASIC TYPE GUARDS
// ============================================================================

/**
 * Verifica se valor é um Record (objeto não-array)
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Verifica se valor é string
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Verifica se valor é string não-vazia
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * Verifica se valor é número finito
 */
export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Verifica se valor é boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Verifica se valor é array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Verifica se valor é array de strings
 */
export function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every(isString);
}

// ============================================================================
// DOMAIN-SPECIFIC TYPE GUARDS
// ============================================================================

/**
 * Verifica se valor é um GamePlan válido (validação parcial)
 */
export function isGamePlanInput(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  
  // Basic validation - at least should have some game plan properties
  const hasGameType = 'gameType' in value;
  const hasRequiredSystems = 'requiredSystems' in value;
  const hasRequiredEntities = 'requiredEntities' in value;
  
  return hasGameType || hasRequiredSystems || hasRequiredEntities;
}

/**
 * Verifica se valor é um OrdaxSpec válido (validação parcial)
 */
export function isOrdaxSpecInput(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  
  // Basic validation
  const hasGameType = 'gameType' in value || ('metadata' in value && isRecord(value.metadata) && 'genre' in value.metadata);
  const hasTitle = 'title' in value || ('metadata' in value && isRecord(value.metadata) && 'title' in value.metadata);
  const hasScene = 'scene' in value;
  
  return hasGameType || hasTitle || hasScene;
}

/**
 * Verifica se valor é uma CompilerSession válida (validação parcial)
 */
export function isCompilerSession(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  
  // Basic validation
  const hasApprovedByUser = 'approvedByUser' in value;
  const hasGamePlan = 'gamePlan' in value;
  
  return hasApprovedByUser || hasGamePlan;
}
