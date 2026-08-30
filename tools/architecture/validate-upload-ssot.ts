#!/usr/bin/env tsx

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type Violation = {
  file: string;
  line: number;
  rule: string;
  snippet: string;
};

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");
const FUNCTIONS_DIR = join(ROOT, "supabase", "functions");
const TS_FILE = /\.(ts|tsx)$/;

const MEDIA_SERVICE = "src/core/media/services/MediaService.ts";
const STORAGE_BUCKETS = "src/core/media/config/storageBuckets.ts";
const SAFETY_SERVICE = "src/core/safety/services/SafetyService.ts";
const SAFETY_EVIDENCE_SERVICE =
  "src/core/safety/services/SafetyEvidenceService.ts";

const ALLOW_DIRECT_STORAGE = new Set([
  MEDIA_SERVICE,
]);

const ALLOW_OPTIMIZE_IMAGE = new Set([
  "src/shared/utils/imageOptimizer.ts",
  MEDIA_SERVICE,
]);

// Explicit backend operation owners. User-originated canonical image uploads go
// through media-assets; the other entries generate/remove server-owned objects.
const BACKEND_STORAGE_GATEWAYS = new Map<string, readonly string[]>([
  [
    "supabase/functions/media-assets/index.ts",
    [
      'const MEDIA_ASSET_BUCKET = "media-assets"',
      ".storage",
      ".upload(",
      '"reserve_media_asset_upload"',
      '"activate_media_asset_upload"',
      '"fail_media_asset_upload"',
    ],
  ],
  [
    "supabase/functions/media-assets-cleanup/index.ts",
    [
      'const MEDIA_ASSET_BUCKET = "media-assets"',
      ".storage",
      ".remove(",
      '"list_media_asset_orphans"',
      '"mark_media_assets_deleted"',
    ],
  ],
  [
    "supabase/functions/ai-image/index.ts",
    [
      'admin.storage.from("ai-images").upload(',
      'const path = `${user.id}/',
      'from("ai_image_generations")',
    ],
  ],
  [
    "supabase/functions/tryon-generate/index.ts",
    [
      'admin.storage.from("tryon").upload(',
      "gen.user_id !== user.id",
      "assertTryOnProductImageUrl(gen.product_image_url, user.id)",
    ],
  ],
]);

// Explicit read-only operational observers. These are not Storage object owners:
// they may inspect fixed bucket metadata for health/diagnostic purposes only and
// must remain incapable of reading user objects or mutating Storage.
const BACKEND_STORAGE_READERS = new Map<string, readonly string[]>([
  [
    "supabase/functions/health-check/index.ts",
    [
      "requireAdmin(req)",
      "supabase.storage.getBucket('media-assets')",
      "canonicalBucketExists",
    ],
  ],
]);

const BACKEND_STORAGE_READER_FORBIDDEN_OPERATIONS = [
  ".upload(",
  ".remove(",
  ".update(",
  ".move(",
  ".copy(",
  ".list(",
  ".download(",
  ".createSignedUrl(",
  ".createSignedUrls(",
  ".createSignedUploadUrl(",
] as const;

function normalize(file: string): string {
  return relative(ROOT, file).replace(/\\/g, "/");
}

function walk(dir: string, out: string[]): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      walk(full, out);
      continue;
    }
    if (TS_FILE.test(entry)) out.push(full);
  }
}

function makeViolation(
  file: string,
  rule: string,
  snippet: string,
  line = 1,
): Violation {
  return { file, line, rule, snippet };
}

function lineFor(content: string, token: string): number {
  const index = content.indexOf(token);
  if (index < 0) return 1;
  return content.slice(0, index).split("\n").length;
}

function requireToken(
  file: string,
  content: string,
  token: string,
  rule: string,
  violations: Violation[],
): void {
  if (!content.includes(token)) {
    violations.push(makeViolation(file, rule, `missing: ${token}`));
  }
}

function forbidToken(
  file: string,
  content: string,
  token: string,
  rule: string,
  violations: Violation[],
): void {
  if (content.includes(token)) {
    violations.push(
      makeViolation(file, rule, token, lineFor(content, token)),
    );
  }
}

