import type { ReactNode } from "react";
import { TERRITORY_CONFIG } from "@/core/routing/config/territory";

interface EmpresasLandingLayoutProps {
  readonly children: ReactNode;
  readonly embedded?: boolean;
}

export function EmpresasLandingLayout({
  children,
  embedded = false,
}: EmpresasLandingLayoutProps) {
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <div
      className={`flex w-full flex-col bg-territory-image-overlay text-territory-on-image ${embedded ? "min-h-0" : "min-h-screen"}`}
      data-module-presentation={embedded ? "embedded" : "standalone"}
    >
      {children}

      {!embedded ? (
        <footer className="mt-auto hidden w-full border-t border-territory-on-image/8 bg-territory-image-overlay px-4 py-5 text-center text-xs text-territory-on-image/42 lg:block lg:px-6">
          Empresas locais - {launchPlace} - Territorio conectado
        </footer>
      ) : null}
    </div>
  );
}

export default EmpresasLandingLayout;
