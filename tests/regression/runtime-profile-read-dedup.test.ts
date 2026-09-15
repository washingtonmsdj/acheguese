import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("runtime profile read deduplication", () => {
  it("shares only concurrent accessible-profile reads for the same user", () => {
    const source = read(
      "src/core/profiles/services/multi-profile/runtimeProfileService.ts",
    );

    expect(source).toContain(
      "const inFlightProfileReads = new Map<string, Promise<Profile[]>>();",
    );
    expect(source).toContain("const existingRequest = inFlightProfileReads.get(userId);");
    expect(source).toContain("if (existingRequest) return existingRequest;");
    expect(source).toContain("inFlightProfileReads.set(userId, request);");
    expect(source).toContain(".finally(() => {");
    expect(source).toContain("inFlightProfileReads.delete(userId);");
    expect(source).toContain(
      "ProfileRpcService.getAccessibleProfiles<Profile[]>({",
    );
    expect(source).toContain("targetUserId: userId");
  });

  it("does not turn the in-flight owner into a stale result cache", () => {
    const source = read(
      "src/core/profiles/services/multi-profile/runtimeProfileService.ts",
    );

    expect(source).not.toContain("CACHE_TTL");
    expect(source).not.toContain("expiresAt");
    expect(source).not.toContain("setTimeout");
    expect(source).not.toContain("sessionStorage");
    expect(source).not.toContain("localStorage");
  });
});
