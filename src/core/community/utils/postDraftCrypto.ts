/**
 * Criptografia dos rascunhos armazenados no localStorage.
 *
 * Estratégia:
 * - Cada perfil possui uma chave AES-GCM 256 bits, **não-extraível**, guardada
 *   em IndexedDB (`community-drafts` → store `keys`). O IndexedDB preserva
 *   objetos `CryptoKey` via structured clone, então a chave nunca é exposta
 *   como bytes ao JavaScript da página.
 * - O payload é serializado em JSON, criptografado com AES-GCM (IV aleatório
 *   de 12 bytes) e persistido no localStorage num envelope base64
 *   (`{v:1,iv,ct}`), o que impede leitura direta por quem acessa o disco
 *   ou faz backup do storage do navegador.
 * - Envelopes antigos em texto puro são detectados na leitura e migrados
 *   transparentemente para o formato criptografado.
 *
 * Limitações conhecidas: código malicioso rodando na mesma origem
 * (XSS) ainda consegue chamar `decrypt` — a proteção principal é contra
 * acesso ao disco / sincronização de storage / extensões que leem
 * `localStorage`, não contra XSS.
 */

const DB_NAME = "community-drafts";
const DB_VERSION = 1;
const KEY_STORE = "keys";
const ENVELOPE_VERSION = 1;

interface EncryptedEnvelope {
  v: number;
  iv: string; // base64
  ct: string; // base64
}

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof indexedDB !== "undefined" &&
    typeof crypto !== "undefined" &&
    !!crypto.subtle
  );
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(store: string, key: string): Promise<void> {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const keyCache = new Map<string, Promise<CryptoKey>>();

async function getOrCreateKey(scope: string): Promise<CryptoKey> {
  const cached = keyCache.get(scope);
  if (cached) return cached;
  const promise = (async () => {
    const existing = await idbGet<CryptoKey>(KEY_STORE, scope);
    if (existing) return existing;
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      /* extractable */ false,
      ["encrypt", "decrypt"],
    );
    await idbPut(KEY_STORE, scope, key);
    return key;
  })();
  keyCache.set(scope, promise);
  return promise;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

export function isEncryptedEnvelope(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as EncryptedEnvelope;
    return (
      !!parsed &&
      typeof parsed === "object" &&
      parsed.v === ENVELOPE_VERSION &&
      typeof parsed.iv === "string" &&
      typeof parsed.ct === "string"
    );
  } catch {
    return false;
  }
}

export function isCryptoAvailable(): boolean {
  return isBrowser();
}

export async function encryptString(scope: string, plaintext: string): Promise<string> {
  if (!isBrowser()) return plaintext;
  const key = await getOrCreateKey(scope);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const envelope: EncryptedEnvelope = {
    v: ENVELOPE_VERSION,
    iv: bytesToBase64(iv),
    ct: bytesToBase64(new Uint8Array(ct)),
  };
  return JSON.stringify(envelope);
}

export async function decryptString(scope: string, raw: string): Promise<string | null> {
  if (!isBrowser()) return raw;
  if (!isEncryptedEnvelope(raw)) return raw; // legado em texto puro
  try {
    const envelope = JSON.parse(raw) as EncryptedEnvelope;
    const key = await getOrCreateKey(scope);
    const iv = base64ToBytes(envelope.iv);
    const ct = base64ToBytes(envelope.ct);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

export async function purgeCryptoKey(scope: string): Promise<void> {
  keyCache.delete(scope);
  if (!isBrowser()) return;
  try {
    await idbDelete(KEY_STORE, scope);
  } catch {
    // no-op
  }
}
