import { forwardRef, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PanelLeft,
  PanelRight,
  Settings,
  FileText,
  Package,
  Plus,
  FolderOpen,
  Download,
  User,
  Bell,
  Save,
  Gamepad2,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { PresetSelectionModal } from "./PresetSelectionModal";
import type { OrdaxSpec } from "@/lib/ordax/types";

// Constants
const LABELS = {
  STUDIO_NAME: "Ordax Studio",
  SETUP: "Setup",
  TEMPLATES: "Templates",
  ASSETS: "Assets",
  CANONICAL_GAMES: "Jogos Canônicos",
  GAMES: "Games",
  NEW_PROJECT: "Novo Projeto",
  MY_PROJECTS: "Meus Projetos",
  EXPORT: "Exportar",
  SAVE: "Salvar",
  ACTIVE_PROJECT: "Projeto ativo",
  NO_PROJECT: "Sem projeto",
  PROFILE: "Perfil",
  SETTINGS: "Configurações",
  LOGOUT: "Sair",
} as const;

const MESSAGES = {
  INFO: {
    SETUP_IN_DEV: "Setup em desenvolvimento",
    TEMPLATES_IN_DEV: "Templates em desenvolvimento",
    ASSETS_IN_DEV: "Assets em desenvolvimento",
    NO_NOTIFICATIONS: "Sem notificações",
    PROFILE_IN_DEV: "Perfil em desenvolvimento",
    SETTINGS_IN_DEV: "Configurações em desenvolvimento",
  },
  SUCCESS: {
    GAME_CREATED: "Jogo criado!",
    GAME_READY: "Seu jogo está pronto para jogar",
    NEW_PROJECT_CREATED: "Novo projeto criado!",
    START_DESCRIBING: "Comece descrevendo seu jogo no chat",
    LOGOUT: "Logout realizado",
  },
} as const;

const ARIA_LABELS = {
  TOGGLE_LEFT: "Alternar sidebar esquerda",
  TOGGLE_RIGHT: "Alternar painel de arquivos",
} as const;

const ROUTES = {
  HOME: "/",
  GAMES: "/games",
} as const;

const MAX_TITLE_LENGTH = 30;

type Props = {
  onSave?: () => void;
  onExport?: () => void;
  onToggleLeft?: () => void;
  onToggleRight?: () => void;
  onPresetConfirm?: (spec: OrdaxSpec) => void;
  onNewProject?: () => void;
  currentSpec?: OrdaxSpec;
};

export const StudioTopBar = forwardRef<HTMLDivElement, Props>(function StudioTopBar(
  { onSave, onExport, onToggleLeft, onToggleRight, onPresetConfirm, onNewProject, currentSpec }: Props,
  ref,
) {
  const [presetModalOpen, setPresetModalOpen] = useState(false);

  // Handlers with useCallback
  const handlePresetConfirm = useCallback((spec: OrdaxSpec) => {
    if (onPresetConfirm) {
      onPresetConfirm(spec);
    }
    toast.success(MESSAGES.SUCCESS.GAME_CREATED, {
      description: MESSAGES.SUCCESS.GAME_READY
    });
  }, [onPresetConfirm]);

  const handleNewProject = useCallback(() => {
    if (onNewProject) {
      onNewProject();
    }
    toast.success(MESSAGES.SUCCESS.NEW_PROJECT_CREATED, {
      description: MESSAGES.SUCCESS.START_DESCRIBING
    });
  }, [onNewProject]);

  const handleSetupClick = useCallback(() => {
    toast.info(MESSAGES.INFO.SETUP_IN_DEV);
  }, []);

  const handleTemplatesClick = useCallback(() => {
    toast.info(MESSAGES.INFO.TEMPLATES_IN_DEV);
  }, []);

  const handleAssetsClick = useCallback(() => {
    toast.info(MESSAGES.INFO.ASSETS_IN_DEV);
  }, []);

  const handleNotificationsClick = useCallback(() => {
    toast.info(MESSAGES.INFO.NO_NOTIFICATIONS);
  }, []);

  const handleProfileClick = useCallback(() => {
    toast.info(MESSAGES.INFO.PROFILE_IN_DEV);
  }, []);

  const handleSettingsClick = useCallback(() => {
    toast.info(MESSAGES.INFO.SETTINGS_IN_DEV);
  }, []);

  const handleLogoutClick = useCallback(() => {
    toast.success(MESSAGES.SUCCESS.LOGOUT);
  }, []);

  // Memoized project title with validation and truncation
  const projectTitle = useMemo(() => {
    if (!currentSpec) {
      return LABELS.NO_PROJECT;
    }
    
    const title = currentSpec.title?.trim();
    if (!title) {
      return LABELS.ACTIVE_PROJECT;
    }
    
    if (title.length > MAX_TITLE_LENGTH) {
      return `${title.slice(0, MAX_TITLE_LENGTH)}...`;
    }
    
    return title;
  }, [currentSpec]);

  // Memoized badge styles
  const badgeStyles = useMemo(() => {
    const hasProject = !!currentSpec;
    return {
      className: hasProject 
        ? "border-primary/30 bg-primary/10 text-primary text-xs" 
        : "border-neon-green/30 bg-neon-green/10 text-neon-green text-xs",
      dotClassName: `w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${hasProject ? "bg-primary" : "bg-neon-green"}`,
    };
  }, [currentSpec]);

  return (
    <div ref={ref} className="h-12 border-b border-border/50 bg-card/60 flex items-center justify-between px-4">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleLeft}
          aria-label={ARIA_LABELS.TOGGLE_LEFT}
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-xs font-bold">OX</span>
          </div>
          <span className="font-bold text-sm">{LABELS.STUDIO_NAME}</span>
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-2 opacity-50 cursor-not-allowed"
          onClick={handleSetupClick}
          disabled
        >
          <Settings className="h-3 w-3" />
          {LABELS.SETUP}
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-2 opacity-50 cursor-not-allowed"
          onClick={handleTemplatesClick}
          disabled
        >
          <FileText className="h-3 w-3" />
          {LABELS.TEMPLATES}
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-2 opacity-50 cursor-not-allowed"
          onClick={handleAssetsClick}
          disabled
        >
          <Package className="h-3 w-3" />
          {LABELS.ASSETS}
        </Button>

        <Button 
          variant="default" 
          size="sm" 
          className="h-8 text-xs gap-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          onClick={() => setPresetModalOpen(true)}
        >
          <Gamepad2 className="h-3 w-3" />
          {LABELS.CANONICAL_GAMES}
        </Button>

        <Link to={ROUTES.GAMES}>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
            <Library className="h-3 w-3" />
            {LABELS.GAMES}
          </Button>
        </Link>

        <Button 
          variant="default" 
          size="sm" 
          className="h-8 text-xs gap-2"
          onClick={handleNewProject}
        >
          <Plus className="h-3 w-3" />
          {LABELS.NEW_PROJECT}
        </Button>

        <Link to={ROUTES.HOME}>
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-2">
            <FolderOpen className="h-3 w-3" />
            {LABELS.MY_PROJECTS}
          </Button>
        </Link>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-2"
          onClick={onExport}
        >
          <Download className="h-3 w-3" />
          {LABELS.EXPORT}
        </Button>

        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-2"
          onClick={onSave}
        >
          <Save className="h-3 w-3" />
          {LABELS.SAVE}
        </Button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleRight}
          aria-label={ARIA_LABELS.TOGGLE_RIGHT}
        >
          <PanelRight className="h-4 w-4" />
        </Button>

        <Badge variant="outline" className={badgeStyles.className}>
          <span className={badgeStyles.dotClassName}></span>
          {projectTitle}
        </Badge>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={handleNotificationsClick}
        >
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleProfileClick}>
              {LABELS.PROFILE}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick}>
              {LABELS.SETTINGS}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogoutClick}>
              {LABELS.LOGOUT}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Preset Selection Modal */}
      <PresetSelectionModal
        open={presetModalOpen}
        onOpenChange={setPresetModalOpen}
        onConfirm={handlePresetConfirm}
      />
    </div>
  );
});
