import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (relativePath: string) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

describe("profile session identity boundary", () => {
  it("uses the lightweight session user id for profile read/editor hooks", () => {
    for (const relativePath of [
      "src/core/profiles/hooks/usePrivateProfileWorkspace.ts",
      "src/core/profiles/hooks/useProfileEditor.ts",
    ]) {
      const source = read(relativePath);
      expect(source).toContain("useSessionUserId");
      expect(source).not.toContain("useAuth");
      expect(source).not.toContain("SessionState");
      expect(source).not.toContain("AuthService");
    }
  });

  it("does not reintroduce callers of the obsolete MultiProfileService.getMyProfiles facade", () => {
    const srcRoot = path.join(ROOT, "src");
    const offenders: string[] = [];

    const walk = (directory: string) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          walk(absolutePath);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name)) continue;
        if (
          fs
            .readFileSync(absolutePath, "utf8")
            .includes("MultiProfileService.getMyProfiles")
        ) {
          offenders.push(path.relative(ROOT, absolutePath));
        }
      }
    };

    walk(srcRoot);
    expect(offenders).toEqual([]);
  });
});
