/**
 * SafeHtml - Componente seguro para renderizar HTML
 * 
 * ✅ ÚNICO lugar permitido para renderizar HTML de usuário
 * ✅ Sanitização automática com DOMPurify
 * ✅ Configuração restritiva por padrão
 * 
 * @example
 * ```tsx
 * // ✅ CORRETO
 * <SafeHtml content={userContent} />
 * 
 * // ❌ ERRADO - Nunca faça isso
 * <div dangerouslySetInnerHTML={{__html: userContent}} />
 * ```
 */

import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface SafeHtmlProps {
  /** Conteúdo HTML a ser sanitizado e renderizado */
  content: string;
  /** Tags HTML permitidas (padrão: apenas formatação básica) */
  allowedTags?: string[];
  /** Atributos permitidos */
  allowedAttributes?: Record<string, string[]>;
  /** Classe CSS do container */
  className?: string;
  /** Elemento wrapper (padrão: div) */
  as?: keyof JSX.IntrinsicElements;
}

// Configuração padrão RESTRITIVA
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
];

const DEFAULT_ALLOWED_ATTR = {
  'a': ['href', 'title', 'target', 'rel'],
  '*': ['class']
};

/**
 * Sanitiza HTML usando DOMPurify com configuração segura
 */
function sanitizeHtml(
  html: string,
  allowedTags: string[] = DEFAULT_ALLOWED_TAGS,
  allowedAttributes: Record<string, string[]> = DEFAULT_ALLOWED_ATTR
): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    // Remove scripts e event handlers
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
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
