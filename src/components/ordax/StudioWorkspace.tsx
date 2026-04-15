import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import type { OrdaxSpec } from "@/lib/ordax/types";
import { StudioTopBar } from "./StudioTopBar";
import { StudioSidebar } from "./StudioSidebar";
import { StudioChatPanel } from "./StudioChatPanel";
import { StudioPreviewPanel } from "./StudioPreviewPanel";
import { StudioFileTree } from "./StudioFileTree";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { StudioBottomBar } from "./StudioBottomBar";
import { useProject } from "@/hooks/use-project";
import { vfs } from "@/lib/vfs/VirtualFileSystem";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { getGameById } from "@/games";
import { lintOrdaxSpec } from "@/lib/ordax/spec-lint";

import stellarVanguardCodeGameSource from "@/games/stellar-vanguard/codeGame.ts?raw";

// Types
interface LintIssue {
  message: string;
  severity?: 'error' | 'warning';
  path?: string;
}

type LintResult = LintIssue[] | undefined;

// Constants
const LAYOUT = {
  CHAT_PANEL: { default: 30, min: 22, max: 40 },
  PREVIEW_PANEL: { default: 70, min: 40 },
  AUTO_SAVE_INTERVAL: 30000,
} as const;

const VALIDATION = {
  MAX_FILENAME_LENGTH: 255,
  MAX_FOLDER_LENGTH: 100,
  MAX_SPEC_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_TITLE_LENGTH: 50,
  DANGEROUS_PATH_PATTERNS: ['..', './', '//', '\\', '\0', '%00', '%2e', '%2f'] as const,
} as const;

const DEFAULTS = {
  GAME_TYPE: "topdown",
  EMPTY_TITLE: "Novo Jogo",
  EMPTY_DESCRIPTION: "Descreva seu jogo aqui",
  UNTITLED_PREFIX: "untitled",
} as const;

const FILE_EXTENSIONS = {
  ORDAX: ".ordax.json",
  TYPESCRIPT: ".ts",
  JSON: ".json",
} as const;

const MESSAGES = {
  ERRORS: {
    INVALID_SPEC: "Spec inválida",
    INVALID_STRUCTURE: "Estrutura inválida",
    SAVE_PRESET_FAILED: "Erro ao salvar preset",
    SAVE_REMIX_FAILED: "Erro ao salvar remix",
    GAME_NOT_FOUND: "Game não encontrado",
    LOAD_GAME_FAILED: "Falha ao carregar game",
    NO_GAME_TO_EXPORT: "Nenhum jogo para exportar",
    INVALID_FOLDER: "Pasta inválida",
    INVALID_FILENAME: "Nome de arquivo inválido",
    PATH_TRAVERSAL: "Caminho inválido: tentativa de path traversal",
    SPEC_TOO_LARGE: "Spec muito grande",
    SERIALIZE_FAILED: "Falha ao serializar spec",
    INVALID_JSON: "JSON inválido",
    EMPTY_PROJECT_FAILED: "Erro ao criar projeto vazio",
  },
  SUCCESS: {
    PRESET_LOADED: "Preset carregado!",
    PRESET_READY: "pronto para jogar",
    WORKSPACE_CLEARED: "Workspace limpo",
    READY_FOR_NEW: "Pronto para criar um novo jogo",
    REMIX_CREATED: "Remix criado!",
    REMIX_READY: "Seu novo jogo está pronto",
    GAME_LOADED: "Carregado:",
  },
} as const;

/**
 * Save spec to VFS with proper folder structure and comprehensive validation
 * @throws Error if validation fails
 */
