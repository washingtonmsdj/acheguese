import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileJson,
  FileCode,
  FileImage,
  FileAudio,
  Search,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { vfs } from "@/lib/vfs/VirtualFileSystem";

// ============================================================================
// TYPES
// ============================================================================

type TreeNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  language?: string;
  children?: TreeNode[];
  expanded?: boolean;
};

type FileLanguage = "typescript" | "javascript" | "json" | "markdown" | "css" | "html";

interface StudioFileTreeProps {
  onFileOpen?: (fileId: string) => void;
  collapsed?: boolean;
}

interface TreeNodeComponentProps {
  node: TreeNode;
  level?: number;
  onToggle: (id: string) => void;
  onClick: (node: TreeNode) => void;
  compact?: boolean;
  searchTerm?: string;
}

interface VFSNode {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  language?: string;
  children?: VFSNode[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const LABELS = {
  HEADER: "Estrutura",
  SEARCH_PLACEHOLDER: "Buscar arquivos...",
  FILES_COUNT: "Arquivos:",
  OPENING_FILE: "Abrindo:",
} as const;

const MESSAGES = {
  SUCCESS: {
    FILE_CREATED: "Arquivo criado!",
    FILE_OPENED: "Arquivo aberto!",
  },
  ERROR: {
    FILE_CREATE_FAILED: "Erro ao criar arquivo",
    FILE_OPEN_FAILED: "Erro ao abrir arquivo",
    TREE_LOAD_FAILED: "Erro ao carregar árvore de arquivos",
    INVALID_NODE: "Nó inválido",
  },
  INFO: {
    MENU_DEV: "Menu em desenvolvimento",
  },
} as const;

const DEFAULTS = {
  NEW_FILE: {
    NAME: "newfile.ts",
    PATH: "/src",
    LANGUAGE: "typescript" as FileLanguage,
    CONTENT: "// New file\n",
  },
  TREE: {
    EXPANDED: true,
    LEVEL: 0,
  },
} as const;

const VALIDATION = {
  NODE_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 500,
  },
  NODE_NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 255,
  },
  RECURSION: {
    MAX_DEPTH: 50,
  },
  SEARCH: {
    MIN_LENGTH: 0,
    MAX_LENGTH: 100,
  },
} as const;

const LAYOUT = {
  WIDTH: {
    COLLAPSED: 14,
    EXPANDED: 64,
  },
  HEIGHT: {
    HEADER: 12,
    BUTTON: 7,
  },
  ICON: {
    SIZE: 3.5,
    SIZE_SMALL: 3,
  },
  PADDING: {
    BASE: 8,
    LEVEL_MULTIPLIER: 12,
    Y: 1,
    X: 2,
  },
  GAP: {
    SMALL: 1,
    MEDIUM: 2,
  },
  SEARCH: {
    HEIGHT: 8,
    ICON_LEFT: 2.5,
    ICON_TOP: 2,
    PADDING_LEFT: 8,
  },
  FONT: {
    SIZE_SMALL: 10,
    SIZE_NORMAL: 12,
  },
} as const;

const FILE_TYPES = {
  ICONS: {
    typescript: FileCode,
    javascript: FileCode,
    json: FileJson,
    markdown: FileCode,
    css: FileCode,
    html: FileCode,
    image: FileImage,
    audio: FileAudio,
  },
  EXTENSIONS: {
    ".ts": "typescript",
    ".tsx": "typescript",
    ".js": "javascript",
    ".jsx": "javascript",
    ".json": "json",
    ".md": "markdown",
    ".css": "css",
    ".html": "html",
  },
} as const;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

function validateNodeId(nodeId: unknown): string | null {
  if (typeof nodeId !== "string") return null;
  if (nodeId.length < VALIDATION.NODE_ID.MIN_LENGTH) return null;
  if (nodeId.length > VALIDATION.NODE_ID.MAX_LENGTH) return null;
  if (nodeId.trim() === "") return null;
  return nodeId;
}

function validateNode(node: unknown): node is TreeNode {
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  if (typeof n.id !== "string" || n.id.trim() === "") return false;
  if (typeof n.name !== "string" || n.name.trim() === "") return false;
  if (n.type !== "file" && n.type !== "folder") return false;
  if (typeof n.path !== "string") return false;
  return true;
}

function validateVFSNode(node: unknown): node is VFSNode {
  if (!node || typeof node !== "object") return false;
  const n = node as Record<string, unknown>;
  if (typeof n.id !== "string" || n.id.trim() === "") return false;
  if (typeof n.name !== "string" || n.name.trim() === "") return false;
  if (n.type !== "file" && n.type !== "folder") return false;
  if (typeof n.path !== "string") return false;
  return true;
}

