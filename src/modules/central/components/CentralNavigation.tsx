import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Moon, Sun } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn";
import { useTheme } from "@/shared/hooks/useTheme";
import { useSessionContext } from "@/core/session";
import { getCentralPrimaryNavItems } from "./centralNavigation.config";

const navItems = getCentralPrimaryNavItems();

export function CentralNavigation() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, activeProfile } = useSessionContext();

  const isActive = (href: string) => {
    if (href === "/central") {
      return location.pathname === "/central";
    }

    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link to="/central" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <LayoutGrid className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed ? <span className="font-display text-lg font-bold text-foreground">Central</span> : null}
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link
                      to={item.href}
                      className={cn(
                        "rounded-xl transition-colors hover:bg-sidebar-accent/50",
                        isActive(item.href) && "bg-sidebar-accent font-medium text-primary",
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed ? <span>{item.label}</span> : null}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="space-y-3 border-t border-sidebar-border p-4">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed ? <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span> : null}
        </button>

        <Link
          to="/conta"
          className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sidebar-accent/50"
        >
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src={activeProfile?.avatarUrl || ""} />
            <AvatarFallback>
              {activeProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {activeProfile?.displayName || user?.email || "Usuario"}
              </p>
              <span className="text-xs text-muted-foreground">Ver perfil</span>
            </div>
          ) : null}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
