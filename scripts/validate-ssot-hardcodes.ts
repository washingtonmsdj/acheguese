/**
 * Detecta hardcodes que violam o SSOT do projeto.
 *
 * Limites puramente defensivos e locais podem ser registrados abaixo. O
 * registro e estrito por arquivo, nome e valor para impedir que uma excecao
 * esconda novos limites operacionais ou alteracoes sem revisao.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";

export interface Violation {
  file: string;
  line: number;
  type: string;
  code: string;
  severity: "critical" | "high" | "medium";
}

export interface DefensiveLocalBound {
  file: string;
  constant: string;
  value: number;
  classification: "defensive-local-bound";
  scope: string;
  rationale: string;
}

export const DEFENSIVE_LOCAL_BOUNDS = [
  {
    file: "src/core/realtime/services/RealtimeService.ts",
    constant: "MAX_ACTIVE_SUBSCRIPTIONS",
    value: 32,
    classification: "defensive-local-bound",
    scope: "RealtimeService instance",
    rationale:
      "Bounds local channel fan-out and protects the browser runtime from leaked subscriptions.",
  },
  {
    file: "src/core/realtime/services/RealtimeService.ts",
    constant: "MAX_RECENT_EVENT_FINGERPRINTS",
    value: 256,
    classification: "defensive-local-bound",
    scope: "individual realtime subscription",
    rationale:
      "Bounds the in-memory duplicate-event fingerprint window for each subscription.",
  },
  {
    file: "src/core/posts/services/postFeedCursor.ts",
    constant: "MAX_CURSOR_LENGTH",
    value: 512,
    classification: "defensive-local-bound",
    scope: "single decoded feed cursor",
    rationale:
      "Rejects oversized untrusted cursor input before parsing and bounds local processing.",
  },
] as const satisfies readonly DefensiveLocalBound[];

const violations: Violation[] = [];

const COMMON_PATTERNS = [
  {
    regex:
      /\b(?:price|priceCents|fare|fareCents|tarifa|valor|preco|preço|amountCents)\b\s*[:=]\s*\d+(?:\.\d+)?/gi,
    severity: "high" as const,
    type: "Preco hardcoded",
  },
  {
    regex: /\b(?:lat|latitude|lng|lon|longitude)\b\s*[:=]\s*-?\d+\.\d+/gi,
    severity: "high" as const,
    type: "Coordenada hardcoded",
  },
  {
    regex:
      /['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi,
    severity: "high" as const,
    type: "UUID hardcoded",
  },
  {
    regex: /import.*(?:mock-|__mocks__|\/data\/mock)/gi,
    severity: "high" as const,
    type: "Import de mock em runtime",
  },
  {
    regex:
      /\bstatus\s*:\s*['"](?:active|inactive|pending|approved|rejected)['"]/gi,
    severity: "high" as const,
    type: "Status hardcoded",
  },
] as const;

const HARDCODED_LIMIT_PATTERN = /\b((?:MAX|MIN|LIMIT)_[A-Z_]+)\s*=\s*(\d+)\b/g;

const SCAN_DIRS = [
  "src/modules",
  "src/core",
  "src/pages",
  "src/shared/components",
];

const IGNORE_DIRS = [
  "node_modules",
  "dist",
  "build",
  "__tests__",
  "__mocks__",
  "__fixtures__",
  ".test.",
  ".spec.",
  ".stories.",
  "mockData.ts",
  "/dev/",
  "Exemplo",
  "Example",
  "Mock",
  "mock",
];

const ALLOWED_HARDCODE_PATH_SEGMENTS = [
  "/constants/",
  "/config/",
  "/types/",
  "/fixtures/",
  "/mocks/",
  "/__tests__/",
  "/__fixtures__/",
];

function normalizeSourcePath(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
  const sourceIndex = normalized.lastIndexOf("/src/");

  return sourceIndex >= 0 ? normalized.slice(sourceIndex + 1) : normalized;
}

function shouldIgnore(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    IGNORE_DIRS.some((dir) => normalized.includes(dir)) ||
    ALLOWED_HARDCODE_PATH_SEGMENTS.some((segment) =>
      normalized.includes(segment),
    )
  );
}

function isRegisteredDefensiveLocalBound(
  filePath: string,
  constant: string,
  value: number,
): boolean {
  const normalized = normalizeSourcePath(filePath);

  return DEFENSIVE_LOCAL_BOUNDS.some(
    (bound) =>
      bound.file === normalized &&
      bound.constant === constant &&
      bound.value === value,
  );
}

export function findHardcodeViolations(
  filePath: string,
  content: string,
): Violation[] {
  if (shouldIgnore(filePath)) return [];
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return [];

  const findings: Violation[] = [];
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;

    COMMON_PATTERNS.forEach((pattern) => {
      if (line.match(pattern.regex)) {
        findings.push({
          file: filePath,
          line: index + 1,
          type: pattern.type,
          code: trimmed,
          severity: pattern.severity,
        });
      }
    });

    for (const match of line.matchAll(HARDCODED_LIMIT_PATTERN)) {
      const [, constant, rawValue] = match;
      const value = Number(rawValue);
      if (isRegisteredDefensiveLocalBound(filePath, constant, value)) continue;

      findings.push({
        file: filePath,
        line: index + 1,
        type: "Limite operacional hardcoded",
        code: trimmed,
        severity: "high",
      });
    }
  });

  return findings;
}

function scanFile(filePath: string): void {
  if (shouldIgnore(filePath)) return;
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;

  try {
    violations.push(
      ...findHardcodeViolations(filePath, readFileSync(filePath, "utf-8")),
    );
  } catch (error) {
    console.error(`Erro ao escanear ${filePath}:`, error);
  }
}

function scanDirectory(dirPath: string): void {
  if (!existsSync(dirPath)) return;

  try {
    readdirSync(dirPath).forEach((entry) => {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!shouldIgnore(fullPath)) scanDirectory(fullPath);
      } else if (stat.isFile()) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`Erro ao escanear diretorio ${dirPath}:`, error);
  }
}

function generateReport(): void {
  console.log("\nRELATORIO DE VALIDACAO SSOT - HARDCODES\n");
  console.log("=".repeat(80));

  if (violations.length === 0) {
    console.log("\nNenhuma violacao encontrada.\n");
    return;
  }

  const critical = violations.filter(
    (violation) => violation.severity === "critical",
  );
  const high = violations.filter((violation) => violation.severity === "high");
  const medium = violations.filter(
    (violation) => violation.severity === "medium",
  );

  console.log("\nRESUMO:");
  console.log(`   Criticas: ${critical.length}`);
  console.log(`   Altas: ${high.length}`);
  console.log(`   Medias: ${medium.length}`);
  console.log(`   Total: ${violations.length}\n`);

  const byType = violations.reduce<Record<string, number>>((summary, item) => {
    summary[item.type] = (summary[item.type] || 0) + 1;
    return summary;
  }, {});

  console.log("POR TIPO:");
  Object.entries(byType)
    .sort((left, right) => right[1] - left[1])
    .forEach(([type, count]) => console.log(`   ${type}: ${count}`));

  console.log("\n" + "=".repeat(80));

  if (critical.length > 0) {
    console.log("\nVIOLACOES CRITICAS:\n");
    critical.slice(0, 10).forEach(printViolation);
  }

  if (high.length > 0) {
    console.log("\nVIOLACOES DE ALTA PRIORIDADE:\n");
    high.slice(0, 5).forEach(printViolation);
  }

  console.log("=".repeat(80));

  if (violations.length > 0) process.exitCode = 1;
}

function printViolation(violation: Violation): void {
  console.log(`   ${violation.file}:${violation.line}`);
  console.log(`   Tipo: ${violation.type}`);
  console.log(`   Codigo: ${violation.code}\n`);
}

export function main(): void {
  violations.length = 0;
  console.log("Iniciando validacao de hardcodes...\n");
  SCAN_DIRS.forEach((directory) => {
    console.log(`Escaneando ${directory}...`);
    scanDirectory(directory);
  });
  generateReport();
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) main();
