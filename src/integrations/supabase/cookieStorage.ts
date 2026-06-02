/**
 * Browser auth storage for Supabase.
 *
 * This module intentionally does not claim HttpOnly protection. A Vite SPA can
 * only write browser-readable cookies; true HttpOnly auth requires a server-side
 * auth boundary. Within the SPA constraint, auth persistence is cookie-only,
 * SameSite=Strict, Secure on HTTPS, chunked for Supabase payload size, and never
 * falls back to localStorage.
 */
import type { SupportedStorage } from "@supabase/supabase-js";

import {
  AUTH_BROWSER_STORAGE_CONFIG,
  AUTH_COOKIE_PREFIX,
  SECURE_COOKIE_CONFIG,
} from "@/config/security.config";

const COOKIE_OPTIONS = SECURE_COOKIE_CONFIG;
const CHUNK_METADATA_SUFFIX = ".chunks";

function devDebug(message: string, context?: unknown): void {
  if (import.meta.env.DEV) {
    console.debug(message, context);
  }
}

function devWarn(message: string, context?: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(message, context);
  }
}

function getChunkCookieName(cookieName: string, index: number): string {
  return `${cookieName}.${index}`;
}

function getChunkMetadataCookieName(cookieName: string): string {
  return `${cookieName}${CHUNK_METADATA_SUFFIX}`;
}

function isBrowserDocumentAvailable(): boolean {
  return typeof document !== "undefined";
}

function isBrowserWindowAvailable(): boolean {
  return typeof window !== "undefined";
}

function getLegacyStorage(): Storage | null {
  if (!isBrowserWindowAvailable()) return null;

  try {
    const storage = window.localStorage;
    const testKey = AUTH_BROWSER_STORAGE_CONFIG.localStorageProbeKey;
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function clearLegacyLocalAuthStorage(additionalKey?: string): void {
  const storage = getLegacyStorage();
  if (!storage) return;

  const keysToRemove = new Set<string>(AUTH_BROWSER_STORAGE_CONFIG.legacyLocalStorageKeys);
  if (additionalKey) keysToRemove.add(additionalKey);

  for (const key of keysToRemove) {
    try {
      storage.removeItem(key);
    } catch {
      devWarn("[AuthStorage] Failed to remove legacy localStorage key", { key });
    }
  }
}

function splitByEncodedLength(value: string): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const char of value) {
    const next = current + char;
    if (
      current.length > 0 &&
      encodeURIComponent(next).length > AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunkSize
    ) {
      chunks.push(current);
      current = char;
      continue;
    }

    current = next;
  }

  if (current.length > 0 || value.length === 0) {
    chunks.push(current);
  }

  return chunks;
}

class CookieManager {
  static set(name: string, value: string, options = COOKIE_OPTIONS): boolean {
    if (!isBrowserDocumentAvailable()) return false;

    const cookieParts = [
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      `Path=${options.path}`,
      `SameSite=${options.sameSite}`,
      `Max-Age=${options.maxAge}`,
    ];

    if (options.secure && isBrowserWindowAvailable() && window.location.protocol === "https:") {
      cookieParts.push("Secure");
    }

    try {
      document.cookie = cookieParts.join("; "); // SAFE: Supabase auth storage writes hardened SameSite cookies only.
      return CookieManager.get(name) === value;
    } catch {
      return false;
    }
  }

  static get(name: string): string | null {
    if (!isBrowserDocumentAvailable()) return null;

    const encodedName = encodeURIComponent(name);
    const cookies = document.cookie.split(";"); // SAFE: Reads the hardened Supabase auth cookie jar.

    for (const cookie of cookies) {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex < 0) continue;

      const cookieName = cookie.slice(0, separatorIndex).trim();
      if (cookieName !== encodedName) continue;

      const cookieValue = cookie.slice(separatorIndex + 1);
      return decodeURIComponent(cookieValue);
    }

