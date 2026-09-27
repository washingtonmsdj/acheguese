/**
 * ClassificadosLayout - layout canônico da página pública de classificados.
 */

import type { ReactNode } from "react";

export interface ClassificadosLayoutProps {
  readonly children: ReactNode;
}

export function ClassificadosLayout({ children }: ClassificadosLayoutProps) {
  return (
    <div
      className="flex min-h-full flex-col bg-background"
      data-module-presentation="standalone"
    >
      <div className="container mx-auto w-full">{children}</div>
    </div>
  );
}
