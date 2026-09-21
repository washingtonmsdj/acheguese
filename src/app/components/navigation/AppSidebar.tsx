import { Link, useLocation } from "react-router-dom";
import { LogIn, Moon, Settings, Sun } from "lucide-react";
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
import { useSessionContext } from "@/core/session";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { prefetchRouteByHref } from "@/app/routes/prefetch";
import { NAV_SECTIONS, type NavItem } from "./navigation.config";
import { usePublicBrowsingCity } from "@/core/location/hooks/usePublicBrowsingCity";
import { PublicCitySelector } from "./PublicCitySelector";
import { useTheme } from "@/shared/hooks/useTheme";
import { parsePublicTerritoryPath } from "@/core/routing/utils/publicTerritoryPath";
import {
  buildModuleTerritoryUrl,
  MODULE_SLUGS,
} from "@/core/routing/utils/territoryUrls";

function getInitials(value?: string | null): string {
  if (!value) return "U";
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const OFFICIAL_LOGO_SRC = "/images/logo-icon.png";

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const appUrls = useAppUrls();
  const { active } = usePublicBrowsingCity();
  const { theme, toggleTheme } = useTheme();

  const parsedTerritory = parsePublicTerritoryPath(location.pathname);
  const activeCityBase = `/${active.state}/${active.city}`;
  const territoryBase =
    parsedTerritory.state && parsedTerritory.city
      ? `/${parsedTerritory.state}/${parsedTerritory.city}${
          parsedTerritory.territorySlug
            ? `/${parsedTerritory.territorySlug}`
            : ""
        }`
      : activeCityBase;

  const activeModuleUrls = {
    business: buildModuleTerritoryUrl(MODULE_SLUGS.business, territoryBase),
    map: buildModuleTerritoryUrl(MODULE_SLUGS.map, territoryBase),
  } as const;

  const getNavHref = (item: NavItem): string => {
    switch (item.id) {
      case "home":
        return territoryBase;
      case "business":
        return activeModuleUrls.business;
      case "map":
        return activeModuleUrls.map;
      default:
        return item.href;
    }
  };

  const isActiveHref = (href: string): boolean => {
    const [path, query] = href.split("?");
    if (href === "/") return location.pathname === "/";
    if (!query) return location.pathname.startsWith(path);

    const expectedTab = new URLSearchParams(query).get("tab");
    const currentTab = new URLSearchParams(location.search).get("tab");
    return location.pathname.startsWith(path) && expectedTab === currentTab;
  };

  const renderSectionItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => {
        if (item.requiresAuth && !user) return null;

        const href = getNavHref(item);
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              asChild
              isActive={isActiveHref(href)}
              tooltip={item.label}
            >
              <Link
                to={href}
                onMouseEnter={() => prefetchRouteByHref(href)}
                onFocus={() => prefetchRouteByHref(href)}
                onTouchStart={() => prefetchRouteByHref(href)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-0">
        <Link
          to="/"
          className={cn(
            "w-full rounded-lg transition-colors hover:bg-sidebar-accent/60",
            collapsed
              ? "flex h-10 items-center justify-center"
              : "flex flex-col items-center justify-center gap-0 px-3 pb-3 pt-0",
          )}
        >
          <img
            src={OFFICIAL_LOGO_SRC}
            alt="Achegue-se"
            className={cn(
              "object-contain",
              collapsed ? "h-8 w-8 rounded-sm" : "h-32 w-auto max-w-full",
            )}
          />
          {!collapsed ? (
            <span className="-mt-3 w-full text-center font-heading text-2xl font-semibold leading-none text-foreground">
              Achegue-<span className="text-primary">se</span>
            </span>
          ) : null}
        </Link>
        {!collapsed ? (
          <div className="border-t border-sidebar-border px-2 py-2">
            <PublicCitySelector compact />
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="flex-1 gap-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.requiresAuth || Boolean(user),
            );
            if (visibleItems.length === 0) return null;

            return (
              <SidebarGroup key={section.id} className="px-2 py-1">
                <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  {renderSectionItems(visibleItems)}
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="space-y-2 border-t border-sidebar-border p-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {!collapsed ? (
            <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>
          ) : null}
        </button>

        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Minha conta">
                <Link
                  to={appUrls.profile.home}
                  onMouseEnter={() => prefetchRouteByHref(appUrls.profile.home)}
                  onFocus={() => prefetchRouteByHref(appUrls.profile.home)}
                  onTouchStart={() => prefetchRouteByHref(appUrls.profile.home)}
                  className="hover:bg-sidebar-accent/50"
                >
                  <Avatar className="h-6 w-6 shrink-0 border border-primary/30">
                    <AvatarImage src={activeProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(activeProfile?.displayName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed ? (
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">
                        {activeProfile?.displayName || user.email?.split("@")[0]}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {activeProfile?.username
                          ? `@${activeProfile.username}`
                          : "Ver perfil"}
                      </p>
                    </div>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Preferências da conta">
                <Link
                  to={appUrls.settings}
                  onMouseEnter={() => prefetchRouteByHref(appUrls.settings)}
                  onFocus={() => prefetchRouteByHref(appUrls.settings)}
                  onTouchStart={() => prefetchRouteByHref(appUrls.settings)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Preferências da conta</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Entrar">
                <Link
                  to="/login"
                  onMouseEnter={() => prefetchRouteByHref("/login")}
                  onFocus={() => prefetchRouteByHref("/login")}
                  onTouchStart={() => prefetchRouteByHref("/login")}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Entrar / Criar conta</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
