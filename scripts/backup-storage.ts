/**
 * Creates a complete local export of Supabase Storage objects.
 * Database backups contain Storage metadata, but not the object bytes.
 * Output is ignored by Git and must be handled as sensitive user data.
 */

/* eslint-disable ssot/no-direct-storage-access -- Operator backup must inventory every remote bucket; MediaService is a browser/domain boundary. */

import { constants } from "node:fs";
import { access, chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import {
  createServiceRoleClient,
  getSupabaseConfig,
} from "./lib/supabase-client";
import {
  createStorageObjectFile,
  getProjectIdentity,
  sha256Bytes,
  STORAGE_BACKUP_SCHEMA_VERSION,
  type StorageBackupBucket,
  type StorageBackupManifest,
  type StorageBackupObject,
} from "./lib/storage-recovery";

const PAGE_SIZE = 1000;
const DEFAULT_CONCURRENCY = 4;

type SupabaseClient = ReturnType<typeof createServiceRoleClient>;

interface StorageBucketRow {
  allowed_mime_types?: string[] | null;
  file_size_limit?: number | string | null;
  id: string;
  name?: string;
  public?: boolean;
}

interface StorageEntry {
  id?: string | null;
  metadata?: unknown;
  name: string;
}

interface BackupArguments {
  concurrency: number;
  output?: string;
}

function parseArguments(args: string[]): BackupArguments {
  const parsed: BackupArguments = { concurrency: DEFAULT_CONCURRENCY };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--output") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--output exige um diretorio.");
      }
      parsed.output = value;
      index += 1;
    } else if (argument === "--concurrency") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--concurrency exige um valor.");
      }
      parsed.concurrency = Number(value);
      index += 1;
    } else {
      throw new Error(`Argumento desconhecido: ${argument}.`);
    }
  }

  if (parsed.output !== undefined && !parsed.output.trim()) {
    throw new Error("--output exige um diretorio.");
  }
  if (
    !Number.isSafeInteger(parsed.concurrency) ||
    parsed.concurrency < 1 ||
    parsed.concurrency > 8
  ) {
    throw new Error("--concurrency deve ser um inteiro entre 1 e 8.");
  }

  return parsed;
}

function timestampForPath(): string {
  return new Date().toISOString().replaceAll(":", "-").replace(".", "-");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return false;
    }
    throw error;
  }
}

function assertSensitiveOutputLocation(outputDir: string) {
  const workspace = resolve(process.cwd());
  const relativeOutput = relative(workspace, outputDir);
  if (relativeOutput.startsWith("..") || isAbsolute(relativeOutput)) return;

  const topLevel = relativeOutput.split(/[\\/]/, 1)[0];
  if (!new Set([".codex-artifacts", "backups"]).has(topLevel)) {
    throw new Error(
      "Backup dentro do workspace deve ficar em backups/ ou .codex-artifacts/.",
    );
  }
}

function isFolderEntry(entry: StorageEntry): boolean {
  return !entry.id && entry.metadata == null;
}

function toStoragePath(...parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

function normalizeFileSizeLimit(
  value: number | string | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(
      `file_size_limit invalido retornado pelo Storage: ${value}.`,
    );
  }
  return parsed;
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(values[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () =>
      runWorker(),
    ),
  );
  return results;
}

async function listBucketObjectPaths(
  supabase: SupabaseClient,
  bucketId: string,
  prefix = "",
): Promise<string[]> {
  const objectPaths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucketId).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      throw new Error(
        `Falha ao listar ${bucketId}/${prefix}: ${error.message}`,
      );
    }

    const entries = (data ?? []) as StorageEntry[];
    for (const entry of entries) {
      const objectPath = toStoragePath(prefix, entry.name);
      if (isFolderEntry(entry)) {
        objectPaths.push(
          ...(await listBucketObjectPaths(supabase, bucketId, objectPath)),
        );
      } else {
        objectPaths.push(objectPath);
      }
    }

    if (entries.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return [...new Set(objectPaths)].sort();
}

