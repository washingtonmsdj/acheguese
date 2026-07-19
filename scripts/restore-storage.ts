/**
 * Verifies or restores a Storage backup into an explicitly confirmed,
 * non-production Supabase project. Restoring into the source project is denied.
 */

/* eslint-disable ssot/no-direct-storage-access -- Operator restore covers the full Storage inventory outside the browser MediaService boundary. */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { assertAuthorizedNonProductionTarget } from "./lib/non-production-target";
import {
  createServiceRoleClient,
  getSupabaseConfig,
} from "./lib/supabase-client";
import {
  readAndVerifyStorageBackup,
  resolveManifestFile,
  sha256Bytes,
  type StorageBackupBucket,
  type StorageBackupObject,
} from "./lib/storage-recovery";

const DEFAULT_CONCURRENCY = 3;

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

interface RestoreArguments {
  backupDir: string;
  concurrency: number;
  verifyOnly: boolean;
}

interface StorageBucketRow {
  allowed_mime_types?: string[] | null;
  file_size_limit?: number | string | null;
  id: string;
  name?: string;
  public?: boolean;
}

function parseArguments(args: string[]): RestoreArguments {
  let backupDir: string | undefined;
  let concurrency = DEFAULT_CONCURRENCY;
  let verifyOnly = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--verify-only") {
      verifyOnly = true;
    } else if (argument === "--concurrency") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--concurrency exige um valor.");
      }
      concurrency = Number(value);
      index += 1;
    } else if (!argument.startsWith("--") && !backupDir) {
      backupDir = argument;
    } else {
      throw new Error(`Argumento desconhecido: ${argument}.`);
    }
  }

  if (!backupDir) {
    throw new Error(
      "Uso: npm run restore:storage -- <backup-dir> [--verify-only] [--concurrency 1-6]",
    );
  }
  if (
    !Number.isSafeInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > 6
  ) {
    throw new Error("--concurrency deve ser um inteiro entre 1 e 6.");
  }

  return { backupDir: resolve(backupDir), concurrency, verifyOnly };
}

function normalizeStringArray(
  value: string[] | null | undefined,
): string[] | null {
  return value ? [...value].sort() : null;
}

function normalizeFileSizeLimit(
  value: number | string | null | undefined,
): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function assertBucketContract(
  expected: StorageBackupBucket,
  actual: StorageBucketRow,
) {
  const actualAllowedMimeTypes = normalizeStringArray(
    actual.allowed_mime_types,
  );
  if (
    Boolean(actual.public) !== expected.public ||
    normalizeFileSizeLimit(actual.file_size_limit) !== expected.fileSizeLimit ||
    JSON.stringify(actualAllowedMimeTypes) !==
      JSON.stringify(normalizeStringArray(expected.allowedMimeTypes))
  ) {
    throw new Error(
      `Bucket ${expected.id} diverge do manifesto. Aplique migrations/configuracao antes do restore.`,
    );
  }
}

function isObjectNotFound(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    message?: string;
    status?: number;
    statusCode?: string;
  };
  return (
    candidate.status === 404 ||
    candidate.statusCode === "404" ||
    /not found|does not exist/i.test(candidate.message ?? "")
  );
}

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<void>,
): Promise<void> {
  let nextIndex = 0;
  async function runWorker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      await worker(values[currentIndex]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () =>
      runWorker(),
    ),
  );
}

async function downloadChecksum(
  supabase: SupabaseClient,
  bucketId: string,
  objectPath: string,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucketId)
    .download(objectPath);
  if (error) {
    if (isObjectNotFound(error)) return null;
    throw new Error(
      `Falha ao verificar ${bucketId}/${objectPath}: ${error.message}`,
    );
  }
  if (!data) return null;
  return sha256Bytes(new Uint8Array(await data.arrayBuffer()));
}

async function restoreObject(
  supabase: SupabaseClient,
  backupDir: string,
  bucketId: string,
  object: StorageBackupObject,
): Promise<"restored" | "verified"> {
  const existingChecksum = await downloadChecksum(
    supabase,
    bucketId,
    object.path,
  );
  if (existingChecksum) {
    if (existingChecksum !== object.sha256) {
      throw new Error(
        `Objeto existente diverge do backup: ${bucketId}/${object.path}.`,
      );
    }
    return "verified";
  }

  const bytes = await readFile(resolveManifestFile(backupDir, object.file));
  const { error } = await supabase.storage
    .from(bucketId)
    .upload(object.path, bytes, {
      contentType: object.contentType ?? "application/octet-stream",
      upsert: true,
    });
  if (error) {
    throw new Error(
      `Falha ao restaurar ${bucketId}/${object.path}: ${error.message}`,
    );
  }

  const restoredChecksum = await downloadChecksum(
    supabase,
    bucketId,
    object.path,
  );
  if (restoredChecksum !== object.sha256) {
    throw new Error(`Verificacao remota falhou em ${bucketId}/${object.path}.`);
  }
  return "restored";
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const manifest = await readAndVerifyStorageBackup(args.backupDir);
  console.log(
    `Backup local verificado: ${manifest.totals.objects} objeto(s), ${manifest.totals.bytes} byte(s).`,
  );
  if (args.verifyOnly) return;

  const config = getSupabaseConfig();
  const target = assertAuthorizedNonProductionTarget({
    supabaseUrl: config.url,
  });
  if (target.projectRef === manifest.source.projectRef) {
    throw new Error(
      "Restore no projeto de origem e proibido. Use um projeto descartavel separado.",
    );
  }

  const supabase = createServiceRoleClient();
  const { data: targetBuckets, error } = await supabase.storage.listBuckets();
  if (error)
    throw new Error(`Falha ao listar buckets de destino: ${error.message}`);
  const bucketById = new Map(
    ((targetBuckets ?? []) as StorageBucketRow[]).map((bucket) => [
      bucket.id || bucket.name || "",
      bucket,
    ]),
  );

  for (const expectedBucket of manifest.buckets) {
    const actualBucket = bucketById.get(expectedBucket.id);
    if (!actualBucket) {
      throw new Error(
        `Bucket ${expectedBucket.id} nao existe no destino. Aplique migrations antes do restore.`,
      );
    }
    assertBucketContract(expectedBucket, actualBucket);
  }

  const work = manifest.buckets.flatMap((bucket) =>
    bucket.objects.map((object) => ({ bucketId: bucket.id, object })),
  );
  let restored = 0;
  let verified = 0;
  await mapWithConcurrency(
    work,
    args.concurrency,
    async ({ bucketId, object }) => {
      const result = await restoreObject(
        supabase,
        args.backupDir,
        bucketId,
        object,
      );
      if (result === "restored") restored += 1;
      else verified += 1;
    },
  );

  console.log(`Destino confirmado: ${target.projectRef} (${target.target}).`);
  console.log(
    `Restore verificado: ${restored} restaurado(s), ${verified} ja identico(s).`,
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Falha no restore de Storage.",
  );
  process.exitCode = 1;
});
