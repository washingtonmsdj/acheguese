import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FolderOpen,
  Star,
  Clock,
  Key,
  Plus,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link, useLocation } from "react-router-dom";
import { useCallback, useMemo } from "react";

// Constants
const LABELS = {
  NEW_PROJECT: "Novo Projeto",
  DASHBOARD: "Dashboard",
  MY_PROJECTS: "Meus Projetos",
  FAVORITES: "Favoritos",
  RECENT: "Recentes",
  LICENSE: "Licença",
  RECENT_SECTION: "RECENTE",
  DISK_USAGE: "Uso de Disco:",
} as const;

const TOAST_MESSAGES = {
  NEW_PROJECT: {
    title: "Novo projeto",
    description: "Configure onNewProject prop",
  },
  PROJECT_SELECTED: {
    title: "Projeto selecionado",
    description: (id: string) => `ID: ${id}`,
  },
  LICENSE: {
    title: "Licença: Ordax Pro",
  },
} as const;

const DEFAULT_VALUES = {
  PROJECT_COUNT: 0,
  FAVORITES_COUNT: 0,
  DISK_USAGE: { used: 0, total: 10 },
  RECENT_PROJECTS: [] as Project[],
} as const;

const LIMITS = {
  MAX_PROJECT_NAME_LENGTH: 100,
  MIN_DISK_TOTAL: 0.1, // Evita divisão por zero
} as const;

// Types
interface Project {
  id: string;
  name: string;
  type: string;
  date: string;
}

interface DiskUsage {
  used: number;
  total: number;
}

interface StudioSidebarProps {
  collapsed?: boolean;
  recentProjects?: Project[];
  projectCount?: number;
  favoritesCount?: number;
  diskUsage?: DiskUsage;
  activeProjectId?: string;
  onNewProject?: () => void;
  onProjectClick?: (projectId: string) => void;
  onLicenseClick?: () => void;
}

// Validation utilities
function validateCount(count: number): number {
  if (!Number.isFinite(count) || count < 0) {
    return 0;
  }
  return Math.floor(count);
}

function validateDiskUsage(diskUsage: DiskUsage): DiskUsage {
  const used = Number.isFinite(diskUsage.used) && diskUsage.used >= 0 
    ? diskUsage.used 
    : 0;
  
  const total = Number.isFinite(diskUsage.total) && diskUsage.total > 0 
    ? Math.max(diskUsage.total, LIMITS.MIN_DISK_TOTAL)
    : DEFAULT_VALUES.DISK_USAGE.total;
  
  // Ensure used doesn't exceed total
  return {
    used: Math.min(used, total),
    total,
  };
}

function validateProject(project: Project): boolean {
  return (
    project &&
    typeof project.id === 'string' &&
    project.id.trim().length > 0 &&
    typeof project.name === 'string' &&
    project.name.trim().length > 0 &&
    project.name.length <= LIMITS.MAX_PROJECT_NAME_LENGTH &&
    typeof project.type === 'string' &&
    typeof project.date === 'string'
  );
}

function validateProjects(projects: Project[]): Project[] {
  if (!Array.isArray(projects)) {
    return DEFAULT_VALUES.RECENT_PROJECTS;
  }
  return projects.filter(validateProject);
}