async function backupObject(
  supabase: SupabaseClient,
  bucketId: string,
  objectPath: string,
  workingDir: string,
): Promise<StorageBackupObject> {
  const { data, error } = await supabase.storage
    .from(bucketId)
    .download(objectPath);
  if (error || !data) {
    throw new Error(
      `Falha ao baixar ${bucketId}/${objectPath}: ${error?.message ?? "sem dados"}.`,
    );
  }

  const bytes = new Uint8Array(await data.arrayBuffer());
  const relativeFile = createStorageObjectFile(bucketId, objectPath);
  const destination = join(workingDir, ...relativeFile.split("/"));
  await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
  await writeFile(destination, bytes, { mode: 0o600, flag: "wx" });

  return {
    contentType: data.type || null,
    file: relativeFile,
    path: objectPath,
    sha256: sha256Bytes(bytes),
    size: bytes.byteLength,
  };
}

async function backupBucket(
  supabase: SupabaseClient,
  bucket: StorageBucketRow,
  workingDir: string,
  concurrency: number,
): Promise<StorageBackupBucket> {
  const bucketId = bucket.id || bucket.name;
  if (!bucketId) throw new Error("Storage retornou bucket sem identificador.");

  const objectPaths = await listBucketObjectPaths(supabase, bucketId);
  console.log(`Bucket ${bucketId}: ${objectPaths.length} objeto(s).`);
  const objects = await mapWithConcurrency(
    objectPaths,
    concurrency,
    (objectPath) => backupObject(supabase, bucketId, objectPath, workingDir),
  );

  return {
    allowedMimeTypes: bucket.allowed_mime_types
      ? [...bucket.allowed_mime_types].sort()
      : null,
    fileSizeLimit: normalizeFileSizeLimit(bucket.file_size_limit),
    id: bucketId,
    objects,
    public: Boolean(bucket.public),
  };
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const config = getSupabaseConfig();
  if (!config.url) throw new Error("URL do Supabase nao configurada.");

  const source = getProjectIdentity(config.url);
  const finalDir = resolve(
    args.output ?? join("backups", `storage-${timestampForPath()}`),
  );
  assertSensitiveOutputLocation(finalDir);
  const parentDir = dirname(finalDir);
  await mkdir(parentDir, { recursive: true, mode: 0o700 });
  if (await pathExists(finalDir)) {
    throw new Error(`Diretorio de destino ja existe: ${finalDir}.`);
  }

  const workingDir = finalDir;
  await mkdir(workingDir, { mode: 0o700 });
  await chmod(workingDir, 0o700).catch(() => undefined);
  const incompleteMarker = join(workingDir, "INCOMPLETE");
  await writeFile(incompleteMarker, "Backup em andamento. Nao restaurar.\n", {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });

  try {
    console.log(`Origem: ${source.host}`);
    console.log(`Destino sensivel: ${finalDir}`);

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase.storage.listBuckets();
    if (error) throw new Error(`Falha ao listar buckets: ${error.message}`);

    const bucketRows = [...((data ?? []) as StorageBucketRow[])].sort((a, b) =>
      (a.id || a.name || "").localeCompare(b.id || b.name || ""),
    );
    const buckets: StorageBackupBucket[] = [];
    for (const bucket of bucketRows) {
      buckets.push(
        await backupBucket(supabase, bucket, workingDir, args.concurrency),
      );
    }

    const objects = buckets.flatMap((bucket) => bucket.objects);
    const manifest: StorageBackupManifest = {
      buckets,
      createdAt: new Date().toISOString(),
      schemaVersion: STORAGE_BACKUP_SCHEMA_VERSION,
      source,
      totals: {
        bytes: objects.reduce((total, object) => total + object.size, 0),
        objects: objects.length,
      },
    };

    await writeFile(
      join(workingDir, "manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      { encoding: "utf8", flag: "wx", mode: 0o600 },
    );
    await rm(incompleteMarker);

    console.log(
      `Backup concluido: ${manifest.totals.objects} objeto(s), ${manifest.totals.bytes} byte(s).`,
    );
    console.log(`Manifesto: ${join(finalDir, "manifest.json")}`);
  } catch (error) {
    await rm(workingDir, { force: true, recursive: true }).catch(
      () => undefined,
    );
    throw error;
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Falha no backup de Storage.",
  );
  process.exitCode = 1;
});
