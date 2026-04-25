import { Link } from "react-router-dom";
import { ShoppingCart, Store, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import type { PublicBusinessSnapshot } from "@/modules/business/public/types";
import type { PremiumBusinessSiteRoutes } from "@/core/business/services/PremiumBusinessSiteResolver";
import type { ReactNode } from "react";

interface PremiumBusinessShellProps {
  readonly snapshot: PublicBusinessSnapshot;
  readonly routes: PremiumBusinessSiteRoutes;
  readonly hasGastronomy: boolean;
  readonly children: ReactNode;
}

export function PremiumBusinessShell({
  snapshot,
  routes,
  hasGastronomy,
  children,
}: PremiumBusinessShellProps) {
  const logoUrl = snapshot.institutional.logoUrl || snapshot.institutional.bannerUrl;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to={routes.home} className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={snapshot.institutional.name}
                className="h-10 w-10 rounded-xl border object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
                <Store className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {snapshot.institutional.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Link premium oficial
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to={routes.home}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Perfil
            </Link>
            {hasGastronomy && (
              <Link
                to={routes.menu}
                className="rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
              >
                Cardapio
              </Link>
            )}
            {hasGastronomy && (
              <Link
                to={routes.cart}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                <ShoppingCart className="h-4 w-4" />
                Carrinho
              </Link>
            )}
          </nav>
        </div>

        {hasGastronomy ? (
          <div className="border-t bg-muted/20">
            <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2 text-xs text-muted-foreground sm:px-6">
              <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
              <span>Cardapio e pedidos neste link premium</span>
            </div>
          </div>
        ) : (
          <div className="border-t bg-muted/20">
            <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2 text-xs sm:px-6">
              <Badge variant="outline">Sem vertical transacional ativa</Badge>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}

