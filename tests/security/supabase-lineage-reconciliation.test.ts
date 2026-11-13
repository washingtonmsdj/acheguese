import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { verifyReconciliation } from "../../tools/ci/verify-supabase-lineage-reconciliation.mjs";

const ROOT = process.cwd();
const DIRECTORY = resolve(ROOT, "supabase", "migrations");
const manifest = JSON.parse(
  readFileSync(resolve(ROOT, "supabase", "migration-lineage-reconciliation.json"), "utf8"),
);

function versions(): string[] {
  return readdirSync(DIRECTORY)
    .map((name) => /^(\d{14})_.*\.sql$/.exec(name)?.[1] ?? null)
    .filter((value): value is string => Boolean(value))
    .sort();
}

function table(remoteVersions: Set<string>, extraLocal: string[] = []): string {
  const all = [...new Set([...versions(), ...extraLocal])].sort();
  return [
    "    LOCAL          │     REMOTE       │ TIME (UTC)",
    "──────────────────┼──────────────────┼────────────────",
    ...all.map((version) => {
      const local = versions().includes(version) || extraLocal.includes(version) ? version : "";
      const remote = remoteVersions.has(version) ? version : "";
      return ` ${local.padEnd(16)} │ ${remote.padEnd(16)} │ 2026-11-13`;
    }),
  ].join("\n");
}

describe("Supabase lineage reconciliation contract", () => {
  const all = versions();
  const repair = new Set<string>(manifest.repairAppliedVersions);
  const forward = new Set<string>(manifest.forwardPendingVersions);

  it("accepts the exact pre-repair state only", () => {
    const remote = new Set(all.filter((version) => !repair.has(version) && !forward.has(version)));
    const state = verifyReconciliation({
      output: table(remote),
      directory: DIRECTORY,
      manifest,
      phase: "before",
    });
    expect(state.ok).toBe(true);
    expect(state.localOnly).toEqual(
      [...new Set([...repair, ...forward])].sort(),
    );
    expect(state.remoteOnly).toEqual([]);
    expect(state.missingRemoteAliases).toEqual([]);
  });

  it("accepts only forward migrations after tracking repair", () => {
    const remote = new Set(all.filter((version) => !forward.has(version)));
    const state = verifyReconciliation({
      output: table(remote),
      directory: DIRECTORY,
      manifest,
      phase: "after-repair",
    });
    expect(state.ok).toBe(true);
    expect(state.localOnly).toEqual([...forward].sort());
  });

  it("accepts a fully synchronized ledger after the forward push", () => {
    const state = verifyReconciliation({
      output: table(new Set(all)),
      directory: DIRECTORY,
      manifest,
      phase: "after-push",
    });
    expect(state.ok).toBe(true);
    expect(state.localOnly).toEqual([]);
    expect(state.remoteOnly).toEqual([]);
  });

  it("preserves the duplicate historical remote execution as two tombstones", () => {
    const duplicateName = manifest.aliases.filter(
      (entry: { canonicalVersion: string }) => entry.canonicalVersion === "20260926011200",
    );
    expect(duplicateName).toHaveLength(2);
    expect(duplicateName.map((entry: { remoteVersion: string }) => entry.remoteVersion).sort())
      .toEqual(["20260926011402", "20260926012211"]);
  });

  it("rejects any unexpected pending migration before repair", () => {
    const remote = new Set(all.filter((version) => !repair.has(version) && !forward.has(version)));
    remote.delete("20261001054425");
    const state = verifyReconciliation({
      output: table(remote),
      directory: DIRECTORY,
      manifest,
      phase: "before",
    });
    expect(state.ok).toBe(false);
    expect(state.unexpectedLocalOnly).toContain("20261001054425");
  });

  it("requires every remote alias file to remain comment-only", () => {
    for (const entry of manifest.aliases) {
      const sql = readFileSync(resolve(DIRECTORY, entry.remoteTombstoneFile), "utf8");
      const executable = sql
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("--"));
      expect(executable, entry.remoteTombstoneFile).toEqual([]);
    }
  });
  it("keeps the production workflow on the exact non-destructive reconciliation path", () => {
    const workflow = readFileSync(
      resolve(ROOT, ".github/workflows/supabase-main-db-push.yml"),
      "utf8",
    );

    expect(workflow).toContain("verify-supabase-lineage-reconciliation.mjs");
    expect(workflow).toContain("migration repair @versions --status applied");
    expect(workflow).toContain("db push --linked --dry-run");
    expect(workflow).toContain("functions deploy profile-rpc");
    expect(workflow).toContain("profile-rpc must remain verify_jwt=true");
    expect(workflow).not.toContain("APPLY_5_LGPD_MIGRATIONS");
    expect(workflow).not.toContain("--include-all");
    expect(workflow).not.toContain("--status reverted");
    expect(workflow).not.toContain("db reset");
    expect(workflow).not.toContain("functions deploy privacy-rpc");
  });

});
