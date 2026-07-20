/**
 * Registro efêmero do post recém-publicado.
 *
 * Fluxo:
 *  - `CreatePostModal` chama `emitNewPost(id)` após publicar com sucesso.
 *  - `CommunityFeed` usa `subscribeNewPost` para receber o ID mais recente,
 *    dar scroll até o card correspondente e aplicar um destaque temporário.
 *
 * Também espelha em `sessionStorage` para funcionar quando a publicação
 * acontece em outra rota (ex.: `/novo-post` → volta para `/comunidade/...`).
 */

const STORAGE_KEY = "community:highlight-post-id";

type Listener = (postId: string) => void;
const listeners = new Set<Listener>();

function readInitial(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function emitNewPost(postId: string): void {
  if (!postId) return;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, postId);
    } catch {
      // no-op
    }
  }
  listeners.forEach((fn) => {
    try {
      fn(postId);
    } catch {
      // no-op
    }
  });
}

export function consumePendingNewPost(): string | null {
  const id = readInitial();
  if (id && typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // no-op
    }
  }
  return id;
}

export function subscribeNewPost(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
