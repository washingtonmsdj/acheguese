import { Button } from "@/shared/components/ui/button";
import { 
  LayoutDashboard, 
  FileText, 
  FilePen, 
  BarChart3, 
  MapPin, 
  Calendar,
  Users,
  Plus
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { DashboardChannelView, DashboardView } from "../../types/agentDashboardViewModels";

interface DashboardQuickActionsProps {
  channel: DashboardChannelView;
  activeView: DashboardView;
  onViewChange: (view: DashboardView) => void;
}

export function DashboardQuickActions({ channel, activeView, onViewChange }: DashboardQuickActionsProps) {
  const views: Array<{ id: DashboardView; label: string; icon: typeof LayoutDashboard }> = [
    { id: "overview", label: "Visão Geral", icon: LayoutDashboard },
    { id: "publications", label: "Publicações", icon: FileText },
    { id: "drafts", label: "Rascunhos", icon: FilePen },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "territories", label: "Territórios", icon: MapPin },
    { id: "schedule", label: "Agenda", icon: Calendar },
    { id: "team", label: "Equipe", icon: Users },
  ];

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* View Tabs - Scroll horizontal em mobile */}
      <div className="relative -mx-3 sm:mx-0">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto px-3 sm:px-0 pb-2 sm:pb-0 scrollbar-hide snap-x snap-mandatory">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.id;
            return (
              <Button
                key={view.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange(view.id)}
                className={cn(
                  "flex-shrink-0 snap-start gap-1.5 sm:gap-2 whitespace-nowrap transition-all",
                  "h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm",
                  isActive && "shadow-md"
                )}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden xs:inline sm:inline">{view.label}</span>
              </Button>
            );
          })}
        </div>
        
        {/* Gradient fade nas bordas em mobile */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-4 bg-gradient-to-r from-background to-transparent sm:hidden" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-4 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>

      {/* Primary Action - Fixo no mobile */}
      <div className="sm:hidden">
        <Button className="w-full gap-2 shadow-lg">
          <Plus className="h-4 w-4" />
          Nova Publicação
        </Button>
      </div>
    </div>
  );
}

