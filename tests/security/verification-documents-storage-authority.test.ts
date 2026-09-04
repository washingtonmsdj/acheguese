import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const SRC = join(ROOT, "src");
const BASELINE =
  "20260830054127_lock_dormant_verification_documents_bucket.sql";

function walkTsFiles(root: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      output.push(...walkTsFiles(path));
    } else if (
      /\.(?:ts|tsx)$/.test(entry) &&
      !/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry)
    ) {
      output.push(path);
    }
  }
  return output;
}

function migrationsAfterBaseline() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > BASELINE)
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS, name), "utf8"),
    }));
}

describe("G5 verification-documents dormant storage authority", () => {
  it("keeps the private bucket contract while removing its browser policies", () => {
    const sql = readFileSync(join(MIGRATIONS, BASELINE), "utf8");

    expect(sql).toContain("verification-documents bucket is not private");
    expect(sql).toContain("bucket is no longer dormant");
    expect(sql).toContain(
      "DROP POLICY IF EXISTS verification_documents_owner_insert ON storage.objects",
    );
    expect(sql).toContain(
      "DROP POLICY IF EXISTS verification_documents_owner_or_admin_select ON storage.objects",
    );
    expect(sql).toContain(
      "DROP POLICY IF EXISTS verification_documents_owner_update ON storage.objects",
    );
    expect(sql).toContain(
      "DROP POLICY IF EXISTS verification_documents_owner_delete ON storage.objects",
    );
    expect(sql).toContain("private bucket contract was not preserved");
  });

  it("reserves verification-documents outside generic browser private-storage primitives", () => {
    const config = readFileSync(
      join(ROOT, "src/core/media/config/storageBuckets.ts"),
      "utf8",
    );

    expect(config).toContain(
      'VERIFICATION_DOCUMENTS: "verification-documents"',
    );
    expect(config).toContain("RESERVED_PRIVATE_STORAGE_BUCKETS");

    const privateList = config.slice(
      config.indexOf("export const PRIVATE_STORAGE_BUCKETS"),
      config.indexOf("export const RESERVED_PRIVATE_STORAGE_BUCKETS"),
    );
    expect(privateList).not.toContain("VERIFICATION_DOCUMENTS");
  });

  it("keeps the historical upload method without any runtime caller until a broker is certified", () => {
    const servicePath = join(
      ROOT,
      "src/core/media/services/MediaService.ts",
    );
    expect(existsSync(servicePath)).toBe(true);

    const offenders: string[] = [];
    for (const path of walkTsFiles(SRC)) {
      if (path === servicePath) continue;
      const source = readFileSync(path, "utf8");
      if (/\.uploadVerificationDocument\s*\(/.test(source)) {
        offenders.push(path.replace(`${ROOT}/`, ""));
      }
    }

    expect(
      offenders,
      "verification-documents has no browser policies; runtime callers require a new brokered authority decision first",
    ).toEqual([]);
  });

  it("rejects future browser storage policies for the reserved bucket", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterBaseline()) {
      const createsPolicy = /CREATE\s+POLICY[\s\S]{0,900}?ON\s+storage\.objects/gi;
      for (const match of sql.matchAll(createsPolicy)) {
        const tail = sql.slice(match.index, match.index + 1800);
        if (
          /verification-documents/i.test(tail) &&
          /TO\s+(?:[^;]*\b(?:anon|authenticated|PUBLIC)\b)/i.test(tail)
        ) {
          offenders.push(name);
          break;
        }
      }
    }

    expect(
      offenders,
      "verification-documents must remain browser-locked until an explicit brokered upload flow is certified",
    ).toEqual([]);
  });
});
