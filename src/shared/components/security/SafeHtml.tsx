/* eslint-disable react-refresh/only-export-components */
import DOMPurify from 'dompurify';
import { useMemo } from 'react';
import { HTML_SANITIZATION_CONFIG } from '@/config/security.config';

interface SafeHtmlProps {
  content: string;
  allowedTags?: readonly string[];
  allowedAttributes?: Record<string, readonly string[]>;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

function sanitizeHtml(
  html: string,
  allowedTags?: readonly string[],
  allowedAttributes?: Record<string, readonly string[]>,
): string {
  const ssotAllowedTags = Array.from(HTML_SANITIZATION_CONFIG.ALLOWED_TAGS);
  const ssotAllowedAttr = Object.fromEntries(
    Object.entries(HTML_SANITIZATION_CONFIG.ALLOWED_ATTR).map(([key, values]) => [
      key,
      Array.from(values),
    ]),
  );

  const configuredAllowedAttr = allowedAttributes
    ? Object.fromEntries(
        Object.entries(allowedAttributes).map(([key, values]) => [key, Array.from(values)]),
      )
    : ssotAllowedAttr;

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags ? Array.from(allowedTags) : ssotAllowedTags,
    ALLOWED_ATTR: configuredAllowedAttr,
    ALLOW_DATA_ATTR: HTML_SANITIZATION_CONFIG.ALLOW_DATA_ATTR,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    FORBID_TAGS: Array.from(HTML_SANITIZATION_CONFIG.FORBID_TAGS),
    FORBID_ATTR: Array.from(HTML_SANITIZATION_CONFIG.FORBID_ATTR),
  } as any);
  return String(sanitized);
}

export function SafeHtml({
  content,
  allowedTags,
  allowedAttributes,
  className,
  as: Component = 'div',
}: SafeHtmlProps) {
  const sanitizedContent = useMemo(
    () => sanitizeHtml(content, allowedTags, allowedAttributes),
    [content, allowedTags, allowedAttributes],
  );

  return <Component className={className} dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
}

export function useSanitizedHtml(
  html: string,
  allowedTags?: readonly string[],
  allowedAttributes?: Record<string, readonly string[]>,
): string {
  return useMemo(() => sanitizeHtml(html, allowedTags, allowedAttributes), [
    html,
    allowedTags,
    allowedAttributes,
  ]);
}

export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}
