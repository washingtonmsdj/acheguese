/**
 * ClassificadosLayout - Layout da página de classificados
 * 
 * SSOT: Layout reutilizável
 * Sem gambiarras: Props tipadas e código limpo
 */

import type { ReactNode } from "react";

// ============================================
// Props
// ============================================

export interface ClassificadosLayoutProps {
  readonly children: ReactNode;
  readonly embedded?: boolean;
}

// ============================================
// Component
// ============================================

export function ClassificadosLayout({ children, embedded = false }: ClassificadosLayoutProps) {
  return (
    <div
      className="flex min-h-full flex-col bg-background"
      data-module-presentation={embedded ? "embedded" : "standalone"}
    >
      <div className="container mx-auto w-full">{children}</div>
    </div>
  );
}
