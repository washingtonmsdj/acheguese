/**
 * SafeLink - Componente seguro para links externos
 * 
 * ✅ Valida URLs antes de renderizar
 * ✅ Adiciona rel="noopener noreferrer" automaticamente
 * ✅ Bloqueia protocolos perigosos (configuração vem do SSOT)
 * 
 * @example
 * ```tsx
 * // ✅ CORRETO
 * <SafeLink href={userUrl}>Clique aqui</SafeLink>
 * 
 * // ❌ ERRADO - Vulnerável a javascript:
 * <a href={userUrl}>Clique aqui</a>
 * ```
 * 
 * @security-critical
 * @ssot src/config/security.config.ts
 */
import { logger } from '@/shared/utils/logger';
import { AnchorHTMLAttributes, ReactNode } from 'react';
import { 
  BLOCKED_URL_PROTOCOLS, 
  ALLOWED_URL_PROTOCOLS,
  isURLProtocolSafe 
} from '@/config/security.config';
interface SafeLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  /** Permite links internos sem validação (padrão: false) */
  allowInternal?: boolean;
}

/**
 * Valida se URL é segura
 * 
 * IMPORTANTE: Usa configuração do SSOT (security.config.ts)
 * NÃO hardcode protocolos aqui!
 */
function isUrlSafe(url: string, allowInternal: boolean): boolean {
  // Permite URLs relativas se allowInternal=true
  if (allowInternal && (url.startsWith('/') || url.startsWith('#'))) {
    return true;
  }

  try {
    const parsed = new URL(url, window.location.origin);
    const protocol = parsed.protocol.toLowerCase();
    
    // Verifica protocolos bloqueados (do SSOT)
    const isBlocked = BLOCKED_URL_PROTOCOLS.some(blocked => 
      protocol.startsWith(blocked)
    );
    
    if (isBlocked) {
      logger.warn('[SafeLink] Blocked dangerous protocol:', protocol);
      return false;
    }

    // Verifica protocolos permitidos (do SSOT)
    const isAllowed = ALLOWED_URL_PROTOCOLS.some(allowed => 
      protocol === allowed
    );
    
    if (!isAllowed) {
      logger.warn('[SafeLink] Blocked unknown protocol:', protocol);
      return false;
    }

    return true;
  } catch {
    logger.warn('[SafeLink] Invalid URL:', url);
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
  // Valida URL usando configuração do SSOT
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
