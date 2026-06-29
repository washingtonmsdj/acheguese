/* eslint-disable react-refresh/only-export-components */
import DOMPurify, { type Config as DomPurifyConfig } from 'dompurify';
import { createElement, useMemo, type ReactNode } from 'react';
import { HTML_SANITIZATION_CONFIG } from '@/config/security.config';

interface SafeHtmlProps {
  content: string;
  allowedTags?: readonly string[];
  allowedAttributes?: Record<string, readonly string[]>;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

type SafeHtmlElementProps = {
  key: string;
  className?: string;
  href?: string;
  title?: string;
  target?: string;
  rel?: string;
};

function sanitizeHtml(
  html: string,
  allowedTags?: readonly string[],
  allowedAttributes?: Record<string, readonly string[]>,
): string {
  const ssotAllowedTags = Array.from(HTML_SANITIZATION_CONFIG.ALLOWED_TAGS);
  const configuredAllowedAttr = resolveAllowedAttributeList(allowedAttributes);

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: allowedTags ? Array.from(allowedTags) : ssotAllowedTags,
    ALLOWED_ATTR: configuredAllowedAttr,
    ALLOW_DATA_ATTR: HTML_SANITIZATION_CONFIG.ALLOW_DATA_ATTR,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    FORBID_TAGS: Array.from(HTML_SANITIZATION_CONFIG.FORBID_TAGS),
    FORBID_ATTR: Array.from(HTML_SANITIZATION_CONFIG.FORBID_ATTR),
  } satisfies DomPurifyConfig);
  return String(sanitized);
}

function resolveAllowedAttributeList(
  allowedAttributes?: Record<string, readonly string[]>,
): string[] {
  if (!allowedAttributes) return Array.from(HTML_SANITIZATION_CONFIG.ALLOWED_ATTR);
  return Array.from(new Set(Object.values(allowedAttributes).flat()));
}

function isSafeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true;

  try {
    const parsed = new URL(trimmed, 'https://acheguese.com.br');
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function applySafeAttribute(
  props: SafeHtmlElementProps,
  name: string,
  value: string,
): void {
  switch (name) {
    case 'class':
      props.className = value;
      break;
    case 'href':
      props.href = value;
      break;
    case 'title':
      props.title = value;
      break;
    case 'target':
      props.target = value;
      break;
    case 'rel':
      props.rel = value;
      break;
    default:
      break;
  }
}

function withLinkRelProtection(rel?: string): string {
  const tokens = new Set((rel ?? '').split(/\s+/).filter(Boolean));
  tokens.add('noopener');
  tokens.add('noreferrer');
  return Array.from(tokens).join(' ');
}

function renderSafeNode(
  node: ChildNode,
  key: string,
  allowedTags: Set<string>,
  allowedAttributes: Set<string>,
): ReactNode {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map((child, index) =>
    renderSafeNode(child, `${key}-${index}`, allowedTags, allowedAttributes),
  );

  if (!allowedTags.has(tagName)) return children;

  const props: SafeHtmlElementProps = { key };
  for (const attr of Array.from(element.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowedAttributes.has(name) || name.startsWith('on')) continue;
    if ((name === 'href' || name === 'src') && !isSafeUrl(attr.value)) continue;
    applySafeAttribute(props, name, attr.value);
  }

  if (tagName === 'a') {
    props.rel = withLinkRelProtection(props.rel);
  }

  return createElement(tagName, props, children);
}

function renderSafeHtml(
  sanitizedHtml: string,
  allowedTags?: readonly string[],
  allowedAttributes?: Record<string, readonly string[]>,
): ReactNode {
  if (typeof DOMParser === 'undefined') {
    return DOMPurify.sanitize(sanitizedHtml, { ALLOWED_TAGS: [] });
  }

  const allowedTagSet = new Set(allowedTags ?? HTML_SANITIZATION_CONFIG.ALLOWED_TAGS);
  const allowedAttributeSet = new Set(resolveAllowedAttributeList(allowedAttributes));
  const document = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
  return Array.from(document.body.childNodes).map((node, index) =>
    renderSafeNode(node, String(index), allowedTagSet, allowedAttributeSet),
  );
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
  const children = useMemo(
    () => renderSafeHtml(sanitizedContent, allowedTags, allowedAttributes),
    [sanitizedContent, allowedTags, allowedAttributes],
  );

  return createElement(Component, { className }, children);
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
