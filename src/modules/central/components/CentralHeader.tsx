import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { useSessionContext } from "@/core/session";
import { AuthService } from "@/core/auth/services/AuthService";

/**
 * CentralHeader
 * 
 * Header COPIADO EXATAMENTE do maker-forge-net Topbar
 * Estrutura idêntica, classes idênticas, comportamento idêntico
 */
export function CentralHeader() {
  const { activeProfile, user } = useSessionContext();

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
        <Link to="/notificacoes" className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
        </Link>
        <Link to="/perfil">
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
