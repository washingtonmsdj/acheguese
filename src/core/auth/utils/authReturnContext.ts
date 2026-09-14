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

const PORTUGUESE_CONNECTORS = new Set(["a", "as", "da", "das", "de", "do", "dos", "e", "em"]);

function titleCaseSlug(slug: string): string {
  const words = decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .split(" ")
    .filter(Boolean);

  return words
    .map((word, index) => {
      if (index > 0 && PORTUGUESE_CONNECTORS.has(word)) return word;
      return word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1);
    })
    .join(" ");
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
