import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(resolve(root, path), "utf8");
}

describe("admin rollout mutation broker", () => {
  const broker = read("supabase/functions/admin-rollout-rpc/index.ts");
  const repository = read(
    "src/core/rollout/repositories/RolloutRepositorySupabase.ts",
  );
  const config = read("supabase/config.toml");

  it("keeps rollout writes server-owned and admin-authorized", () => {
    expect(config).toContain("[functions.admin-rollout-rpc]");
    expect(config).toContain(
      "[functions.admin-rollout-rpc]\nverify_jwt = true",
    );

    expect(broker).toContain("requireAdmin(req, ALLOWED_METHODS)");
    expect(broker).toContain("getSupabaseAdminClient()");
    expect(broker).toContain('resource: "admin-rollout-rpc"');
    expect(broker).toContain("rateLimitMiddleware(");
    expect(broker).toContain('.from("module_rollouts")');
    expect(broker).toContain(".insert({");
    expect(broker).toContain(".update({");
    expect(broker).toContain(".delete()");
    expect(broker).toContain("created_by: actorUserId");
    expect(broker).toContain("updated_by: actorUserId");
  });

  it("validates rollout identity, lifecycle and bounded config before mutation", () => {
    for (const moduleKey of [
      "community",
      "business",
      "services",
      "mobility",
      "classifieds",
      "promotions",
      "gastronomy",
      "events",
      "jobs",
    ]) {
      expect(broker).toContain(`"${moduleKey}"`);
    }

    expect(broker).toContain('new Set(["active", "inactive"])');
    expect(broker).toContain("isValidUUID(value)");
    expect(broker).toContain("MAX_CONFIG_BYTES = 8_192");
    expect(broker).toContain("MAX_CONFIG_KEYS = 50");
    expect(broker).toContain('data.status !== "active"');
    expect(broker).toContain('throw new RequestValidationError("Location is not active")');
  });

  it("never grants browser mutation authority in the repository", () => {
    expect(repository).toContain('"admin-rollout-rpc"');
    expect(repository).toContain(
      'invokeSupabaseBroker<ModuleRolloutRow, "upsertRollout">',
    );
    expect(repository).toContain(
      'invokeSupabaseBrokerCommand<"deleteRollout">',
    );
    expect(repository).not.toContain(".upsert(");
    expect(repository).not.toContain(".delete()");
  });
});
