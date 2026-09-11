import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const PREFLIGHT = join(
  ROOT,
  "tools",
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
const TERRITORY_AI = join(
  ROOT,
  "supabase",
  "functions",
  "territory-ai-content",
  "index.ts",
);
const CRON_FUNCTIONS = [
  "media-assets-cleanup",
  "process-emergency-delivery-outbox",
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

  it("keeps public VAPID configuration optional while requiring origin policy", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");
    const functionSource = readFileSync(PUSH_CONFIG, "utf8");
    const required = requiredEnvNames(functionSource);
    const block = preflight.match(
      /'get-push-config': Object\.freeze\(\[([\s\S]*?)\]\)/,
    )?.[1] ?? "";

    expect(required).toEqual([]);
    expect(functionSource).toContain("LEGACY_PUBLIC_VAPID_KEY");
    expect(block).toContain("'ALLOWED_ORIGINS'");
    expect(block).not.toContain("'VAPID_PUBLIC_KEY'");
  });

  it("keeps Nominatim public protocol overrides optional while requiring origin policy", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");
    const functionSource = readFileSync(NOMINATIM, "utf8");
    const required = requiredEnvNames(functionSource);
    const block = preflight.match(
      /'nominatim-proxy': Object\.freeze\(\[([\s\S]*?)\]\)/,
    )?.[1] ?? "";

    expect(required).toEqual([]);
    expect(functionSource).toContain("function envOrDefault(");
    expect(block).toContain("'ALLOWED_ORIGINS'");
    expect(block).not.toContain("'NOMINATIM_BASE_URL'");
    expect(block).not.toContain("'NOMINATIM_USER_AGENT'");
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

  it("blocks autonomous emergency dispatch unless provider secrets are present", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");
    const block = preflight.match(
      /'process-emergency-delivery-outbox': Object\.freeze\(\[([\s\S]*?)\]\)/,
    )?.[1] ?? "";

    for (const secret of [
      "'CRON_SECRET'",
      "'ALLOWED_ORIGINS'",
      "'RESEND_API_KEY'",
      "'EMAIL_FROM_DOMAIN'",
      "'EMAIL_FROM_NAME'",
    ]) {
      expect(block).toContain(secret);
    }
  });

  it("blocks territory AI rollout unless its provider key and origin policy are configured", () => {
    const preflight = readFileSync(PREFLIGHT, "utf8");
    const functionSource = readFileSync(TERRITORY_AI, "utf8");

    expect(functionSource).toContain('LOVABLE_API_KEY');
    expect(functionSource).toContain('isOriginAllowed');
    expect(functionSource).toContain('requireAdmin');

    const block = preflight.match(
      /'territory-ai-content': Object\.freeze\(\[([\s\S]*?)\]\)/,
    )?.[1] ?? "";
    expect(block).toContain("'LOVABLE_API_KEY'");
    expect(block).toContain("'ALLOWED_ORIGINS'");
  });

  it("fails closed when required configuration or CLI access is missing", () => {
    const source = readFileSync(PREFLIGHT, "utf8");

    expect(source).toContain("ready: missing.length === 0");
    expect(source).toContain("if (!status.ready) process.exitCode = 1");
    expect(source).toContain("EDGE_SECRETS_PREFLIGHT_BLOCKED");
    expect(source).toContain("Falha ao executar `supabase secrets list`");
  });
});
