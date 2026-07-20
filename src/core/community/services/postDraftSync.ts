/**
 * Sincronização best-effort de rascunhos do composer entre dispositivos.
 *
 * Depende da tabela `public.community_post_drafts` (ver
 * docs/migrations-pending/*_create_community_post_drafts.sql).
 *
 * Todas as operações silenciam erros — falha remota nunca bloqueia a UX,
 * pois o `localStorage` continua sendo a fonte imediata (`postDraft.ts`).
 */

import { supabase } from "@/integrations/supabase/supabase";
import type {
  PostDraftPayload,
  PostDraftSnapshot,
} from "@/core/community/utils/postDraft";

const TABLE = "community_post_drafts";

interface RemoteDraftRow {
  payload: PostDraftPayload;
  updated_at: string;
}

export interface RemoteDraft {
  snapshot: PostDraftSnapshot;
  updatedAt: number;
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
    const { data } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (col: string, val: string) => {
            maybeSingle: () => Promise<{ data: RemoteDraftRow | null }>;
          };
        };
      };
    })
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
): Promise<void> {
  if (!profileId) return;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes?.user?.id;
    if (!userId) return;
    // Remove chaves de metadata do payload persistido remotamente.
    const { updatedAt: _u, savedAt: _s, ...payload } = snapshot;
    void _u;
    void _s;
    await (supabase as unknown as {
      from: (t: string) => {
        upsert: (
          row: Record<string, unknown>,
          opts: { onConflict: string },
        ) => Promise<unknown>;
      };
    })
      .from(TABLE)
      .upsert(
        {
          user_id: userId,
          profile_id: profileId,
          payload,
          updated_at: new Date(snapshot.updatedAt).toISOString(),
        },
        { onConflict: "user_id,profile_id" },
      );
  } catch {
    // best-effort
  }
}

export async function deleteRemoteDraft(profileId: string): Promise<void> {
  if (!profileId) return;
  try {
    await (supabase as unknown as {
      from: (t: string) => {
        delete: () => {
          eq: (col: string, val: string) => Promise<unknown>;
        };
      };
    })
      .from(TABLE)
      .delete()
      .eq("profile_id", profileId);
  } catch {
    // best-effort
  }
}
