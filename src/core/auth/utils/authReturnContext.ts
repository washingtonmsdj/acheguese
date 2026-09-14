export type AuthReturnContextKind =
  | "business"
  | "conversation"
  | "account"
  | "community"
  | "generic";

export interface AuthReturnContext {
  label: string;
  kind: AuthReturnContextKind;
}

function titleCaseSlug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR"));
}

/**
 * Converte somente destinos internos já sanitizados em uma descrição amigável.
 * Não busca nem confia em texto arbitrário da URL; rotas desconhecidas usam um
 * fallback neutro. Assim Login e Primeiro acesso podem explicar para onde a
 * pessoa voltará sem transformar query string em conteúdo de interface.
 */
export function getAuthReturnContext(path: string): AuthReturnContext {
  const pathname = path.split(/[?#]/, 1)[0] || "/";

  if (/^\/mensagens(?:\/|$)/.test(pathname)) {
    return { label: "Conversas", kind: "conversation" };
  }

  if (/^\/conta(?:\/|$)/.test(pathname)) {
    return { label: "Minha conta", kind: "account" };
  }

  if (/^\/comunidade(?:\/|$)/.test(pathname)) {
    return { label: "Comunidade", kind: "community" };
  }

  const premiumBusinessMatch = pathname.match(/^\/p\/([^/]+)/);
  if (premiumBusinessMatch?.[1]) {
    const label = titleCaseSlug(premiumBusinessMatch[1]);
    if (label) return { label, kind: "business" };
  }

  if (/^\/empresas\/[^/]+\/catalogo(?:\/|$)/.test(pathname)) {
    return { label: "Catálogo da empresa", kind: "business" };
  }

  return { label: "onde parou", kind: "generic" };
}
