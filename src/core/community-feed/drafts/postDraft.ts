/**
 * Rascunhos locais do CreatePostModal.
 *
 * Persistência client-side (localStorage) por perfil ativo. Snapshot enxuto
 * dos campos textuais do composer — não persiste imagens/uploads.
 *
 * ⚠️ O conteúdo é **criptografado** com AES-GCM antes de ir para o
 * localStorage (ver `postDraftCrypto.ts`). Snapshots antigos em texto puro
 * são migrados automaticamente na primeira leitura.
 *
 * `updatedAt` é o único timestamp do contrato público. `savedAt` existe apenas
 * no shape persistido legado e é convertido durante a leitura.
 */

import {
  decryptString,
  encryptString,
  isEncryptedEnvelope,
  purgeCryptoKey,
} from "./postDraftCrypto";

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
  updatedAt: number;
}

export type PostDraftPayload = Omit<PostDraftSnapshot, "updatedAt">;

type PersistedPostDraftSnapshot = PostDraftPayload & {
  updatedAt?: number;
  /** Legacy v1 timestamp. Never expose this outside the storage parser. */
  savedAt?: number;
};

function keyFor(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`;
}

function cryptoScopeFor(profileId: string): string {
  return `post-draft:${profileId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function canonicalizePersistedSnapshot(
  parsed: PersistedPostDraftSnapshot,
): PostDraftSnapshot | null {
  const updatedAt =
    typeof parsed.updatedAt === "number" && Number.isFinite(parsed.updatedAt)
      ? parsed.updatedAt
      : typeof parsed.savedAt === "number" && Number.isFinite(parsed.savedAt)
        ? parsed.savedAt
        : null;

  if (updatedAt === null) return null;

  const {
    updatedAt: _persistedUpdatedAt,
    savedAt: _legacySavedAt,
    ...payload
  } = parsed;

  return {
    ...payload,
    updatedAt,
  };
}

async function persistEncrypted(
  profileId: string,
  snapshot: PostDraftSnapshot,
): Promise<void> {
  const serialized = JSON.stringify(snapshot);
  const ciphertext = await encryptString(cryptoScopeFor(profileId), serialized);
  window.localStorage.setItem(keyFor(profileId), ciphertext);
}

export async function savePostDraft(
  profileId: string,
  snapshot: PostDraftPayload,
): Promise<PostDraftSnapshot | null> {
  if (!isBrowser() || !profileId) return null;
  try {
    const payload: PostDraftSnapshot = {
      ...snapshot,
      updatedAt: Date.now(),
    };
    await persistEncrypted(profileId, payload);
    return payload;
  } catch {
    return null;
  }
}

export async function loadPostDraft(
  profileId: string,
): Promise<PostDraftSnapshot | null> {
  if (!isBrowser() || !profileId) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(profileId));
    if (!raw) return null;

    const scope = cryptoScopeFor(profileId);
    const plaintext = await decryptString(scope, raw);
    if (!plaintext) return null;

    const parsed = JSON.parse(plaintext) as PersistedPostDraftSnapshot;
    if (!parsed || typeof parsed !== "object") return null;

    const canonical = canonicalizePersistedSnapshot(parsed);
    if (!canonical) return null;

    const hasLegacyTimestamp =
      typeof parsed.savedAt === "number" ||
      typeof parsed.updatedAt !== "number";

    // Migração transparente: plaintext e formatos com `savedAt` são sempre
    // regravados no envelope criptografado e no contrato canônico atual.
    if (!isEncryptedEnvelope(raw) || hasLegacyTimestamp) {
      try {
        await persistEncrypted(profileId, canonical);
      } catch {
        // best-effort: a leitura continua válida mesmo se a regravação falhar.
      }
    }

    return canonical;
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
  void purgeCryptoKey(cryptoScopeFor(profileId));
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
