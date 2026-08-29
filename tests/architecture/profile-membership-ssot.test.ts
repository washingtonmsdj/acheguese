import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const SOURCE_FILE_RE = /\.(?:ts|tsx)$/;
const DIRECT_PROFILE_MEMBERS_RE =
  /\.from(?:<[^>]+>)?\s*\(\s*(["'])profile_members\1\s*\)/g;

const ALLOWED_DIRECT_PROFILE_MEMBER_OWNERS = [
  "src/core/admin/services/AdminProfileGovernanceLoaders.ts",
  "src/core/admin/services/AdminProfileGovernanceService.ts",
  "src/core/business/services/NetworkService.ts",
  "src/core/profiles/services/multi-profile/profileMembersService.ts",
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

describe("G4 profile membership SSOT", () => {
  it("keeps active manager authority aligned with the database contract", () => {
    const service = fs.readFileSync(
      path.join(
        ROOT,
        "src/core/profiles/services/multi-profile/profileMembersService.ts",
      ),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(
        ROOT,
        "supabase/migrations/20260825242500_require_active_profile_managers.sql",
      ),
      "utf8",
    );

    expect(service).toContain(".eq('is_active', true)");
    expect(service).toContain("role === 'owner' || role === 'admin'");
    expect(migration).toContain("AND pm.is_active = TRUE");
    expect(migration).toContain("AND pm.role IN ('owner', 'admin')");
  });

  it("keeps the legacy ProfileService membership helper one-way", () => {
    const adapter = fs.readFileSync(
      path.join(ROOT, "src/core/profiles/services/profile.membership.queries.ts"),
      "utf8",
    );

    expect(adapter).toContain("ProfileMembersService");
    expect(adapter).not.toMatch(DIRECT_PROFILE_MEMBERS_RE);
  });

  it("keeps business ownership delegated to the membership owner", () => {
    const ownership = fs.readFileSync(
      path.join(ROOT, "src/core/business/services/BusinessOwnershipService.ts"),
      "utf8",
    );

    expect(ownership).toContain("ProfileMembersService.isManager(ownerProfileId, userId)");
    expect(ownership).not.toMatch(DIRECT_PROFILE_MEMBERS_RE);
  });

  it("keeps jobs publishing permission delegated without hiding query failures", () => {
    const vagas = fs.readFileSync(
      path.join(
        ROOT,
        "src/core/classifieds/jobs/services/VagasPublishPermissionService.ts",
      ),
      "utf8",
    );

    expect(vagas).toContain("ProfileMembersService.getActiveRoleResult(");
    expect(vagas).toContain('return this.denied("UNKNOWN", isAdmin)');
    expect(vagas).not.toMatch(DIRECT_PROFILE_MEMBERS_RE);
  });

  it("tracks every remaining direct profile_members runtime owner explicitly", () => {
    const owners = new Set<string>();

    for (const filePath of walk(SRC)) {
      const source = fs.readFileSync(filePath, "utf8");
      DIRECT_PROFILE_MEMBERS_RE.lastIndex = 0;
      if (DIRECT_PROFILE_MEMBERS_RE.test(source)) {
        owners.add(normalize(path.relative(ROOT, filePath)));
      }
    }

    expect([...owners].sort()).toEqual(
      [...ALLOWED_DIRECT_PROFILE_MEMBER_OWNERS].sort(),
    );
  });
});
