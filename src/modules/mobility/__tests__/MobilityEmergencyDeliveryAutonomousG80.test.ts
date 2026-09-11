import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function projectPath(relativePath: string): string {
  return path.resolve(process.cwd(), relativePath);
}

function readProjectFile(relativePath: string): string {
  return fs.readFileSync(projectPath(relativePath), "utf8");
}

const migration = readProjectFile(
  "supabase/migrations/20260911210000_autonomous_emergency_delivery_dispatcher_g80.sql",
);
const worker = readProjectFile(
  "supabase/functions/send-emergency-email/index.ts",
);
const config = readProjectFile("supabase/config.toml");
const preflight = readProjectFile(
  "tools/security/supabase-edge-secrets-preflight.mjs",
);
const authPolicy = JSON.parse(
  readProjectFile("docs/09-reference/governance/security/EDGE_FUNCTION_AUTH_POLICY.json"),
) as {
  noJwtAllowlist: Record<string, { kind: string; requiredPatterns: string[] }>;
  serviceRoleAllowlist: Record<
    string,
    { kind: string; risk: string; requiredPatterns: string[] }
  >;
};

describe("G80 autonomous emergency delivery outbox", () => {
  it("snapshots recipient data when the durable obligation is created", () => {
    expect(migration).toContain("'contact_name', contact.name");
    expect(migration).toContain("'pending'");
    expect(worker).toContain("extractEmail(claimed.target || '')");
    expect(worker).toContain("readQueuedContactName(claimed.metadata)");
    expect(worker).not.toContain(".from('emergency_contacts')");
  });

  it("recovers abandoned reversible claims without resetting bounded attempts", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.prepare_emergency_delivery_work",
    );
    expect(migration).toContain("delivery.status = 'processing'");
    expect(migration).toContain("INTERVAL '2 minutes'");
    expect(migration).toContain("SET status = 'pending'");
    expect(migration).not.toContain("attempt_count = 0");
    expect(migration).toContain("alert.status IN ('active', 'acknowledged')");
  });

  it("keeps pending gated by actionable alerts but recovers authorized dispatches independently", () => {
    const pendingPredicate = migration.indexOf("delivery.status = 'pending'");
    const dispatchingPredicate = migration.indexOf(
      "delivery.status = 'dispatching'",
      pendingPredicate,
    );
    const ordering = migration.indexOf("ORDER BY", dispatchingPredicate);

    expect(pendingPredicate).toBeGreaterThan(-1);
    expect(dispatchingPredicate).toBeGreaterThan(pendingPredicate);
    expect(ordering).toBeGreaterThan(dispatchingPredicate);

    const pendingBlock = migration.slice(pendingPredicate, dispatchingPredicate);
    const dispatchingBlock = migration.slice(dispatchingPredicate, ordering);

    expect(pendingBlock).toContain("alert.status IN ('active', 'acknowledged')");
    expect(dispatchingBlock).not.toContain("alert.status IN ('active', 'acknowledged')");
    expect(dispatchingBlock).toContain("INTERVAL '30 seconds'");
    expect(dispatchingBlock).toContain("INTERVAL '23 hours'");
  });

  it("schedules the canonical emergency broker instead of a parallel worker", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION private.invoke_emergency_delivery_worker",
    );
    expect(migration).toContain("'/functions/v1/send-emergency-email'");
    expect(migration).toContain("'x-cron-secret', v_cron_secret");
    expect(migration).toContain("'emergency-delivery-outbox-every-minute'");
    expect(migration).not.toContain(
      "'/functions/v1/process-emergency-delivery-outbox'",
    );

    expect(
      fs.existsSync(
        projectPath("supabase/functions/process-emergency-delivery-outbox/index.ts"),
      ),
    ).toBe(false);
    expect(
      fs.existsSync(
        projectPath("supabase/functions/send-emergency-email/deliveryExecutor.ts"),
      ),
    ).toBe(false);
  });

  it("fails closed between cron-secret and authenticated-user ingress", () => {
    expect(worker).toContain(
      "const cronRequested = req.headers.has('x-cron-secret')",
    );
    expect(worker).toContain("requireCronSecret(req, ALLOWED_METHODS)");
    expect(worker).toContain("requireAuthenticatedUser(req, supabase)");
    expect(worker).toContain("if (cronRequested)");
    expect(worker).toContain("} else {");

    const configBlock = config.slice(
      config.indexOf("[functions.send-emergency-email]"),
      config.indexOf("[functions.resend-emergency-webhook]"),
    );
    expect(configBlock).toContain("verify_jwt = false");
    expect(config).not.toContain("[functions.process-emergency-delivery-outbox]");
  });

  it("classifies and preflights the dual-auth broker explicitly", () => {
    const noJwt = authPolicy.noJwtAllowlist["send-emergency-email"];
    expect(noJwt?.kind).toBe("cron-secret");
    expect(noJwt?.requiredPatterns).toContain("requireCronSecret\\s*\\(");
    expect(noJwt?.requiredPatterns).toContain(
      "requireAuthenticatedUser\\s*\\(",
    );

    const serviceRole = authPolicy.serviceRoleAllowlist["send-emergency-email"];
    expect(serviceRole?.kind).toBe("notification-broker");
    expect(serviceRole?.risk).toBe("Critical");
    expect(serviceRole?.requiredPatterns).toContain("requireCronSecret\\s*\\(");
    expect(serviceRole?.requiredPatterns).toContain(
      "requireAuthenticatedUser\\s*\\(",
    );

    const secretBlock = preflight.match(
      /'send-emergency-email': Object\.freeze\(\[([\s\S]*?)\]\)/,
    )?.[1] ?? "";
    for (const secret of [
      "'CRON_SECRET'",
      "'ALLOWED_ORIGINS'",
      "'RESEND_API_KEY'",
      "'EMAIL_FROM_DOMAIN'",
      "'EMAIL_FROM_NAME'",
    ]) {
      expect(secretBlock).toContain(secret);
    }
  });
});
