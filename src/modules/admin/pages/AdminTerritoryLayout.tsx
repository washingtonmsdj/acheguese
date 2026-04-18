/**
 * AdminTerritoryLayout
 * 
 * Layout wrapper para AdminTerritoryManagement.
 * Fornece estrutura de espaçamento consistente.
 * 
 * SSOT: Layout reutilizável
 * Sem gambiarras: Componente focado apenas em layout
 */

import type { ReactNode } from 'react';

interface AdminTerritoryLayoutProps {
  readonly children: ReactNode;
}

export function AdminTerritoryLayout({ children }: AdminTerritoryLayoutProps) {
  return (
    <div className="space-y-6 p-6">
      {children}
    </div>
  );
}
