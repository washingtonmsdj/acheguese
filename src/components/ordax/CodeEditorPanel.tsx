import { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { vfs } from "@/lib/vfs/VirtualFileSystem";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// TYPES
// ============================================================================

type OpenFile = {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  modified: boolean;
  originalContent: string;
};

interface CodeEditorPanelProps {
  openFileId: string | null;
  onClose: () => void;
}

interface VFSFileNode {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  type: "file";
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LABELS = {
  BUTTONS: {
    REVERT: "Reverter",
    SAVE: "Salvar",
    CLOSE: "Fechar",
  },
  STATUS: {
    LANGUAGE: "Linguagem:",
    LINES: "Linhas:",
    CHARACTERS: "Caracteres:",
    UNSAVED: "● Não salvo",
  },
  MODIFIED_INDICATOR: "●",
} as const;

const MESSAGES = {
  SUCCESS: {
    FILE_SAVED: "salvo!",
  },
  ERROR: {
    FILE_NOT_FOUND: "Arquivo não encontrado",
    SAVE_FAILED: "Erro ao salvar arquivo",
    OPEN_FAILED: "Erro ao abrir arquivo",
    INVALID_FILE_ID: "ID de arquivo inválido",
    CONTENT_TOO_LARGE: "Conteúdo muito grande",
  },
  INFO: {
    CHANGES_REVERTED: "Alterações revertidas",
  },
  CONFIRM: {
    CLOSE_UNSAVED_TITLE: "Alterações não salvas",
    CLOSE_UNSAVED_DESC: "tem alterações não salvas. Deseja fechar mesmo assim?",
    CLOSE_BUTTON: "Fechar mesmo assim",
    CANCEL_BUTTON: "Cancelar",
  },
} as const;

const DEFAULTS = {
  TAB_SIZE: 2,
  LINE_HEIGHT: "1.6",
  MIN_HEIGHT: 500,
} as const;

const VALIDATION = {
  FILE_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
  CONTENT: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
  },
  OPEN_FILES: {
    MAX_COUNT: 20,
  },
} as const;

const LAYOUT = {
  TAB: {
    MIN_WIDTH: 120,
    MAX_WIDTH: 200,
  },
  TOOLBAR: {
    HEIGHT: 10,
  },
  STATUS_BAR: {
    HEIGHT: 8,
  },
  BUTTON: {
    HEIGHT: 7,
  },
  ICON: {
    SIZE: 3,
  },
  PADDING: {
    SMALL: 0.5,
    MEDIUM: 2,
    LARGE: 3,
    EDITOR: 4,
  },
  GAP: {
    SMALL: 1,
    MEDIUM: 2,
    LARGE: 4,
  },
  FONT: {
    SIZE_SMALL: 10,
    SIZE_NORMAL: 12,
  },
} as const;

const EDITOR = {
  SPELL_CHECK: false,
  RESIZE: "none" as const,
  FOCUS_OUTLINE: "none",
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateFileId(fileId: unknown): string | null {
  if (typeof fileId !== "string") return null;
  if (fileId.length < VALIDATION.FILE_ID.MIN_LENGTH) return null;
  if (fileId.length > VALIDATION.FILE_ID.MAX_LENGTH) return null;
  if (fileId.trim() === "") return null;
  return fileId;
}

function validateContent(content: unknown): string | null {
  if (typeof content !== "string") return null;
  if (content.length > VALIDATION.CONTENT.MAX_SIZE) {
    return null;
  }
  return content;
}

function validateVFSNode(node: unknown): node is VFSFileNode {
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  if (typeof n.id !== "string" || n.id.trim() === "") return false;
  if (typeof n.name !== "string" || n.name.trim() === "") return false;
  if (typeof n.path !== "string") return false;
  if (typeof n.content !== "string") return false;
  if (typeof n.language !== "string") return false;
  if (n.type !== "file") return false;
  return true;
}

function validateOpenFilesCount(count: number): boolean {
  return count < VALIDATION.OPEN_FILES.MAX_COUNT;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function updateFileInList(
  files: OpenFile[],
  fileId: string,
  updater: (file: OpenFile) => OpenFile
): OpenFile[] {
  return files.map((f) => (f.id === fileId ? updater(f) : f));
}

function countLines(content: string): number {
  if (!content) return 0;
  return content.split("\n").length;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CodeEditorPanel({ openFileId, onClose }: CodeEditorPanelProps) {
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [closeConfirmFile, setCloseConfirmFile] = useState<OpenFile | null>(null);

  // Memoized values
  const activeFile = useMemo(
    () => openFiles.find((f) => f.id === activeFileId),
    [openFiles, activeFileId]
  );

  const lineCount = useMemo(
    () => (activeFile ? countLines(activeFile.content) : 0),
    [activeFile]
  );

  const charCount = useMemo(
    () => (activeFile ? activeFile.content.length : 0),
    [activeFile]
  );

  // Open file handler
  const openFile = useCallback((fileId: string) => {
    const validatedId = validateFileId(fileId);
    if (!validatedId) {
      console.error(MESSAGES.ERROR.INVALID_FILE_ID, fileId);
      toast.error(MESSAGES.ERROR.INVALID_FILE_ID);
      return;
    }

    // Check if already open
    const existing = openFiles.find((f) => f.id === validatedId);
    if (existing) {
      setActiveFileId(validatedId);
      return;
    }

    // Check max open files
    if (!validateOpenFilesCount(openFiles.length)) {
      toast.error(`Máximo de ${VALIDATION.OPEN_FILES.MAX_COUNT} arquivos abertos`);
      return;
    }

    try {
      // Load from VFS
      const vfsNode = vfs.getNodeById(validatedId);
      
      if (!validateVFSNode(vfsNode)) {
        toast.error(MESSAGES.ERROR.FILE_NOT_FOUND);
        return;
      }

      const validatedContent = validateContent(vfsNode.content);
      if (validatedContent === null) {
        toast.error(MESSAGES.ERROR.CONTENT_TOO_LARGE);
        return;
      }

      const file: OpenFile = {
        id: vfsNode.id,
        name: vfsNode.name,
        path: vfsNode.path,
        content: validatedContent,
        language: vfsNode.language,
        modified: false,
        originalContent: validatedContent,
      };

      setOpenFiles((prev) => [...prev, file]);
      setActiveFileId(validatedId);
    } catch (error) {
      console.error(MESSAGES.ERROR.OPEN_FAILED, error);
      toast.error(MESSAGES.ERROR.OPEN_FAILED);
    }
  }, [openFiles]);

  // Close file handler
  const closeFile = useCallback((fileId: string) => {
    const validatedId = validateFileId(fileId);
    if (!validatedId) {
      console.error(MESSAGES.ERROR.INVALID_FILE_ID, fileId);
      return;
    }

    setOpenFiles((prevFiles) => {
      const file = prevFiles.find((f) => f.id === validatedId);
      
      if (file?.modified) {
        setCloseConfirmFile(file);
        return prevFiles;
      }

      const newFiles = prevFiles.filter((f) => f.id !== validatedId);
      
      // Update active file if needed
      if (activeFileId === validatedId) {
        setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
      }

      // Close panel if no files left
      if (newFiles.length === 0) {
        onClose();
      }

      return newFiles;
    });
  }, [activeFileId, onClose]);

  // Confirm close unsaved file
  const confirmCloseFile = useCallback(() => {
    if (!closeConfirmFile) return;

    setOpenFiles((prevFiles) => {
      const newFiles = prevFiles.filter((f) => f.id !== closeConfirmFile.id);
      
      if (activeFileId === closeConfirmFile.id) {
        setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
      }

      if (newFiles.length === 0) {
        onClose();
      }

      return newFiles;
    });

    setCloseConfirmFile(null);
  }, [closeConfirmFile, activeFileId, onClose]);

  // Update content handler
  const updateContent = useCallback((fileId: string, newContent: string) => {
    const validatedId = validateFileId(fileId);
    if (!validatedId) {
      console.error(MESSAGES.ERROR.INVALID_FILE_ID, fileId);
      return;
    }

    const validatedContent = validateContent(newContent);
    if (validatedContent === null) {
      toast.error(MESSAGES.ERROR.CONTENT_TOO_LARGE);
      return;
    }

    setOpenFiles((prev) =>
      updateFileInList(prev, validatedId, (f) => ({
        ...f,
        content: validatedContent,
        modified: validatedContent !== f.originalContent,
      }))
    );
  }, []);

  // Save file handler
  const saveFile = useCallback((fileId: string) => {
    const validatedId = validateFileId(fileId);
    if (!validatedId) {
      console.error(MESSAGES.ERROR.INVALID_FILE_ID, fileId);
      return;
    }

    const file = openFiles.find((f) => f.id === validatedId);
    if (!file) return;

    try {
      const success = vfs.updateFileContent(validatedId, file.content);
      
      if (success) {
        setOpenFiles((prev) =>
          updateFileInList(prev, validatedId, (f) => ({
            ...f,
            modified: false,
            originalContent: f.content,
          }))
        );
        toast.success(`${file.name} ${MESSAGES.SUCCESS.FILE_SAVED}`);
      } else {
        toast.error(MESSAGES.ERROR.SAVE_FAILED);
      }
    } catch (error) {
      console.error(MESSAGES.ERROR.SAVE_FAILED, error);
      toast.error(MESSAGES.ERROR.SAVE_FAILED);
    }
  }, [openFiles]);

  // Revert file handler
  const revertFile = useCallback((fileId: string) => {
    const validatedId = validateFileId(fileId);
    if (!validatedId) {
      console.error(MESSAGES.ERROR.INVALID_FILE_ID, fileId);
      return;
    }

    setOpenFiles((prev) =>
      updateFileInList(prev, validatedId, (f) => ({
        ...f,
        content: f.originalContent,
        modified: false,
      }))
    );
    toast.info(MESSAGES.INFO.CHANGES_REVERTED);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeFileId && activeFile?.modified) {
          saveFile(activeFileId);
        }
      }

      // Ctrl+W / Cmd+W - Close
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (activeFileId) {
          closeFile(activeFileId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFileId, activeFile, saveFile, closeFile]);

  // Open file when openFileId changes
  useEffect(() => {
    if (openFileId) {
      openFile(openFileId);
    }
  }, [openFileId, openFile]);

  if (openFiles.length === 0) {
    return null;
  }

  return (
    <>
      <div className="h-full flex flex-col bg-card">
        {/* Tabs */}
        <div className="border-b border-border/50 bg-card/60">
          <div className="flex items-center overflow-x-auto" role="tablist" aria-label="Open files">
            {openFiles.map((file) => (
              <div
                key={file.id}
                className={`
                  flex items-center gap-2 px-3 py-2 border-r border-border/50 cursor-pointer
                  hover:bg-surface-2 transition-colors min-w-[120px] max-w-[200px]
                  ${activeFileId === file.id ? "bg-card" : ""}
                `}
                onClick={() => setActiveFileId(file.id)}
                role="tab"
                aria-selected={activeFileId === file.id}
                aria-label={`${file.name}${file.modified ? " (modified)" : ""}`}
              >
                <span className="text-xs truncate flex-1">
                  {file.name}
                  {file.modified && <span className="text-primary ml-1">{LABELS.MODIFIED_INDICATOR}</span>}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFile(file.id);
                  }}
                  className="hover:bg-surface-3 rounded p-0.5"
                  aria-label={`${LABELS.BUTTONS.CLOSE} ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        {activeFile && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="h-10 border-b border-border/50 flex items-center justify-between px-3 bg-card/60">
              <div className="text-xs text-muted-foreground">
                {activeFile.path}
              </div>
              <div className="flex items-center gap-2">
                {activeFile.modified && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => revertFile(activeFile.id)}
                    aria-label={`${LABELS.BUTTONS.REVERT} ${activeFile.name}`}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {LABELS.BUTTONS.REVERT}
                  </Button>
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => saveFile(activeFile.id)}
                  disabled={!activeFile.modified}
                  aria-label={`${LABELS.BUTTONS.SAVE} ${activeFile.name}`}
                >
                  <Save className="h-3 w-3 mr-1" />
                  {LABELS.BUTTONS.SAVE}
                </Button>
              </div>
            </div>

            {/* Code Area */}
            <ScrollArea className="flex-1">
              <textarea
                value={activeFile.content}
                onChange={(e) => updateContent(activeFile.id, e.target.value)}
                className="w-full h-full min-h-[500px] p-4 bg-background text-sm font-mono resize-none focus:outline-none"
                spellCheck={EDITOR.SPELL_CHECK}
                style={{
                  tabSize: DEFAULTS.TAB_SIZE,
                  lineHeight: DEFAULTS.LINE_HEIGHT,
                }}
                aria-label={`Editor for ${activeFile.name}`}
              />
            </ScrollArea>

            {/* Status Bar */}
            <div className="h-8 border-t border-border/50 flex items-center justify-between px-3 bg-card/60 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>{LABELS.STATUS.LANGUAGE} {activeFile.language}</span>
                <span>{LABELS.STATUS.LINES} {lineCount}</span>
                <span>{LABELS.STATUS.CHARACTERS} {charCount}</span>
              </div>
              {activeFile.modified && (
                <span className="text-primary">{LABELS.STATUS.UNSAVED}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={!!closeConfirmFile} onOpenChange={(open) => !open && setCloseConfirmFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{MESSAGES.CONFIRM.CLOSE_UNSAVED_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {closeConfirmFile?.name} {MESSAGES.CONFIRM.CLOSE_UNSAVED_DESC}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCloseConfirmFile(null)}>
              {MESSAGES.CONFIRM.CANCEL_BUTTON}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmCloseFile}>
              {MESSAGES.CONFIRM.CLOSE_BUTTON}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
