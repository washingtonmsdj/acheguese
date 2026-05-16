import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Building2, Calendar, Radio, User, Car, Bike, Sun, Moon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/utils/cn';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSessionContext } from '@/core/session';

const navItems = [
  { title: "Início", url: "/central", icon: LayoutGrid },
  { title: "Minhas Empresas", url: "/central/empresas", icon: Building2 },
  { title: "Meus Eventos", url: "/central/eventos", icon: Calendar },
  { title: "Meus Canais", url: "/central/comunicacao", icon: Radio },
  { title: "Perfil Profissional", url: "/central/profissional", icon: User },
  { title: "Motorista", url: "/central/motorista", icon: Car },
  { title: "Motoboy", url: "/central/motoboy", icon: Bike },
];

/**
 * CentralNavigation
 * 
 * Sidebar copiada EXATAMENTE do maker-forge-net AppSidebar
 */
export function CentralNavigation() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, activeProfile } = useSessionContext();

  console.log("🔵 Sidebar state:", state, "collapsed:", collapsed);

  const isActive = (url: string) => {
    if (url === "/central") {
      return location.pathname === "/central";
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <Link to="/central" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <LayoutGrid className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold text-foreground">
              Central
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="flex-1 overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className={cn(
                        "hover:bg-sidebar-accent/50 rounded-xl transition-colors",
                        isActive(item.url) && "bg-sidebar-accent text-primary font-medium"
                      )}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border space-y-3">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full rounded-xl px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
        </button>
        <Link to="/perfil" className="flex items-center gap-3 hover:bg-sidebar-accent/50 rounded-xl p-2 transition-colors">
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src={activeProfile?.avatarUrl || ""} />
            <AvatarFallback>
              {activeProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {activeProfile?.displayName || user?.email || "Usuário"}
              </p>
              <span className="text-xs text-muted-foreground">Ver perfil</span>
            </div>
          )}
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}
