import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  BrowserCookieStorage,
  StrictBrowserAuthStorage,
  createBrowserAuthStorage,
} from "@/integrations/supabase/cookieStorage";
import {
  AUTH_BROWSER_STORAGE_CONFIG,
  AUTH_STORAGE_KEY,
} from "@/config/security.config";

function clearCookies(): void {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; Path=/; Max-Age=0`;
    }
  });
}

function restoreCookieDescriptor(
  originalOwnCookie: PropertyDescriptor | undefined,
  originalProtoCookie: PropertyDescriptor | undefined,
): void {
  if (originalOwnCookie) {
    Object.defineProperty(document, "cookie", originalOwnCookie);
    return;
  }

  delete (document as { cookie?: string }).cookie;
  if (originalProtoCookie) {
    Object.defineProperty(Document.prototype, "cookie", originalProtoCookie);
  }
}

describe("BrowserCookieStorage", () => {
  let storage: BrowserCookieStorage;

  beforeEach(() => {
    clearCookies();
    localStorage.clear();
    storage = new BrowserCookieStorage("test");
  });

  afterEach(() => {
    clearCookies();
    localStorage.clear();
  });

  it("stores, reads, overwrites, and removes values", () => {
    storage.setItem("key1", "value1");
    expect(storage.getItem("key1")).toBe("value1");

    storage.setItem("key1", "value2");
    expect(storage.getItem("key1")).toBe("value2");

    storage.removeItem("key1");
    expect(storage.getItem("key1")).toBeNull();
  });

  it("preserves empty values, special characters, and JSON payloads", () => {
    storage.setItem("empty", "");
    expect(storage.getItem("empty")).toBe("");

    storage.setItem("marker-like", "chunked:2");
    expect(storage.getItem("marker-like")).toBe("chunked:2");

    const specialValue = "value with spaces & special=chars";
    storage.setItem("special", specialValue);
    expect(storage.getItem("special")).toBe(specialValue);

    const jsonValue = JSON.stringify({ token: "abc123", expires: 123456 });
    storage.setItem("json", jsonValue);
    expect(storage.getItem("json")).toBe(jsonValue);
  });

  it("isolates keys by prefix", () => {
    const storage1 = new BrowserCookieStorage("prefix1");
    const storage2 = new BrowserCookieStorage("prefix2");

    storage1.setItem("key", "value1");
    storage2.setItem("key", "value2");

    expect(storage1.getItem("key")).toBe("value1");
    expect(storage2.getItem("key")).toBe("value2");
  });

  it("chunks payloads that exceed a single cookie budget", () => {
    const largeValue = "x".repeat(AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunkSize + 128);

    storage.setItem("large-session", largeValue);

    expect(storage.getItem("large-session")).toBe(largeValue);
    expect(document.cookie).toContain("test-large-session");
    expect(document.cookie).toContain("test-large-session.0");
  });

  it("does not persist payloads above the configured cookie budget", () => {
    const oversizedValue = "x".repeat(
      AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunkSize *
        (AUTH_BROWSER_STORAGE_CONFIG.maxCookieChunks + 1),
    );

    storage.setItem("oversized-session", oversizedValue);

    expect(storage.getItem("oversized-session")).toBeNull();
  });
});

describe("StrictBrowserAuthStorage", () => {
  beforeEach(() => {
    clearCookies();
    localStorage.clear();
  });

  afterEach(() => {
    clearCookies();
    localStorage.clear();
  });

  it("uses cookie storage and never writes auth tokens to localStorage", () => {
    const storage = new StrictBrowserAuthStorage(new BrowserCookieStorage("test"));
    const session = JSON.stringify({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      expires_at: Date.now() + 3600000,
    });

    storage.setItem(AUTH_STORAGE_KEY, session);

    expect(storage.getItem(AUTH_STORAGE_KEY)).toBe(session);
    expect(document.cookie).toContain(`test-${AUTH_STORAGE_KEY}`);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("clears known legacy auth keys from localStorage", () => {
    for (const key of AUTH_BROWSER_STORAGE_CONFIG.legacyLocalStorageKeys) {
      localStorage.setItem(key, "legacy-session");
    }

    const storage = new StrictBrowserAuthStorage();
    storage.getItem(AUTH_STORAGE_KEY);

    for (const key of AUTH_BROWSER_STORAGE_CONFIG.legacyLocalStorageKeys) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });

  it("does not fall back to localStorage when cookies are unavailable", () => {
    const originalOwnCookie = Object.getOwnPropertyDescriptor(document, "cookie");
    const originalProtoCookie = Object.getOwnPropertyDescriptor(Document.prototype, "cookie");

    Object.defineProperty(document, "cookie", {
      get: () => "",
      set: () => {
        throw new Error("Cookies disabled");
      },
      configurable: true,
    });

    try {
      const storage = new StrictBrowserAuthStorage();
      storage.setItem(AUTH_STORAGE_KEY, "sensitive-session");

      expect(storage.getItem(AUTH_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    } finally {
      restoreCookieDescriptor(originalOwnCookie, originalProtoCookie);
    }
  });

  it("implements the Supabase SupportedStorage contract", () => {
    const storage = createBrowserAuthStorage();

    expect(typeof storage.getItem).toBe("function");
    expect(typeof storage.setItem).toBe("function");
    expect(typeof storage.removeItem).toBe("function");
  });
});
