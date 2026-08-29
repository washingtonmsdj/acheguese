import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SOURCE_FILE_RE = /\.(?:ts|tsx)$/;
const DIRECT_AUTH_READ_RE = /supabase\.auth\.(getSession|getUser|onAuthStateChange)\s*\(/g;

const ALLOWED_DIRECT_AUTH_READS = new Map<string, readonly string[]>([
  [
    "src/core/session/services/SessionService.ts",
    ["getSession", "onAuthStateChange"],
  ],
  [
    "src/integrations/supabase/supabase.ts",
    ["getSession"],
  ],
]);

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && SOURCE_FILE_RE.test(entry.name)) files.push(fullPath);
  }
  return files;
}

describe("G4 Auth/session authority", () => {
  it("keeps direct Supabase auth reads inside explicit canonical owners", () => {
    const violations: string[] = [];

    for (const filePath of walk(SRC)) {
      const relativePath = normalize(path.relative(ROOT, filePath));
      const source = fs.readFileSync(filePath, "utf8");
      const allowedMethods = new Set(ALLOWED_DIRECT_AUTH_READS.get(relativePath) ?? []);

      DIRECT_AUTH_READ_RE.lastIndex = 0;
      for (const match of source.matchAll(DIRECT_AUTH_READ_RE)) {
        const method = match[1];
        if (!allowedMethods.has(method)) {
          violations.push(`${relativePath}: supabase.auth.${method}()`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("keeps direct-auth allowlist entries live and narrow", () => {
    for (const [relativePath, methods] of ALLOWED_DIRECT_AUTH_READS) {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      for (const method of methods) {
        expect(source).toContain(`supabase.auth.${method}(`);
      }
    }
  });

  it("keeps privacy access-token reads delegated to the session owner", () => {
    const privacy = fs.readFileSync(
      path.join(ROOT, "src/core/privacy/services/PrivacySettingsService.ts"),
      "utf8",
    );

    expect(privacy).toContain("SessionService.getAccessToken()");
    expect(privacy).not.toContain("supabase.auth.getSession(");
  });

  it("keeps session-security auth reads delegated to SessionService", () => {
    const sessionSecurity = fs.readFileSync(
      path.join(ROOT, "src/core/session/services/SessionSecurityService.ts"),
      "utf8",
    );

    expect(sessionSecurity).toContain("SessionService.getCurrentUser()");
    expect(sessionSecurity).toContain("SessionService.getAccessToken()");
    expect(sessionSecurity).not.toContain("supabase.auth.getUser(");
    expect(sessionSecurity).not.toContain("supabase.auth.getSession(");
  });
});
