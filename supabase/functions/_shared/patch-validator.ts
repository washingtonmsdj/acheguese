// Patch Validator - Valida patches de código semântico
// Import type guards, validation utilities, and configuration
import {
  type PatchOperation,
  type PatchOp,
  isCodeSemanticPatch,
  validateCodeSemanticPatch,
  validatePatchOp,
  safeNormalizePath,
  validateGameId,
  isPathWithinScope,
  containsPathTraversal,
  getPathSegments,
  createValidationError,
  formatValidationError
} from "./patch-validator-utils.ts";

import {
  PATCH_CONFIG,
  ERROR_MESSAGES,
  getVfsPrefix,
  getCodeGamePath,
  isAllowedDirectory,
  isAllowedRootFile,
  isDirectoryRequiringUpdate,
  getDirectoriesRequiringUpdate
} from "./patch-validator-config.ts";

export interface CodeSemanticPatch {
  kind: "CODE_SEMANTIC_PATCH";
  version: string;
  gameId: string;
  ops: PatchOp[];
}

// Helper functions for validation

// Validation helper functions
function validatePatchStructure(patch: unknown, targetGameId: string): CodeSemanticPatch {
  // Validate patch is a CodeSemanticPatch
  const validatedPatch = validateCodeSemanticPatch(patch);
  
  // Validate version
  if (validatedPatch.version !== PATCH_CONFIG.VERSION) {
    throw createValidationError(ERROR_MESSAGES.INVALID_VERSION(validatedPatch.version));
  }
  
  // Validate gameId
  const validatedTargetGameId = validateGameId(targetGameId);
  if (validatedPatch.gameId !== validatedTargetGameId) {
    throw createValidationError(ERROR_MESSAGES.INVALID_GAME_ID(validatedPatch.gameId, validatedTargetGameId));
  }
  
  return validatedPatch;
}

function validateOperation(op: PatchOp, prefix: string, codeGamePath: string): { touchedCanonicalDirs: Set<string>; hasCodeGameUpdate: boolean } {
  const touchedCanonicalDirs = new Set<string>();
  let hasCodeGameUpdate = false;
  
  // Get paths to validate based on operation type
  const pathsToValidate: string[] = [];
  
  switch (op.op) {
    case "rename_file":
      if (op.from) pathsToValidate.push(op.from);
      if (op.to) pathsToValidate.push(op.to);
      break;
    
    case "move_file":
      if (op.path) pathsToValidate.push(op.path);
      if (op.to) pathsToValidate.push(op.to);
      break;
    
    default:
      if (op.path) pathsToValidate.push(op.path);
      break;
  }
  
  // Validate each path
  for (const rawPath of pathsToValidate) {
    validatePath(rawPath, op, prefix, codeGamePath, touchedCanonicalDirs);
  }
  
  // Check if this operation updates codeGame.ts
  if (op.op === "update_file" && op.path) {
    const normalizedPath = safeNormalizePath(op.path);
    if (normalizedPath === codeGamePath) {
      hasCodeGameUpdate = true;
    }
  }
  
  return { touchedCanonicalDirs, hasCodeGameUpdate };
}

function validatePath(
  rawPath: string,
  op: PatchOp,
  prefix: string,
  codeGamePath: string,
  touchedCanonicalDirs: Set<string>
): void {
  const absPath = safeNormalizePath(rawPath);
  
  // Check path is within scope
  if (!isPathWithinScope(absPath, prefix)) {
    throw formatValidationError(op, ERROR_MESSAGES.PATH_OUT_OF_SCOPE(absPath));
  }
  
  // Check for path traversal
  if (containsPathTraversal(absPath)) {
    throw formatValidationError(op, ERROR_MESSAGES.PATH_TRAVERSAL(absPath));
  }
  
  // Get path segments
  const segments = getPathSegments(absPath, prefix);
  if (segments.length === 0) {
    throw formatValidationError(op, ERROR_MESSAGES.INVALID_ROOT_PATH(absPath));
  }
  
  // Validate root files or directory structure
  if (segments.length === 1) {
    // Root file
    if (!isAllowedRootFile(segments[0])) {
      throw formatValidationError(op, ERROR_MESSAGES.ROOT_FILE_NOT_ALLOWED(absPath));
    }
  } else {
    // Nested path - validate first directory
    const firstDir = segments[0];
    if (!isAllowedDirectory(firstDir)) {
      throw formatValidationError(op, ERROR_MESSAGES.DIRECTORY_NOT_ALLOWED(absPath));
    }
    
    // Track canonical directories that require codeGame.ts update
    if (isDirectoryRequiringUpdate(firstDir)) {
      touchedCanonicalDirs.add(firstDir);
    }
  }
  
  // Special validation for delete operations on codeGame.ts
  if (op.op === "delete_file" && absPath === codeGamePath) {
    throw formatValidationError(op, ERROR_MESSAGES.DELETE_CODE_GAME);
  }
}

function validatePatchCompleteness(
  touchedCanonicalDirs: Set<string>,
  hasCodeGameUpdate: boolean,
  codeGamePath: string
): void {
  if (touchedCanonicalDirs.size > 0 && !hasCodeGameUpdate) {
    const directories = Array.from(touchedCanonicalDirs);
    throw createValidationError(
      ERROR_MESSAGES.MISSING_CODE_GAME_UPDATE(directories, codeGamePath)
    );
  }
}

// Main validation function
export function validateCodeSemanticPatchOrThrow(patch: unknown, targetGameId: string): void {
  // Step 1: Validate patch structure
  const validatedPatch = validatePatchStructure(patch, targetGameId);
  
  // Step 2: Setup validation context
  const prefix = getVfsPrefix(targetGameId);
  const codeGamePath = getCodeGamePath(targetGameId);
  const allTouchedCanonicalDirs = new Set<string>();
  let overallHasCodeGameUpdate = false;
  
  // Step 3: Validate each operation
  for (const op of validatedPatch.ops) {
    const { touchedCanonicalDirs, hasCodeGameUpdate } = validateOperation(op, prefix, codeGamePath);
    
    // Merge results
    touchedCanonicalDirs.forEach(dir => allTouchedCanonicalDirs.add(dir));
    if (hasCodeGameUpdate) {
      overallHasCodeGameUpdate = true;
    }
  }
  
  // Step 4: Validate patch completeness
  validatePatchCompleteness(allTouchedCanonicalDirs, overallHasCodeGameUpdate, codeGamePath);
}
