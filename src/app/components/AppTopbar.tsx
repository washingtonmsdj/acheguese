/**
 * AppTopbar - Header Global Moderno
 * 
 * Design amigável e responsivo com:
 * - Logo com gradiente
 * - Seletor de território centralizado
 * - Ícones de ação com tooltips visuais
 * - Avatar com hover suave
 * - Badges de notificação animados
 */

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Home, Bell, User, LogIn } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';

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
    <header className="sticky top-0 w-full bg-gradient-to-r from-card/98 via-card/95 to-card/98 backdrop-blur-lg border-b border-border/60 shadow-sm flex-shrink-0 z-20">
      <div className="flex items-center h-16 gap-3 px-3 sm:px-6 max-w-[1600px] mx-auto">
        {/* Logo com gradiente moderno */}
        <Link
          to={getHomeUrl()}
          className="flex items-center gap-2.5 hover:scale-105 transition-transform duration-200 flex-shrink-0 group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <Home className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold text-foreground font-heading hidden sm:inline">
            Achegue-<span className="text-primary">se</span>
          </span>
        </Link>

        {/* Territory Selector — centralizado */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <div className="flex shrink-0">
            <TerritorySelectorV2 compact={true} />
          </div>
        </div>

        {/* Actions com tooltips */}
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Mensagens */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-10 w-10 hover:bg-primary/10 transition-colors rounded-xl"
                  onClick={() => navigate('/mensagens')}
                  aria-label={`Mensagens${unreadMessages > 0 ? ` (${unreadMessages} não lidas)` : ''}`}
                >
                  <MessageCircle className="h-5 w-5 text-foreground/80" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-destructive to-destructive/90 px-1 text-[10px] font-bold text-destructive-foreground shadow-md animate-in zoom-in-50">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>Mensagens{unreadMessages > 0 ? ` (${unreadMessages})` : ''}</p>
              </TooltipContent>
            </Tooltip>

            {/* Notificações */}
            <UnifiedNotificationBellV2 />

            {/* Perfil / Login */}
            {user ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/perfil" className="ml-1">
                    <Avatar className="h-9 w-9 border-2 border-primary/20 hover:border-primary/60 transition-all duration-200 hover:scale-105 cursor-pointer ring-offset-2 hover:ring-2 hover:ring-primary/30">
                      <AvatarImage src={activeProfile?.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
                        {getInitials(activeProfile?.displayName || user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>Meu Perfil</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground font-semibold text-sm h-10 px-5 rounded-xl ml-1 shadow-md hover:shadow-lg transition-all duration-200 gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Button>
            )}
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
