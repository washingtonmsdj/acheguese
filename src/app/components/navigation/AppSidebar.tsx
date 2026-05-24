import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  Building2,
  Calendar,
  Car,
  GraduationCap,
  Home,
  LayoutList,
  LogIn,
  MapPin,
  MessageSquare,
  Newspaper,
  Search,
  Settings,
  Sun,
  Tag,
  UtensilsCrossed,
  Users,
  Wrench,
  Moon,
} from 'lucide-react';
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
} from '@/shared/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { cn } from '@/shared/utils/cn';
import { useSessionContext } from '@/core/session';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { useSiteSettings } from '@/core/admin/hooks/useSiteSettings';
import { GuideSidebarItem } from '@/modules/guide/components/GuideSidebarItem';
import { prefetchRouteByHref } from '@/app/routes/prefetch';
import { NAV_SECTIONS, type NavItem } from './navigation.config';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { PublicCitySelector } from './PublicCitySelector';
import { useTheme } from '@/shared/hooks/useTheme';
import { useHomeCommunityHref } from '@/core/routing/hooks/useHomeCommunityHref';
import { isReservedSlug } from '@/core/routing/reservedSlugs';
import { useResolveTerritoryFromUrl } from '@/core/routing/hooks/useResolveTerritoryFromUrl';
import { useGroupAvailability } from '@/core/territorial/hooks/useGroupAvailability';
import { ModuleKey } from '@/core/rollout/types';

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

