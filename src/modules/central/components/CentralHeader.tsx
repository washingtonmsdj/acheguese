import { SidebarTrigger } from "@/shared/components/ui/sidebar";
import { Link } from "react-router-dom";
import { Home, LogOut } from "lucide-react";
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

export function CentralHeader({
  billingEnabled,
  brand,
  showNavigation = true,
}: CentralHeaderProps) {
  const publicHomeUrl = buildPublicAbsoluteUrl("/");

  const handleLogout = async () => {
    await AuthService.signOut();
    window.location.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-3 border-b border-territory-border bg-territory-surface/80 px-4 text-territory-ink backdrop-blur-sm">
      {showNavigation ? (
        <SidebarTrigger className="text-territory-muted hover:text-territory-ink md:mr-2" />
      ) : null}
      <div className="min-w-0 shrink-0">{brand}</div>

      <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-3">
        <MultiProfileSwitcher compact />
        <a
          href={publicHomeUrl}
          className="hidden items-center gap-1.5 text-xs text-territory-muted transition-colors hover:text-territory-ink sm:inline-flex"
          aria-label="Voltar ao site"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Ver site</span>
        </a>
        {billingEnabled ? (
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
        <Link
          to="/conta"
          className="hidden text-sm text-territory-ink transition-colors hover:text-territory-brand sm:inline"
          aria-label="Minha conta"
        >
          Conta
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 text-territory-muted hover:bg-territory-raised hover:text-territory-ink"
          aria-label="Sair da conta"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
