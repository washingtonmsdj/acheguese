import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const script = readFileSync(
  resolve(root, "tools/release/supabase-edge-admin-canary-deploy.mjs"),
  "utf8",
);
const config = readFileSync(resolve(root, "supabase/config.toml"), "utf8");
const vercelBuild = readFileSync(
  resolve(root, "tools/release/run-vercel-production-build.mjs"),
  "utf8",
);

describe("Supabase Edge admin canary deploy guard", () => {
  it("allows only the two reconciled administrative canaries", () => {
    expect(script).toContain("'admin-list-users': Object.freeze({");
    expect(script).toContain("'admin-get-user': Object.freeze({");
    expect(script).toContain("<admin-list-users|admin-get-user>");
    expect(script).toContain("Funcao canario nao permitida");
    expect(script).not.toContain("'admin-create-user': Object.freeze({");
    expect(script).not.toContain("'admin-suspend-profile': Object.freeze({");
  });

  it("deploys source-derived code only from an exact clean Git revision", () => {
    expect(script).toContain("git', ['rev-parse', 'HEAD']");
    expect(script).toContain("status', '--porcelain', '--untracked-files=normal'");
    expect(script).toContain("Worktree sujo; deploy recusado");
    expect(script).toContain("--expected-sha e obrigatorio com --apply");
    expect(script).toContain("branch !== 'main'");
  });

  it("pins the target project to the versioned Supabase config", () => {
    expect(script).toContain("project_id ausente em supabase/config.toml");
    expect(script).toContain("difere do project_id versionado");
    expect(config).toContain('project_id = "xhdowzacfujckjelqhtd"');
  });

  it("keeps JWT verification fail-closed for both canaries", () => {
    expect(script).toContain("assertJwtConfig");
    expect(script).toContain("verifyJwt: true");
    expect(config).toMatch(
      /\[functions\.admin-list-users\][\s\S]*?verify_jwt\s*=\s*true/,
    );
    expect(config).toMatch(
      /\[functions\.admin-get-user\][\s\S]*?verify_jwt\s*=\s*true/,
    );
    expect(script).toContain("Nunca usa --prune nem --no-verify-jwt");
    expect(script).not.toMatch(/\['functions', 'deploy'[\s\S]*'--no-verify-jwt'/);
    expect(script).not.toMatch(/\['functions', 'deploy'[\s\S]*'--prune'/);
  });

  it("requires the reconciled list RPC and hardened shared adminAuth contracts", () => {
    expect(script).toContain("admin_list_user_account_contexts");
    expect(script).toContain("admin-list-users voltou a paginar profiles diretamente");
    expect(script).toContain(".select('role_enum, expires_at')");
    expect(script).toContain(".eq('is_active', true)");
    expect(script).toContain(".is('revoked_at', null)");
    expect(script).toContain("expiresAt > nowMs");
  });

  it("requires admin-get-user authentication, bounded input and current role display", () => {
    for (const marker of [
      "const auth = await requireAdmin(req);",
      "readJsonBody<GetUserBody>(req, {",
      "maxBytes: 4096",
      "validateBody<GetUserBody>(rawBody.data, getUserSchema)",
      ".auth.admin.getUserById(userId)",
      "function hasCurrentRoleValidity",
      "Date.parse(role.expires_at)",
      "Number.isFinite(expiresAtMs) && expiresAtMs > nowMs",
      ".filter((role) => hasCurrentRoleValidity(role, nowMs))",
    ]) {
      expect(script).toContain(marker);
    }
  });

  it("uses the official API-based single-function deploy path", () => {
    expect(script).toContain(
      "['functions', 'deploy', functionSlug, '--project-ref', projectRef, '--use-api']",
    );
    expect(script).toContain("SUPABASE_ACCESS_TOKEN: accessToken");
  });

  it("hashes the exact source bundles before any apply", () => {
    for (const path of [
      "supabase/functions/admin-list-users/index.ts",
      "supabase/functions/admin-get-user/index.ts",
      "supabase/functions/_shared/adminAuth.ts",
      "supabase/functions/_shared/security.ts",
      "supabase/functions/_shared/validation.ts",
    ]) {
      expect(script).toContain(path);
    }
    expect(script).toContain("createHash('sha256')");
    expect(script.indexOf("const bundle = hashBundle")).toBeLessThan(
      script.indexOf("deploy(options.functionSlug"),
    );
  });

  it("is check-only unless --apply is explicit", () => {
    expect(script).toContain("apply: false");
    expect(script).toContain("if (!options.apply)");
    expect(script).toContain("EDGE_ADMIN_CANARY_DEPLOY_CHECK_READY");
    expect(script).toContain("EDGE_ADMIN_CANARY_DEPLOY_APPLIED");
  });

  it("makes Vercel syntax-check the canonical deploy guard before every production build", () => {
    expect(vercelBuild).toContain(
      '["node", ["--check", "tools/release/supabase-edge-admin-canary-deploy.mjs"]]',
    );
  });
});
