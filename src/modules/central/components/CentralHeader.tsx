import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Bell, Home, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth/services/AuthService";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";

/**
 * CentralHeader
 *
 * Header principal da Central.
 */
export function CentralHeader() {
  const { activeProfile, user } = useSessionContext();
  const publicHomeUrl = buildPublicAbsoluteUrl("/");

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground md:mr-2" />

      <div className="ml-auto flex items-center gap-3">
        <a
          href={publicHomeUrl}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Voltar ao site"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Ver site</span>
        </a>
        <Link to="/pricing" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline">
          Planos
        </Link>
        <Link to="/sobre" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline">
          Sobre
        </Link>
        <Link to="/notificacoes" className="relative text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Link>
        <Link to="/conta">
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src={activeProfile?.avatarUrl || ""} />
            <AvatarFallback>
              {activeProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
