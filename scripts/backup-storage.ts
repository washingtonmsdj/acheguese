/**
 * Backup Supabase Storage.
 *
 * Downloads all files from every bucket returned by Supabase Storage. The
 * environment is the source of truth because migrations and optional features
 * can create buckets outside the frontend upload surface.
 *
 * Usage:
 *   npx tsx scripts/backup-storage.ts
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key with storage admin access
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";

type SupabaseClient = ReturnType<typeof createClient>;

type StorageBucket = {
  id: string;
  name?: string;
};

function getBucketId(bucket: StorageBucket): string {
  return bucket.id || bucket.name || "";
}

async function listStorageBucketIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(`Could not list storage buckets: ${error.message}`);
  }

  const bucketIds = (data ?? [])
    .map((bucket) => getBucketId(bucket as StorageBucket))
    .filter((bucketId): bucketId is string => Boolean(bucketId));

  return Array.from(new Set(bucketIds)).sort();
}

async function backupBucket(
  supabase: SupabaseClient,
  bucketName: string,
  backupDir: string,
): Promise<number> {
  console.log(`Backing up bucket: ${bucketName}`);

  const bucketDir = join(backupDir, bucketName);
  if (!existsSync(bucketDir)) {
    mkdirSync(bucketDir, { recursive: true });
  }

  const { data: files, error } = await supabase.storage.from(bucketName).list("", {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    console.error(`Error listing files in ${bucketName}:`, error.message);
    return 0;
  }

  if (!files || files.length === 0) {
    console.log(`   No files in ${bucketName}`);
    return 0;
  }

  let count = 0;
  let errors = 0;

  for (const file of files) {
    try {
      const { data, error } = await supabase.storage.from(bucketName).download(file.name);

      if (error) {
        console.error(`   Error downloading ${file.name}:`, error.message);
        errors++;
        continue;
      }

      if (!data) {
        console.error(`   No data for ${file.name}`);
        errors++;
        continue;
      }

      const filePath = join(bucketDir, file.name);
      const buffer = Buffer.from(await data.arrayBuffer());
      writeFileSync(filePath, buffer);
      count++;

      if (count % 10 === 0) {
        console.log(`   Downloaded ${count} files...`);
      }
    } catch (err) {
      console.error(`   Exception downloading ${file.name}:`, err);
      errors++;
    }
  }

  console.log(`Backed up ${count} files from ${bucketName}${errors > 0 ? ` (${errors} errors)` : ""}`);
  return count;
}

async function main() {
  console.log("Starting Supabase Storage Backup\n");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing environment variables:");
    console.error("   SUPABASE_URL");
    console.error("   SUPABASE_SERVICE_ROLE_KEY");
    console.error("\nLoad from .env file or set manually");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const timestamp = new Date().toISOString().split("T")[0];
  const backupDir = join(process.cwd(), "backups", `storage-${timestamp}`);

  console.log(`Backup directory: ${backupDir}\n`);

  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }

  const buckets = await listStorageBucketIds(supabase);
  if (buckets.length === 0) {
    console.log("No storage buckets found.");
    return;
  }

  console.log(`Found ${buckets.length} storage buckets: ${buckets.join(", ")}\n`);

  let totalFiles = 0;
  const startTime = Date.now();

  for (const bucket of buckets) {
    const count = await backupBucket(supabase, bucket, backupDir);
    totalFiles += count;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\nStorage backup complete.");
  console.log(`Total files: ${totalFiles}`);
  console.log(`Duration: ${duration}s`);
  console.log(`Location: ${backupDir}`);
}

main().catch((error) => {
  console.error("\nBackup failed:", error);
  process.exit(1);
});
