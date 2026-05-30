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
import { AnchorHTMLAttributes, ReactNode } from 'react';
import { isSafeLinkUrl } from '@/shared/utils/urlSafety';

interface SafeLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
  /** Permite links internos sem validação (padrão: false) */
  allowInternal?: boolean;
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
  if (!isSafeLinkUrl(href, { allowInternal, context: 'SafeLink' })) {
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
