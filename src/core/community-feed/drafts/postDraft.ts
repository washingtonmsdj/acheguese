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
 * O timestamp `updatedAt` registra a última gravação local. `savedAt` é
 * mantido apenas para compatibilidade com snapshots locais antigos.
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
  /** Timestamp (ms) da última atualização. */
  updatedAt: number;
  /** @deprecated usar updatedAt. Mantido para compat com snapshots antigos. */
  savedAt?: number;
}

export type PostDraftPayload = Omit<PostDraftSnapshot, "updatedAt" | "savedAt">;

function keyFor(profileId: string): string {
  return `${STORAGE_PREFIX}${profileId}`;
}

function cryptoScopeFor(profileId: string): string {
  return `post-draft:${profileId}`;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
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
    const now = Date.now();
    const payload: PostDraftSnapshot = {
      ...snapshot,
      updatedAt: now,
      savedAt: now,
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

    const parsed = JSON.parse(plaintext) as PostDraftSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.updatedAt && parsed.savedAt) parsed.updatedAt = parsed.savedAt;

    // Migração transparente: se o envelope original estava em texto puro,
    // reescreve criptografado.
    if (!isEncryptedEnvelope(raw)) {
      try {
        await persistEncrypted(profileId, parsed);
      } catch {
        // best-effort
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function writePostDraftSnapshot(
  profileId: string,
  snapshot: PostDraftSnapshot,
): Promise<void> {
  if (!isBrowser() || !profileId) return;
  try {
    await persistEncrypted(profileId, snapshot);
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
  // Chave AES pode ser descartada com o rascunho — próxima gravação gera nova.
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
