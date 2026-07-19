import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { assertAuthorizedNonProductionTarget } from "../../scripts/lib/non-production-target.mjs";
import {
  createStorageObjectFile,
  readAndVerifyStorageBackup,
  STORAGE_BACKUP_SCHEMA_VERSION,
} from "../../scripts/lib/storage-recovery";
import {
  evaluateBackupReadiness,
  parseArguments as parseBackupReadinessArguments,
  parseSupabaseBackupListJson,
} from "../../scripts/supabase-backup-readiness.mjs";

const tempDirs: string[] = [];
const SOURCE_REF = "abcdefghijklmnopqrst";
const TARGET_REF = "tsrqponmlkjihgfedcba";

afterEach(() => {
  for (const directory of tempDirs.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

function createBackupFixture(
  options: { checksum?: string; path?: string } = {},
) {
  const directory = mkdtempSync(join(tmpdir(), "acheguese-storage-backup-"));
  tempDirs.push(directory);
  mkdirSync(join(directory, "objects"));

  const objectPath = options.path ?? "profiles/user/avatar.png";
  const bytes = Buffer.from("verified backup bytes", "utf8");
  const file = createStorageObjectFile("avatars", objectPath);
  const checksum = createHash("sha256").update(bytes).digest("hex");
  writeFileSync(join(directory, ...file.split("/")), bytes);
  writeFileSync(
    join(directory, "manifest.json"),
    JSON.stringify({
      buckets: [
        {
          allowedMimeTypes: ["image/png"],
          fileSizeLimit: 1024,
          id: "avatars",
          objects: [
            {
              contentType: "image/png",
              file,
              path: objectPath,
              sha256: options.checksum ?? checksum,
              size: bytes.length,
            },
          ],
          public: false,
        },
      ],
      createdAt: "2026-07-19T00:00:00.000Z",
      schemaVersion: STORAGE_BACKUP_SCHEMA_VERSION,
      source: {
        host: `${SOURCE_REF}.supabase.co`,
        projectRef: SOURCE_REF,
      },
      totals: { bytes: bytes.length, objects: 1 },
    }),
  );
  return directory;
}

describe("Supabase backup readiness", () => {
  it("parses JSON even when the CLI emits an update warning", () => {
    const payload = parseSupabaseBackupListJson(
      `CLI update available\n{"backups":[],"pitr_enabled":false,"walg_enabled":true}\n`,
    );
    expect(payload.backups).toEqual([]);
    expect(() => parseBackupReadinessArguments(["--project-ref"])).toThrow(
      /exige um valor/i,
    );
  });

  it("does not treat WAL-G alone as an accessible restore point", () => {
    expect(
      evaluateBackupReadiness(
        {
          backups: [],
          pitr_enabled: false,
          region: "us-west-2",
          walg_enabled: true,
        },
        SOURCE_REF,
        new Date("2026-07-19T00:00:00.000Z"),
      ),
    ).toMatchObject({ backupCount: 0, pitrEnabled: false, ready: false });
  });

  it("accepts only a recent completed backup or PITR", () => {
    expect(
      evaluateBackupReadiness(
        {
          backups: [
            {
              inserted_at: "2026-07-18T12:00:00Z",
              status: "COMPLETED",
            },
          ],
          pitr_enabled: false,
        },
        SOURCE_REF,
        new Date("2026-07-19T00:00:00.000Z"),
      ),
    ).toMatchObject({
      backupCount: 1,
      completedBackupCount: 1,
      latestBackupAt: "2026-07-18T12:00:00.000Z",
      ready: true,
    });
    expect(
      evaluateBackupReadiness({ backups: [], pitr_enabled: true }, SOURCE_REF),
    ).toMatchObject({ pitrEnabled: true, ready: true });
  });

  it("rejects failed and stale backups", () => {
    expect(
      evaluateBackupReadiness(
        {
          backups: [{ inserted_at: "2026-07-18T23:00:00Z", status: "FAILED" }],
          pitr_enabled: false,
        },
        SOURCE_REF,
        new Date("2026-07-19T00:00:00.000Z"),
      ),
    ).toMatchObject({ completedBackupCount: 0, ready: false });

    expect(
      evaluateBackupReadiness(
        {
          backups: [
            { inserted_at: "2026-07-17T00:00:00Z", status: "COMPLETED" },
          ],
          pitr_enabled: false,
        },
        SOURCE_REF,
        new Date("2026-07-19T00:00:00.000Z"),
      ),
    ).toMatchObject({ completedBackupCount: 1, ready: false });
  });
});

describe("Storage backup integrity", () => {
  it("verifies manifest, size and SHA-256 before restore", async () => {
    const manifest = await readAndVerifyStorageBackup(createBackupFixture());
    expect(manifest.totals).toEqual({ bytes: 21, objects: 1 });
  });

  it("fails closed when object bytes do not match the manifest", async () => {
    await expect(
      readAndVerifyStorageBackup(
        createBackupFixture({ checksum: "0".repeat(64) }),
      ),
    ).rejects.toThrow(/checksum invalido/i);
  });

  it("rejects a directory left incomplete by an interrupted export", async () => {
    const directory = createBackupFixture();
    writeFileSync(join(directory, "INCOMPLETE"), "in progress");
    await expect(readAndVerifyStorageBackup(directory)).rejects.toThrow(
      /marcado como incompleto/i,
    );
  });

  it("rejects unsafe object paths", async () => {
    await expect(
      readAndVerifyStorageBackup(
        createBackupFixture({ path: "../secret.txt" }),
      ),
    ).rejects.toThrow(/path de objeto inseguro/i);
  });

  it("rejects a manifest that remaps an object to another backup file", async () => {
    const directory = createBackupFixture();
    const manifestPath = join(directory, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.buckets[0].objects[0].file = `objects/${"f".repeat(64)}.bin`;
    writeFileSync(manifestPath, JSON.stringify(manifest));
    await expect(readAndVerifyStorageBackup(directory)).rejects.toThrow(
      /arquivo invalido ou duplicado/i,
    );
  });
});

describe("non-production restore target", () => {
  it("accepts only an exact confirmed Supabase project", () => {
    expect(
      assertAuthorizedNonProductionTarget({
        supabaseUrl: `https://${TARGET_REF}.supabase.co`,
        env: {
          OPERATIONAL_TEST_CONFIRM: "NON_PRODUCTION_REMOTE_CONFIRMED",
          OPERATIONAL_TEST_PROJECT_REF: TARGET_REF,
          OPERATIONAL_TEST_TARGET: "staging",
        },
      }),
    ).toMatchObject({ projectRef: TARGET_REF, target: "staging" });
  });

  it("rejects production and mismatched hosts", () => {
    expect(() =>
      assertAuthorizedNonProductionTarget({
        supabaseUrl: `https://${TARGET_REF}.supabase.co`,
        env: {
          OPERATIONAL_TEST_CONFIRM: "NON_PRODUCTION_REMOTE_CONFIRMED",
          OPERATIONAL_TEST_PROJECT_REF: TARGET_REF,
          OPERATIONAL_TEST_TARGET: "production",
        },
      }),
    ).toThrow(/development ou staging/i);

    expect(() =>
      assertAuthorizedNonProductionTarget({
        supabaseUrl: `https://${SOURCE_REF}.supabase.co`,
        env: {
          OPERATIONAL_TEST_CONFIRM: "NON_PRODUCTION_REMOTE_CONFIRMED",
          OPERATIONAL_TEST_PROJECT_REF: TARGET_REF,
          OPERATIONAL_TEST_TARGET: "development",
        },
      }),
    ).toThrow(/nao corresponde/i);
  });
});
