/**
 * EmpresasLandingLayout
 * 
 * Layout wrapper para a página de empresas landing
 */

import type { ReactNode } from "react";

interface EmpresasLandingLayoutProps {
  readonly children: ReactNode;
}

export function EmpresasLandingLayout({ children }: EmpresasLandingLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {children}
      
      {/* Footer */}
      <footer className="w-full bg-card border-t border-border px-4 sm:px-6 py-4 text-center text-muted-foreground text-xs">
        Empresas Locais · Salvador, BA · Bairro Conectado
      </footer>
    </div>
  );
}

export default EmpresasLandingLayout;