    return null;
  }

  static remove(name: string, options = COOKIE_OPTIONS): void {
    if (!isBrowserDocumentAvailable()) return;

    try {
      document.cookie = `${encodeURIComponent(name)}=; Path=${options.path}; Max-Age=0`; // SAFE: Clears only named Supabase auth cookies.
    } catch {
      // Cookie deletion should be idempotent. A disabled cookie jar is handled
      // by the caller without falling back to another token store.
    }
  }

  static isEnabled(): boolean {
    const testKey = AUTH_BROWSER_STORAGE_CONFIG.cookieProbeKey;
    const written = CookieManager.set(testKey, testKey, {
      ...COOKIE_OPTIONS,
      maxAge: AUTH_BROWSER_STORAGE_CONFIG.cookieProbeMaxAgeSeconds,
    });
    CookieManager.remove(testKey);
    return written;
  }
}

export class BrowserCookieStorage implements SupportedStorage {
  private readonly prefix: string;

  constructor(prefix = AUTH_COOKIE_PREFIX) {
    this.prefix = prefix;
  }

  getItem(key: string): string | null {
    const cookieName = this.getCookieName(key);
    const chunkMetadata = CookieManager.get(getChunkMetadataCookieName(cookieName));
    if (chunkMetadata === null) {
      return CookieManager.get(cookieName);
    }

    const chunkCount = Number(chunkMetadata);
    if (!Number.isInteger(chunkCount) || chunkCount <= 0) {
      this.removeItem(key);
      return null;
    }

    const chunks: string[] = [];
    for (let index = 0; index < chunkCount; index += 1) {
      const chunk = CookieManager.get(getChunkCookieName(cookieName, index));
      if (chunk === null) {
        this.removeItem(key);
        return null;
      }
      chunks.push(chunk);
    }

    return chunks.join("");
  }

  setItem(key: string, value: string): void {
    const cookieName = this.getCookieName(key);
    this.removeItem(key);

    const chunks = splitByEncodedLength(value);
    if (chunks.length > AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunks) {
      devWarn("[AuthStorage] Supabase session exceeds cookie storage budget", {
        key,
        chunks: chunks.length,
        maxChunks: AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunks,
      });
      return;
    }

    if (chunks.length === 1) {
      CookieManager.remove(getChunkMetadataCookieName(cookieName));
      if (!CookieManager.set(cookieName, value)) {
        devWarn("[AuthStorage] Failed to persist Supabase session cookie", { key });
      }
      return;
    }

    CookieManager.remove(cookieName);
    if (!CookieManager.set(getChunkMetadataCookieName(cookieName), String(chunks.length))) {
      devWarn("[AuthStorage] Failed to persist Supabase session chunk metadata", { key });
      return;
    }

    const failedChunkIndex = chunks.findIndex(
      (chunk, index) => !CookieManager.set(getChunkCookieName(cookieName, index), chunk),
    );

    if (failedChunkIndex >= 0) {
      this.removeItem(key);
      devWarn("[AuthStorage] Failed to persist Supabase session chunk", {
        key,
        failedChunkIndex,
      });
    }
  }

  removeItem(key: string): void {
    const cookieName = this.getCookieName(key);
    CookieManager.remove(cookieName);
    CookieManager.remove(getChunkMetadataCookieName(cookieName));

    for (let index = 0; index < AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunks; index += 1) {
      CookieManager.remove(getChunkCookieName(cookieName, index));
    }
  }

  private getCookieName(key: string): string {
    return `${this.prefix}-${key}`;
  }
}

export class StrictBrowserAuthStorage implements SupportedStorage {
  private readonly cookieStorage: BrowserCookieStorage;

  constructor(cookieStorage = new BrowserCookieStorage()) {
    this.cookieStorage = cookieStorage;
    clearLegacyLocalAuthStorage();

    devDebug("[AuthStorage] Initialized cookie-only Supabase auth storage", {
      cookiesAvailable: CookieManager.isEnabled(),
      localStorageFallback: false,
    });
  }

  getItem(key: string): string | null {
    clearLegacyLocalAuthStorage(key);
    return this.cookieStorage.getItem(key);
  }

  setItem(key: string, value: string): void {
    clearLegacyLocalAuthStorage(key);
    this.cookieStorage.setItem(key, value);
  }

  removeItem(key: string): void {
    this.cookieStorage.removeItem(key);
    clearLegacyLocalAuthStorage(key);
  }
}

export function createBrowserAuthStorage(): SupportedStorage {
  return new StrictBrowserAuthStorage();
}
