import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

type Severity = "error" | "warning";

interface Violation {
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  code: string;
  suggestion: string;
}

interface Rule {
  name: string;
  pattern: RegExp;
  severity: Severity;
  suggestion: string;
  allowedFiles?: RegExp[];
}

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_DIRS = [
  "src",
  "supabase/functions",
] as const;

const IGNORED_PATHS = [
  /(^|\/)__tests__(\/|$)/,
  /(^|\/)__fixtures__(\/|$)/,
  /\.test\.[tj]sx?$/,
  /\.spec\.[tj]sx?$/,
  /\.generated\.ts$/,
  /(^|\/)types(\/|$)/,
] as const;

const PUBLIC_BUSINESS_URL_SSOT_FILES = [
  /src\/core\/business\/utils\/businessPublicUrls\.ts$/,
  /src\/core\/business\/services\/BusinessUrlService\.ts$/,
  /src\/core\/verticals\/gastronomy\/services\/GastronomyUrlService\.ts$/,
  /src\/core\/routing\/utils\/territoryUrls\.ts$/,
  /src\/app\/routes\//,
  // Edge Function deploys cannot import frontend aliases; sitemap is the only
  // approved server-side mirror for public business URL generation.
  /supabase\/functions\/sitemap\/index\.ts$/,
] as const;

const PUBLIC_PROFILE_URL_SSOT_FILES = [
  /src\/core\/profiles\/utils\/publicProfileUrl\.ts$/,
] as const;

const PREMIUM_URL_SSOT_FILES = [
  /src\/core\/business\/utils\/businessPublicUrls\.ts$/,
  /src\/core\/business\/services\/BusinessUrlService\.ts$/,
  /src\/core\/business\/services\/PremiumBusinessSiteResolver\.ts$/,
  /src\/app\/routes\//,
] as const;

const RULES: Rule[] = [
  {
    name: "Nao montar rota premium /p manualmente",
    pattern: /[`'"]\/p\/[^`'"]*\$\{|\+[^;\n]*[`'"]\/p\/|[`'"]\/p\/[`'"][^;\n]*\+/,
    severity: "error",
    suggestion: "Use buildBusinessPremiumUrl() ou BusinessUrlService.getShareUrl*().",
    allowedFiles: PREMIUM_URL_SSOT_FILES,
  },
  {
    name: "Nao montar rota publica de perfil /u manualmente",
    pattern: /[`'"]\/u\/[^`'"]*\$\{|\+[^;\n]*[`'"]\/u\/|[`'"]\/u\/[`'"][^;\n]*\+/,
    severity: "error",
    suggestion: "Use buildPublicProfileUrl().",
    allowedFiles: PUBLIC_PROFILE_URL_SSOT_FILES,
  },
  {
    name: "Nao usar id como username em buildPublicProfileUrl",
    pattern:
      /buildPublicProfileUrl\(\s*(?:profile|suggestion)\.id\s*\)|buildPublicProfileUrl\(\s*[^)]*(?:profileId|userId|authorId|mentionedProfileId|recipientProfileId)[^)]*\)/,
    severity: "error",
    suggestion: "Use username/handle publico; se nao houver username, nao gere /u/:username.",
  },
  {
    name: "Nao montar detalhe publico curto de empresa manualmente",
    pattern:
      /`\/\$\{[^}]*?(?:alias|communityAlias|communitySlug)[^}]*\}\/\$\{[^}]*?(?:business|slug)[^}]*\}`/,
    severity: "error",
    suggestion: "Use buildBusinessPublicUrlFromCommunityAlias() ou BusinessUrlService.",
    allowedFiles: PUBLIC_BUSINESS_URL_SSOT_FILES,
  },
  {
    name: "Nao montar detalhe publico de empresa manualmente",
    pattern: /[`'"]\/empresas\/[^`'"]*\$\{|\+[^;\n]*[`'"]\/empresas\/|[`'"]\/empresas\/[`'"][^;\n]*\+/,
    severity: "error",
    suggestion: "Use BusinessUrlService/getCanonicalUrlWithResolvedCommunityAlias() ou businessPublicUrls.",
    allowedFiles: PUBLIC_BUSINESS_URL_SSOT_FILES,
  },
  {
    name: "Nao montar detalhe legado de gastronomia manualmente",
    pattern: /[`'"]\/gastronomia\/[^`'"]*\$\{|\+[^;\n]*[`'"]\/gastronomia\/|[`'"]\/gastronomia\/[`'"][^;\n]*\+/,
    severity: "error",
    suggestion: "Use GastronomyUrlService para listagens ou BusinessUrlService para detalhe publico.",
    allowedFiles: PUBLIC_BUSINESS_URL_SSOT_FILES,
  },
];

function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function shouldIgnoreFile(path: string): boolean {
  const normalized = normalizePath(relative(rootDir, path));
  return IGNORED_PATHS.some((pattern) => pattern.test(normalized));
}

function isAllowedFile(path: string, allowedFiles: readonly RegExp[] | undefined): boolean {
  if (!allowedFiles) return false;
  const normalized = normalizePath(relative(rootDir, path));
  return allowedFiles.some((pattern) => pattern.test(normalized));
}

function stripCommentContent(line: string): string {
  const trimmed = line.trim();
  if (trimmed.startsWith("//") || trimmed.startsWith("*")) return "";
  return line;
}

function scanFile(path: string): Violation[] {
  if (shouldIgnoreFile(path)) return [];

  const content = readFileSync(path, "utf8");
  const lines = content.split("\n");
  const violations: Violation[] = [];

  lines.forEach((line, index) => {
    const scanLine = stripCommentContent(line);
    if (!scanLine.trim()) return;

    for (const rule of RULES) {
      if (!rule.pattern.test(scanLine)) continue;
      if (isAllowedFile(path, rule.allowedFiles)) continue;

      violations.push({
        file: normalizePath(relative(rootDir, path)),
        line: index + 1,
        severity: rule.severity,
        rule: rule.name,
        code: scanLine.trim(),
        suggestion: rule.suggestion,
      });
    }
  });

  return violations;
}

function scanDirectory(path: string): Violation[] {
  if (!existsSync(path)) return [];

  const stat = statSync(path);
  if (stat.isFile()) {
    return /\.(ts|tsx)$/.test(path) ? scanFile(path) : [];
  }

  const violations: Violation[] = [];
  for (const entry of readdirSync(path)) {
    const childPath = join(path, entry);
    const childStat = statSync(childPath);
    if (childStat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry.startsWith(".")) continue;
      violations.push(...scanDirectory(childPath));
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry)) {
      violations.push(...scanFile(childPath));
    }
  }

  return violations;
}

const violations = SCAN_DIRS.flatMap((dir) => scanDirectory(join(rootDir, dir)));
const errors = violations.filter((violation) => violation.severity === "error");

console.log("Validando SSOT de URLs publicas...");
console.log(`Arquivos analisados: ${SCAN_DIRS.join(", ")}`);
console.log(`Violacoes encontradas: ${violations.length}`);

if (violations.length > 0) {
  console.log("");
  violations.forEach((violation) => {
    console.log(`${violation.file}:${violation.line}`);
    console.log(`  Regra: ${violation.rule}`);
    console.log(`  Codigo: ${violation.code}`);
    console.log(`  Correcao: ${violation.suggestion}`);
    console.log("");
  });
}

if (errors.length > 0) {
  process.exit(1);
}

console.log("OK: URLs publicas seguem os SSOTs configurados.");