function validateSearchTerm(search: unknown): string {
  if (typeof search !== "string") return "";
  if (search.length > VALIDATION.SEARCH.MAX_LENGTH) {
    return search.substring(0, VALIDATION.SEARCH.MAX_LENGTH);
  }
  return search;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getFileIcon(node: TreeNode) {
  if (node.type === "folder") {
    return node.expanded ? FolderOpen : Folder;
  }
  if (node.language && node.language in FILE_TYPES.ICONS) {
    return FILE_TYPES.ICONS[node.language as keyof typeof FILE_TYPES.ICONS];
  }
  return FileCode;
}

function filterTree(node: TreeNode, searchTerm: string): TreeNode | null {
  if (!searchTerm) return node;
  
  const lowerSearch = searchTerm.toLowerCase();
  const nameMatches = node.name.toLowerCase().includes(lowerSearch);
  
  if (node.type === "file") {
    return nameMatches ? node : null;
  }
  
  // Folder: filter children
  const filteredChildren = node.children
    ?.map(child => filterTree(child, searchTerm))
    .filter((child): child is TreeNode => child !== null) || [];
  
  // Show folder if name matches OR has matching children
  if (nameMatches || filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren,
      expanded: true, // Auto-expand when searching
    };
  }
  
  return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const StudioFileTree = React.forwardRef<HTMLDivElement, StudioFileTreeProps>(function StudioFileTree({ onFileOpen, collapsed }, ref) {
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [search, setSearch] = useState("");

  // Memoized values
  const isCollapsed = useMemo(() => !!collapsed, [collapsed]);
  
  const validatedSearch = useMemo(() => validateSearchTerm(search), [search]);
  
  const filteredTree = useMemo(() => {
    if (!tree || !validatedSearch) return tree;
    return filterTree(tree, validatedSearch);
  }, [tree, validatedSearch]);
  
  const fileCount = useMemo(() => {
    try {
      return vfs.getAllFiles().length;
    } catch (error) {
      console.error(MESSAGES.ERROR.TREE_LOAD_FAILED, error);
      return 0;
    }
  }, [tree]);

  // Convert VFS node to TreeNode with recursion protection
  const convertTree = useCallback((node: VFSNode, depth = 0): TreeNode => {
    if (depth > VALIDATION.RECURSION.MAX_DEPTH) {
      throw new Error(`Max recursion depth exceeded: ${VALIDATION.RECURSION.MAX_DEPTH}`);
    }

    if (!validateVFSNode(node)) {
      throw new Error(MESSAGES.ERROR.INVALID_NODE);
    }

    if (node.type === "file") {
      return {
        id: node.id,
        name: node.name,
        type: "file",
        path: node.path,
        language: node.language,
      };
    }

    return {
      id: node.id,
      name: node.name,
      type: "folder",
      path: node.path,
      expanded: DEFAULTS.TREE.EXPANDED,
      children: node.children?.map(child => convertTree(child, depth + 1)) || [],
    };
  }, []);

  // Load tree from VFS
  const loadTree = useCallback(() => {
    try {
      const vfsTree = vfs.getTree();
      if (vfsTree && validateVFSNode(vfsTree)) {
        setTree(convertTree(vfsTree));
      }
    } catch (error) {
      console.error(MESSAGES.ERROR.TREE_LOAD_FAILED, error);
      toast.error(MESSAGES.ERROR.TREE_LOAD_FAILED);
    }
  }, [convertTree]);

  // Load tree on mount and listen to VFS changes
  useEffect(() => {
    loadTree();

    try {
      const unsubscribe = vfs.on(() => {
        loadTree();
      });
      return unsubscribe;
    } catch (error) {
      console.error(MESSAGES.ERROR.TREE_LOAD_FAILED, error);
      return undefined;
    }
  }, [loadTree]);

  // Toggle folder expanded state with recursion protection
  const handleToggle = useCallback((nodeId: string) => {
    const validatedId = validateNodeId(nodeId);
    if (!validatedId) {
      console.error(MESSAGES.ERROR.INVALID_NODE, nodeId);
      return;
    }

    const toggleNode = (node: TreeNode, depth = 0): TreeNode => {
      if (depth > VALIDATION.RECURSION.MAX_DEPTH) {
        console.error(`Max recursion depth exceeded: ${VALIDATION.RECURSION.MAX_DEPTH}`);
        return node;
      }

      if (node.id === validatedId) {
        return { ...node, expanded: !node.expanded };
      }
      
      if (node.children) {
        return {
          ...node,
          children: node.children.map(child => toggleNode(child, depth + 1)),
        };
      }
      
      return node;
    };

    if (tree) {
      try {
        setTree(toggleNode(tree));
      } catch (error) {
        console.error(MESSAGES.ERROR.INVALID_NODE, error);
      }
    }
  }, [tree]);

  // Handle file click
  const handleFileClick = useCallback((node: TreeNode) => {
    if (!validateNode(node)) {
      console.error(MESSAGES.ERROR.INVALID_NODE, node);
      toast.error(MESSAGES.ERROR.FILE_OPEN_FAILED);
      return;
    }

    if (node.type === "file") {
      try {
        const vfsNode = vfs.getNodeById(node.id);
        if (vfsNode && vfsNode.type === "file") {
          toast.success(`${LABELS.OPENING_FILE} ${node.name}`);
          onFileOpen?.(node.id);
        } else {
          toast.error(MESSAGES.ERROR.FILE_OPEN_FAILED);
        }
      } catch (error) {
        console.error(MESSAGES.ERROR.FILE_OPEN_FAILED, error);
        toast.error(MESSAGES.ERROR.FILE_OPEN_FAILED);
      }
    }
  }, [onFileOpen]);

  // Create new file
  const handleCreateFile = useCallback(() => {
    try {
      const result = vfs.createFile(
        DEFAULTS.NEW_FILE.NAME,
        DEFAULTS.NEW_FILE.PATH,
        DEFAULTS.NEW_FILE.LANGUAGE as "typescript" | "json" | "css" | "html",
        DEFAULTS.NEW_FILE.CONTENT
      );
      
      if (result) {
        toast.success(MESSAGES.SUCCESS.FILE_CREATED);
      } else {
        toast.error(MESSAGES.ERROR.FILE_CREATE_FAILED);
      }
    } catch (error) {
      console.error(MESSAGES.ERROR.FILE_CREATE_FAILED, error);
      toast.error(MESSAGES.ERROR.FILE_CREATE_FAILED);
    }
  }, []);

  // Handle menu click
  const handleMenuClick = useCallback(() => {
    toast.info(MESSAGES.INFO.MENU_DEV);
  }, []);

  if (!filteredTree) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "border-l border-border/50 bg-card flex flex-col transition-[width] duration-200 ease-linear",
        isCollapsed ? "w-14" : "w-64",
      )}
    >
      {/* Header */}
      <div className="h-12 border-b border-border/50 flex items-center justify-between px-3 bg-card/60">
        {!isCollapsed && <span className="font-semibold text-sm">{LABELS.HEADER}</span>}
        <div className={cn("flex items-center gap-1", isCollapsed && "w-full justify-center")}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={handleCreateFile}
            aria-label={MESSAGES.SUCCESS.FILE_CREATED}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleMenuClick}
              aria-label={MESSAGES.INFO.MENU_DEV}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={LABELS.SEARCH_PLACEHOLDER}
              className="h-8 pl-8 text-xs"
              aria-label={LABELS.SEARCH_PLACEHOLDER}
            />
          </div>
        </div>
      )}

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className={cn("p-2", isCollapsed && "px-1")} role="tree" aria-label={LABELS.HEADER}>
          {filteredTree.children?.map((node) => (
            <TreeNodeComponent
              key={node.id}
              node={node}
              onToggle={handleToggle}
              onClick={handleFileClick}
              compact={isCollapsed}
              searchTerm={validatedSearch}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Info */}
      <div className={cn("border-t border-border/50 bg-card/60", isCollapsed ? "p-2" : "p-3")}>
        <div className="text-[10px] text-muted-foreground space-y-1">
          {!isCollapsed && (
            <div className="flex justify-between">
              <span>{LABELS.FILES_COUNT}</span>
              <span className="text-primary">{fileCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// TREE NODE COMPONENT
// ============================================================================

const TreeNodeComponent = React.forwardRef<HTMLDivElement, TreeNodeComponentProps>(function TreeNodeComponent({
  node,
  level = DEFAULTS.TREE.LEVEL,
  onToggle,
  onClick,
  compact,
  searchTerm,
}, ref) {
  const Icon = useMemo(() => getFileIcon(node), [node.type, node.expanded, node.language]);
  
  const isHighlighted = useMemo(() => {
    if (!searchTerm) return false;
    return node.name.toLowerCase().includes(searchTerm.toLowerCase());
  }, [node.name, searchTerm]);

  return (
    <div ref={ref}>
      <button
        onClick={() => {
          if (node.type === "folder") {
            onToggle(node.id);
          } else {
            onClick(node);
          }
        }}
        className={cn(
          "w-full flex items-center gap-2 px-2 py-1 hover:bg-surface-2 rounded text-xs transition-colors",
          level === DEFAULTS.TREE.LEVEL && "font-medium",
          isHighlighted && "bg-primary/10"
        )}
        style={{ paddingLeft: compact ? LAYOUT.PADDING.BASE : `${level * LAYOUT.PADDING.LEVEL_MULTIPLIER + LAYOUT.PADDING.BASE}px` }}
        role="treeitem"
        aria-expanded={node.type === "folder" ? node.expanded : undefined}
        aria-label={node.name}
      >
        {node.type === "folder" && (
          <span className="text-muted-foreground">
            {node.expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
        {node.type === "file" && !compact && <span className="w-3" />}
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
        {!compact && <span className="flex-1 text-left truncate">{node.name}</span>}
      </button>

      {node.type === "folder" && !compact && node.expanded && node.children && (
        <div role="group">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              onClick={onClick}
              compact={compact}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
});
