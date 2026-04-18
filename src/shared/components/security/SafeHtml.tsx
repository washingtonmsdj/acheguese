/**
 * SafeHtml - Componente seguro para renderizar HTML
 * 
 * ✅ ÚNICO lugar permitido para renderizar HTML de usuário
 * ✅ Sanitização automática com DOMPurify
 * ✅ Configuração vem do SSOT (security.config.ts)
 * 
 * @example
 * ```tsx
 * // ✅ CORRETO
 * <SafeHtml content={userContent} />
 * 
 * // ❌ ERRADO - Nunca faça isso
 * <div dangerouslySetInnerHTML={{__html: userContent}} />
 * ```
 * 
 * @security-critical
 * @ssot src/config/security.config.ts
 */

import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { HTML_SANITIZATION_CONFIG } from '@/config/security.config';

interface SafeHtmlProps {
  /** Conteúdo HTML a ser sanitizado e renderizado */
  content: string;
  /** Tags HTML permitidas (padrão: vem do SSOT) */
  allowedTags?: string[];
  /** Atributos permitidos (padrão: vem do SSOT) */
  allowedAttributes?: Record<string, string[]>;
  /** Classe CSS do container */
  className?: string;
  /** Elemento wrapper (padrão: div) */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Sanitiza HTML usando DOMPurify com configuração do SSOT
 * 
 * IMPORTANTE: Configuração vem de security.config.ts (SSOT)
 * NÃO hardcode configurações aqui!
 */
function sanitizeHtml(
  html: string,
  allowedTags?: string[],
  allowedAttributes?: Record<string, string[]>
): string {
  // Configuração vem do SSOT - Single Source of Truth
  return DOMPurify.sanitize(html, {
    // Use custom config if provided, otherwise use SSOT
    ALLOWED_TAGS: allowedTags || HTML_SANITIZATION_CONFIG.ALLOWED_TAGS,
    ALLOWED_ATTR: allowedAttributes || HTML_SANITIZATION_CONFIG.ALLOWED_ATTR,
    ALLOW_DATA_ATTR: HTML_SANITIZATION_CONFIG.ALLOW_DATA_ATTR,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    // Forbidden tags/attrs from SSOT
    FORBID_TAGS: HTML_SANITIZATION_CONFIG.FORBID_TAGS,
    FORBID_ATTR: HTML_SANITIZATION_CONFIG.FORBID_ATTR,
    KEEP_CONTENT: HTML_SANITIZATION_CONFIG.KEEP_CONTENT,
    RETURN_DOM: HTML_SANITIZATION_CONFIG.RETURN_DOM,
    RETURN_DOM_FRAGMENT: HTML_SANITIZATION_CONFIG.RETURN_DOM_FRAGMENT,
    FORCE_BODY: HTML_SANITIZATION_CONFIG.FORCE_BODY,
    SANITIZE_DOM: HTML_SANITIZATION_CONFIG.SANITIZE_DOM,
    WHOLE_DOCUMENT: HTML_SANITIZATION_CONFIG.WHOLE_DOCUMENT,
  });
}

export function SafeHtml({
  content,
  allowedTags,
  allowedAttributes,
  className,
  as: Component = 'div'
}: SafeHtmlProps) {
  // Memoiza sanitização para performance
  const sanitizedContent = useMemo(
    () => sanitizeHtml(content, allowedTags, allowedAttributes),
    [content, allowedTags, allowedAttributes]
  );

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}

/**
 * Hook para sanitizar HTML sem renderizar
 */
export function useSanitizedHtml(
  html: string,
  allowedTags?: string[],
  allowedAttributes?: Record<string, string[]>
): string {
  return useMemo(
    () => sanitizeHtml(html, allowedTags, allowedAttributes),
    [html, allowedTags, allowedAttributes]
  );
}

/**
 * Sanitiza texto puro (remove TODAS as tags HTML)
 */
export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
