/**
 * Backup Supabase Storage.
 *
 * Downloads every object from every bucket returned by Supabase Storage. The
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

import { dirname, join, relative, resolve } from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { createServiceRoleClient } from "./lib/supabase-client";

const PAGE_SIZE = 1000;

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

type StorageBucket = {
  id: string;
  name?: string;
};

type StorageEntry = {
  id?: string | null;
  name: string;
  metadata?: unknown;
};

function getBucketId(bucket: StorageBucket): string {
  return bucket.id || bucket.name || "";
}

function isFolderEntry(entry: StorageEntry): boolean {
  return !entry.id && entry.metadata == null;
}

function toStoragePath(...parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

function safeLocalPath(rootDir: string, objectPath: string): string {
  const target = resolve(rootDir, ...objectPath.split("/"));
  const relativeTarget = relative(rootDir, target);

  if (relativeTarget.startsWith("..") || resolve(relativeTarget) === relativeTarget) {
    throw new Error(`Unsafe storage object path: ${objectPath}`);
  }

  return target;
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

async function listBucketObjectPaths(
  supabase: SupabaseClient,
  bucketName: string,
  prefix = "",
): Promise<string[]> {
  const objectPaths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucketName).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw new Error(`Could not list ${bucketName}/${prefix}: ${error.message}`);
    }

    const entries = (data ?? []) as StorageEntry[];
    if (entries.length === 0) break;

    for (const entry of entries) {
      const objectPath = toStoragePath(prefix, entry.name);

      if (isFolderEntry(entry)) {
        objectPaths.push(...(await listBucketObjectPaths(supabase, bucketName, objectPath)));
        continue;
      }

      objectPaths.push(objectPath);
    }

    if (entries.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return objectPaths;
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

  let objectPaths: string[];
  try {
    objectPaths = await listBucketObjectPaths(supabase, bucketName);
  } catch (error) {
    console.error(error);
    return 0;
  }

  if (objectPaths.length === 0) {
    console.log(`   No files in ${bucketName}`);
    return 0;
  }

  let count = 0;
  let errors = 0;

  for (const objectPath of objectPaths) {
    try {
      const { data, error } = await supabase.storage.from(bucketName).download(objectPath);

      if (error) {
        console.error(`   Error downloading ${objectPath}:`, error.message);
        errors++;
        continue;
      }

      if (!data) {
        console.error(`   No data for ${objectPath}`);
        errors++;
        continue;
      }

      const filePath = safeLocalPath(bucketDir, objectPath);
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, Buffer.from(await data.arrayBuffer()));
      count++;

      if (count % 10 === 0) {
        console.log(`   Downloaded ${count} files...`);
      }
    } catch (error) {
      console.error(`   Exception downloading ${objectPath}:`, error);
      errors++;
    }
  }

  console.log(`Backed up ${count} files from ${bucketName}${errors > 0 ? ` (${errors} errors)` : ""}`);
  return count;
}

async function main() {
  console.log("Starting Supabase Storage Backup\n");

  const supabase = createServiceRoleClient();

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