function scanSourceFile(file: string): Violation[] {
  const rel = normalize(file);
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];

    if (line.includes("supabase.storage") && !ALLOW_DIRECT_STORAGE.has(rel)) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: "Uso direto de storage fora do MediaService",
        snippet: line.trim(),
      });
    }

    if (line.includes("optimizeImage(") && !ALLOW_OPTIMIZE_IMAGE.has(rel)) {
      violations.push({
        file: rel,
        line: i + 1,
        rule: "Otimização de imagem fora do SSOT",
        snippet: line.trim(),
      });
    }
  }

  return violations;
}

function validateBackendStorage(files: string[], violations: Violation[]): void {
  const seenGateways = new Set<string>();
  const seenReaders = new Set<string>();

  for (const file of files) {
    const rel = normalize(file);
    const content = readFileSync(file, "utf8");
    if (!content.includes(".storage")) continue;

    const gatewayTokens = BACKEND_STORAGE_GATEWAYS.get(rel);
    if (gatewayTokens) {
      seenGateways.add(rel);
      for (const token of gatewayTokens) {
        requireToken(
          rel,
          content,
          token,
          "Gateway backend perdeu sua fronteira de operação/ownership",
          violations,
        );
      }
      continue;
    }

    const readerTokens = BACKEND_STORAGE_READERS.get(rel);
    if (readerTokens) {
      seenReaders.add(rel);
      for (const token of readerTokens) {
        requireToken(
          rel,
          content,
          token,
          "Leitor backend de Storage perdeu sua fronteira metadata-only/admin",
          violations,
        );
      }
      for (const token of BACKEND_STORAGE_READER_FORBIDDEN_OPERATIONS) {
        forbidToken(
          rel,
          content,
          token,
          "Leitor backend de Storage não pode adquirir acesso a objetos ou capacidade de mutação",
          violations,
        );
      }
      continue;
    }

    violations.push(
      makeViolation(
        rel,
        "Uso backend de Storage não classificado",
        "Edge Functions novas devem ser explicitamente classificadas como owner de operação ou leitor metadata-only no Upload SSOT",
        lineFor(content, ".storage"),
      ),
    );
  }

  for (const gateway of BACKEND_STORAGE_GATEWAYS.keys()) {
    if (!seenGateways.has(gateway)) {
      violations.push(
        makeViolation(
          gateway,
          "Allowlist backend stale ou gateway ausente",
          "Remova a entrada se o gateway deixou de usar Storage; não mantenha exceção ociosa",
        ),
      );
    }
  }

  for (const reader of BACKEND_STORAGE_READERS.keys()) {
    if (!seenReaders.has(reader)) {
      violations.push(
        makeViolation(
          reader,
          "Allowlist de leitor Storage stale ou reader ausente",
          "Remova a entrada se o observer deixou de usar Storage; não mantenha exceção ociosa",
        ),
      );
    }
  }
}

