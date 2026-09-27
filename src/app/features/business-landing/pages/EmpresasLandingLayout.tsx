import type { ReactNode } from "react";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";

interface EmpresasLandingLayoutProps {
  readonly children: ReactNode;
  readonly embedded?: boolean;
}

export function EmpresasLandingLayout({ children, embedded = false }: EmpresasLandingLayoutProps) {
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <div
      className={embedded
        ? "territory-vivo flex w-full min-w-0 flex-col bg-territory-surface text-territory-ink"
        : "territory-vivo flex min-h-screen w-full flex-col bg-territory-surface text-territory-ink"}
      data-module-presentation={embedded ? "embedded" : "standalone"}
    >
      {children}

      {!embedded ? (
        <footer className="mt-auto hidden w-full border-t border-territory-border bg-territory-surface px-4 py-5 text-center text-xs text-territory-muted lg:block lg:px-6">
          Empresas locais · {launchPlace} · Território conectado
        </footer>
      ) : null}
    </div>
  );
}

export default EmpresasLandingLayout;
