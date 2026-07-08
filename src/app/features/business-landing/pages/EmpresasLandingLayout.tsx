import type { ReactNode } from "react";
import { TERRITORY_CONFIG } from "@/config/territory";

interface EmpresasLandingLayoutProps {
  readonly children: ReactNode;
}

export function EmpresasLandingLayout({ children }: EmpresasLandingLayoutProps) {
  const launchPlace = `${TERRITORY_CONFIG.launch.name}, ${TERRITORY_CONFIG.launch.state.toUpperCase()}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#071017] text-white">
      {children}

      <footer className="mt-auto hidden w-full border-t border-white/8 bg-[#071017] px-4 py-5 text-center text-xs text-white/42 lg:block lg:px-6">
        Empresas locais - {launchPlace} - Territorio conectado
      </footer>
    </div>
  );
}

export default EmpresasLandingLayout;
