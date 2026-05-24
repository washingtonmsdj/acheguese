import type { ReactNode } from "react";
import { TERRITORY_CONFIG } from "@/config/territory";

interface EmpresasLandingLayoutProps {
  readonly children: ReactNode;
}

export function EmpresasLandingLayout({ children }: EmpresasLandingLayoutProps) {
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground">
      {children}

      <footer className="w-full border-t border-border bg-card px-4 py-4 text-center text-xs text-muted-foreground sm:px-6">
        Empresas locais · {launchPlace} · Território conectado
      </footer>
    </div>
  );
}

export default EmpresasLandingLayout;
