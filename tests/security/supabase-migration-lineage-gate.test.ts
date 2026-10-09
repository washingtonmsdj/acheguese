import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { describe, expect, it } from "vitest";

const validator = resolve(process.cwd(), "tools/ci/verify-supabase-migration-lineage.mjs");
const V1 = "20260821001800";
const V2 = "20261008215900";
const V3 = "20261008220000";

type TableEntry = { local?: string; remote?: string };

function runFixture(
  entries: TableEntry[],
  names: string[],
  expected: string,
  rawLines: string[] = [],
) {
  const root = mkdtempSync(join(tmpdir(), "acheguese-migrations-"));
  const migrations = join(root, "migrations");
  const list = join(root, "remote-list.txt");
  try {
    mkdirSync(migrations);
    for (const file of names) {
      writeFileSync(join(migrations, file), "-- sintético, sem conexão remota\n");
    }
    const table = [
      "    LOCAL          │     REMOTE       │ TIME (UTC)",
      "──────────────────┼──────────────────┼────────────────",
      ...entries.map(({ local, remote }) =>
        ` ${(local ?? "").padEnd(16)} │ ${(remote ?? "").padEnd(16)} │ 2026-10-08`),
      ...rawLines,
    ].join("\n");
    writeFileSync(list, table);
    return spawnSync(process.execPath, [
      validator,
      "--list", list,
      "--directory", migrations,
      "--expected", expected,
    ], { encoding: "utf8", timeout: 15_000 });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

describe("fail-closed Supabase production migration lineage", () => {
  it("accepts only an exact approved pending set and aligned remote history", () => {
    const result = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }, { local: V3 }],
      [
        `${V1}_already_applied.sql`,
        `${V2}_trusted_guard.sql`,
        `${V3}_public_projection.sql`,
      ],
      `${V2},${V3}`,
    );
    expect(result.status).toBe(0);
    const state = JSON.parse(result.stdout);
    expect(state.ok).toBe(true);
    expect(state.localOnly).toEqual([V2, V3]);
  });

  it("blocks remote-only history even if pending migrations are approved", () => {
    const ghost = "20260926005921";
    const result = runFixture(
      [{ local: V1, remote: V1 }, { remote: ghost }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("HISTÓRICO_SUPABASE_DIVERGENTE");
    expect(result.stdout).toContain(ghost);
  });

  it("blocks local-only migrations outside approved allowlist", () => {
    const unexpected = "20260921224500";
    const result = runFixture(
      [{ local: V1, remote: V1 }, { local: unexpected }, { local: V2 }],
      [`${V1}_applied.sql`, `${unexpected}_unreviewed.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(unexpected);
  });

  it("blocks a previously skipped migration older than the latest deployed remote version", () => {
    const result = runFixture(
      [{ local: V1 }, { local: V2, remote: V2 }, { local: V3, remote: V3 }],
      [`${V1}_old_unapplied.sql`, `${V2}_applied.sql`, `${V3}_applied.sql`],
      V1,
    );
    expect(result.status).toBe(1);
    const details = JSON.parse(result.stdout);
    expect(details.retroactivePending).toEqual([V1]);
    expect(details.latestRemoteVersion).toBe(V3);
    expect(result.stderr).toContain("HISTÓRICO_SUPABASE_DIVERGENTE");
  });

  it("blocks an approved migration batch with timestamps in the wrong order", () => {
    const result = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }, { local: V3 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`, `${V3}_pending.sql`],
      `${V3},${V2}`,
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Lista esperada de pendências inválida ou duplicada");
  });

  it("blocks a misleading approval when the referenced source file is absent", () => {
    const result = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V3,
    );
    expect(result.status).toBe(1);
    expect(result.stdout).toContain(V3);
  });

  it("rejects repeated versions even when set-based comparisons would collapse them", () => {
    const duplicatedLocal = runFixture(
      [{ local: V1, remote: V1 }, { local: V1, remote: V2 }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(duplicatedLocal.status).toBe(1);
    expect(duplicatedLocal.stdout).toContain('"duplicateLocalRows"');
    expect(duplicatedLocal.stdout).toContain(V1);

    const duplicatedRemote = runFixture(
      [{ local: V1, remote: V1 }, { remote: V1 }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(duplicatedRemote.status).toBe(1);
    const remoteState = JSON.parse(duplicatedRemote.stdout);
    expect(remoteState.duplicateRemoteRows).toEqual([V1]);
  });

  it("allows only fully synchronized history with explicit none after apply", () => {
    const done = runFixture(
      [{ local: V1, remote: V1 }, { local: V2, remote: V2 }],
      [`${V1}_old.sql`, `${V2}_new.sql`],
      "none",
    );
    expect(done.status).toBe(0);
    const state = JSON.parse(done.stdout);
    expect(state.ok).toBe(true);
    expect(state.localOnly).toEqual([]);
    expect(state.remoteOnly).toEqual([]);

    const partial = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }],
      [`${V1}_old.sql`, `${V2}_new.sql`],
      "none",
    );
    expect(partial.status).toBe(1);
    expect(JSON.parse(partial.stdout).unexpectedPending).toEqual([V2]);
  });

  it("rejects a version with trailing annotations instead of silently accepting its prefix", () => {
    const badLocal = runFixture(
      [{ local: V1, remote: V1 }, { local: `${V2} missing` }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(badLocal.status).toBe(1);
    expect(badLocal.stderr).toContain("Versão de migração malformada");

    const badRemote = runFixture(
      [{ local: V1, remote: V1 }, { remote: `${V3} duplicate?` }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(badRemote.status).toBe(1);
    expect(badRemote.stderr).toContain("Versão de migração malformada");
  });

  it("never drops a remote row with a truncated or nonnumeric version", () => {
    const shortenedRemote = runFixture(
      [{ local: V1, remote: V1 }, { remote: "2026092600592" }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(shortenedRemote.status).toBe(1);
    expect(shortenedRemote.stderr).toContain("Versão de migração malformada");

    const unreadableRemote = runFixture(
      [{ local: V1, remote: V1 }, { remote: "BROKEN_VERSION" }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
    );
    expect(unreadableRemote.status).toBe(1);
    expect(unreadableRemote.stderr).toContain("Versão de migração malformada");
  });

  it("refuses version-looking lines without table delimiters, even beside valid rows", () => {
    const result = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
      [`${V3}  incomplete migration CLI output`],
    );
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Linha sem delimitadores");
  });

  it("rejects an unparseable remote-only line after the migration header", () => {
    const corrupted = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`],
      V2,
      ["BROKEN_VERSION_MISSING_COLUMNS"],
    );
    expect(corrupted.status).toBe(1);
    expect(corrupted.stderr).toContain("Linha não reconhecida após cabeçalho");
  });

  it("rejects unversioned .sql files instead of silently omitting them from the audit", () => {
    const result = runFixture(
      [{ local: V1, remote: V1 }, { local: V2 }],
      [`${V1}_applied.sql`, `${V2}_pending.sql`, "unversioned.sql"],
      V2,
    );
    expect(result.status).toBe(1);
    const output = JSON.parse(result.stdout);
    expect(output.invalidSqlFiles).toEqual(["unversioned.sql"]);
  });

  it("blocks mixed local/remote versions on a row and unknown CLI formats", () => {
    const mixed = runFixture(
      [{ local: V1, remote: V2 }],
      [`${V1}_applied.sql`],
      V3,
    );
    expect(mixed.status).toBe(1);
    expect(mixed.stdout).toContain('"mispaired"');

    const empty = runFixture(
      [],
      [`${V1}_applied.sql`],
      V2,
    );
    expect(empty.status).toBe(1);
    expect(empty.stderr).toContain("Nenhuma linha de migração reconhecida");
  });
});
