import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(__dirname, "../..");

function read(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

describe("admin profile mutation authority", () => {
  it("does not retain the retired generic browser profile writer", () => {
    const adminUserService = read("src/core/admin/services/AdminUserService.ts");
    const adminDataService = read("src/core/admin/services/AdminDataService.ts");

    expect(adminUserService).not.toContain("static async updateProfile(");
    expect(adminUserService).not.toMatch(
      /\.from\(\s*["']profiles["']\s*\)[\s\S]{0,220}\.update\(/,
    );
    expect(adminDataService).not.toContain("AdminUserService.updateProfile");
    expect(adminDataService).not.toContain("static async updateUserData(");
  });

  it("keeps live admin profile actions on their dedicated authorities", () => {
    const adminUserService = read("src/core/admin/services/AdminUserService.ts");

    expect(adminUserService).toContain('"admin-suspend-profile"');
    expect(adminUserService).toContain("VerificationAdminService.verifyProfile");
    expect(adminUserService).toContain("adminRolesService.grantRole");
    expect(adminUserService).toContain("adminRolesService.revokeRole");
  });
});
