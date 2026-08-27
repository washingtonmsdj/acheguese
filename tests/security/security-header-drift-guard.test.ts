import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const FRONTEND_SECURITY = readFileSync(
  join(ROOT, "src/config/security.config.ts"),
  "utf8",
);
const EDGE_SECURITY = readFileSync(
  join(ROOT, "supabase/functions/_shared/security.ts"),
  "utf8",
);
const PROCESS_TIMEOUTS = readFileSync(
  join(ROOT, "supabase/functions/process-timeouts/index.ts"),
  "utf8",
);
const AUTO_DISPATCH_RIDE = readFileSync(
  join(ROOT, "supabase/functions/auto-dispatch-ride/index.ts"),
  "utf8",
);
const NOMINATIM_PROXY = readFileSync(
  join(ROOT, "supabase/functions/nominatim-proxy/index.ts"),
  "utf8",
);
const DRIFT_CONTRACT = JSON.parse(
  readFileSync(
    join(ROOT, "tools/security/security-header-drift-contract.json"),
    "utf8",
  ),
) as {
  allowedDivergences: Record<
    string,
    { frontend: string; edge: string; reason: string }
  >;
};

const COMMON_STATIC_HEADERS = [
  "X-Content-Type-Options",
  "X-Frame-Options",
  "X-XSS-Protection",
  "Strict-Transport-Security",
  "Referrer-Policy",
] as const;

const CRON_MUTATION_FUNCTIONS = [
  ["process-timeouts", PROCESS_TIMEOUTS],
  ["auto-dispatch-ride", AUTO_DISPATCH_RIDE],
] as const;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractStaticHeader(source: string, header: string): string {
  const match = source.match(
    new RegExp(`["']${escapeRegex(header)}["']\\s*:\\s*["']([^"']+)["']`),
  );
  if (!match?.[1]) {
    throw new Error(`Static header ${header} was not found`);
  }
  return match[1];
}

describe("SEC-009 security header drift guard", () => {
  it.each(COMMON_STATIC_HEADERS)(
    "keeps %s identical between the frontend SSOT and Edge shared security module",
    (header) => {
      expect(extractStaticHeader(EDGE_SECURITY, header)).toBe(
        extractStaticHeader(FRONTEND_SECURITY, header),
      );
    },
  );

  it("allows only the documented Permissions-Policy context difference", () => {
    expect(Object.keys(DRIFT_CONTRACT.allowedDivergences)).toEqual([
      "Permissions-Policy",
    ]);

    const permissions = DRIFT_CONTRACT.allowedDivergences["Permissions-Policy"];
    expect(permissions).toBeDefined();
    expect(extractStaticHeader(FRONTEND_SECURITY, "Permissions-Policy")).toBe(
      permissions.frontend,
    );
    expect(extractStaticHeader(EDGE_SECURITY, "Permissions-Policy")).toBe(
      permissions.edge,
    );
    expect(permissions.reason.length).toBeGreaterThan(40);
    expect(permissions.frontend).not.toBe(permissions.edge);
  });

  it.each(CRON_MUTATION_FUNCTIONS)(
    "%s remains fail-closed behind the shared cron security boundary",
    (_name, source) => {
      expect(source).toContain("../_shared/security.ts");
      expect(source).toContain("requireCronSecret");
      expect(source).toMatch(/requireCronSecret\s*\(\s*req/);
      expect(source).not.toMatch(/['\"]Access-Control-Allow-Origin['\"]\s*:\s*['\"]\*['\"]/);
      expect(source).not.toMatch(/CRON_SECRET\s*=\s*Deno\.env\.get\([^)]*\)\s*\|\|\s*['\"]['\"]/);
    },
  );

  it("keeps the public Nominatim proxy on shared security without wildcard CORS", () => {
    expect(NOMINATIM_PROXY).toContain("../_shared/security.ts");
    expect(NOMINATIM_PROXY).toContain("getAllSecurityHeaders");
    expect(NOMINATIM_PROXY).not.toMatch(
      /['\"]Access-Control-Allow-Origin['\"]\s*:\s*['\"]\*['\"]/,
    );
  });
});