async function saveSpecToVFS(
  spec: OrdaxSpec,
  folder: string,
  filename: string
): Promise<void> {
  // Validate spec
  if (!spec || typeof spec !== 'object') {
    throw new Error("Invalid spec: must be an object");
  }

  // Validate folder
  if (!folder || typeof folder !== 'string' || folder.trim().length === 0) {
    throw new Error(MESSAGES.ERRORS.INVALID_FOLDER + ": must be a non-empty string");
  }
  
  if (folder.length > VALIDATION.MAX_FOLDER_LENGTH) {
    throw new Error(`${MESSAGES.ERRORS.INVALID_FOLDER}: too long (max ${VALIDATION.MAX_FOLDER_LENGTH} chars)`);
  }

  // Validate filename
  if (!filename || typeof filename !== 'string' || filename.trim().length === 0) {
    throw new Error(MESSAGES.ERRORS.INVALID_FILENAME + ": must be a non-empty string");
  }
  
  if (filename.length > VALIDATION.MAX_FILENAME_LENGTH) {
    throw new Error(`${MESSAGES.ERRORS.INVALID_FILENAME}: too long (max ${VALIDATION.MAX_FILENAME_LENGTH} chars)`);
  }

  // Comprehensive path traversal check
  for (const pattern of VALIDATION.DANGEROUS_PATH_PATTERNS) {
    if (folder.includes(pattern) || filename.includes(pattern)) {
      throw new Error(`${MESSAGES.ERRORS.PATH_TRAVERSAL} (${pattern})`);
    }
  }

  // Validate filename characters (alphanumeric, dots, dashes, underscores only)
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error(`${MESSAGES.ERRORS.INVALID_FILENAME}: only alphanumeric, dots, dashes, and underscores allowed`);
  }

  // Serialize with error handling
  let raw: string;
  try {
    raw = JSON.stringify(spec, null, 2);
  } catch (error) {
    throw new Error(`${MESSAGES.ERRORS.SERIALIZE_FAILED}: ${error instanceof Error ? error.message : 'unknown'}`);
  }

  // Validate size
  if (raw.length > VALIDATION.MAX_SPEC_SIZE_BYTES) {
    throw new Error(`${MESSAGES.ERRORS.SPEC_TOO_LARGE} (max ${VALIDATION.MAX_SPEC_SIZE_BYTES / 1024 / 1024}MB)`);
  }

  // Ensure folder exists (with error handling)
  try {
    if (!vfs.getNodeByPath(`/${folder}`)) {
      vfs.createFolder(folder, "/");
    }
  } catch (error) {
    console.error("Failed to create folder:", error);
    throw new Error(`Failed to create folder: ${error instanceof Error ? error.message : 'unknown'}`);
  }

  const path = `/${folder}/${filename}`;
  const existing = vfs.getNodeByPath(path);

  try {
    if (existing?.type === "file") {
      vfs.updateFileContent(existing.id, raw);
    } else {
      vfs.createFile(filename, `/${folder}`, "json", raw);
    }
  } catch (error) {
    console.error("Failed to save file:", error);
    throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'unknown'}`);
  }
}

/**
 * Generate safe filename from title with fallback for invalid inputs
 * Removes special characters and limits length
 */
function generateSafeFilename(title: string): string {
  if (!title || typeof title !== 'string') {
    return `${DEFAULTS.UNTITLED_PREFIX}-${Date.now()}${FILE_EXTENSIONS.ORDAX}`;
  }

  const sanitized = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, VALIDATION.MAX_TITLE_LENGTH);

  // Fallback if sanitization results in empty string
  if (sanitized.length === 0) {
    return `${DEFAULTS.UNTITLED_PREFIX}-${Date.now()}${FILE_EXTENSIONS.ORDAX}`;
  }

  return `${sanitized}${FILE_EXTENSIONS.ORDAX}`;
}

/**
 * Update VFS config file with spec JSON
 * Extracted to avoid duplication (used 3x in code)
 */
function updateVFSConfig(raw: string): boolean {
  try {
    const configNode = vfs.getNodeByPath("/config/ordax.json");
    if (configNode?.type === "file") {
      vfs.updateFileContent(configNode.id, raw);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to update VFS config:", error);
    return false;
  }
}

/**
 * Ensure folder path exists in VFS, creating if necessary
 * Extracted to avoid duplication
 */
function ensureFolderPath(path: string): boolean {
  try {
    const parts = path.split('/').filter(Boolean);
    let currentPath = '';
    
    for (const part of parts) {
      const parentPath = currentPath || '/';
      currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
      
      if (!vfs.getNodeByPath(currentPath)) {
        vfs.createFolder(part, parentPath);
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to ensure folder path ${path}:`, error);
    return false;
  }
}

/**
 * Validate lint result and return typed array
 * Ensures type safety for lint operations
 */
function validateLintResult(result: unknown): LintIssue[] {
  if (!result) {
    return [];
  }
  
  if (!Array.isArray(result)) {
    console.error("Invalid lint result: not an array", result);
    return [];
  }
  
  return result.filter((item): item is LintIssue => {
    return item && typeof item === 'object' && 'message' in item;
  });
}

