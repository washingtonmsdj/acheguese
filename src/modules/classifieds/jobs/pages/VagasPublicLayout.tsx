/**
 * VagasPublicLayout - Layout principal da página de vagas.
 *
 * SSOT: layout reutilizável com projeção visual territorial e props tipadas.
 */

import type { ReactNode } from "react";
import { SEO } from "@/shared/components/seo/SEO";

export interface VagasPublicLayoutProps {
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly emitSeo?: boolean;
  readonly children: ReactNode;
}

export function VagasPublicLayout({
  pageTitle,
  pageDescription,
  emitSeo = true,
  children,
}: VagasPublicLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-territory-canvas text-territory-ink">
      {emitSeo ? <SEO title={pageTitle} description={pageDescription} /> : null}
      {children}
    </div>
  );
}
