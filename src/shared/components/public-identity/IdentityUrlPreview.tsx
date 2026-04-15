/**
 * IdentityUrlPreview
 * Exibe preview da URL pública do identificador.
 * Recebe a URL já computada — sem lógica de roteamento própria.
 */

import { Globe } from 'lucide-react';

interface IdentityUrlPreviewProps {
  url: string;
  label?: string;
}

export function IdentityUrlPreview({ url, label = 'URL pública' }: IdentityUrlPreviewProps) {
  if (!url) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="sr-only">{label}:</span>
      <span className="font-mono truncate">{url}</span>
    </div>
  );
}