export function StudioSidebar({
  collapsed,
  recentProjects = DEFAULT_VALUES.RECENT_PROJECTS,
  projectCount = DEFAULT_VALUES.PROJECT_COUNT,
  favoritesCount = DEFAULT_VALUES.FAVORITES_COUNT,
  diskUsage = DEFAULT_VALUES.DISK_USAGE,
  activeProjectId,
  onNewProject,
  onProjectClick,
  onLicenseClick,
}: StudioSidebarProps) {
  const isCollapsed = !!collapsed;
  const location = useLocation();
  
  // Validate and normalize inputs
  const validatedProjects = useMemo(() => validateProjects(recentProjects), [recentProjects]);
  const validatedProjectCount = useMemo(() => validateCount(projectCount), [projectCount]);
  const validatedFavoritesCount = useMemo(() => validateCount(favoritesCount), [favoritesCount]);
  const validatedDiskUsage = useMemo(() => validateDiskUsage(diskUsage), [diskUsage]);
  
  // Calculate disk usage percentage
  const diskUsagePercent = useMemo(() => {
    const percent = (validatedDiskUsage.used / validatedDiskUsage.total) * 100;
    return Math.min(Math.max(percent, 0), 100); // Clamp between 0-100
  }, [validatedDiskUsage]);
  
  // Handlers
  const handleNewProject = useCallback(() => {
    if (onNewProject) {
      onNewProject();
    } else {
      toast.info(TOAST_MESSAGES.NEW_PROJECT.title, { 
        description: TOAST_MESSAGES.NEW_PROJECT.description 
      });
    }
  }, [onNewProject]);
  
  const handleProjectClick = useCallback((projectId: string) => {
    if (!projectId || projectId.trim().length === 0) {
      return; // Ignore invalid IDs
    }
    
    if (onProjectClick) {
      onProjectClick(projectId);
    } else {
      toast.info(TOAST_MESSAGES.PROJECT_SELECTED.title, { 
        description: TOAST_MESSAGES.PROJECT_SELECTED.description(projectId)
      });
    }
  }, [onProjectClick]);
  
  const handleLicenseClick = useCallback(() => {
    if (onLicenseClick) {
      onLicenseClick();
    } else {
      toast.info(TOAST_MESSAGES.LICENSE.title);
    }
  }, [onLicenseClick]);
  
  return (
    <div
      className={cn(
        "border-r border-border/50 bg-card flex flex-col transition-[width] duration-200 ease-linear",
        isCollapsed ? "w-14" : "w-64",
      )}
    >
      {/* New Project Button */}
      <div className="p-3 border-b border-border/50">
        <Button 
          className={cn("w-full justify-start gap-2 neon-glow", isCollapsed && "justify-center px-0")}
          size="sm"
          onClick={handleNewProject}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && LABELS.NEW_PROJECT}
        </Button>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-1">
        <Link to="/">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-xs h-8",
              isCollapsed && "justify-center px-0",
              location.pathname === "/" && "bg-primary/10 text-primary"
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            {!isCollapsed && LABELS.DASHBOARD}
          </Button>
        </Link>

        <Link to="/projects">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-xs h-8",
              isCollapsed && "justify-center px-0",
              location.pathname === "/projects" && "bg-primary/10 text-primary"
            )}
          >
            <FolderOpen className="h-4 w-4" />
            {!isCollapsed && (
              <>
                {LABELS.MY_PROJECTS}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {validatedProjectCount}
                </Badge>
              </>
            )}
          </Button>
        </Link>

        <Link to="/favorites">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-xs h-8",
              isCollapsed && "justify-center px-0",
              location.pathname === "/favorites" && "bg-primary/10 text-primary"
            )}
          >
            <Star className="h-4 w-4" />
            {!isCollapsed && (
              <>
                {LABELS.FAVORITES}
                <Badge variant="secondary" className="ml-auto text-xs">
                  {validatedFavoritesCount}
                </Badge>
              </>
            )}
          </Button>
        </Link>

        <Link to="/recent">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 text-xs h-8",
              isCollapsed && "justify-center px-0",
              location.pathname === "/recent" && "bg-primary/10 text-primary"
            )}
          >
            <Clock className="h-4 w-4" />
            {!isCollapsed && LABELS.RECENT}
          </Button>
        </Link>

        <Button
          variant="ghost"
          className={cn("w-full justify-start gap-2 text-xs h-8", isCollapsed && "justify-center px-0")}
          onClick={handleLicenseClick}
        >
          <Key className="h-4 w-4" />
          {!isCollapsed && LABELS.LICENSE}
        </Button>
      </div>

      <Separator className="bg-border/50" />

      {/* Recent Projects */}
      {!isCollapsed && validatedProjects.length > 0 && (
      <div className="flex-1 overflow-hidden">
        <div className="p-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center justify-between">
            {LABELS.RECENT_SECTION}
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>

        <ScrollArea className="h-[calc(100%-2rem)]">
          <div className="px-3 space-y-1">
            {validatedProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={cn(
                  "w-full text-left p-2 rounded-lg hover:bg-surface-2 transition-colors group",
                  project.id === activeProjectId && "bg-surface-2"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0 group-hover:neon-glow transition-all">
                    <FolderOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {project.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {project.type}
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 ml-10">
                  {project.date}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
      )}

      {/* Bottom Stats */}
      <div className={cn("border-t border-border/50 bg-card/60", isCollapsed ? "p-2" : "p-3")}>
        <div className="text-[10px] text-muted-foreground space-y-1">
          {!isCollapsed && (
            <div className="flex justify-between">
              <span>{LABELS.DISK_USAGE}</span>
              <span className="text-primary">
                {validatedDiskUsage.used.toFixed(1)}GB / {validatedDiskUsage.total}GB
              </span>
            </div>
          )}
          <div className="h-1 bg-surface-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all" 
              style={{ width: `${diskUsagePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
