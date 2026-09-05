/**
 * Utilitário SSOT para compartilhamento de posts.
 *
 * Regras:
 * - Sempre gera URL absoluta.
 * - Preserva o contexto territorial da comunidade quando o usuário
 *   está numa rota `/comunidade/...` (usa `window.location.pathname`).
 * - Fora de uma rota de comunidade, cai no feed global (`LAUNCH_URLS.community`).
 * - O parâmetro canônico é `?post=<id>` (consumido por `useComunidadePage`
 *   para abrir o `PostDetailModal`).
 */

import { LAUNCH_URLS } from "@/core/routing/config/territory";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";

const COMMUNITY_ROUTE_PREFIX = "/comunidade";

export interface BuildPostShareUrlOptions {
  /** Sobrescreve o pathname base (ex.: quando compartilhando de fora do browser). */
  basePath?: string;
}

/**
 * Constrói uma URL canônica e absoluta para o post.
 * Ex.: `https://achegue.se/comunidade/ba/salvador/nordeste-de-amaralina?post=<id>`
 */
export function buildPostShareUrl(
  postId: string,
  options: BuildPostShareUrlOptions = {},
): string {
  if (!postId) return "";

  const isBrowser = typeof window !== "undefined";
  const origin = isBrowser ? window.location.origin : "";
  const currentPath = isBrowser ? window.location.pathname : "";

  const explicitBase = options.basePath?.trim();
  const useCurrent =
    !explicitBase && currentPath.startsWith(COMMUNITY_ROUTE_PREFIX);

  const basePath = explicitBase || (useCurrent ? currentPath : LAUNCH_URLS.community);

  const url = new URL(basePath, origin || "https://achegue.se");
  url.searchParams.set("post", postId);
  return url.toString();
}

export interface SharePostOptions {
  postId: string;
  title?: string;
  text?: string;
  /** Callback opcional para registrar o share no backend. */
  onShared?: () => void | Promise<void>;
}

/**
 * Dispara o fluxo de compartilhamento:
 * 1. Web Share API (mobile / navegadores compatíveis).
 * 2. Fallback: copia o link para a área de transferência.
 * 3. Fallback final: exibe o link em um toast para cópia manual.
 */
export async function sharePost(options: SharePostOptions): Promise<boolean> {
  const { postId, title = "Post da Comunidade", text, onShared } = options;
  const url = buildPostShareUrl(postId);

  if (!url) {
    toast.error("Não foi possível gerar o link do post");
    return false;
  }

  const shareData: ShareData = { title, url, ...(text ? { text } : {}) };
  let succeeded = false;

  try {
    const canWebShare =
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      (typeof navigator.canShare !== "function" ||
        navigator.canShare(shareData));

    if (canWebShare) {
      await navigator.share(shareData);
      succeeded = true;
    } else if (
      typeof navigator !== "undefined" &&
      navigator.clipboard?.writeText
    ) {
      await navigator.clipboard.writeText(url);
      toast.success("Link do post copiado", { description: url });
      succeeded = true;
    } else {
      toast.info("Copie o link do post", { description: url, duration: 8000 });
      succeeded = true;
    }
  } catch (error) {
    const name = (error as Error)?.name;
    if (name === "AbortError") {
      // Usuário cancelou o share nativo — não é erro.
      return false;
    }
    logger.error("[sharePost] falha ao compartilhar", error);
    toast.error("Não foi possível compartilhar o post");
    return false;
  }

  if (succeeded && onShared) {
    try {
      await onShared();
    } catch (error) {
      logger.warn("[sharePost] onShared falhou (não crítico)", error);
    }
  }

  return succeeded;
}