export function StudioWorkspace() {
  const location = useLocation();
  const [spec, setSpec] = useState<OrdaxSpec | null>(null);
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const { save, exportProject, updateSpec } = useProject();

  const requestedGameId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("game");
  }, [location.search]);

  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const topBarRef = useRef<HTMLDivElement | null>(null);
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);

  // Stable save callback
  const stableSave = useCallback(() => {
    if (spec) {
      save({ silent: true });
    }
  }, [spec, save]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(stableSave, LAYOUT.AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [stableSave]);

  // Handle spec updates with comprehensive validation
  const handleSpecUpdate = useCallback((newSpec: OrdaxSpec, raw: string) => {
    // Validate inputs
    if (!newSpec || typeof newSpec !== 'object') {
      toast.error(MESSAGES.ERRORS.INVALID_SPEC, { 
        description: "Spec deve ser um objeto" 
      });
      return;
    }

    if (!raw || typeof raw !== 'string') {
      toast.error(MESSAGES.ERRORS.INVALID_JSON, { 
        description: "Raw deve ser uma string" 
      });
      return;
    }

    // Validate size
    if (raw.length > VALIDATION.MAX_SPEC_SIZE_BYTES) {
      toast.error(MESSAGES.ERRORS.SPEC_TOO_LARGE, { 
        description: `Máximo ${VALIDATION.MAX_SPEC_SIZE_BYTES / 1024 / 1024}MB` 
      });
      return;
    }

    // Validate spec structure with error handling
    let lintResult: LintResult;
    try {
      lintResult = lintOrdaxSpec(newSpec) as LintResult;
    } catch (error) {
      console.error("Lint error:", error);
      toast.error("Erro ao validar spec", {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      return;
    }

    // Validate lint result type and check for issues
    const validatedIssues = validateLintResult(lintResult);
    
    // ✅ CORREÇÃO: Não bloquear por erros de lint
    // Mostrar warnings mas SEMPRE aplicar a spec
    if (validatedIssues.length > 0) {
      console.warn("Spec validation warnings (non-blocking):", validatedIssues);
      toast.warning(MESSAGES.ERRORS.INVALID_SPEC, {
        description: `${validatedIssues.length} aviso(s) de validação. Aplicando spec mesmo assim...`
      });
      // ✅ NÃO fazer return - continuar aplicando
    }

    setSpec(newSpec);
    updateSpec(newSpec);

    // Update VFS with generated code
    const updated = updateVFSConfig(raw);
    if (!updated) {
      console.warn("VFS config not updated - file may not exist");
    }
  }, [updateSpec]);

  // Handle preset confirmation
  const handlePresetConfirm = useCallback(async (newSpec: OrdaxSpec) => {
    const raw = JSON.stringify(newSpec, null, 2);
    handleSpecUpdate(newSpec, raw);

    // Save to VFS
    try {
      const filename = generateSafeFilename(newSpec.title);
      await saveSpecToVFS(newSpec, "presets", filename);

      toast.success(MESSAGES.SUCCESS.PRESET_LOADED, {
        description: `${newSpec.title} ${MESSAGES.SUCCESS.PRESET_READY}`,
      });
    } catch (error) {
      console.error("Failed to save preset:", error);
      toast.error(MESSAGES.ERRORS.SAVE_PRESET_FAILED, {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }, [handleSpecUpdate]);

  // Handle new project
  const handleNewProject = useCallback(() => {
    // Clear all state
    setSpec(null);
    setOpenFileId(null);
    setShowEditor(false);

    // Clear VFS config
    const cleared = updateVFSConfig("");
    if (!cleared) {
      console.warn("Failed to clear VFS config - file may not exist");
    }

    // Create valid empty spec
    const emptySpec: OrdaxSpec = {
      gameType: DEFAULTS.GAME_TYPE,
      title: DEFAULTS.EMPTY_TITLE,
      description: DEFAULTS.EMPTY_DESCRIPTION,
      systems: [],
      scene: {
        gravity: { x: 0, y: 0 },
        entities: []
      }
    };

    // Validate empty spec
    let lintResult: LintResult;
    try {
      lintResult = lintOrdaxSpec(emptySpec) as LintResult;
    } catch (error) {
      console.error("Failed to validate empty spec:", error);
      toast.error(MESSAGES.ERRORS.EMPTY_PROJECT_FAILED, {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
      return;
    }

    const validatedIssues = validateLintResult(lintResult);
    
    // ✅ CORREÇÃO: Não bloquear por erros de lint em spec vazia
    if (validatedIssues.length > 0) {
      console.warn("Empty spec validation warnings (non-blocking):", validatedIssues);
      toast.warning(MESSAGES.ERRORS.EMPTY_PROJECT_FAILED, {
        description: `${validatedIssues.length} aviso(s). Aplicando spec vazia mesmo assim...`
      });
      // ✅ NÃO fazer return - continuar
    }

    updateSpec(emptySpec);

    // Force re-render by closing panels
    setLeftOpen(false);
    setRightOpen(false);

    toast.info(MESSAGES.SUCCESS.WORKSPACE_CLEARED, {
      description: MESSAGES.SUCCESS.READY_FOR_NEW,
    });
  }, [updateSpec]);

  // Handle remix completion
  const handleRemixComplete = useCallback(async (remixedSpec: OrdaxSpec, remixId: string) => {
    // Use the actual remixed spec, not a hardcoded one
    const ordaxSpec: OrdaxSpec = {
      ...remixedSpec,
      title: `${remixedSpec.title || "Game"} (Remix)`, // Use remixedSpec.title instead of stale spec
    };

    const raw = JSON.stringify(ordaxSpec, null, 2);
    handleSpecUpdate(ordaxSpec, raw);

    // Save to VFS
    try {
      const filename = `${remixId}${FILE_EXTENSIONS.ORDAX}`;
      await saveSpecToVFS(ordaxSpec, "remixes", filename);

      toast.success(MESSAGES.SUCCESS.REMIX_CREATED, {
        description: MESSAGES.SUCCESS.REMIX_READY,
      });
    } catch (error) {
      console.error("Failed to save remix:", error);
      toast.error(MESSAGES.ERRORS.SAVE_REMIX_FAILED, {
        description: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  }, [handleSpecUpdate]);

  // Load a predefined game into the Studio (via /workspace?game=...) with cleanup
  useEffect(() => {
    if (!requestedGameId) return;
    if (spec) return; // Don't override an active spec

    let cancelled = false;
    let abortController = new AbortController();

    const loadGame = async () => {
      const def = getGameById(requestedGameId);
      if (!def) {
        if (!cancelled) {
          toast.error(MESSAGES.ERRORS.GAME_NOT_FOUND, {
            description: `ID: ${requestedGameId}`,
          });
        }
        return;
      }

      try {
        // Validate buildSpec exists and is a function
        if (typeof def.buildSpec !== 'function') {
          throw new Error("Game definition missing buildSpec function");
        }

        const nextSpec = def.buildSpec();
        
        // Validate spec structure
        if (!nextSpec || typeof nextSpec !== 'object') {
          throw new Error("buildSpec returned invalid spec");
        }

        // Validate spec with linter
        const lintResult = validateLintResult(lintOrdaxSpec(nextSpec));
        if (lintResult.length > 0) {
          console.warn("Game spec has validation issues:", lintResult);
          // Continue anyway for predefined games, but log warning
        }

        const raw = JSON.stringify(nextSpec, null, 2);
        
        if (cancelled) return; // Don't update state if unmounted
        
        setSpec(nextSpec);
        updateSpec(nextSpec);

        // Persist into VFS for visibility/editing
        const filename = `${def.id}${FILE_EXTENSIONS.ORDAX}`;
        try {
          await saveSpecToVFS(nextSpec, "games", filename);
        } catch (error) {
          console.error("Failed to save game to VFS:", error);
          toast.warning("Jogo carregado mas não salvo no VFS", {
            description: error instanceof Error ? error.message : "Erro desconhecido"
          });
        }

        // Update VFS config
        const updated = updateVFSConfig(raw);
        if (!updated) {
          console.warn("Failed to update VFS config");
        }

        if (!cancelled) {
          toast.success(`${MESSAGES.SUCCESS.GAME_LOADED} ${def.title}`);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Erro desconhecido";
          console.error("Failed to load game:", error);
          toast.error(MESSAGES.ERRORS.LOAD_GAME_FAILED, {
            description: message,
          });
        }
      }
    };

    loadGame();

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [requestedGameId, spec, updateSpec]);

  // Seed code-first VFS workspace (hybrid model): mirror repo code into /vfs/games/<gameId>/.
  useEffect(() => {
    if (!requestedGameId) return;
    const gameId = requestedGameId;
    if (gameId !== "stellar-vanguard") return;

    let cancelled = false;

    const seedVFS = () => {
      try {
        // Ensure folder structure using helper
        const success = ensureFolderPath("/vfs/games/" + gameId);
        if (!success) {
          console.error("Failed to create VFS folder structure");
          return;
        }

        const entryPath = `/vfs/games/${gameId}/codeGame${FILE_EXTENSIONS.TYPESCRIPT}`;
        const existing = vfs.getNodeByPath(entryPath);
        
        if (existing?.type === "file") {
          console.log("VFS workspace already seeded");
          return;
        }
        
        if (cancelled) return;
        
        vfs.createFile("codeGame.ts", `/vfs/games/${gameId}`, "typescript", stellarVanguardCodeGameSource);
        console.log("VFS workspace seeded successfully");
      } catch (error) {
        console.error("Failed to seed VFS workspace:", error);
        // Non-critical, don't show error to user
      }
    };

    seedVFS();

    return () => {
      cancelled = true;
    };
  }, [requestedGameId]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!spec) {
      toast.error(MESSAGES.ERRORS.NO_GAME_TO_EXPORT);
      return;
    }
    exportProject();
  }, [spec, exportProject]);

  // Handle file open
  const handleFileOpen = useCallback((fileId: string) => {
    setOpenFileId(fileId);
    setShowEditor(true);
  }, []);

  // Handle editor close
  const handleEditorClose = useCallback(() => {
    setShowEditor(false);
    setOpenFileId(null);
  }, []);

  // Click-outside to collapse side panels
  const handleClickOutside = useCallback(() => {
    setLeftOpen(false);
    setRightOpen(false);
  }, []);

  useEffect(() => {
    if (!leftOpen && !rightOpen) return;

    const onDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      // Ignore clicks inside sidebars or top bar
      const refs = [topBarRef, leftRef, rightRef];
      if (refs.some((ref) => ref.current?.contains(target))) return;

      handleClickOutside();
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [leftOpen, rightOpen, handleClickOutside]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <StudioTopBar
        ref={topBarRef}
        onExport={handleExport}
        onSave={save}
        onToggleLeft={() => {
          setLeftOpen((v) => !v);
          // keep behavior “Lovable-like”: opening one collapses the other
          setRightOpen(false);
        }}
        onToggleRight={() => {
          setRightOpen((v) => !v);
          setLeftOpen(false);
        }}
        onPresetConfirm={handlePresetConfirm}
        onNewProject={handleNewProject}
        currentSpec={spec}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div ref={leftRef} className="h-full">
          <StudioSidebar collapsed={!leftOpen} />
        </div>

        {/* Center Content (Chat + Preview/Editor + File Tree) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            <ResizablePanelGroup direction="horizontal" className="flex-1">
              {/* Chat Panel */}
              <ResizablePanel
                defaultSize={LAYOUT.CHAT_PANEL.default}
                minSize={LAYOUT.CHAT_PANEL.min}
                maxSize={LAYOUT.CHAT_PANEL.max}
              >
                <StudioChatPanel
                  gameId={requestedGameId ?? undefined}
                  currentSpec={spec ?? undefined}
                  onSpec={handleSpecUpdate}
                />
              </ResizablePanel>

              <ResizableHandle className="w-px bg-border/50 hover:bg-primary/30 transition-colors" />

              {/* Preview or Editor Panel */}
              <ResizablePanel
                defaultSize={LAYOUT.PREVIEW_PANEL.default}
                minSize={LAYOUT.PREVIEW_PANEL.min}
              >
                {showEditor ? (
                  <CodeEditorPanel openFileId={openFileId} onClose={handleEditorClose} />
                ) : (
                  <StudioPreviewPanel
                    spec={spec}
                    gameId={requestedGameId ?? undefined}
                    onRemixComplete={handleRemixComplete}
                  />
                )}
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Right panel (File Tree) */}
            <div ref={rightRef} className="h-full">
              <StudioFileTree onFileOpen={handleFileOpen} collapsed={!rightOpen} />
            </div>
          </div>

          {/* Bottom Bar */}
          <StudioBottomBar />
        </div>
      </div>
    </div>
  );
}
