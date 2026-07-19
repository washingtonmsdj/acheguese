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
import { requiresRestorableBackup } from "../../scripts/manage-private-alpha-access.mjs";
import {
  evaluateResendEmailReadiness,
  evaluateSupabaseAuthEmailReadiness,
} from "../../scripts/private-alpha-email-readiness.mjs";
import { auditSupabaseAuthReadiness } from "../../scripts/supabase-auth-readiness.mjs";
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
  it("blocks only operations that can admit new alpha identities", () => {
    expect(requiresRestorableBackup("invite")).toBe(true);
    expect(requiresRestorableBackup("resume")).toBe(true);
    expect(requiresRestorableBackup("pause")).toBe(false);
    expect(requiresRestorableBackup("revoke")).toBe(false);
    expect(requiresRestorableBackup("status")).toBe(false);
  });

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

describe("Supabase Auth readiness", () => {
  it("accepts paginated permanent identities and anonymous users", async () => {
    const pages = [
      {
        data: {
          total: 5,
          users: [
            { id: "account-1", identities: [{}], is_anonymous: false },
            { id: "account-2", identities: [], is_anonymous: true },
            { id: "account-3", is_anonymous: false },
            { id: "account-4", identities: null, is_anonymous: false },
          ],
        },
        error: null,
      },
      {
        data: {
          total: 5,
          users: [{ id: "account-5", identities: [{}], is_anonymous: false }],
        },
        error: null,
      },
    ];
    const admin = {
      auth: {
        admin: {
          listUsers: async () => pages.shift() ?? { data: { users: [] } },
        },
      },
    };

    await expect(
      auditSupabaseAuthReadiness(admin, { pageSize: 4 }),
    ).resolves.toMatchObject({
      checkedUsers: 5,
      permanentUsersWithoutIdentity: 0,
      ready: true,
      reportedTotal: 5,
    });
  });

  it("fails closed without copying API errors or identity values", async () => {
    const apiFailure = {
      auth: {
        admin: {
          listUsers: async () => ({
            data: null,
            error: { message: "sensitive upstream diagnostic" },
          }),
        },
      },
    };
    const status = await auditSupabaseAuthReadiness(apiFailure);

    expect(status).toMatchObject({
      checkedUsers: 0,
      failedPage: 1,
      failureCode: "auth_admin_list_failed",
      ready: false,
    });
    expect(JSON.stringify(status)).not.toContain("sensitive upstream");
  });

  it("rejects a permanent user without an authentication identity", async () => {
    const admin = {
      auth: {
        admin: {
          listUsers: async () => ({
            data: {
              total: 1,
              users: [
                { id: "legacy-account", identities: [], is_anonymous: false },
              ],
            },
            error: null,
          }),
        },
      },
    };

    await expect(auditSupabaseAuthReadiness(admin)).resolves.toMatchObject({
      failureCode: "permanent_user_without_identity",
      permanentUsersWithoutIdentity: 1,
      ready: false,
    });
  });
});

describe("Private alpha email readiness", () => {
  it("accepts a verified Resend sender without exposing provider data", () => {
    const status = evaluateResendEmailReadiness(
      {
        data: [
          {
            id: "provider-domain-id",
            name: "auth.example.com",
            records: [
              {
                name: "sensitive-record-name",
                record: "DKIM",
                status: "verified",
                type: "TXT",
                value: "sensitive-dns-value",
              },
            ],
            status: "verified",
          },
        ],
      },
      "Achegue-se <no-reply@auth.example.com>",
    );

    expect(status).toMatchObject({
      failedRecordCount: 0,
      matchingDomainFound: true,
      matchingDomainStatus: "verified",
      ready: true,
      verifiedDomainCount: 1,
    });
    expect(JSON.stringify(status)).not.toContain("auth.example.com");
    expect(JSON.stringify(status)).not.toContain("sensitive");
  });

  it("fails closed when the sender domain or its DNS is not verified", () => {
    expect(
      evaluateResendEmailReadiness(
        {
          data: [
            {
              name: "auth.example.com",
              records: [{ record: "DKIM", status: "failed", type: "TXT" }],
              status: "failed",
            },
          ],
        },
        "no-reply@auth.example.com",
      ),
    ).toMatchObject({
      failedRecordCount: 1,
      failureCode: "resend_domain_not_verified",
      ready: false,
    });
    expect(evaluateResendEmailReadiness({}, "invalid")).toMatchObject({
      failureCode: "resend_invalid_response",
      ready: false,
    });
  });

  it("requires confirmed-email flow and a complete custom Auth SMTP", () => {
    expect(
      evaluateSupabaseAuthEmailReadiness({
        external_email_enabled: true,
        mailer_autoconfirm: false,
        smtp_admin_email: "no-reply@auth.example.com",
        smtp_host: "smtp.example.com",
        smtp_port: 587,
        smtp_sender_name: "Achegue-se",
        smtp_user: "resend",
      }),
    ).toEqual({
      autoConfirmDisabled: true,
      customSmtpConfigured: true,
      externalEmailEnabled: true,
      failureCode: null,
      ready: true,
      senderConfigured: true,
    });
    expect(
      evaluateSupabaseAuthEmailReadiness({
        external_email_enabled: true,
        mailer_autoconfirm: true,
      }),
    ).toMatchObject({
      failureCode: "auth_email_autoconfirm_enabled",
      ready: false,
    });
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
