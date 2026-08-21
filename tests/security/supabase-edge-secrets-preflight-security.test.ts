import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PREFLIGHT = join(
  ROOT,
  "scripts",
  "security",
  "supabase-edge-secrets-preflight.mjs",
);
const PUSH_CONFIG = join(
  ROOT,
  "supabase",
  "functions",
  "get-push-config",
  "index.ts",
);
const NOMINATIM = join(
  ROOT,
  "supabase",
  "functions",
  "nominatim-proxy",
  "index.ts",
);
const CRON_FUNCTIONS = [
  "media-assets-cleanup",
  "process-timeouts",
  "auto-dispatch-ride",
] as const;

function requiredEnvNames(source: string): string[] {
  return [...source.matchAll(/getRequiredEnv\(['\"]([^'\"]+)['\"]\)/g)]
    .map((match) => match[1])
    .filter((name): name is string => Boolean(name));
}

describe("Supabase Edge secrets preflight", () => {
  it("delegates secret listing to the official CLI and never calls the raw secrets API", () => {
    const source = readFileSync(PREFLIGHT, "utf8");

    expect(source).toContain("execFileSync(");
    expect(source).toContain("'supabase'");
    expect(source).toContain("['secrets', 'list', '--project-ref', projectRef, '--output', 'json']");
    expect(source).toContain("SUPABASE_ACCESS_TOKEN: accessToken");
    expect(source).toContain("stdio: ['ignore', 'pipe', 'pipe']");
    expect(source).toContain("NAME + DIGEST");
    expect(source).not.toContain("api.supabase.com");
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toContain("entry.value");
    expect(source).not.toContain("error.stdout");
    expect(source).not.toContain("error.stderr");
    expect(source).not.toContain("shell:");
  });

  it("covers every explicit required env used by get-push-config", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");
    const functionSource = readFileSync(PUSH_CONFIG, "utf8");
    const required = requiredEnvNames(functionSource);

    expect(required).toContain("VAPID_PUBLIC_KEY");
    for (const name of required) {
      expect(preflight).toContain(`'${name}'`);
    }
    expect(preflight).toContain("'ALLOWED_ORIGINS'");
  });

  it("covers every explicit required env used by nominatim-proxy", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");
    const functionSource = readFileSync(NOMINATIM, "utf8");
    const required = requiredEnvNames(functionSource);

    expect(required.length).toBeGreaterThan(0);
    for (const name of required) {
      expect(preflight).toContain(`'${name}'`);
    }
    expect(preflight).toContain("'ALLOWED_ORIGINS'");
  });

  it("covers every verify-jwt-disabled cron mutation that requires CRON_SECRET", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");

    for (const slug of CRON_FUNCTIONS) {
      const functionSource = readFileSync(
        join(ROOT, "supabase", "functions", slug, "index.ts"),
        "utf8",
      );

      expect(functionSource).toContain("requireCronSecret");
      expect(preflight).toContain(`'${slug}': Object.freeze([`);

      const block = preflight.match(
        new RegExp(`'${slug}': Object\\.freeze\\(\\[([\\s\\S]*?)\\]\\)`),
      )?.[1] ?? "";
      expect(block).toContain("'CRON_SECRET'");
      expect(block).toContain("'ALLOWED_ORIGINS'");
    }
  });

  it("fails closed when required configuration or CLI access is missing", () => {
    const source = readFileSync(PREFLIGHT, "utf8");

    expect(source).toContain("ready: missing.length === 0");
    expect(source).toContain("if (!status.ready) process.exitCode = 1");
    expect(source).toContain("EDGE_SECRETS_PREFLIGHT_BLOCKED");
    expect(source).toContain("Falha ao executar `supabase secrets list`");
  });
});
