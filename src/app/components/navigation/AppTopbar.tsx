import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Bell, LogOut, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth/services/AuthService";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

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
 * Topbar global da aplicacao.
 */
export function AppTopbar() {
  const { activeProfile, user } = useSessionContext();
  const appUrls = useAppUrls();

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground md:mr-2" />

      <div className="ml-auto flex items-center gap-3">
        <Link to="/planos" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline">
          Planos
        </Link>
        <Link to="/sobre" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline">
          Sobre
        </Link>
        <Link to={appUrls.notifications} className="relative text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Link>
        <Link to={appUrls.messages} className="relative text-muted-foreground transition-colors hover:text-foreground">
          <MessageCircle className="h-5 w-5" />
        </Link>
        <Link to={appUrls.profile.home}>
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src={activeProfile?.avatarUrl || ""} />
            <AvatarFallback>{getInitials(activeProfile?.displayName || user?.email)}</AvatarFallback>
          </Avatar>
        </Link>
        {user ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </header>
  );
}
