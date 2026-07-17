#!/usr/bin/env tsx

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  DOMAIN_REGISTRY,
  GOVERNANCE_ALLOWED_DB_PATH_MARKERS,
  GOVERNANCE_SERVICE_FACADE_HINTS,
} from "./lib/architecture-registry";

type ViolationKind =
  | "db-boundary"
  | "cross-module-import"
  | "parallel-service"
  | "duplicate-type"
  | "business-logic-in-ui";

interface Violation {
  kind: ViolationKind;
  file: string;
  message: string;
}

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");
const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;
const IMPORT_RE = /from\s+["']([^"']+)["']/g;
const SUPABASE_BOUNDARY_RE =
  /(\(\s*supabase\s+as\s+any\s*\)|\bsupabase\s*\.\s*(from|rpc|channel|functions|auth|storage|removeChannel)\s*\(|from\s+['"]@\/integrations\/supabase(?:\/client)?['"])/;
const NOTIFICATIONS_DOMAIN_BOUNDARY_RE =
  /\.(from\(["'](?:notifications|user_notification_settings)["']\)|rpc\(["'](?:create_notification|get_unread_count|mark_notification_as_read|mark_all_notifications_as_read|cleanup_old_notifications)["'])/;
const FAMILY_DOMAIN_BOUNDARY_RE =
  /\.from\(\s*(?:FAMILY_TABLES\.(?:connections|locations|locationSharingSettings|geofences|alerts)|["'](?:family_connections|family_locations|family_location_sharing_settings|family_geofences|family_location_alerts)["'])\s*\)/;
const BUSINESS_RULE_RE =
  /(if\s*\(|\?\s*)(?=.*\b(profile|activeProfile|user|account|business|driver|subscription|verification)\b)(?=.*\b(verified|is_verified|is_suspended|plan|role|profile_type|status|type)\b)/;
const SERVICE_FILE_RE = /(?:^|\/)([^/]+Service(?:\.impl)?\.ts)$/i;
const NOTIFICATION_DB_ALLOWED_FILES = new Set([
  "src/core/notifications/services/NotificationService.ts",
  "src/core/admin/services/AdminNotificationsService.ts",
]);
const FAMILY_DB_ALLOWED_FILES = new Set([
  "src/core/family/services/FamilyService.ts",
]);

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function relativeToRoot(filePath: string): string {
  return normalize(path.relative(ROOT, filePath));
}

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        ["node_modules", ".git", "dist", "build", "coverage"].includes(
          entry.name,
        )
      ) {
        continue;
      }
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && CODE_FILE_RE.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function stripInlineComment(line: string): string {
  const index = line.indexOf("//");
  return index >= 0 ? line.slice(0, index) : line;
}

function stripBlockComments(content: string): string {
  return content.replace(/\/\*[\s\S]*?\*\//g, "");
}

function isBoundaryFile(filePath: string): boolean {
  const normalized = normalize(filePath);
  return (
    normalized.startsWith("src/app/") ||
    normalized.startsWith("src/shared/") ||
    normalized.includes("/hooks/") ||
    normalized.includes("/pages/") ||
    normalized.includes("/components/") ||
    normalized.includes("/utils/")
  );
}

function hasAllowedDbMarker(filePath: string): boolean {
  const normalized = normalize(filePath);
  return GOVERNANCE_ALLOWED_DB_PATH_MARKERS.some((marker) =>
    normalized.includes(marker),
  );
}

function resolveImport(currentFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null;
  const resolved = path.resolve(path.dirname(currentFile), specifier);
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    path.join(resolved, "index.ts"),
    path.join(resolved, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return normalize(candidate);
    }
  }
  return null;
}

function extractImports(content: string): string[] {
  return Array.from(content.matchAll(IMPORT_RE)).map((match) => match[1]);
}

function isFacadeFile(content: string): boolean {
  const normalized = stripBlockComments(content)
    .split("\n")
    .map((line) => stripInlineComment(line).trim())
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  if (!normalized) return true;
  if (
    GOVERNANCE_SERVICE_FACADE_HINTS.some((hint) => normalized.includes(hint))
  ) {
    return true;
  }

  if (
    /(class\s+|async\s+function\s+|function\s+|=>|\bconst\s+\w+\s*=|\blet\s+\w+\s*=|\bawait\s+|\.from\(|\.rpc\()/.test(
      normalized,
    )
  ) {
    return false;
  }

  return true;
}

function collectDomainTypeBasenames(): Set<string> {
  return new Set(
    DOMAIN_REGISTRY.flatMap((entry) => entry.canonicalTypeBasenames).filter(
      (basename) => basename !== "index.ts" && basename !== "types.ts",
    ),
  );
}

export function collectViolations(): Violation[] {
  const files = walk(SRC_DIR);
  const violations: Violation[] = [];
  const serviceGroups = new Map<string, string[]>();
  const typeGroups = new Map<string, string[]>();
  const trackedTypeBasenames = collectDomainTypeBasenames();

  for (const file of files) {
    const relativeFile = relativeToRoot(file);
    const content = fs.readFileSync(file, "utf-8");
    const scanContent = stripBlockComments(content);

    if (SERVICE_FILE_RE.test(relativeFile)) {
      const match = relativeFile.match(SERVICE_FILE_RE);
      const serviceBase = match?.[1]?.replace(".impl.ts", ".ts");
      if (serviceBase) {
        serviceGroups.set(serviceBase, [
          ...(serviceGroups.get(serviceBase) ?? []),
          relativeFile,
        ]);
      }
    }

    const baseName = path.basename(relativeFile);
    if (trackedTypeBasenames.has(baseName)) {
      typeGroups.set(baseName, [
        ...(typeGroups.get(baseName) ?? []),
        relativeFile,
      ]);
    }

    if (
      isBoundaryFile(relativeFile) &&
      !hasAllowedDbMarker(relativeFile) &&
      SUPABASE_BOUNDARY_RE.test(scanContent)
    ) {
      violations.push({
        kind: "db-boundary",
        file: relativeFile,
        message:
          "Acesso direto ao Supabase fora de services/repositories oficiais.",
      });
    }

    if (
      NOTIFICATIONS_DOMAIN_BOUNDARY_RE.test(scanContent) &&
      !NOTIFICATION_DB_ALLOWED_FILES.has(relativeFile)
    ) {
      violations.push({
        kind: "db-boundary",
        file: relativeFile,
        message:
          "Acesso direto ao dominio notifications fora de NotificationService/AdminNotificationsService.",
      });
    }

    if (
      FAMILY_DOMAIN_BOUNDARY_RE.test(scanContent) &&
      !FAMILY_DB_ALLOWED_FILES.has(relativeFile)
    ) {
      violations.push({
        kind: "db-boundary",
        file: relativeFile,
        message: "Acesso direto ao dominio family fora de FamilyService.",
      });
    }

    const moduleMatch = normalize(relativeFile).match(
      /^src\/modules\/([^/]+)\//,
    );
    if (moduleMatch) {
      const currentModule = moduleMatch[1];
      for (const specifier of extractImports(content)) {
        const moduleImport = specifier.match(/^@\/modules\/([^/]+)/);
        if (moduleImport && moduleImport[1] !== currentModule) {
          violations.push({
            kind: "cross-module-import",
            file: relativeFile,
            message: `Import cruzado entre modulos: ${currentModule} -> ${moduleImport[1]}.`,
          });
          continue;
        }

        const resolved = resolveImport(file, specifier);
        if (!resolved) continue;
        const otherModuleMatch = resolved.match(/\/src\/modules\/([^/]+)\//);
        if (otherModuleMatch && otherModuleMatch[1] !== currentModule) {
          violations.push({
            kind: "cross-module-import",
            file: relativeFile,
            message: `Import relativo cruzado entre modulos: ${currentModule} -> ${otherModuleMatch[1]}.`,
          });
        }
      }
    }

    if (
      normalize(relativeFile).includes("/hooks/") ||
      normalize(relativeFile).includes("/pages/")
    ) {
      const lines = scanContent.split("\n");
      lines.forEach((rawLine) => {
        const line = stripInlineComment(rawLine).trim();
        if (!line) return;
        if (BUSINESS_RULE_RE.test(line)) {
          violations.push({
            kind: "business-logic-in-ui",
            file: relativeFile,
            message: `Regra de negocio inline em hook/page: "${line.slice(0, 120)}".`,
          });
        }
      });
    }
  }

  const canonicalServiceSet = new Set(
    DOMAIN_REGISTRY.flatMap((entry) => entry.canonicalServiceBasenames),
  );
  const explicitSsotPaths = new Set(
    DOMAIN_REGISTRY.flatMap((entry) => entry.ssotPaths).map((filePath) =>
      normalize(filePath),
    ),
  );

  for (const [serviceBase, groupedFiles] of serviceGroups) {
    if (!canonicalServiceSet.has(serviceBase) || groupedFiles.length <= 1) {
      continue;
    }

    const officialPaths = new Set(
      DOMAIN_REGISTRY.flatMap((entry) => entry.ssotPaths)
        .map((filePath) => normalize(filePath))
        .filter((filePath) => path.basename(filePath) === serviceBase),
    );

    for (const candidate of groupedFiles) {
      if (explicitSsotPaths.has(candidate)) {
        continue;
      }
      if (officialPaths.has(candidate)) {
        continue;
      }

      const absoluteCandidate = path.join(ROOT, candidate);
      const candidateContent = fs.readFileSync(absoluteCandidate, "utf-8");
      const siblingWrapper = candidate.endsWith(".impl.ts")
        ? candidate.replace(".impl.ts", ".ts")
        : null;

      if (siblingWrapper && groupedFiles.includes(siblingWrapper)) {
        continue;
      }
      if (isFacadeFile(candidateContent)) {
        continue;
      }

      violations.push({
        kind: "parallel-service",
        file: candidate,
        message: `Implementacao paralela detectada para service canonico ${serviceBase}.`,
      });
    }
  }

  for (const [typeBase, groupedFiles] of typeGroups) {
    if (groupedFiles.length <= 1) continue;

    const officialContainers = DOMAIN_REGISTRY.filter((entry) =>
      entry.canonicalTypeBasenames.includes(typeBase),
    ).flatMap((entry) =>
      entry.sourceRoots.map((sourceRoot) => normalize(sourceRoot)),
    );

    for (const candidate of groupedFiles) {
      const isInsideOfficialContainer = officialContainers.some((rootDir) =>
        candidate.startsWith(rootDir),
      );
      if (isInsideOfficialContainer) continue;

      violations.push({
        kind: "duplicate-type",
        file: candidate,
        message: `Arquivo de tipo duplicado para basename canonico ${typeBase}.`,
      });
    }
  }

  return dedupeViolations(violations);
}

function dedupeViolations(violations: Violation[]): Violation[] {
  const seen = new Set<string>();
  return violations.filter((violation) => {
    const key = `${violation.kind}:${violation.file}:${violation.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function printReport(violations: Violation[]): void {
  if (violations.length === 0) {
    console.log("Architecture governance validation passed.");
    return;
  }

  console.error("Architecture governance violations detected:\n");

  const grouped = new Map<ViolationKind, Violation[]>();
  for (const violation of violations) {
    grouped.set(violation.kind, [
      ...(grouped.get(violation.kind) ?? []),
      violation,
    ]);
  }

  for (const [kind, items] of grouped.entries()) {
    console.error(`- ${kind} (${items.length})`);
    for (const item of items.slice(0, 10)) {
      console.error(`  • ${item.file}: ${item.message}`);
    }
    if (items.length > 10) {
      console.error(`  • ... e mais ${items.length - 10}`);
    }
    console.error("");
  }
}

function main(): void {
  const violations = collectViolations();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(violations, null, 2));
    if (violations.length > 0) {
      process.exit(1);
    }
    return;
  }
  printReport(violations);
  if (violations.length > 0) {
    process.exit(1);
  }
}

const currentModulePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentModulePath) {
  main();
}
