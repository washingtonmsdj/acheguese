/**
 * Sincronização best-effort de rascunhos do composer entre dispositivos.
 *
 * Depende da tabela `public.community_post_drafts` (ver
 * docs/migrations-pending/*_create_community_post_drafts.sql).
 *
 * Estratégia de conflito: last-write-wins com `updated_at` (server-side).
 * Antes de sobrescrever, buscamos o remoto e comparamos timestamps — se o
 * remoto for mais novo, abortamos e devolvemos { conflict: true, remote }.
 *
 * Suporte offline: quando o navegador está offline ou a requisição falha,
 * o snapshot é enfileirado em localStorage para reenvio via `flushPendingSync`.
 */

import { supabase } from "@/integrations/supabase";
import type {
  PostDraftPayload,
  PostDraftSnapshot,
} from "@/core/community/utils/postDraft";
import {
  decryptString,
  encryptString,
} from "@/core/community/utils/postDraftCrypto";
import { SessionService } from "@/core/session/services/SessionService";

const TABLE = "community_post_drafts";
const PENDING_PREFIX = "community:post-draft-pending:v1:";

interface RemoteDraftRow {
  payload: PostDraftPayload;
  updated_at: string;
}

export interface RemoteDraft {
  snapshot: PostDraftSnapshot;
  updatedAt: number;
}

export type UpsertRemoteResult =
  | { status: "ok"; updatedAt: number }
  | { status: "offline" }
  | { status: "conflict"; remote: RemoteDraft }
  | { status: "error"; error: unknown };

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

function pendingKey(profileId: string): string {
  return `${PENDING_PREFIX}${profileId}`;
}

function pendingCryptoScope(profileId: string): string {
  return `post-draft-pending:${profileId}`;
}

async function enqueuePending(
  profileId: string,
  snapshot: PostDraftSnapshot,
): Promise<void> {
  if (!isBrowser() || !profileId) return;
  try {
    const ciphertext = await encryptString(
      pendingCryptoScope(profileId),
      JSON.stringify(snapshot),
    );
    window.localStorage.setItem(pendingKey(profileId), ciphertext);
  } catch {
    // no-op
  }
}

async function readPending(
  profileId: string,
): Promise<PostDraftSnapshot | null> {
  if (!isBrowser() || !profileId) return null;
  try {
    const raw = window.localStorage.getItem(pendingKey(profileId));
    if (!raw) return null;
    const plaintext = await decryptString(pendingCryptoScope(profileId), raw);
    if (!plaintext) return null;
    return JSON.parse(plaintext) as PostDraftSnapshot;
  } catch {
    return null;
  }
}

function clearPending(profileId: string): void {
  if (!isBrowser() || !profileId) return;
  try {
    window.localStorage.removeItem(pendingKey(profileId));
  } catch {
    // no-op
  }
}

/**
 * Verificação síncrona: apenas checa se há envelope pendente, sem decifrar.
 */
export function hasPendingSync(profileId: string): boolean {
  if (!isBrowser() || !profileId) return false;
  try {
    return window.localStorage.getItem(pendingKey(profileId)) !== null;
  } catch {
    return false;
  }
}

function toSnapshot(row: RemoteDraftRow): PostDraftSnapshot {
  const ts = new Date(row.updated_at).getTime();
  return { ...row.payload, updatedAt: ts, savedAt: ts };
}

export async function fetchRemoteDraft(
  profileId: string,
): Promise<RemoteDraft | null> {
  if (!profileId) return null;
  try {
    const { data } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              col: string,
              val: string,
            ) => {
              maybeSingle: () => Promise<{ data: RemoteDraftRow | null }>;
            };
          };
        };
      }
    )
      .from(TABLE)
      .select("payload, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (!data) return null;
    const snapshot = toSnapshot(data);
    return { snapshot, updatedAt: snapshot.updatedAt };
  } catch {
    return null;
  }
}

export async function upsertRemoteDraft(
  profileId: string,
  snapshot: PostDraftSnapshot,
  options: { skipConflictCheck?: boolean } = {},
): Promise<UpsertRemoteResult> {
  if (!profileId) return { status: "error", error: "missing profileId" };

  // Offline: enfileira para reenvio.
  if (!isOnline()) {
    await enqueuePending(profileId, snapshot);
    return { status: "offline" };
  }

  try {
    // Conflict guard: só sobrescreve se local for igual ou mais novo.
    if (!options.skipConflictCheck) {
      const remote = await fetchRemoteDraft(profileId);
      if (remote && remote.updatedAt > snapshot.updatedAt) {
        return { status: "conflict", remote };
      }
    }

    const user = await SessionService.getCurrentUser();
    const userId = user?.id;
    if (!userId) return { status: "error", error: "not authenticated" };

    const { updatedAt: _u, savedAt: _s, ...payload } = snapshot;
    void _u;
    void _s;

    const res = (await (
      supabase as unknown as {
        from: (t: string) => {
          upsert: (
            row: Record<string, unknown>,
            opts: { onConflict: string },
          ) => Promise<{ error?: unknown }>;
        };
      }
    )
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          profile_id: profileId,
          payload,
          updated_at: new Date(snapshot.updatedAt).toISOString(),
        },
        { onConflict: "user_id,profile_id" },
      )) as { error?: unknown };

    if (res && res.error) {
      await enqueuePending(profileId, snapshot);
      return { status: "error", error: res.error };
    }

    clearPending(profileId);
    return { status: "ok", updatedAt: snapshot.updatedAt };
  } catch (error) {
    await enqueuePending(profileId, snapshot);
    return { status: "error", error };
  }
}

/**
 * Reenvio de rascunhos pendentes salvos offline. Retorna o resultado do
 * último upsert, se houver.
 */
export async function flushPendingSync(
  profileId: string,
): Promise<UpsertRemoteResult | null> {
  const pending = await readPending(profileId);
  if (!pending) return null;
  const result = await upsertRemoteDraft(profileId, pending, {
    skipConflictCheck: false,
  });
  if (result.status === "ok") clearPending(profileId);
  return result;
}

export async function deleteRemoteDraft(profileId: string): Promise<void> {
  if (!profileId) return;
  clearPending(profileId);
  try {
    await (
      supabase as unknown as {
        from: (t: string) => {
          delete: () => {
            eq: (col: string, val: string) => Promise<unknown>;
          };
        };
      }
    )
      .from(TABLE)
      .delete()
      .eq("profile_id", profileId);
  } catch {
    // best-effort
  }
}
