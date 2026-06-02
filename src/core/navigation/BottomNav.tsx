/**
 * BottomNav
 *
 * Bottom nav mobile sem atalhos de mensagens/notificacoes (centralizados no header).
 */

import React, { useState } from 'react';
import {
  Users, Building2, Wrench, Tag, Home,
  MoreHorizontal, Calendar, Car, Map, Search,
  Briefcase, GraduationCap,
} from 'lucide-react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useHomeCommunityHref } from '@/core/routing/hooks/useHomeCommunityHref';
import { useCommunityNavigationContext } from '@/core/routing/hooks/useCommunityNavigationContext';
import {
  buildCommunityNavigationModuleUrls,
  type CommunityNavigationModuleUrls,
} from '@/core/routing/utils/communityNavigationContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';

function BadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface BottomNavProps {
  prefetchRoute?: (href: string) => void;
}

const noopPrefetch = () => undefined;

function resolveCommunityModuleUrl(
  urls: CommunityNavigationModuleUrls | null,
  key: keyof CommunityNavigationModuleUrls,
): string | null {
  if (!urls) return null;

  switch (key) {
    case 'business':
      return urls.business;
    case 'gastronomy':
      return urls.gastronomy;
    case 'education':
      return urls.education;
    case 'services':
      return urls.services;
    case 'classifieds':
      return urls.classifieds;
    case 'events':
      return urls.events;
    case 'jobs':
      return urls.jobs;
    case 'map':
      return urls.map;
    case 'mobility':
      return urls.mobility;
  }
}

export function BottomNav({ prefetchRoute = noopPrefetch }: BottomNavProps) {
  const navigate = useNavigate();
  const { pathname } = useRouterLocation();
  const appUrls = useAppUrls();
  const homeCommunityHref = useHomeCommunityHref();
  const communityContext = useCommunityNavigationContext();
  const { active } = usePublicBrowsingCity();
  const [moreOpen, setMoreOpen] = useState(false);

  const cityBase = `/${active.state}/${active.city}`;
  const cityModule = (module: string) => `/${module}${cityBase}`;
  const communityModuleUrls = communityContext
    ? buildCommunityNavigationModuleUrls(communityContext)
    : null;
  const modulePath = (
    key: keyof CommunityNavigationModuleUrls,
    fallbackModule: string,
  ) => resolveCommunityModuleUrl(communityModuleUrls, key) ?? cityModule(fallbackModule);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const mainTabs = [
    { path: '/', label: 'Inicio', icon: Home, badge: 0 },
    { path: modulePath('business', 'empresas'), label: 'Empresas', icon: Building2, badge: 0 },
    { path: homeCommunityHref, label: 'Bairro', icon: Users, badge: 0 },
    { path: modulePath('classifieds', 'classificados'), label: 'Anuncios', icon: Tag, badge: 0 },
  ];

  const moreItems = [
    { path: modulePath('services', 'servicos'), label: 'Servicos', icon: Wrench, badge: 0 },
    { path: modulePath('education', 'educacao'), label: 'Educacao', icon: GraduationCap, badge: 0 },
    { path: modulePath('events', 'eventos'), label: 'Eventos', icon: Calendar, badge: 0 },
    { path: modulePath('jobs', 'vagas'), label: 'Vagas', icon: Briefcase, badge: 0 },
    { path: modulePath('map', 'mapa'), label: 'Mapa', icon: Map, badge: 0 },
    { path: resolveCommunityModuleUrl(communityModuleUrls, 'mobility') ?? appUrls.mobility.home, label: 'Mobilidade', icon: Car, badge: 0 },
    { path: cityModule('buscar'), label: 'Busca', icon: Search, badge: 0 },
  ];

  const handleNavigate = (path: string) => {
    prefetchRoute(path);
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {mainTabs.map(({ path, label, icon: Icon, badge }) => {
          const activeTab = isActive(path);
          return (
            <button
              key={label}
              onClick={() => {
                prefetchRoute(path);
                navigate(path);
              }}
              onMouseEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              onTouchStart={() => prefetchRoute(path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors rounded-lg mx-0.5',
                activeTab ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              )}
              aria-label={`${label}${badge > 0 ? ` (${badge} nao lidas)` : ''}`}
            >
              <span className="relative">
                <Icon className={cn('h-5 w-5', activeTab && 'stroke-[2.5]')} />
                <BadgeDot count={badge} />
              </span>
              <span className={cn('text-[10px] leading-tight', activeTab ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </button>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-muted-foreground active:text-foreground transition-colors rounded-lg mx-0.5"
              aria-label="Mais opcoes"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] leading-tight font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-base">Mais opcoes</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 py-4">
              {moreItems.map(({ path, label, icon: Icon, badge }) => {
                const activeItem = isActive(path);
                return (
                  <button
                    key={label}
                    onClick={() => handleNavigate(path)}
                    onMouseEnter={() => prefetchRoute(path)}
                    onFocus={() => prefetchRoute(path)}
                    onTouchStart={() => prefetchRoute(path)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors',
                      activeItem ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent active:bg-accent'
                    )}
                  >
                    <div className={cn(
                      'relative h-10 w-10 rounded-full flex items-center justify-center',
                      activeItem ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                      {badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
