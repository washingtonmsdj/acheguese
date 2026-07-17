/**
 * BottomNav
 *
 * Bottom nav mobile sem atalhos de mensagens/notificacoes (centralizados no header).
 */

import React, { useState } from 'react';
import {
  Users, Building2, Wrench, Tag, Home, Compass,
  MoreHorizontal, Map, Search, UtensilsCrossed,
} from 'lucide-react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
import { useHomeCommunityHref } from '@/core/routing/hooks/useHomeCommunityHref';
import { isLaunchSurfaceEnabled, type LaunchSurfaceKey } from '@/config/launchScope';
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

export function BottomNav({ prefetchRoute = noopPrefetch }: BottomNavProps) {
  const navigate = useNavigate();
  const { pathname } = useRouterLocation();
  const homeCommunityHref = useHomeCommunityHref();
  const { active } = usePublicBrowsingCity();
  const [moreOpen, setMoreOpen] = useState(false);

  const cityBase = `/${active.state}/${active.city}`;
  const cityModule = (module: string) => `/${module}${cityBase}`;

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const mainTabs = [
    { path: '/', label: 'Início', icon: Home, badge: 0 },
    { path: cityBase, label: 'Explorar', icon: Compass, badge: 0 },
    { path: homeCommunityHref, label: 'Bairro', icon: Users, badge: 0 },
    { path: cityModule('busca'), label: 'Busca', icon: Search, badge: 0 },
  ];

  const moreItems: Array<{
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: number;
    surface: LaunchSurfaceKey;
  }> = [
    { path: cityModule('empresas'), label: 'Empresas', icon: Building2, badge: 0, surface: 'business' as const },
    { path: cityModule('gastronomia'), label: 'Gastronomia', icon: UtensilsCrossed, badge: 0, surface: 'gastronomy' as const },
    { path: cityModule('servicos'), label: 'Serviços', icon: Wrench, badge: 0, surface: 'services' as const },
    { path: cityModule('classificados'), label: 'Classificados', icon: Tag, badge: 0, surface: 'classifieds' as const },
    { path: cityModule('mapa'), label: 'Mapa', icon: Map, badge: 0, surface: 'map' as const },
  ].filter((item) => isLaunchSurfaceEnabled(item.surface));
  const isMoreActive = moreItems.some((item) => isActive(item.path));

  const handleNavigate = (path: string) => {
    prefetchRoute(path);
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-card/95 font-sans backdrop-blur-lg safe-area-bottom md:hidden"
      aria-label="Navegacao principal mobile"
    >
      <div className="flex h-16 items-stretch justify-around px-1">
        {mainTabs.map(({ path, label, icon: Icon, badge }) => {
          const activeTab = isActive(path);
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                prefetchRoute(path);
                navigate(path);
              }}
              onMouseEnter={() => prefetchRoute(path)}
              onFocus={() => prefetchRoute(path)}
              onTouchStart={() => prefetchRoute(path)}
              className={cn(
                'relative mx-0.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 transition-colors',
                activeTab ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              )}
              aria-label={`${label}${badge > 0 ? ` (${badge} não lidas)` : ''}`}
              aria-current={activeTab ? 'page' : undefined}
              data-bottom-nav-item={label.toLowerCase()}
            >
              <span className="relative">
                <Icon className={cn('h-5 w-5', activeTab && 'stroke-[2.5]')} />
                <BadgeDot count={badge} />
              </span>
              <span className={cn('max-w-full truncate text-[10px] leading-none min-[360px]:text-[11px]', activeTab ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </button>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className={cn(
                'relative mx-0.5 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md px-1 py-1.5 transition-colors',
                isMoreActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
              )}
              aria-label="Mais opções"
              aria-expanded={moreOpen}
              data-bottom-nav-item="mais"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className={cn('text-[10px] leading-none min-[360px]:text-[11px]', isMoreActive ? 'font-semibold' : 'font-medium')}>
                Mais
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-lg pb-safe font-sans">
            <SheetHeader className="pb-2">
              <SheetTitle className="font-display text-base">Explorar cidade</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-2 py-4">
              {moreItems.map(({ path, label, icon: Icon, badge }) => {
                const activeItem = isActive(path);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNavigate(path)}
                    onMouseEnter={() => prefetchRoute(path)}
                    onFocus={() => prefetchRoute(path)}
                    onTouchStart={() => prefetchRoute(path)}
                    data-bottom-nav-more-item={label.toLowerCase()}
                    className={cn(
                      'flex min-h-20 flex-col items-center justify-center gap-2 rounded-md p-3 transition-colors',
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
