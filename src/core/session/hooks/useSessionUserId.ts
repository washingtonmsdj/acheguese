import { useSyncExternalStore } from "react";
import { SessionState } from "@/core/session/state/SessionState";

function subscribe(listener: () => void): () => void {
  return SessionState.subscribe(listener);
}

function getSnapshot(): string | null {
  return SessionState.getState().user?.id ?? null;
}

/**
 * Le apenas o id do usuario no SessionState canonico.
 *
 * Use em superficies que nao executam acoes de autenticacao para evitar
 * carregar AuthService/SessionService apenas para observar a sessao atual.
 */
export function useSessionUserId(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
