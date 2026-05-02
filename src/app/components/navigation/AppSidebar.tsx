import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, LogIn, MessageCircle, Settings } from 'lucide-react';
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
  SidebarSeparator,
  useSidebar,
} from '@/shared/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { useSessionContext } from '@/core/session';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useSiteSettings } from '@/core/admin/hooks/useSiteSettings';
import { MessagingService } from '@/core/messaging';
import { GuideSidebarItem } from '@/modules/guide/components/GuideSidebarItem';
import { prefetchRouteByHref } from '@/app/routes/prefetch';
import { LAUNCH_TERRITORIES, LAUNCH_URLS } from '@/config/territory';
import { NAV_SECTIONS, type NavItem } from './navigation.config';

function getInitials(value?: string | null): string {
  if (!value) return 'U';
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const appUrls = useAppUrls();
  const { data: siteSettings, isLoading: isSiteSettingsLoading } = useSiteSettings();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const count = await MessagingService.getUnreadMessagesCount(user.id);
        setUnreadMessages(count);
      } catch {
        setUnreadMessages(0);
      }
    };

    fetchUnread();
    const sub = MessagingService.subscribeToMessages(user.id, fetchUnread);

    return () => {
      if (sub) MessagingService.unsubscribeFromMessages(sub);
    };
  }, [user]);

  const homeHref = '/';
  const launchCommunityHref =
    LAUNCH_TERRITORIES.find(
      (territory) =>
        territory.kind === 'group' &&
        territory.slug === 'complexo-do-nordeste-de-amaralina',
    )?.path ?? '/ba/salvador/complexo-do-nordeste-de-amaralina';

  const getNavHref = (item: NavItem): string => {
    switch (item.id) {
      case 'home':
        return homeHref;
      case 'neighborhood':
        return `/comunidade${launchCommunityHref}`;
      case 'business':
        return LAUNCH_URLS.business;
      case 'gastronomy':
        return LAUNCH_URLS.gastronomy;
      case 'services':
        return LAUNCH_URLS.services;
      case 'education':
        return LAUNCH_URLS.education;
      case 'classifieds':
        return LAUNCH_URLS.classifieds;
      case 'jobs':
        return LAUNCH_URLS.jobs;
      case 'events':
        return LAUNCH_URLS.events;
      case 'map':
        return `/mapa/${LAUNCH_URLS.community.replace('/comunidade/', '')}`;
      default:
        return item.href;
    }
  };

  const isActiveHref = (href: string): boolean => {
    const [path, query] = href.split('?');
    if (href === '/') return location.pathname === '/';
    if (!query) return location.pathname.startsWith(path);

    const expectedTab = new URLSearchParams(query).get('tab');
    const currentTab = new URLSearchParams(location.search).get('tab');
    return location.pathname.startsWith(path) && expectedTab === currentTab;
  };

  const renderSectionItems = (items: NavItem[]) => (
    <SidebarMenu>
      {items.map((item) => {
        if (item.requiresAuth && !user) return null;

        const href = getNavHref(item);
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild isActive={isActiveHref(href)} tooltip={item.label}>
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
          to={homeHref}
          className={cn(
            'w-full rounded-lg transition-colors hover:bg-sidebar-accent/60',
            collapsed
              ? 'flex h-10 items-center justify-center'
              : 'flex flex-col items-center justify-center gap-0 px-3 pt-0 pb-3',
          )}
        >
          {isSiteSettingsLoading ? (
            <div
              className={cn(
                'animate-pulse rounded-md bg-muted/70',
                collapsed ? 'h-6 w-6' : 'h-24 w-full',
              )}
            />
          ) : siteSettings?.logo_url ? (
            <>
              <img
                src={siteSettings.logo_url}
                alt={siteSettings.site_name || 'Achegue-se'}
                className={cn(
                  'object-contain',
                  collapsed ? 'h-6 w-6 rounded-sm' : 'h-28 w-auto max-w-full',
                )}
              />
              {!collapsed ? (
                <span className="w-full text-center text-2xl font-semibold text-foreground font-heading leading-none -mt-3">
                  Achegue-<span className="text-primary">se</span>
                </span>
              ) : null}
            </>
          ) : (
            <>
              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-primary text-primary-foreground text-2xl font-bold">
                A
              </div>
              {!collapsed ? (
                <span className="w-full text-center text-2xl font-semibold text-foreground font-heading leading-none -mt-3">
                  Achegue-<span className="text-primary">se</span>
                </span>
              ) : null}
            </>
          )}
        </Link>

      </SidebarHeader>

      <SidebarContent className="gap-0">
        <div className="flex-1 overflow-y-auto py-1">
          {user ? (
            <SidebarGroup className="px-2 py-2">
              <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                Acoes
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Mensagens"
                      isActive={
                        location.pathname.startsWith('/mensagens') ||
                        location.pathname.startsWith('/chat/')
                      }
                    >
                      <Link
                        to={appUrls.messages}
                        onMouseEnter={() => prefetchRouteByHref(appUrls.messages)}
                        onFocus={() => prefetchRouteByHref(appUrls.messages)}
                        onTouchStart={() => prefetchRouteByHref(appUrls.messages)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>Mensagens</span>
                        {!collapsed && unreadMessages > 0 ? (
                          <Badge
                            variant="destructive"
                            className="ml-auto h-5 min-w-[20px] px-1.5 text-[10px] font-bold"
                          >
                            {unreadMessages > 9 ? '9+' : unreadMessages}
                          </Badge>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Notificacoes"
                      isActive={
                        location.pathname.startsWith('/notifications') ||
                        location.pathname.startsWith(appUrls.notifications)
                      }
                    >
                      <Link
                        to={appUrls.notifications}
                        onMouseEnter={() => prefetchRouteByHref(appUrls.notifications)}
                        onFocus={() => prefetchRouteByHref(appUrls.notifications)}
                        onTouchStart={() => prefetchRouteByHref(appUrls.notifications)}
                      >
                        <Bell className="h-4 w-4" />
                        <span>Notificacoes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.requiresAuth || Boolean(user),
            );
            const hasVisibleItems = visibleItems.length > 0;
            const showGuestCommunityCta = section.id === 'main' && !user;

            if (!hasVisibleItems && !showGuestCommunityCta) return null;

            return (
              <SidebarGroup key={section.id} className="px-2 py-1">
                <SidebarGroupLabel className="h-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  {renderSectionItems(section.items)}

                  {section.id === 'main' ? (
                    <SidebarMenu>
                      <GuideSidebarItem />
                    </SidebarMenu>
                  ) : null}

                  {showGuestCommunityCta && !collapsed ? (
                    <SidebarMenu className="mt-1">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Entrar">
                          <Link
                            to="/login"
                            onMouseEnter={() => prefetchRouteByHref('/login')}
                            onFocus={() => prefetchRouteByHref('/login')}
                            onTouchStart={() => prefetchRouteByHref('/login')}
                          >
                            <LogIn className="h-4 w-4" />
                            <span>Entrar na comunidade</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  ) : null}
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {user ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Meu perfil">
                <Link
                  to={appUrls.profile.central}
                  onMouseEnter={() => prefetchRouteByHref(appUrls.profile.central)}
                  onFocus={() => prefetchRouteByHref(appUrls.profile.central)}
                  onTouchStart={() => prefetchRouteByHref(appUrls.profile.central)}
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={activeProfile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(activeProfile?.displayName || user.email)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed ? (
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium truncate">
                        {activeProfile?.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {activeProfile?.username ? `@${activeProfile.username}` : 'Ver perfil'}
                      </p>
                    </div>
                  ) : null}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Configuracoes">
                <Link
                  to={appUrls.settings}
                  onMouseEnter={() => prefetchRouteByHref(appUrls.settings)}
                  onFocus={() => prefetchRouteByHref(appUrls.settings)}
                  onTouchStart={() => prefetchRouteByHref(appUrls.settings)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuracoes</span>
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
                  onMouseEnter={() => prefetchRouteByHref('/login')}
                  onFocus={() => prefetchRouteByHref('/login')}
                  onTouchStart={() => prefetchRouteByHref('/login')}
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
