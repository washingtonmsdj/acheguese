/**
 * Restore Supabase Storage.
 *
 * Uploads all files from a recursive backup directory to Supabase Storage.
 *
 * Usage:
 *   npx tsx tools/maintenance/restore-storage.ts <backup-dir>
 *
 * Example:
 *   npx tsx tools/maintenance/restore-storage.ts backups/storage-2026-04-19
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key with storage admin access
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join, relative } from "path";
import { createServiceRoleClient } from "../supabase/supabase-client";

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();

  const contentTypes: Record<string, string> = {
    avif: "image/avif",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    gif: "image/gif",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    pdf: "application/pdf",
    png: "image/png",
    svg: "image/svg+xml",
    wav: "audio/wav",
    webm: "video/webm",
    webp: "image/webp",
    default: "application/octet-stream",
  };

  return contentTypes[ext || ""] || contentTypes.default;
}

function listLocalFiles(rootDir: string, currentDir = rootDir): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(currentDir)) {
    const entryPath = join(currentDir, entry);
    const stat = statSync(entryPath);

    if (stat.isDirectory()) {
      files.push(...listLocalFiles(rootDir, entryPath));
      continue;
    }

    files.push(entryPath);
  }

  return files;
}

function toStoragePath(rootDir: string, filePath: string): string {
  return relative(rootDir, filePath).replace(/\\/g, "/");
}

async function restoreBucket(
  supabase: SupabaseClient,
  bucketName: string,
  backupDir: string,
): Promise<number> {
  console.log(`Restoring bucket: ${bucketName}`);

  const bucketDir = join(backupDir, bucketName);
  const files = listLocalFiles(bucketDir);

  if (files.length === 0) {
    console.log("   No files to restore");
    return 0;
  }

  let count = 0;
  let errors = 0;

  for (const filePath of files) {
    const objectPath = toStoragePath(bucketDir, filePath);

    try {
      const fileBuffer = readFileSync(filePath);

      const { error } = await supabase.storage.from(bucketName).upload(objectPath, fileBuffer, {
        upsert: true,
        contentType: getContentType(objectPath),
      });

      if (error) {
        console.error(`   Error uploading ${objectPath}:`, error.message);
        errors++;
        continue;
      }

      count++;

      if (count % 10 === 0) {
        console.log(`   Uploaded ${count} files...`);
      }
    } catch (error) {
      console.error(`   Exception uploading ${objectPath}:`, error);
      errors++;
    }
  }

  console.log(`Restored ${count} files to ${bucketName}${errors > 0 ? ` (${errors} errors)` : ""}`);
  return count;
}

async function main() {
  console.log("Starting Supabase Storage Restore\n");

  const backupDir = process.argv[2];

  if (!backupDir) {
    console.error("Usage: npx tsx tools/maintenance/restore-storage.ts <backup-dir>");
    console.error("\nExample:");
    console.error("  npx tsx tools/maintenance/restore-storage.ts backups/storage-2026-04-19");
    process.exit(1);
  }

  if (!existsSync(backupDir)) {
    console.error(`Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  const supabase = createServiceRoleClient();
  const buckets = readdirSync(backupDir).filter((entry) => statSync(join(backupDir, entry)).isDirectory());

  console.log(`Backup directory: ${backupDir}\n`);

  if (buckets.length === 0) {
    console.error("No buckets found in backup directory");
    process.exit(1);
  }

  console.log(`Found ${buckets.length} buckets to restore\n`);

  let totalFiles = 0;
  const startTime = Date.now();

  for (const bucket of buckets) {
    const count = await restoreBucket(supabase, bucket, backupDir);
    totalFiles += count;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\nStorage restore complete.");
  console.log(`Total files: ${totalFiles}`);
  console.log(`Duration: ${duration}s`);
}

main().catch((error) => {
  console.error("\nRestore failed:", error);
  process.exit(1);
});
