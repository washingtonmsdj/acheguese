import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Bell, LogOut, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth/services/AuthService";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { prefetchRouteByHref } from "@/app/routes/prefetch";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "@/app/config/lifecycleRegistry";

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

/**
 * AppTopbar
 *
 * Topbar global da aplicação autenticada.
 */
export function AppTopbar() {
  const { activeProfile, user } = useSessionContext();
  const appUrls = useAppUrls();
  const showNotifications = isPlatformCapabilityEnabled("notifications");
  const showMessages = isPlatformCapabilityEnabled("messaging");
  const showBilling = isProductModuleEnabled("billing");

  const handleLogout = async () => {
    await AuthService.signOut();
    window.location.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-3 border-b border-territory-border bg-territory-surface/80 px-4 text-territory-ink backdrop-blur-sm">
      <SidebarTrigger className="text-territory-muted hover:text-territory-ink md:mr-2" />

      <div className="ml-auto flex items-center gap-3">
        {showBilling ? (
          <Link
            to="/planos"
            className="hidden text-xs text-territory-muted transition-colors hover:text-territory-ink sm:inline"
          >
            Planos
          </Link>
        ) : null}
        <Link
          to="/sobre"
          className="hidden text-xs text-territory-muted transition-colors hover:text-territory-ink sm:inline"
        >
          Sobre
        </Link>
        {showNotifications ? (
          <Link
            to={appUrls.notifications}
            aria-label="Notificações"
            onMouseEnter={() => prefetchRouteByHref(appUrls.notifications)}
            onFocus={() => prefetchRouteByHref(appUrls.notifications)}
            onTouchStart={() => prefetchRouteByHref(appUrls.notifications)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink"
          >
            <Bell className="h-5 w-5" />
          </Link>
        ) : null}
        {showMessages ? (
          <Link
            to={appUrls.messages}
            aria-label="Mensagens"
            onMouseEnter={() => prefetchRouteByHref(appUrls.messages)}
            onFocus={() => prefetchRouteByHref(appUrls.messages)}
            onTouchStart={() => prefetchRouteByHref(appUrls.messages)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-territory-muted transition-colors hover:bg-territory-raised hover:text-territory-ink"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
        ) : null}
        <Link to={appUrls.profile.home} aria-label="Perfil ativo">
          <Avatar className="h-8 w-8 border border-territory-brand/30">
            <AvatarImage src={activeProfile?.avatarUrl || ""} />
            <AvatarFallback className="bg-territory-raised text-territory-ink">
              {getInitials(activeProfile?.displayName || user?.email)}
            </AvatarFallback>
          </Avatar>
        </Link>
        {user ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
            aria-label="Sair da conta"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
