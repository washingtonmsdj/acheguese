/**
 * BottomNavV2
 *
 * Bottom nav mobile com badges de notificacoes para mensagens e alertas.
 */

import React, { useEffect, useState } from 'react';
import {
  Users, Building2, Wrench, Tag, Home,
  MoreHorizontal, Calendar, Car, Map, Search,
  MessageCircle, Bell, Briefcase, GraduationCap,
} from 'lucide-react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { prefetchRouteByHref } from '@/app/routes/prefetch';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { MessagingService } from '@/core/messaging';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';
import { usePublicBrowsingCity } from '@/core/location/hooks/usePublicBrowsingCity';
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

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useRouterLocation();
  const appUrls = useAppUrls();
  const { active } = usePublicBrowsingCity();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const cityBase = `/${active.state}/${active.city}`;
  const cityModule = (module: string) => `/${module}${cityBase}`;

  const { unreadCount: unreadNotifications } = useUnifiedNotifications({ enableRealtime: true });

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
    const sub = MessagingService.subscribeToMessages(user.id, () => fetchUnread());
    return () => {
      if (sub) MessagingService.unsubscribeFromMessages(sub);
    };
  }, [user]);

  const moreBadgeTotal = unreadMessages + (unreadNotifications ?? 0);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const mainTabs = [
    { path: '/', label: 'Inicio', icon: Home, badge: 0 },
    { path: cityModule('empresas'), label: 'Empresas', icon: Building2, badge: 0 },
    { path: cityModule('comunidade'), label: 'Bairro', icon: Users, badge: 0 },
    { path: cityModule('classificados'), label: 'Anuncios', icon: Tag, badge: 0 },
  ];

  const moreItems = [
    { path: cityModule('servicos'), label: 'Servicos', icon: Wrench, badge: 0 },
    { path: cityModule('educacao'), label: 'Educacao', icon: GraduationCap, badge: 0 },
    { path: cityModule('eventos'), label: 'Eventos', icon: Calendar, badge: 0 },
    { path: cityModule('vagas'), label: 'Vagas', icon: Briefcase, badge: 0 },
    { path: appUrls.messages, label: 'Mensagens', icon: MessageCircle, badge: unreadMessages },
    { path: appUrls.notifications, label: 'Notificacoes', icon: Bell, badge: unreadNotifications ?? 0 },
    { path: cityModule('mapa'), label: 'Mapa', icon: Map, badge: 0 },
    { path: appUrls.mobility.home, label: 'Mobilidade', icon: Car, badge: 0 },
    { path: cityModule('buscar'), label: 'Busca', icon: Search, badge: 0 },
  ];

  const handleNavigate = (path: string) => {
    prefetchRouteByHref(path);
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {mainTabs.map(({ path, label, icon: Icon, badge }) => {
          const activeTab = isActive(path);
          return (
            <button
              key={label}
              onClick={() => {
                prefetchRouteByHref(path);
                navigate(path);
              }}
              onMouseEnter={() => prefetchRouteByHref(path)}
              onFocus={() => prefetchRouteByHref(path)}
              onTouchStart={() => prefetchRouteByHref(path)}
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
              aria-label={`Mais opcoes${moreBadgeTotal > 0 ? ` (${moreBadgeTotal} pendentes)` : ''}`}
            >
              <span className="relative">
                <MoreHorizontal className="h-5 w-5" />
                <BadgeDot count={moreBadgeTotal} />
              </span>
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
                    onMouseEnter={() => prefetchRouteByHref(path)}
                    onFocus={() => prefetchRouteByHref(path)}
                    onTouchStart={() => prefetchRouteByHref(path)}
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

