import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = readFileSync(
  resolve(
    root,
    "supabase/migrations/20260820000837_harden_admin_role_validity.sql",
  ),
  "utf8",
);
const adminAuth = readFileSync(
  resolve(root, "supabase/functions/_shared/adminAuth.ts"),
  "utf8",
);

describe("admin role validity contract", () => {
  it("hardens canonical private admin helpers", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.is_admin_from_roles",
    );
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.is_super_admin",
    );

    const adminHelper = migration.slice(
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION private.is_admin_from_roles",
      ),
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION private.is_super_admin",
      ),
    );
    const superAdminHelper = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION private.is_super_admin"),
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION public.has_role",
      ),
    );

    for (const helper of [adminHelper, superAdminHelper]) {
      expect(helper).toContain("ur.is_active = TRUE");
      expect(helper).toContain("ur.revoked_at IS NULL");
      expect(helper).toContain(
        "ur.expires_at IS NULL OR ur.expires_at > now()",
      );
      expect(helper).toContain("SECURITY DEFINER");
      expect(helper).toContain("SET search_path = public, pg_temp");
    }
  });

  it("hardens the generic service-role role helper too", () => {
    const hasRole = migration.slice(
      migration.indexOf("CREATE OR REPLACE FUNCTION public.has_role"),
      migration.indexOf(
        "CREATE OR REPLACE FUNCTION public.is_admin_from_roles",
      ),
    );

    expect(hasRole).toContain("ur.role_enum = _role");
    expect(hasRole).toContain("ur.is_active = TRUE");
    expect(hasRole).toContain("ur.revoked_at IS NULL");
    expect(hasRole).toContain(
      "ur.expires_at IS NULL OR ur.expires_at > now()",
    );
  });

  it("makes public admin wrappers delegate to the private SSOT", () => {
    expect(migration).toMatch(
      /FUNCTION public\.is_admin_from_roles[\s\S]*SELECT private\.is_admin_from_roles\(p_user_id\);/,
    );
    expect(migration).toMatch(
      /FUNCTION public\.is_admin_user[\s\S]*SELECT private\.is_admin_user\(p_user_id\);/,
    );
    expect(migration).toMatch(
      /FUNCTION public\.is_super_admin[\s\S]*SELECT private\.is_super_admin\(_user_id\);/,
    );
  });

  it("preserves private and public caller boundaries", () => {
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION private\.is_admin_from_roles\(UUID\)[\s\S]*TO anon, authenticated, service_role;/,
    );
    expect(migration).toMatch(
      /GRANT EXECUTE ON FUNCTION private\.is_super_admin\(UUID\)[\s\S]*TO authenticated, service_role;/,
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.is_admin_from_roles(UUID) TO service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO service_role;",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO service_role;",
    );
  });

  it("keeps Edge admin authorization aligned with active and unrevoked roles", () => {
    expect(adminAuth).toContain(".select('role_enum, expires_at')");
    expect(adminAuth).toContain(".eq('is_active', true)");
    expect(adminAuth).toContain(".is('revoked_at', null)");
  });

  it("rejects expired or malformed Edge admin role expirations", () => {
    expect(adminAuth).toContain("if (r.expires_at === null) return true");
    expect(adminAuth).toContain("Date.parse(r.expires_at)");
    expect(adminAuth).toContain("Number.isFinite(expiresAt)");
    expect(adminAuth).toContain("expiresAt > nowMs");
  });

  it("keeps admin and super_admin as the only project-admin roles", () => {
    expect(migration).toContain(
      "ur.role_enum IN ('admin'::public.app_role, 'super_admin'::public.app_role)",
    );
    expect(migration).toContain(
      "ur.role_enum = 'super_admin'::public.app_role",
    );
    expect(adminAuth).toContain(
      "r.role_enum === 'admin' || r.role_enum === 'super_admin'",
    );
  });
});
