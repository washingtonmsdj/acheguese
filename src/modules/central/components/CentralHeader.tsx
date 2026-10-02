import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { APP_PATHS } from "@/core/routing/config/appPaths";
import { Bell, Home, LogOut } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { AuthService } from "@/core/auth/services/AuthService";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";
import type { ReactNode } from "react";
import { MultiProfileSwitcher } from "@/core/profiles/components/MultiProfileSwitcher";

/**
 * CentralHeader
 *
 * Header principal da Central.
 */
interface CentralHeaderProps {
  readonly billingEnabled: boolean;
  readonly brand?: ReactNode;
  readonly showNavigation?: boolean;
}

export function CentralHeader({ billingEnabled, brand, showNavigation = true }: CentralHeaderProps) {
  const publicHomeUrl = buildPublicAbsoluteUrl("/");

  const handleLogout = async () => {
    await AuthService.signOut();
    window.location.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      {showNavigation ? <SidebarTrigger className="text-muted-foreground hover:text-foreground md:mr-2" /> : null}
      <div className="min-w-0 shrink-0">{brand}</div>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-3">
        <MultiProfileSwitcher compact />
        <a
          href={publicHomeUrl}
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Voltar ao site"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Ver site</span>
        </a>
        {billingEnabled ? (
          <Link to="/planos" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline">
            Planos
          </Link>
        ) : null}
        <Link to="/sobre" className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline">
          Sobre
        </Link>
        <Link to={APP_PATHS.notifications} aria-label="Notificações" className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
        </Link>
        <Link to="/conta" className="hidden text-sm sm:inline" aria-label="Minha conta">Conta</Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Sair da conta"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
