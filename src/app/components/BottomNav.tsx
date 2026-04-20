/**
 * BottomNavV2
 * 
 * Nova bottom nav mobile com seletor de localidade integrado
 * e badges de notificação para mensagens e alertas.
 * Coexiste com BottomNav original.
 */

import React, { useState, useEffect } from 'react';
import { useSyncExternalStore } from 'react';
import {
  Users, Building2, Wrench, Tag, Home,
  MoreHorizontal, Calendar, Car, Map, Search,
  MessageCircle, Bell, Briefcase,
} from 'lucide-react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { useAppUrls } from '@/core/routing/hooks/useAppUrls';
import { lastTerritoryStore } from '@/core/routing/stores/LastTerritoryStore';
import { TerritorySelectorV2 } from '@/core/location/components/TerritorySelectorV2';
import { MessagingService } from '@/core/messaging';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useUnifiedNotifications } from '@/core/notifications/useUnifiedNotifications';
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
  const urls = useFriendlyModuleUrls();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Usa lastTerritoryStore para obter o nome correto do território
  const lastTerritory = useSyncExternalStore(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  ) as import('@/core/routing/stores/LastTerritoryStore').LastTerritory | null;

  // Notificações
  const { unreadCount: unreadNotifications } = useUnifiedNotifications({ enableRealtime: true });

  // Mensagens não lidas
  useEffect(() => {
    if (!user) { setUnreadMessages(0); return; }

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
    return () => { if (sub) MessagingService.unsubscribeFromMessages(sub); };
  }, [user]);

  // Total de badges no "Mais" (mensagens + notificações)
  const moreBadgeTotal = unreadMessages + (unreadNotifications ?? 0);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const mainTabs = [
    { path: urls.landing, label: 'Início', icon: Home, badge: 0 },
    { path: urls.business, label: 'Empresas', icon: Building2, badge: 0 },
    { path: urls.community, label: 'Comunidade', icon: Users, badge: 0 },
    { path: urls.classifieds, label: 'Anúncios', icon: Tag, badge: 0 },
  ];

  const moreItems = [
    { path: urls.services, label: 'Serviços', icon: Wrench, badge: 0 },
    { path: urls.events, label: 'Eventos', icon: Calendar, badge: 0 },
    { path: urls.jobs, label: 'Vagas', icon: Briefcase, badge: 0 },
    { path: appUrls.messages, label: 'Mensagens', icon: MessageCircle, badge: unreadMessages },
    { path: appUrls.notifications, label: 'Notificações', icon: Bell, badge: unreadNotifications ?? 0 },
    { path: urls.map, label: 'Mapa', icon: Map, badge: 0 },
    { path: appUrls.mobility.home, label: 'Mobilidade', icon: Car, badge: 0 },
    { path: appUrls.search, label: 'Busca', icon: Search, badge: 0 },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {mainTabs.map(({ path, label, icon: Icon, badge }) => {
          const active = isActive(path);
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors rounded-lg mx-0.5',
                active ? 'text-primary' : 'text-muted-foreground active:text-foreground'
              )}
              aria-label={`${label}${badge > 0 ? ` (${badge} não lidas)` : ''}`}
            >
              <span className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                <BadgeDot count={badge} />
              </span>
              <span className={cn('text-[10px] leading-tight', active ? 'font-semibold' : 'font-medium')}>
                {label}
              </span>
            </button>
          );
        })}

        {/* Localidade */}
        <div className="flex flex-col items-center justify-center flex-1 mx-0.5">
          <TerritorySelectorV2
            compact
          />
          <span className="text-[10px] leading-tight font-medium text-muted-foreground mt-0.5">Local</span>
        </div>

        {/* Mais — com badge agregado */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className="relative flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 text-muted-foreground active:text-foreground transition-colors rounded-lg mx-0.5"
              aria-label={`Mais opções${moreBadgeTotal > 0 ? ` (${moreBadgeTotal} pendentes)` : ''}`}
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
              <SheetTitle className="text-base">Mais opções</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-4 gap-3 py-4">
              {moreItems.map(({ path, label, icon: Icon, badge }) => {
                const active = isActive(path);
                return (
                  <button
                    key={label}
                    onClick={() => handleNavigate(path)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent active:bg-accent'
                    )}
                  >
                    <div className={cn(
                      'relative h-10 w-10 rounded-full flex items-center justify-center',
                      active ? 'bg-primary/15' : 'bg-muted'
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
