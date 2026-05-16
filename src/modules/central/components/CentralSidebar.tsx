import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  LayoutDashboard,
  Radio,
  Building2,
  Calendar,
  Users,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/central" },
  { id: "comunicacao", label: "Comunicação", icon: Radio, href: "/central/comunicacao" },
  { id: "empresas", label: "Empresas", icon: Building2, href: "/central/empresas" },
  { id: "eventos", label: "Eventos", icon: Calendar, href: "/central/eventos" },
  { id: "comunidade", label: "Comunidade", icon: Users, href: "/central/comunidade" },
  { id: "configuracoes", label: "Configurações", icon: Settings, href: "/central/configuracoes" },
];

export function CentralSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <>
      {/* Mobile Menu Button - Sempre visível em mobile */}
      <Button
        variant="default"
        size="icon"
        className="fixed left-4 top-4 z-50 lg:hidden shadow-lg hover:scale-105 transition-transform"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay - Apenas mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
          "flex flex-col shadow-xl lg:shadow-none",
          // Mobile
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop
          isCollapsed ? "lg:w-20" : "lg:w-64",
          "w-64"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">Central</span>
            </div>
          )}
          
          {/* Desktop Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={toggleCollapse}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
                           location.pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.id}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !isActive && "text-muted-foreground",
                  isCollapsed && "justify-center"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
                {!isCollapsed && item.badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t p-3">
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5",
              isCollapsed && "justify-center"
            )}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              U
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Usuário</p>
                <p className="text-xs text-muted-foreground truncate">Gestor</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
