import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const LOCKDOWN = "20260830100654_lock_dormant_public_image_bucket_writers_g5.sql";
const DORMANT_BUCKETS = ["avatars", "business_images", "classified_images", "event_images"] as const;

function migrationsAfterLockdown() {
  return readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith(".sql") && name > LOCKDOWN)
    .sort()
    .map((name) => ({ name, sql: readFileSync(join(MIGRATIONS, name), "utf8") }));
}

describe("G5 dormant public image bucket writers", () => {
  it("removes legacy browser write policies while preserving media-assets", () => {
    const sql = readFileSync(join(MIGRATIONS, LOCKDOWN), "utf8");

    for (const bucket of DORMANT_BUCKETS) {
      expect(sql).toContain(`'${bucket}'`);
    }

    expect(sql).toContain("'media-assets'");
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can upload their own avatar"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can upload their own business images"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can upload their own classified images"/i);
    expect(sql).toMatch(/drop\s+policy\s+if\s+exists\s+"Users can upload their own event images"/i);
  });

  it("rejects future browser write policies for dormant buckets", () => {
    const offenders: string[] = [];

    for (const { name, sql } of migrationsAfterLockdown()) {
      if (!/create\s+policy\b/i.test(sql)) continue;

      for (const bucket of DORMANT_BUCKETS) {
        if (
          new RegExp(bucket, "i").test(sql) &&
          /\bfor\s+(?:insert|update|delete|all)\b/i.test(sql) &&
          /\bto\s+(?:public|anon|authenticated)\b/i.test(sql)
        ) {
          offenders.push(`${name}: ${bucket}`);
        }
      }
    }

    expect(
      offenders,
      "dormant image buckets cannot regain browser writers without a new Media SSOT decision",
    ).toEqual([]);
  });
});
