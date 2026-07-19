import { createHash } from "node:crypto";
import { access, lstat, readFile, realpath } from "node:fs/promises";
import { isAbsolute, join, normalize, relative, resolve } from "node:path";

export const STORAGE_BACKUP_SCHEMA_VERSION = "acheguese-storage-backup/v1";

export interface StorageBackupObject {
  contentType: string | null;
  file: string;
  path: string;
  sha256: string;
  size: number;
}

export interface StorageBackupBucket {
  allowedMimeTypes: string[] | null;
  fileSizeLimit: number | null;
  id: string;
  objects: StorageBackupObject[];
  public: boolean;
}

export interface StorageBackupManifest {
  buckets: StorageBackupBucket[];
  createdAt: string;
  schemaVersion: typeof STORAGE_BACKUP_SCHEMA_VERSION;
  source: {
    host: string;
    projectRef: string;
  };
  totals: {
    bytes: number;
    objects: number;
  };
}

function assertRecord(
  value: unknown,
  label: string,
): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} deve ser um objeto.`);
  }
}

function assertSafeObjectPath(value: unknown): asserts value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 1024) {
    throw new Error("Manifesto contem path de objeto invalido.");
  }
  const hasControlCharacter = Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
  if (/^[\\/]/.test(value) || hasControlCharacter) {
    throw new Error(`Path de objeto inseguro: ${JSON.stringify(value)}.`);
  }
  const segments = value.split("/");
  if (
    segments.some((segment) => !segment || segment === "." || segment === "..")
  ) {
    throw new Error(`Path de objeto inseguro: ${JSON.stringify(value)}.`);
  }
}

function assertSafeBackupFile(value: unknown): asserts value is string {
  if (
    typeof value !== "string" ||
    !/^objects\/[a-f0-9]{64}\.bin$/.test(value)
  ) {
    throw new Error("Manifesto contem arquivo de objeto invalido.");
  }
}

function toNullableStringArray(value: unknown, label: string): string[] | null {
  if (value === null) return null;
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    throw new Error(`${label} deve ser null ou uma lista de strings.`);
  }
  return [...value];
}

function toNullableNonNegativeInteger(
  value: unknown,
  label: string,
): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new Error(`${label} deve ser null ou inteiro nao negativo.`);
  }
  return Number(value);
}

export function getProjectIdentity(supabaseUrl: string): {
  host: string;
  projectRef: string;
} {
  let url;
  try {
    url = new URL(supabaseUrl);
  } catch {
    throw new Error("URL do Supabase invalida para backup.");
  }

  const match = /^([a-z0-9]{20})\.supabase\.co$/.exec(url.hostname);
  if (
    url.protocol !== "https:" ||
    !match ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Backup exige URL canonica HTTPS de um projeto Supabase.");
  }

  return { host: url.hostname, projectRef: match[1] };
}

export function createStorageObjectFile(
  bucketId: string,
  objectPath: string,
): string {
  const digest = createHash("sha256")
    .update(`${bucketId}\0${objectPath}`, "utf8")
    .digest("hex");
  return `objects/${digest}.bin`;
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function sha256File(filePath: string): Promise<string> {
  return sha256Bytes(await readFile(filePath));
}

export function resolveManifestFile(
  backupDir: string,
  relativeFile: string,
): string {
  const root = resolve(backupDir);
  const target = resolve(root, normalize(relativeFile));
  const relativeTarget = relative(root, target);
  if (
    !relativeTarget ||
    relativeTarget.startsWith("..") ||
    isAbsolute(relativeTarget)
  ) {
    throw new Error(`Arquivo fora do diretorio de backup: ${relativeFile}.`);
  }
  return target;
}

export function parseStorageBackupManifest(
  value: unknown,
): StorageBackupManifest {
  assertRecord(value, "Manifesto");
  if (value.schemaVersion !== STORAGE_BACKUP_SCHEMA_VERSION) {
    throw new Error("Versao de manifesto de Storage nao suportada.");
  }
  if (
    typeof value.createdAt !== "string" ||
    !Number.isFinite(Date.parse(value.createdAt))
  ) {
    throw new Error("Manifesto possui createdAt invalido.");
  }

  assertRecord(value.source, "source");
  const source = value.source;
  if (
    typeof source.projectRef !== "string" ||
    !/^[a-z0-9]{20}$/.test(source.projectRef) ||
    source.host !== `${source.projectRef}.supabase.co`
  ) {
    throw new Error("Manifesto possui origem Supabase invalida.");
  }

  if (!Array.isArray(value.buckets)) {
    throw new Error("Manifesto deve conter uma lista de buckets.");
  }

  const bucketIds = new Set<string>();
  const backupFiles = new Set<string>();
  const objectKeys = new Set<string>();
  let computedBytes = 0;
  let computedObjects = 0;

  const buckets = value.buckets.map((rawBucket, bucketIndex) => {
    assertRecord(rawBucket, `buckets[${bucketIndex}]`);
    if (
      typeof rawBucket.id !== "string" ||
      !/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(rawBucket.id) ||
      bucketIds.has(rawBucket.id)
    ) {
      throw new Error(
        `Bucket invalido ou duplicado no manifesto: ${String(rawBucket.id)}.`,
      );
    }
    bucketIds.add(rawBucket.id);
    const bucketId = rawBucket.id;
    if (
      typeof rawBucket.public !== "boolean" ||
      !Array.isArray(rawBucket.objects)
    ) {
      throw new Error(`Bucket ${rawBucket.id} possui contrato invalido.`);
    }

    const objects = rawBucket.objects.map((rawObject, objectIndex) => {
      assertRecord(rawObject, `objects[${objectIndex}]`);
      assertSafeObjectPath(rawObject.path);
      assertSafeBackupFile(rawObject.file);
      const expectedFile = createStorageObjectFile(bucketId, rawObject.path);
      if (rawObject.file !== expectedFile || backupFiles.has(rawObject.file)) {
        throw new Error(
          `Arquivo invalido ou duplicado em ${bucketId}/${rawObject.path}.`,
        );
      }
      backupFiles.add(rawObject.file);
      if (
        !Number.isSafeInteger(rawObject.size) ||
        Number(rawObject.size) < 0 ||
        typeof rawObject.sha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(rawObject.sha256) ||
        (rawObject.contentType !== null &&
          typeof rawObject.contentType !== "string")
      ) {
        throw new Error(
          `Objeto ${bucketId}/${rawObject.path} possui contrato invalido.`,
        );
      }

      const objectKey = `${bucketId}\0${rawObject.path}`;
      if (objectKeys.has(objectKey)) {
        throw new Error(
          `Objeto duplicado no manifesto: ${bucketId}/${rawObject.path}.`,
        );
      }
      objectKeys.add(objectKey);
      computedBytes += Number(rawObject.size);
      computedObjects += 1;

      return {
        contentType: rawObject.contentType,
        file: rawObject.file,
        path: rawObject.path,
        sha256: rawObject.sha256,
        size: Number(rawObject.size),
      } satisfies StorageBackupObject;
    });

    return {
      allowedMimeTypes: toNullableStringArray(
        rawBucket.allowedMimeTypes,
        `${bucketId}.allowedMimeTypes`,
      ),
      fileSizeLimit: toNullableNonNegativeInteger(
        rawBucket.fileSizeLimit,
        `${bucketId}.fileSizeLimit`,
      ),
      id: bucketId,
      objects,
      public: rawBucket.public,
    } satisfies StorageBackupBucket;
  });

  assertRecord(value.totals, "totals");
  if (
    value.totals.bytes !== computedBytes ||
    value.totals.objects !== computedObjects
  ) {
    throw new Error("Totais do manifesto nao correspondem ao inventario.");
  }

  return {
    buckets,
    createdAt: value.createdAt,
    schemaVersion: STORAGE_BACKUP_SCHEMA_VERSION,
    source: { host: source.host as string, projectRef: source.projectRef },
    totals: { bytes: computedBytes, objects: computedObjects },
  };
}

export async function readAndVerifyStorageBackup(
  backupDir: string,
): Promise<StorageBackupManifest> {
  const resolvedBackupDir = resolve(backupDir);
  try {
    await access(join(resolvedBackupDir, "INCOMPLETE"));
    throw new Error("Backup de Storage esta marcado como incompleto.");
  } catch (error) {
    if (
      !(
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "ENOENT"
      )
    ) {
      throw error;
    }
  }

  const rootRealPath = await realpath(resolvedBackupDir);
  const manifestPath = join(resolvedBackupDir, "manifest.json");
  const manifestStat = await lstat(manifestPath);
  if (!manifestStat.isFile() || manifestStat.isSymbolicLink()) {
    throw new Error("manifest.json deve ser um arquivo regular.");
  }
  const manifest = parseStorageBackupManifest(
    JSON.parse(await readFile(manifestPath, "utf8")),
  );

  for (const bucket of manifest.buckets) {
    for (const object of bucket.objects) {
      const filePath = resolveManifestFile(backupDir, object.file);
      const fileStat = await lstat(filePath);
      const fileRealPath = await realpath(filePath);
      const relativeRealPath = relative(rootRealPath, fileRealPath);
      if (
        fileStat.isSymbolicLink() ||
        !fileStat.isFile() ||
        relativeRealPath.startsWith("..") ||
        isAbsolute(relativeRealPath) ||
        fileStat.size !== object.size
      ) {
        throw new Error(`Tamanho invalido em ${bucket.id}/${object.path}.`);
      }
      if ((await sha256File(filePath)) !== object.sha256) {
        throw new Error(`Checksum invalido em ${bucket.id}/${object.path}.`);
      }
    }
  }

  return manifest;
}