function formatSlugLabel(slug?: string): string {
  if (!slug) return 'Comunidade';
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const OFFICIAL_LOGO_SRC = '/images/logo-icon.png';

export function AppSidebar() {
  const location = useLocation();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const appUrls = useAppUrls();
  const { data: siteSettings, isLoading: isSiteSettingsLoading } = useSiteSettings();
  const { active } = usePublicBrowsingCity();
  const { theme, toggleTheme } = useTheme();
  const homeCommunityHref = useHomeCommunityHref();
  const territoryResolve = useResolveTerritoryFromUrl();

  const communityContext = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'comunidade' || !parts[1] || !parts[2] || !parts[3]) {
      return null;
    }
    if (parts[3] === 'area' || isReservedSlug(parts[3])) {
      return null;
    }

    return {
      state: parts[1],
      city: parts[2],
      territorySlug: parts[3],
      basePath: `/comunidade/${parts[1]}/${parts[2]}/${parts[3]}`,
    };
  }, [location.pathname]);

  const communityGroupId = useMemo(() => {
    if (!communityContext) return null;
    if (territoryResolve.status !== 'resolved_group') return null;
    return territoryResolve.resolved?.kind === 'group' ? territoryResolve.resolved.group.id : null;
  }, [communityContext, territoryResolve.resolved, territoryResolve.status]);

  const communityModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.COMMUNITY);
  const businessModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.BUSINESS);
  const gastronomyModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.GASTRONOMY);
  const servicesModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.SERVICES);
  const classifiedsModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.CLASSIFIEDS);
  const jobsModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.JOBS);
  const eventsModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.EVENTS);
  const mobilityModuleAvailability = useGroupAvailability(communityGroupId, ModuleKey.MOBILITY);

  const moduleVisibility = useMemo(() => {
    const isAvailable = (moduleState: ReturnType<typeof useGroupAvailability>) => {
      if (!communityGroupId) return true;
      if (moduleState.isLoading) return true;
      return moduleState.availability !== 'none';
    };

    return {
      community: isAvailable(communityModuleAvailability),
      business: isAvailable(businessModuleAvailability),
      gastronomy: isAvailable(gastronomyModuleAvailability),
      services: isAvailable(servicesModuleAvailability),
      classifieds: isAvailable(classifiedsModuleAvailability),
      jobs: isAvailable(jobsModuleAvailability),
      events: isAvailable(eventsModuleAvailability),
      mobility: isAvailable(mobilityModuleAvailability),
    };
  }, [
    communityGroupId,
    communityModuleAvailability,
    businessModuleAvailability,
    gastronomyModuleAvailability,
    servicesModuleAvailability,
    classifiedsModuleAvailability,
    jobsModuleAvailability,
    eventsModuleAvailability,
    mobilityModuleAvailability,
  ]);

  const communitySections = useMemo(() => {
    if (!communityContext) return [];

    const base = communityContext.basePath;
    const territoryName = formatSlugLabel(communityContext.territorySlug).replace(
      /^Complexo Do\s+/i,
      'Complexo do ',
    );

    return [
      {
        id: 'community',
        label: 'Comunidade',
        items: [
          { id: 'community-home', icon: Home, label: 'Meu bairro', description: 'O que está acontecendo no bairro hoje', href: base },
          { id: 'community-feed', icon: LayoutList, label: 'Feed', description: 'Feed da comunidade', href: `${base}/feed` },
          { id: 'community-groups', icon: Users, label: 'Grupos', description: 'Núcleos e interesses locais', href: `${base}/grupos` },
          { id: 'community-comms', icon: Newspaper, label: 'Comunicação', description: 'Mídias e canais locais', href: `${base}/comunicacao` },
          { id: 'community-alerts', icon: Bell, label: 'Alertas', description: 'Alertas da comunidade', href: `${base}/feed?tab=alertas` },
          { id: 'community-issues', icon: MessageSquare, label: 'Problemas', description: 'Problemas da região', href: `${base}/problemas` },
          { id: 'community-lost-found', icon: Search, label: 'Achados e perdidos', description: 'Itens perdidos e encontrados', href: `${base}/achados-e-perdidos` },
        ].filter(() => moduleVisibility.community) as NavItem[],
      },
      {
        id: 'local',
        label: 'Comércio local',
        items: [
          {
            id: 'community-business',
            icon: Building2,
            label: `Comércios do ${territoryName}`,
            description: `Comércios do ${territoryName}`,
            href: `${base}/empresas`,
            visible: moduleVisibility.business,
          },
          {
            id: 'community-gastronomy',
            icon: UtensilsCrossed,
            label: 'Gastronomia',
            description: 'Restaurantes e cardápios locais',
            href: `${base}/gastronomia`,
            visible: moduleVisibility.gastronomy,
          },
          {
            id: 'community-education',
            icon: GraduationCap,
            label: 'Educação',
            description: `Escolas e cursos do ${territoryName}`,
            href: `${base}/educacao`,
            // Educação usa a base de disponibilidade de negócio local.
            visible: moduleVisibility.business,
          },
          {
            id: 'community-services',
            icon: Wrench,
            label: 'Serviços locais',
            description: `Serviços do ${territoryName}`,
            href: `${base}/servicos`,
            visible: moduleVisibility.services,
          },
        ]
          .filter((item) => item.visible !== false)
          .map(({ visible: _visible, ...item }) => item) as NavItem[],
      },
      {
        id: 'opportunities',
        label: 'Oportunidades',
        items: [
          {
            id: 'community-classifieds',
            icon: Tag,
            label: 'Classificados da comunidade',
            description: `Classificados do ${territoryName}`,
            href: `${base}/classificados`,
            visible: moduleVisibility.classifieds,
          },
          {
            id: 'community-jobs',
            icon: Briefcase,
            label: 'Oportunidades perto de você',
            description: 'Oportunidades perto de você',
            href: `${base}/feed?tab=oportunidades`,
            visible: moduleVisibility.jobs,
          },
          {
            id: 'community-events',
            icon: Calendar,
            label: 'Eventos do bairro',
            description: `Eventos do ${territoryName}`,
            href: `${base}/eventos`,
            visible: moduleVisibility.events,
          },
        ]
          .filter((item) => item.visible !== false)
          .map(({ visible: _visible, ...item }) => item) as NavItem[],
      },
      {
        id: 'tools',
        label: 'Ferramentas',
        items: [
          { id: 'community-map', icon: MapPin, label: 'Mapa', description: 'Camadas territoriais', href: `${base}/mapa` },
          { id: 'community-search', icon: Search, label: 'Busca', description: 'Busca no contexto local', href: `/buscar/${communityContext.state}/${communityContext.city}` },
          { id: 'community-nearby', icon: MapPin, label: 'Perto de mim', description: 'Explorar o que está por perto', href: '/perto-de-mim' },
          {
            id: 'community-mobility',
            icon: Car,
            label: 'Mobilidade',
            description: 'Caronas e entregas locais',
            href: `${base}/mobilidade`,
            visible: moduleVisibility.mobility,
          },
        ]
          .filter((item) => item.visible !== false)
          .map(({ visible: _visible, ...item }) => item) as NavItem[],
      },
    ].filter((section) => section.items.length > 0);
  }, [communityContext, moduleVisibility]);

  const homeHref = '/';
  const getNavHref = (item: NavItem): string => {
    const cityBase = `/${active.state}/${active.city}`;
    switch (item.id) {
      case 'home':
        return homeHref;
      case 'neighborhood':
        return homeCommunityHref;
      case 'business':
        return `/empresas${cityBase}`;
      case 'gastronomy':
        return `/gastronomia${cityBase}`;
      case 'services':
        return `/servicos${cityBase}`;
      case 'education':
        return `/educacao${cityBase}`;
      case 'classifieds':
        return `/classificados${cityBase}`;
      case 'jobs':
        return `/vagas${cityBase}`;
      case 'events':
        return `/eventos${cityBase}`;
      case 'map':
        return `/mapa${cityBase}`;
      case 'search':
        return `/buscar${cityBase}`;
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

  const renderSectionItems = (items: NavItem[], showDescription = false) => (
    <SidebarMenu className={showDescription ? 'space-y-1' : undefined}>
      {items.map((item) => {
        if (item.requiresAuth && !user) return null;

        const href = getNavHref(item);
        return (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton
              asChild
              isActive={isActiveHref(href)}
              tooltip={item.label}
              className={showDescription ? 'h-auto min-h-12 items-start py-2.5' : undefined}
            >
              <Link
                to={href}
                onMouseEnter={() => prefetchRouteByHref(href)}
                onFocus={() => prefetchRouteByHref(href)}
                onTouchStart={() => prefetchRouteByHref(href)}
              >
                <item.icon className={cn('h-4 w-4', showDescription ? 'mt-0.5' : '')} />
                {showDescription ? (
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] font-medium">{item.label}</span>
                    {item.description ? (
                      <span className="mt-1 block truncate text-[11px] text-muted-foreground/90">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                ) : (
                  <span>{item.label}</span>
                )}
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
          ) : (
            <>
              <img
                src={OFFICIAL_LOGO_SRC}
                alt={siteSettings?.site_name || 'Achegue-se'}
                className={cn(
                  'object-contain',
                  collapsed ? 'h-8 w-8 rounded-sm' : 'h-32 w-auto max-w-full',
                )}
              />
              {!collapsed ? (
                <span className="w-full text-center text-2xl font-semibold text-foreground font-heading leading-none -mt-3">
                  Achegue-<span className="text-primary">se</span>
                </span>
              ) : null}
            </>
          )}
        </Link>
        {!collapsed ? (
          <div className="border-t border-sidebar-border px-2 py-2">
            <PublicCitySelector compact />
          </div>
        ) : null}
      </SidebarHeader>

      <SidebarContent className="gap-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto py-2">
          {communityContext ? (
            <>
              {communitySections.map((section) => (
                <SidebarGroup key={section.id} className="px-2 py-1.5">
                  <SidebarGroupLabel className="mb-1 h-6 px-2 text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/60">
                    {section.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="rounded-xl border border-sidebar-border/60 bg-sidebar-accent/20 px-1 py-1.5">
                    {renderSectionItems(section.items, true)}
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </>
          ) : null}

          {!communityContext ? NAV_SECTIONS.map((section) => {
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
          }) : null}
        </div>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        {/* Botao de tema */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full rounded-xl px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Modo Claro" : "Modo Escuro"}</span>}
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
              <SidebarMenuButton asChild tooltip="Preferencias da conta">
                <Link
                  to={appUrls.settings}
                  onMouseEnter={() => prefetchRouteByHref(appUrls.settings)}
                  onFocus={() => prefetchRouteByHref(appUrls.settings)}
                  onTouchStart={() => prefetchRouteByHref(appUrls.settings)}
                >
                  <Settings className="h-4 w-4" />
                  <span>Preferencias da conta</span>
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
