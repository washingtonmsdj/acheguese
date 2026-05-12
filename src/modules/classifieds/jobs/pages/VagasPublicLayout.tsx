/**
 * VagasPublicLayout - Layout principal da página de vagas
 * 
 * SSOT: Layout reutilizável com props tipadas
 * Sem gambiarras: Separação clara de responsabilidades
 * 
 * Responsabilidades:
 * - Renderizar SEO
 * - Renderizar container principal
 * - Renderizar conteúdo das sections
 */

import type { ReactNode } from "react";
import { SEO } from "@/shared/components/seo/SEO";

export interface VagasPublicLayoutProps {
  // SEO
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly emitSeo?: boolean;

  // Conteúdo
  readonly children: ReactNode;
}

export function VagasPublicLayout({
  pageTitle,
  pageDescription,
  emitSeo = true,
  children,
}: VagasPublicLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {emitSeo ? <SEO title={pageTitle} description={pageDescription} /> : null}
      {children}
    </div>
  );
}
