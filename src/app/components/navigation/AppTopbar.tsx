import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Bell, LogOut, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth/services/AuthService";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";

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

/**
 * AppTopbar
 * 
 * Topbar global COPIADA EXATAMENTE do CentralTopbarV2
 * Estrutura idêntica, classes idênticas, comportamento idêntico
 */
export function AppTopbar() {
  const { activeProfile, user } = useSessionContext();
  const appUrls = useAppUrls();

  const handleLogout = async () => {
    await AuthService.signOut();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 w-full">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground md:mr-2" />

      <div className="flex items-center gap-3 ml-auto">
        <Link to="/pricing" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          Planos
        </Link>
        <Link to="/sobre" className="hidden sm:inline text-xs text-muted-foreground hover:text-foreground transition-colors">
          Sobre
        </Link>
        <Link to={appUrls.notifications} className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
        </Link>
        <Link to={appUrls.messages} className="relative text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="h-5 w-5" />
        </Link>
        <Link to={appUrls.profile.home}>
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src={activeProfile?.avatarUrl || ""} />
            <AvatarFallback>
              {getInitials(activeProfile?.displayName || user?.email)}
            </AvatarFallback>
          </Avatar>
        </Link>
        {user && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </header>
  );
}
