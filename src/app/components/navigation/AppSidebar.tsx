/**
 * AppSidebar - Navegação Desktop Global
 *
 * Sidebar global da aplicação usando shadcn Sidebar.
 * Consome configuração de navigation.config.ts (SSOT).
 * 
 * Features:
 * - Colapsável com modo ícone
 * - Seções organizadas (Explorar, Comunidade, Ferramentas)
 * - TerritorySelector integrado
 * - Perfil do usuário no footer
 * - Botão "Início" dinâmico que leva para o território ativo (cidade ou bairro)
 */

import { Link, useLocation } from 'react-router-dom';
import { Settings, LogIn } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { useSessionContext } from '@/core/session';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { lastTerritoryStore } from '@/core/routing/stores/LastTerritoryStore';
import { GuideSidebarItem } from '@/modules/guide/components/GuideSidebarItem';
import { NAV_SECTIONS, type NavItem } from './navigation.config';

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const { activeProfile } = useSessionContext();
  const { user } = useAuth();
  const appUrls = useAppUrls();
  
  // ✅ SSOT: Usar useFriendlyModuleUrls para URLs dinâmicas baseadas no território ativo
  const moduleUrls = useFriendlyModuleUrls();
  
  // Usa lastTerritoryStore para obter o último território visitado
  const lastTerritory = useSyncExternalStore(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  ) as import('@/core/routing/stores/LastTerritoryStore').LastTerritory | null;

  // URL dinâmica para o botão "Início" - vai para landing do território ativo
  const getHomeUrl = (): string => {
    // Se há território ativo (cidade ou bairro), usa o baseUrl dele
    if (lastTerritory?.baseUrl) {
      return lastTerritory.baseUrl;
    }
    
    // Fallback: home padrão
    return '/';
  };
  
  // ✅ Mapear IDs de navegação para URLs dinâmicas
  const getDynamicHref = (item: NavItem): string => {
    switch (item.id) {
      case 'home':
        return getHomeUrl();
      case 'business':
        return moduleUrls.business;
      case 'services':
        return moduleUrls.services;
      case 'classifieds':
        return moduleUrls.classifieds;
      case 'gastronomy':
        return moduleUrls.gastronomy;
      case 'events':
        return moduleUrls.events;
      case 'jobs':
        return moduleUrls.jobs;
      case 'neighborhood':
      case 'feed':
        return moduleUrls.community;
      case 'ranking':
        return moduleUrls.ranking;
      case 'map':
        return moduleUrls.map;
      default:
        return item.href;
    }
  };

  const isActive = (href: string): boolean => {
    if (!href) return false;
    const [path, query] = href.split('?');
    if (href === '/') return location.pathname === path;
    if (!query) return location.pathname.startsWith(path);
    const params = new URLSearchParams(query);
    const tab = params.get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab');
    return location.pathname.startsWith(path) && currentTab === tab;
  };

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderNavItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map(item => {
        if (item.requiresAuth && !user) return null;
        
        // ✅ URL dinâmica baseada no território ativo
        const href = getDynamicHref(item);
        const active = isActive(href);
        
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
              <Link to={href}>
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
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        {NAV_SECTIONS.map(section => (
          <div key={section.id}>
            <SidebarGroup>
              <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                {section.id === 'explore' ? (
                  <>
                    {renderNavItems(section.items)}
                    <SidebarMenu>
                      <GuideSidebarItem />
                    </SidebarMenu>
                  </>
                ) : section.id === 'community' && !user && !collapsed ? (
                  <div className="mx-2 mb-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      Faça login para participar da comunidade
                    </p>
                    <Link
                      to="/login"
                      className="w-full px-3 py-1.5 flex items-center justify-center bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors rounded"
                    >
                      Entrar
                    </Link>
                  </div>
                ) : (
                  renderNavItems(section.items)
                )}
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarSeparator />
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Meu perfil">
                <Link to={appUrls.profile.central} className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage src={activeProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(activeProfile?.displayName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">
                        {activeProfile?.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {activeProfile?.username ? `@${activeProfile.username}` : 'Ver perfil'}
                      </p>
                    </div>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configurações">
                <Link to={appUrls.settings}>
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Entrar">
                <Link to="/login">
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
