import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("profile links failure semantics", () => {
  it("keeps private profile-link read failures distinct from a valid empty list", () => {
    const service = read(
      "src/core/profiles/services/multi-profile/profileLinksService.ts",
    );
    const hook = read("src/core/profiles/hooks/useProfileLinks.ts");
    const manager = read(
      "src/core/profiles/components/ProfileLinksManager.tsx",
    );

    const privateReadStart = service.indexOf("static async getProfileLinks");
    const publicReadStart = service.indexOf("static async getPublicProfileLinks");
    const privateRead = service.slice(privateReadStart, publicReadStart);

    expect(privateRead).toContain("if (error) throw error;");
    expect(privateRead).not.toContain("return [];");
    expect(privateRead).not.toContain("catch (");

    expect(hook).toContain("catch (error: unknown)");
    expect(hook).toContain("setError(getErrorMessage(error, 'Failed to load links'))");

    expect(manager).toContain("error && links.length === 0");
    expect(manager).toContain("Não foi possível carregar os vínculos.");
    expect(manager).toContain("onClick={() => void refetch()}");
    expect(manager).not.toContain("useProfiles");
  });

  it("does not report reorder success when a Supabase update resolves with an error", () => {
    const service = read(
      "src/core/profiles/services/multi-profile/profileLinksService.ts",
    );

    expect(service).toContain("const results = await Promise.all(updates);");
    expect(service).toContain(
      "const failed = results.find((result) => result.error);",
    );
    expect(service).toContain("if (failed?.error) throw failed.error;");
  });
});
