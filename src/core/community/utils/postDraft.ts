/**
 * Rascunhos locais do CreatePostModal.
 *
 * Persistência client-side (localStorage) por perfil ativo. Snapshot enxuto
 * dos campos textuais do composer — não persiste imagens/uploads.
 *
 * O timestamp `updatedAt` é usado para reconciliar com o rascunho remoto
 * (ver `postDraftSync.ts`). `savedAt` é mantido para compat retroativa.
 */

const STORAGE_PREFIX = "community:post-draft:v1:";

export interface PostDraftSnapshot {
  intent: string;
  distributionLevel: "street" | "neighborhood" | "region" | "city";
  genericDescription: string;
  pollQuestion: string;
  pollOptions: string[];
  problemLocation: string;
  problemCategory: string;
  problemSeverity: "baixa" | "media" | "alta" | "critica";
  problemRecurrence: "pontual" | "frequente" | "constante";
  problemDescription: string;
  eventDate: string;
  eventTime: string;
  eventPlace: string;
  eventLimit: string;
  eventDescription: string;
  /** Timestamp (ms) da última atualização. */
  updatedAt: number;
  /** @deprecated usar updatedAt. Mantido para compat com snapshots antigos. */
  savedAt?: number;
}

export type PostDraftPayload = Omit<PostDraftSnapshot, "updatedAt" | "savedAt">;

function keyFor(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function savePostDraft(
  profileId: string,
  snapshot: PostDraftPayload,
): PostDraftSnapshot | null {
  if (!isBrowser() || !profileId) return null;
  try {
    const now = Date.now();
    const payload: PostDraftSnapshot = {
      ...snapshot,
      updatedAt: now,
      savedAt: now,
    };
    window.localStorage.setItem(keyFor(profileId), JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function loadPostDraft(profileId: string): PostDraftSnapshot | null {
  if (!isBrowser() || !profileId) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostDraftSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.updatedAt && parsed.savedAt) parsed.updatedAt = parsed.savedAt;
    return parsed;
  } catch {
    return null;
  }
}

export function writePostDraftSnapshot(
  profileId: string,
  snapshot: PostDraftSnapshot,
): void {
  if (!isBrowser() || !profileId) return;
  try {
    window.localStorage.setItem(keyFor(profileId), JSON.stringify(snapshot));
  } catch {
    // no-op
  }
}

export function clearPostDraft(profileId: string): void {
  if (!isBrowser() || !profileId) return;
  try {
    window.localStorage.removeItem(keyFor(profileId));
  } catch {
    // no-op
  }
}

export function hasMeaningfulDraft(
  snapshot: PostDraftPayload | PostDraftSnapshot,
): boolean {
  return (
    snapshot.genericDescription.trim().length > 0 ||
    snapshot.pollQuestion.trim().length > 0 ||
    snapshot.pollOptions.some((opt) => opt.trim().length > 0) ||
    snapshot.problemDescription.trim().length > 0 ||
    snapshot.problemLocation.trim().length > 0 ||
    snapshot.problemCategory.trim().length > 0 ||
    snapshot.eventDescription.trim().length > 0 ||
    snapshot.eventPlace.trim().length > 0
  );
}
