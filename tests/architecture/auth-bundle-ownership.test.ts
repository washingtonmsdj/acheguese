import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const viteConfig = readFileSync(resolve(root, "vite.config.ts"), "utf8");

describe("auth bundle ownership", () => {
  it("keeps auth and session out of unrelated territorial shared chunks", () => {
    expect(viteConfig).toContain('normalizedId.includes("/src/core/auth/")');
    expect(viteConfig).toContain('return "app-auth-runtime"');
    expect(viteConfig).toContain('normalizedId.includes("/src/core/session/")');
    expect(viteConfig).toContain('return "app-session-runtime"');
    expect(viteConfig).toContain("getAppChunk(id) ?? getVendorChunk(id)");
  });

  it("normalizes Windows module ids before applying internal chunk ownership", () => {
    expect(viteConfig).toContain('id.replaceAll("\\\\", "/")');
  });
});
