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
}

// ============================================
// Component
// ============================================

export function ClassificadosLayout({ children }: ClassificadosLayoutProps) {
  return (
    <div className="flex flex-col min-h-full bg-background">
      <div className="container mx-auto w-full">{children}</div>
    </div>
  );
}
