#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_ROOT = path.join(ROOT, "src");
const CODE_FILE_RE = /\.(ts|tsx|js|jsx)$/;

const PUBLIC_IDENTITY_INTERNAL_IMPORT =
  "@/core/public-identity/services/PublicIdentityService";
const PUBLIC_IDENTITY_OWNER_ROOT = "src/core/public-identity/";

const BUSINESS_URL_SERVICE =
  "src/core/business/services/BusinessUrlService.ts";
const PROFESSIONAL_URL_SERVICE =
  "src/core/professional/services/ProfessionalUrlService.ts";
const PROFILE_IDENTITY_COMMAND =
  "src/core/profiles/services/profile.identity.commands.ts";
const PROFILE_PUBLIC_URL =
  "src/core/profiles/utils/publicProfileUrl.ts";
const CLASSIFIED_URL_SERVICE =
  "src/core/classifieds/services/ClassifiedUrlService.ts";
const PUBLIC_IDENTITY_SERVICE =
  "src/core/public-identity/services/PublicIdentityService.ts";

function normalize(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isRuntimeCodeFile(filePath: string): boolean {
  const normalized = normalize(filePath);
  return (
    CODE_FILE_RE.test(normalized) &&
    !normalized.includes("/__tests__/") &&
    !normalized.includes(".test.") &&
    !normalized.includes(".spec.")
  );
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath));
    else if (entry.isFile() && isRuntimeCodeFile(fullPath)) files.push(fullPath);
  }
  return files;
}

function readRequired(relative: string, violations: string[]): string {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    violations.push(`${relative}: required Public URL/slug authority is missing.`);
    return "";
  }
  return fs.readFileSync(absolute, "utf8");
}

function requireTokens(
  relative: string,
  content: string,
  tokens: readonly string[],
  violations: string[],
): void {
  for (const token of tokens) {
    if (!content.includes(token)) {
      violations.push(`${relative}: required SSOT token missing: ${token}`);
    }
  }
}

function main(): void {
  const violations: string[] = [];
  const runtimeFiles = walk(SRC_ROOT);

  for (const filePath of runtimeFiles) {
    const relative = normalize(path.relative(ROOT, filePath));
    const content = fs.readFileSync(filePath, "utf8");

    if (
      !relative.startsWith(PUBLIC_IDENTITY_OWNER_ROOT) &&
      content.includes(PUBLIC_IDENTITY_INTERNAL_IMPORT)
    ) {
      violations.push(
        `${relative}: consumers outside core/public-identity must import the public facade @/core/public-identity so adapter initialization cannot depend on import order.`,
      );
    }

    if (
      !relative.startsWith(PUBLIC_IDENTITY_OWNER_ROOT) &&
      /\.from\(\s*["'](?:business_data|professional_data)["']\s*\)[\s\S]{0,1200}?\.ilike\(\s*["']slug["']/.test(content)
    ) {
      violations.push(
        `${relative}: fuzzy slug uniqueness lookup is forbidden outside core/public-identity adapters. Delegate available-identifier generation to PublicIdentityService.generateAvailableIdentifier().`,
      );
    }
  }

  const publicIdentity = readRequired(PUBLIC_IDENTITY_SERVICE, violations);
  requireTokens(
    PUBLIC_IDENTITY_SERVICE,
    publicIdentity,
    [
      "static async generateAvailableIdentifier",
      "adapter.identifierExists(baseIdentifier, excludeEntityId)",
      "await adapter.getExistingSimilar(baseIdentifier)",
      "adapter.identifierExists(candidate, excludeEntityId)",
    ],
    violations,
  );

  const businessUrl = readRequired(BUSINESS_URL_SERVICE, violations);
  requireTokens(
    BUSINESS_URL_SERVICE,
    businessUrl,
    [
      "from '@/core/public-identity'",
      "PublicIdentityService.generateAvailableIdentifier({",
      "entityType: 'business'",
      "buildBusinessPublicUrlFromTerritory(",
      "buildPublicEntityUrl({",
    ],
    violations,
  );

  const professionalUrl = readRequired(PROFESSIONAL_URL_SERVICE, violations);
  requireTokens(
    PROFESSIONAL_URL_SERVICE,
    professionalUrl,
    [
      "from '@/core/public-identity'",
      "PublicIdentityService.generateAvailableIdentifier({",
      "entityType: 'professional'",
      "professionalPublicRoutes.detail({ state, city, slug })",
    ],
    violations,
  );

  const profileIdentity = readRequired(PROFILE_IDENTITY_COMMAND, violations);
  requireTokens(
    PROFILE_IDENTITY_COMMAND,
    profileIdentity,
    [
      'from "@/core/public-identity"',
      'PublicIdentityService.canChangeIdentifier({',
      'PublicIdentityService.checkAvailability({',
      'entityType: "profile"',
    ],
    violations,
  );

  const profileUrl = readRequired(PROFILE_PUBLIC_URL, violations);
  requireTokens(
    PROFILE_PUBLIC_URL,
    profileUrl,
    [
      "export function buildPublicProfileUrl(username: string)",
      "return `/u/${username}`;",
      "case 'business':",
      "case 'professional':",
      "return null;",
    ],
    violations,
  );

  const classifiedUrl = readRequired(CLASSIFIED_URL_SERVICE, violations);
  requireTokens(
    CLASSIFIED_URL_SERVICE,
    classifiedUrl,
    [
      "normalizeSafePublicId",
      "static buildShortUrl(publicId: string)",
      "static async resolveByPublicId(publicId: string)",
      "return this.buildShortUrl(publicId);",
    ],
    violations,
  );

  if (violations.length > 0) {
    console.error("Public URL/slug SSOT violations:\n");
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    "Public URL/slug SSOT valid: public-identity owns stable identifier policy and uniqueness; profile, business, professional and classifieds keep explicit domain URL builders with their existing identity semantics.",
  );
}

main();
