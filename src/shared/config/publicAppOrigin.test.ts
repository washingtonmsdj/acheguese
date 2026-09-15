import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPublicAbsoluteUrl,
  getPublicAppOrigin,
} from "@/shared/config/publicAppOrigin";

function useBrowserOrigin(origin: string): void {
  vi.stubGlobal("window", {
    location: { origin },
  });
}

describe("public auth application origin", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "https://acheguese.com.br/");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("keeps localhost 5175 authoritative over the production env origin", () => {
    useBrowserOrigin("http://localhost:5175");

    expect(getPublicAppOrigin()).toBe("http://localhost:5175");
    expect(buildPublicAbsoluteUrl("/aceitar-termos")).toBe(
      "http://localhost:5175/aceitar-termos",
    );
  });

  it("supports the versioned 127.0.0.1:5175 auth origin", () => {
    useBrowserOrigin("http://127.0.0.1:5175");

    expect(getPublicAppOrigin()).toBe("http://127.0.0.1:5175");
    expect(buildPublicAbsoluteUrl("login?confirmed=1")).toBe(
      "http://127.0.0.1:5175/login?confirmed=1",
    );
  });

  it("does not let an arbitrary local dev port override the configured public origin", () => {
    useBrowserOrigin("http://localhost:5173");

    expect(getPublicAppOrigin()).toBe("https://acheguese.com.br");
    expect(buildPublicAbsoluteUrl("/aceitar-termos")).toBe(
      "https://acheguese.com.br/aceitar-termos",
    );
  });

  it("falls back to the browser origin when no public origin is configured", () => {
    vi.stubEnv("VITE_PUBLIC_SITE_URL", "");
    useBrowserOrigin("https://preview.example.test");

    expect(getPublicAppOrigin()).toBe("https://preview.example.test");
  });
});
