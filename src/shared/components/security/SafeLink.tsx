/**
 * SafeLink - Componente seguro para links externos
 * 
 * ✅ Valida URLs antes de renderizar
 * ✅ Adiciona rel="noopener noreferrer" automaticamente
 * ✅ Bloqueia javascript: e data: URLs
 * 
 * @example
 * ```tsx
 * // ✅ CORRETO
 * <SafeLink href={userUrl}>Clique aqui</SafeLink>
 * 
 * // ❌ ERRADO - Vulnerável a javascript:
 * <a href={userUrl}>Clique aqui</a>
 * ```
 */

import { AnchorHTMLAttributes, ReactNode } from 'react';

interface SafeLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  /** Permite links internos sem validação (padrão: false) */
  allowInternal?: boolean;
}

/**
 * Valida se URL é segura
 */
function isUrlSafe(url: string, allowInternal: boolean): boolean {
  // Permite URLs relativas se allowInternal=true
  if (allowInternal && (url.startsWith('/') || url.startsWith('#'))) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    
    // Bloqueia protocolos perigosos
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(proto => parsed.protocol.toLowerCase().startsWith(proto))) {
      console.warn('[SafeLink] Blocked dangerous protocol:', parsed.protocol);
      return false;
    }

    // Permite apenas http, https, mailto, tel
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    if (!allowedProtocols.includes(parsed.protocol.toLowerCase())) {
      console.warn('[SafeLink] Blocked unknown protocol:', parsed.protocol);
      return false;
    }

    return true;
  } catch {
    console.warn('[SafeLink] Invalid URL:', url);
    return false;
  }
}

export function SafeLink({
  href,
  children,
  allowInternal = false,
  target,
  rel,
  ...props
}: SafeLinkProps) {
  // Valida URL
  if (!isUrlSafe(href, allowInternal)) {
    // Renderiza texto sem link se URL for perigosa
    return <span className="text-muted-foreground">{children}</span>;
  }

  // Adiciona segurança para links externos
  const isExternal = target === '_blank' || href.startsWith('http');
  const safeRel = isExternal
    ? `noopener noreferrer ${rel || ''}`.trim()
    : rel;

  return (
    <a
      href={href}
      target={target}
      rel={safeRel}
      {...props}
    >
      {children}
    </a>
  );
}
