import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const viteConfig = readFileSync(resolve(root, "vite.config.ts"), "utf8");

describe("auth bundle ownership", () => {
  it("leaves internal auth/session chunk topology to Rollup", () => {
    expect(viteConfig).toContain("return getVendorChunk(id);");
    expect(viteConfig).not.toContain('return "app-auth-runtime"');
    expect(viteConfig).not.toContain('return "app-session-runtime"');
    expect(viteConfig).not.toContain('normalizedId.includes("/src/core/auth/")');
    expect(viteConfig).not.toContain('normalizedId.includes("/src/core/session/")');
  });

  it("keeps explicit manual chunks limited to external vendor boundaries", () => {
    expect(viteConfig).toContain("function getVendorChunk(id: string)");
    expect(viteConfig).toContain('id.includes("node_modules")');
    expect(viteConfig).toContain("manualChunks: (id) => getManualChunk(id)");
    expect(viteConfig).toContain(
      "Internal application modules must stay under Rollup's graph ownership.",
    );
  });
});
