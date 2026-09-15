import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

const routedRuntime = read("src/app/components/RoutedAppRuntime.tsx");
const callback = read("src/core/auth/utils/authCallback.ts");

describe("routed auth callback boundary", () => {
  it("reuses the canonical callback classifier instead of treating every hash as auth", () => {
    expect(routedRuntime).toContain(
      'import { hasAuthCallbackMarker } from "@/core/auth/utils/authCallback";',
    );
    expect(routedRuntime).toContain("hasAuthCallbackMarker(");
    expect(routedRuntime).toContain("location.search");
    expect(routedRuntime).toContain("location.hash");
    expect(routedRuntime).not.toContain("location.hash.length > 1");
    expect(routedRuntime).not.toContain('searchParams.get("mode") === "recovery"');
  });

  it("keeps ordinary account anchors outside the auth callback contract", () => {
    expect(callback).toContain("export function hasAuthCallbackMarker");
    expect(callback).toContain("getAuthCallbackError(search, hash) !== null");
    expect(callback).not.toContain('hash === "#acesso"');
    expect(callback).not.toContain('hash === "#senha"');
    expect(callback).not.toContain('hash === "#mfa"');
  });
});
