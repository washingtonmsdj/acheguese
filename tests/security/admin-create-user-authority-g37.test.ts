import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const read = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

describe("G37 admin user creation authority", () => {
  it("reuses the auth trigger profile instead of creating a second Profile", () => {
    const adminCreateUser = read("supabase/functions/admin-create-user/index.ts");
    const authTrigger = read(
      "supabase/migrations/20260420000000_fix_auth_triggers_schema_drift.sql",
    );
    const profileOwner = read(
      "supabase/migrations/20260909230042_broker_owned_profile_self_service_g36.sql",
    );

    expect(authTrigger).toContain("CREATE OR REPLACE FUNCTION handle_new_user()");
    expect(authTrigger).toContain("INSERT INTO profiles");
    expect(authTrigger).toContain("INSERT INTO user_roles");

    expect(adminCreateUser).toContain("supabaseAdmin.auth.admin.createUser");
    expect(adminCreateUser).toContain(".eq('profile_type', 'personal')");
    expect(adminCreateUser).toContain(".rpc('profile_rpc_update_owned_profile'");
    expect(adminCreateUser).toContain("p_actor_user_id: newUserId");
    expect(adminCreateUser).toContain("p_profile_id: triggerProfile.id");
    expect(adminCreateUser).toContain("if (role !== 'user')");
    expect(adminCreateUser).toContain("role_enum: role");
    expect(adminCreateUser).toContain("role,");
    expect(adminCreateUser).not.toContain("auth.admin.listUsers()");

    expect(adminCreateUser).not.toMatch(
      /\.from\(['"]profiles['"]\)[\s\S]{0,240}\.(?:insert|update|upsert|delete)\(/,
    );
    expect(adminCreateUser).not.toContain(".from('profiles').delete()");

    expect(profileOwner).toContain(
      "CREATE OR REPLACE FUNCTION public.profile_rpc_update_owned_profile",
    );
    expect(profileOwner).toContain("GRANT EXECUTE ON FUNCTION public.profile_rpc_update_owned_profile");
  });

  it("checks compromised passwords server-side before privileged auth creation", () => {
    const adminCreateUser = read("supabase/functions/admin-create-user/index.ts");
    const passwordCheck = read(
      "supabase/functions/_shared/compromisedPassword.ts",
    );

    const compromiseCheck = adminCreateUser.indexOf(
      "await checkCompromisedPassword(password)",
    );
    const authCreation = adminCreateUser.indexOf(
      "supabaseAdmin.auth.admin.createUser",
    );

    expect(compromiseCheck).toBeGreaterThan(-1);
    expect(authCreation).toBeGreaterThan(compromiseCheck);
    expect(adminCreateUser).toContain("PASSWORD_COMPROMISED");
    expect(adminCreateUser).toContain("PASSWORD_CHECK_UNAVAILABLE");
    expect(adminCreateUser).toContain("admin_create_user_compromised_password_blocked");
    expect(adminCreateUser).toContain("admin_create_user_password_check_unavailable");

    expect(passwordCheck).toContain("https://api.pwnedpasswords.com/range/");
    expect(passwordCheck).toContain("hash.slice(0, 5)");
    expect(passwordCheck).toContain("hash.slice(5)");
    expect(passwordCheck).toContain("'Add-Padding': 'true'");
    expect(passwordCheck).toContain("AbortController");
    expect(passwordCheck).toContain("HIBP_TIMEOUT_MS");
  });

  it("keeps rollback anchored on auth.users cascade ownership", () => {
    const adminCreateUser = read("supabase/functions/admin-create-user/index.ts");
    const foundation = read(
      "supabase/migrations/20260412000000_create_core_identity_business_foundation.sql",
    );

    expect(adminCreateUser).toContain("rollbackCreatedUser");
    expect(adminCreateUser).toContain("supabaseAdmin.auth.admin.deleteUser(userId)");
    expect(foundation).toMatch(
      /CREATE TABLE IF NOT EXISTS public\.profiles[\s\S]*?user_id UUID REFERENCES auth\.users\(id\) ON DELETE CASCADE/,
    );
    expect(foundation).toMatch(
      /CREATE TABLE IF NOT EXISTS public\.user_roles[\s\S]*?user_id UUID NOT NULL REFERENCES auth\.users\(id\) ON DELETE CASCADE/,
    );
  });
});
