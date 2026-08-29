import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SOURCE_FILE_RE = /\.(?:ts|tsx)$/;
const ADMIN_ROLE_SERVICE_IMPORT_RE =
  /from\s+["']@\/core\/admin\/services\/AdminRolesService["']/;
const DIRECT_USER_ROLES_RE =
  /\.from(?:<[^>]+>)?\s*\(\s*(["'])user_roles\1\s*\)/g;

const RUNTIME_ROLE_CONSUMERS = [
  "src/core/auth/hooks/useIsAdmin.ts",
  "src/core/community/access/useCommunityAccess.ts",
  "src/core/landing/services/landing.queries.ts",
  "src/core/profiles/services/profile.context.aggregate.ts",
  "src/core/profiles/services/ProfileService.ts",
] as const;

const DIRECT_USER_ROLE_OWNERS = [
  "src/core/admin/services/AdminRolesService.ts",
] as const;

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

describe("G4 global role SSOT", () => {
  it("keeps RoleService broker-only and aligned with the canonical role authority", () => {
    const roleService = fs.readFileSync(
      path.join(ROOT, "src/core/authorization/services/RoleService.ts"),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(
        ROOT,
        "supabase/migrations/20260825123100_fix_global_admin_authority_source.sql",
      ),
      "utf8",
    );

    expect(roleService).toContain("RoleRpcService.getUserRoles(userId)");
    expect(roleService).toContain("RoleRpcService.isAdmin(userId)");
    expect(roleService).not.toMatch(ADMIN_ROLE_SERVICE_IMPORT_RE);
    expect(migration).toContain("Platform-wide admin authority is canonically stored in public.user_roles");
    expect(migration).toContain("private.is_admin_from_roles/user_roles");
  });

  it.each(RUNTIME_ROLE_CONSUMERS)(
    "%s delegates runtime role decisions to RoleService",
    (relativePath) => {
      const source = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      expect(source).toContain("RoleService");
      expect(source).not.toMatch(ADMIN_ROLE_SERVICE_IMPORT_RE);
    },
  );

  it("keeps the administrative role adapter out of non-admin runtime code", () => {
    const bypasses = new Set<string>();

    for (const filePath of walk(SRC)) {
      const relativePath = normalize(path.relative(ROOT, filePath));
      if (relativePath.startsWith("src/core/admin/")) continue;
      if (relativePath.startsWith("src/modules/admin/")) continue;

      const source = fs.readFileSync(filePath, "utf8");
      if (ADMIN_ROLE_SERVICE_IMPORT_RE.test(source)) bypasses.add(relativePath);
    }

    expect([...bypasses]).toEqual([]);
  });

  it("keeps direct user_roles persistence access in one frontend owner", () => {
    const owners = new Set<string>();

    for (const filePath of walk(SRC)) {
      const source = fs.readFileSync(filePath, "utf8");
      DIRECT_USER_ROLES_RE.lastIndex = 0;
      if (DIRECT_USER_ROLES_RE.test(source)) {
        owners.add(normalize(path.relative(ROOT, filePath)));
      }
    }

    expect([...owners].sort()).toEqual([...DIRECT_USER_ROLE_OWNERS].sort());
  });
});
