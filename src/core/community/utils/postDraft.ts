/**
 * Rascunhos locais do CreatePostModal.
 *
 * Persistência client-side (localStorage) por perfil ativo. Snapshot enxuto
 * dos campos textuais do composer — não persiste imagens/uploads.
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
  savedAt: number;
}

function keyFor(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function savePostDraft(
  profileId: string,
  snapshot: Omit<PostDraftSnapshot, "savedAt">,
): void {
  if (!isBrowser() || !profileId) return;
  try {
    const payload: PostDraftSnapshot = { ...snapshot, savedAt: Date.now() };
    window.localStorage.setItem(keyFor(profileId), JSON.stringify(payload));
  } catch {
    // Silencia falhas de quota/serialização — rascunho é best-effort.
  }
}

export function loadPostDraft(profileId: string): PostDraftSnapshot | null {
  if (!isBrowser() || !profileId) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(profileId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PostDraftSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
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
  snapshot: Omit<PostDraftSnapshot, "savedAt"> | PostDraftSnapshot,
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
