// Configuration for patch-validator.ts

// Allowed directories and files
export const CANONICAL_ALLOWED_DIRS = new Set([
  "systems",
  "entities", 
  "ui",
  "state",
  "input",
  "audio",
  "spawn",
  "utils",
  "_derived"
]);

export const CANONICAL_ROOT_FILES = new Set([
  "codeGame.ts"
]);

// Canonical directories that require codeGame.ts update
export const CANONICAL_DIRS_REQUIRING_UPDATE = new Set([
  "systems",
  "entities",
  "ui",
  "state",
  "input",
  "audio",
  "spawn"
]);

// Patch configuration
export const PATCH_CONFIG = {
  VERSION: "1",
  KIND: "CODE_SEMANTIC_PATCH",
  VFS_PREFIX: "/vfs/games/"
} as const;

// Operation descriptions
export const OPERATION_DESCRIPTIONS: Record<string, string> = {
  "create_file": "Create a new file with content",
  "update_file": "Update an existing file with new content",
  "delete_file": "Delete an existing file",
  "rename_file": "Rename a file from one path to another",
  "move_file": "Move a file to a different directory"
};

// Validation rules
export const VALIDATION_RULES = {
  // Security rules
  NO_PATH_TRAVERSAL: "Paths cannot contain '..' for security",
  NO_ROOT_ACCESS: "Only specific files allowed in root directory",
  NO_DELETE_CODE_GAME: "codeGame.ts cannot be deleted",
  
  // Business rules
  REQUIRE_CODE_GAME_UPDATE: "Changes to canonical directories require codeGame.ts update",
  VALID_OPERATIONS: "Only predefined operations are allowed",
  VALID_DIRECTORIES: "Only predefined directories are allowed"
} as const;

// Helper functions
export function getAllowedDirectories(): string[] {
  return Array.from(CANONICAL_ALLOWED_DIRS);
}

export function getRootFiles(): string[] {
  return Array.from(CANONICAL_ROOT_FILES);
}

export function getDirectoriesRequiringUpdate(): string[] {
  return Array.from(CANONICAL_DIRS_REQUIRING_UPDATE);
}

export function isDirectoryRequiringUpdate(dir: string): boolean {
  return CANONICAL_DIRS_REQUIRING_UPDATE.has(dir);
}

export function isAllowedDirectory(dir: string): boolean {
  return CANONICAL_ALLOWED_DIRS.has(dir);
}

export function isAllowedRootFile(file: string): boolean {
  return CANONICAL_ROOT_FILES.has(file);
}

export function getVfsPrefix(gameId: string): string {
  return `${PATCH_CONFIG.VFS_PREFIX}${gameId}/`;
}

export function getCodeGamePath(gameId: string): string {
  return `${getVfsPrefix(gameId)}codeGame.ts`;
}

// Error messages (Portuguese for user-facing errors)
export const ERROR_MESSAGES = {
  INVALID_KIND: "Patch inválido: kind",
  INVALID_VERSION: (version: string) => `Patch inválido: version=${version}`,
  INVALID_GAME_ID: (actual: string, expected: string) => `Patch inválido: gameId=${actual} (esperado ${expected})`,
  INVALID_OPS: "Patch inválido: ops",
  INVALID_OP: "Op inválida: sem campo op",
  PATH_OUT_OF_SCOPE: (path: string) => `Path fora do escopo permitido: ${path}`,
  PATH_TRAVERSAL: (path: string) => `Path inválido (..): ${path}`,
  INVALID_ROOT_PATH: (path: string) => `Path inválido (raiz): ${path}`,
  ROOT_FILE_NOT_ALLOWED: (path: string) => `Arquivo na raiz não permitido: ${path}`,
  DIRECTORY_NOT_ALLOWED: (path: string) => `Diretório não permitido: ${path}`,
  DELETE_CODE_GAME: "Não é permitido deletar codeGame.ts",
  MISSING_CODE_GAME_UPDATE: (directories: string[], codeGamePath: string) => 
    `Patch incompleto: alterou/criou em [${directories.join(", ")}] mas não incluiu update_file em ${codeGamePath} (registro obrigatório).`
} as const;