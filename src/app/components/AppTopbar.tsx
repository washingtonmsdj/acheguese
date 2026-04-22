/**
 * AppTopbarV2
 * 
 * Header global inspirado no design da HomePageV2.
 * Substitui AppTopbar no layout V2.
 * Inclui: logo, nav links territoriais, busca, notificações, mensagens, perfil.
 */

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { UnifiedNotificationBellV2 } from '@/core/notifications';
import { MessagingService } from '@/core/messaging';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useSessionContext } from '@/core/session';
import { useFriendlyModuleUrls } from '@/core/routing/hooks/useFriendlyModuleUrls';
import { lastTerritoryStore } from '@/core/routing/stores/LastTerritoryStore';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { TerritorySelectorV2 } from '@/core/location/components/TerritorySelectorV2';

export function AppTopbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { activeProfile } = useSessionContext();
  const urls = useFriendlyModuleUrls();
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Usa lastTerritoryStore para obter o nome correto do território
  const lastTerritory = useSyncExternalStore(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  ) as import('@/core/routing/stores/LastTerritoryStore').LastTerritory | null;

  useEffect(() => {
    if (!user) { setUnreadMessages(0); return; }
    const fetchUnread = async () => {
      try {
        const count = await MessagingService.getUnreadMessagesCount(user.id);
        setUnreadMessages(count);
      } catch { setUnreadMessages(0); }
    };
    fetchUnread();
    const sub = MessagingService.subscribeToMessages(user.id, () => fetchUnread());
    return () => { if (sub) MessagingService.unsubscribeFromMessages(sub); };
  }, [user]);

  const getInitials = (name?: string | null): string => {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Funções de busca removidas - busca agora está apenas na página de gastronomia

  // ✅ URL dinâmica para a logo - vai para landing do território ativo (mesmo que botão "Início")
  const getHomeUrl = (): string => {
    // Se há território ativo (cidade ou bairro), usa o baseUrl dele
    if (lastTerritory?.baseUrl) {
      return lastTerritory.baseUrl;
    }

    // Fallback: URL territorial resolvida dinamicamente
    return urls.base || '/';
  };

  // ✅ SSOT: Detectar módulo e mensagem contextual de forma centralizada
  // Nota: contextMessage não é mais passado como prop - o seletor detecta automaticamente

  return (
    <header className="sticky top-0 w-full bg-card/95 backdrop-blur-md border-b border-border flex-shrink-0 z-20">
      <div className="flex items-center h-16 gap-3 px-3 sm:px-4">
        {/* Logo */}
        <Link
          to={getHomeUrl()}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Home className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground font-heading hidden sm:inline">
            Achegue-<span className="text-primary">se</span>
          </span>
        </Link>

        {/* Territory Selector — centralizado na topbar */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="flex shrink-0">
            <TerritorySelectorV2 compact={true} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={() => navigate('/mensagens')}
            aria-label={`Mensagens${unreadMessages > 0 ? ` (${unreadMessages} não lidas)` : ''}`}
          >
            <MessageCircle className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                {unreadMessages > 9 ? '9+' : unreadMessages}
              </span>
            )}
          </Button>

          {/* Notificações */}
          <UnifiedNotificationBellV2 />

          {/* Perfil / Login */}
          {user ? (
            <Link to="/perfil" className="ml-1">
              <Avatar className="h-9 w-9 border-2 border-primary/30 hover:border-primary transition-colors">
                <AvatarImage src={activeProfile?.avatarUrl || undefined} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                  {getInitials(activeProfile?.displayName || user.email)}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm h-10 px-4 rounded-lg ml-1"
            >
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