function validateOwnerContracts(violations: Violation[]): void {
  const bucketsPath = join(ROOT, STORAGE_BUCKETS);
  const mediaPath = join(ROOT, MEDIA_SERVICE);
  const safetyPath = join(ROOT, SAFETY_SERVICE);
  const evidencePath = join(ROOT, SAFETY_EVIDENCE_SERVICE);

  for (const [file, path] of [
    [STORAGE_BUCKETS, bucketsPath],
    [MEDIA_SERVICE, mediaPath],
    [SAFETY_SERVICE, safetyPath],
    [SAFETY_EVIDENCE_SERVICE, evidencePath],
  ] as const) {
    if (!existsSync(path)) {
      violations.push(makeViolation(file, "Owner obrigatório ausente", file));
    }
  }

  if (existsSync(bucketsPath)) {
    const content = readFileSync(bucketsPath, "utf8");
    const publicList = content.match(
      /export const PUBLIC_IMAGE_UPLOAD_BUCKETS = \[([\s\S]*?)\] as const;/,
    )?.[1] ?? "";
    const legacyList = content.match(
      /export const LEGACY_PUBLIC_IMAGE_BUCKETS = \[([\s\S]*?)\] as const;/,
    )?.[1] ?? "";

    if (!publicList.includes("MEDIA_STORAGE_BUCKETS.TRYON")) {
      violations.push(
        makeViolation(
          STORAGE_BUCKETS,
          "Try-On staging deve permanecer no único bucket público genérico gravável",
          "PUBLIC_IMAGE_UPLOAD_BUCKETS",
        ),
      );
    }
    for (const legacy of ["BUSINESS_IMAGES", "CLASSIFIED_IMAGES"]) {
      if (publicList.includes(`MEDIA_STORAGE_BUCKETS.${legacy}`)) {
        violations.push(
          makeViolation(
            STORAGE_BUCKETS,
            "Bucket legado voltou a ser writer runtime público",
            legacy,
          ),
        );
      }
      if (!legacyList.includes(`MEDIA_STORAGE_BUCKETS.${legacy}`)) {
        violations.push(
          makeViolation(
            STORAGE_BUCKETS,
            "Inventário de bucket legado ficou stale/incompleto",
            legacy,
          ),
        );
      }
    }
  }

  if (existsSync(mediaPath)) {
    const content = readFileSync(mediaPath, "utf8");
    requireToken(
      MEDIA_SERVICE,
      content,
      'supabase.functions.invoke("media-assets"',
      "Imagens públicas canônicas devem passar pelo broker media-assets",
      violations,
    );
    requireToken(
      MEDIA_SERVICE,
      content,
      "bucket: PublicImageUploadBucket;",
      "uploadToBucket deve aceitar somente o staging público explicitamente tipado",
      violations,
    );
    forbidToken(
      MEDIA_SERVICE,
      content,
      "PRIVATE_BUCKET_REQUIRES_PRIVATE_API",
      "Compatibilidade Safety dentro de uploadToBucket foi aposentada",
      violations,
    );
  }

  if (existsSync(safetyPath)) {
    const content = readFileSync(safetyPath, "utf8");
    for (const retired of ["uploadSafetyEvidence", "listIncidentEvidence", "safety_evidence"]) {
      forbidToken(
        SAFETY_SERVICE,
        content,
        retired,
        "SafetyService não pode recuperar a segunda autoridade de evidências",
        violations,
      );
    }
  }

  if (existsSync(evidencePath)) {
    const content = readFileSync(evidencePath, "utf8");
    for (const token of [
      "mediaService.uploadPrivateFile",
      "mediaService.removePrivateFiles",
      "mediaService.createPrivateSignedUrl",
      "const STORAGE_PREFIX = `storage://${BUCKET}/`;",
    ]) {
      requireToken(
        SAFETY_EVIDENCE_SERVICE,
        content,
        token,
        "SafetyEvidenceService deve manter storage privado, compensação e URL assinada",
        violations,
      );
    }
    forbidToken(
      SAFETY_EVIDENCE_SERVICE,
      content,
      "getPublicUrl",
      "Evidência privada não pode produzir URL pública",
      violations,
    );
  }
}

function main(): void {
  const sourceFiles: string[] = [];
  const functionFiles: string[] = [];
  walk(SRC_DIR, sourceFiles);
  walk(FUNCTIONS_DIR, functionFiles);

  const violations = sourceFiles.flatMap(scanSourceFile);
  validateBackendStorage(functionFiles, violations);
  validateOwnerContracts(violations);

  if (violations.length === 0) {
    console.log(
      "✅ Upload SSOT validado: media-assets governa imagens públicas canônicas; private storage passa pelo MediaService; Try-On é o único staging público genérico; gateways backend e observers metadata-only são explícitos.",
    );
    return;
  }

  console.error(`❌ Upload SSOT: ${violations.length} desvio(s) encontrado(s).`);
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} | ${violation.rule}`);
    console.error(`  ${violation.snippet}`);
  }
  process.exit(1);
}

main();
