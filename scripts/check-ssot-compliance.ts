#!/usr/bin/env node
/**
 * SSOT Compliance Checker
 *
 * Detects violations of the SSOT (Single Source of Truth) pattern
 * by finding direct Supabase table queries outside approved layers.
 *
 * Usage:
 *   npm run check:ssot
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ============================================================================
// CONFIGURATION
// ============================================================================

// Tables that should only be accessed through SSOT services/repositories
const PROTECTED_TABLES = [
  'locations',
  'profiles',
  'business_data',
  'professional_data',
  'driver_data',
  'posts',
  'comments',
  'classifieds',
  'events',
  'reviews',
  'user_subscriptions',
  'gastronomy_establishments',
  'menu_categories',
  'menu_items',
  'tourist_points',
  'community_memberships',
  'community_entity_links',
];

// Table -> allowed SSOT owners (avoids false positives in canonical files)
const TABLE_SSOTS: Record<string, string[]> = {
  locations: ['LocationService.ts', 'GeospatialRepository'],
  profiles: ['ProfileService.ts', 'ProfileRepository'],
  business_data: ['BusinessService.ts', 'BusinessRepository'],
  professional_data: ['ProfessionalService.ts', 'ProfessionalRepository'],
  driver_data: ['MobilityService.ts', 'MobilityService.impl.ts', 'DriverService.ts', 'DriverService.impl.ts'],
  ride_requests: ['RideService.ts', 'RideService.impl.ts', 'RideCanonicalAdapter.ts'],
  posts: ['PostService.ts', 'PostRepository'],
  comments: ['CommentService.ts', 'CommentRepository'],
  classifieds: ['ClassifiedService.ts', 'ClassifiedService.impl.ts', 'ClassifiedUrlService.ts', 'ClassifiedRepository'],
  events: ['EventService.ts', 'EventRepository'],
  reviews: ['ReviewsService.ts', 'ReviewRepository'],
  user_subscriptions: ['SubscriptionService.ts'],
  gastronomy_establishments: ['GastronomyService.ts', 'GastronomyQueryService.ts'],
  menu_categories: ['MenuService.ts', 'MenuQueryService.ts'],
  menu_items: ['MenuService.ts', 'MenuQueryService.ts'],
  tourist_points: ['TouristPointService.ts'],
  community_memberships: ['CommunityMembershipRepository.ts', 'CommunityMembershipService.ts'],
  community_entity_links: ['CommunityEntityLinkRepository.ts', 'CommunityEntityLinkService.ts'],
  business_slug_history: ['BusinessService.ts', 'BusinessIdentityAdapter.ts'],
  professional_slug_history: ['ProfessionalService.ts', 'ProfessionalIdentityAdapter.ts'],
  profile_username_history: ['ProfileService.ts', 'ProfileIdentityAdapter.ts'],
  profile_members: ['ProfileService.ts'],
  business_views: ['BusinessService.ts'],
  business_claims: ['BusinessService.ts'],
};

// Paths where direct Supabase access is allowed by architecture
const ALLOWED_PATH_PATTERNS = [
  '/services/',
  '/repositories/',
  '/integrations/supabase/',
];

// Layer paths where direct supabase access should never happen
const BOUNDARY_ENFORCED_PATH_PATTERNS = [
  '/hooks/',
  '/components/',
  '/pages/',
  '/utils/',
];

// File path exceptions (migrations, tests, seeds, etc)
const EXCEPTION_PATTERNS = [
  /\/migrations?\//,
  /\/seeds?\//,
  /\.test\./,
  /\.spec\./,
  /__tests__\//,
  /\/e2e\//,
  /scripts\/migrate/,
  /scripts\/seed/,
];

// ============================================================================
// TYPES
// ============================================================================

interface Violation {
  file: string;
  line: number;
  table: string;
  code: string;
  severity: 'error' | 'warning';
  message: string;
  suggestedFix?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function isAllowedDirectory(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return ALLOWED_PATH_PATTERNS.some((pattern) => normalizedPath.includes(pattern));
}

function isException(filePath: string): boolean {
  const normalizedPath = normalizePath(filePath);
  return EXCEPTION_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

/**
 * Checks whether this file is one of the SSOT owners for the table.
 */
function isTableSSot(filePath: string, table: string): boolean {
  const ssots = TABLE_SSOTS[table] || [];
  return ssots.some((ssot) => filePath.includes(ssot));
}

function getSuggestedService(table: string): string {
  const serviceMap: Record<string, string> = {
    locations: 'locationService',
    profiles: 'profileService',
    business_data: 'BusinessService',
    professional_data: 'ProfessionalService',
    driver_data: 'MobilityService',
    posts: 'postService',
    comments: 'commentService',
    classifieds: 'classifiedService',
    events: 'eventService',
    reviews: 'ReviewsService',
    user_subscriptions: 'SubscriptionService',
    gastronomy_establishments: 'GastronomyService',
    menu_categories: 'MenuService',
    menu_items: 'MenuService',
    tourist_points: 'TouristPointService',
    layer_boundary: 'module service layer',
  };

  return serviceMap[table] || 'appropriate SSOT service';
}

function stripInlineComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  for (let i = 0; i < line.length - 1; i++) {
    const ch = line[i];
    const next = line[i + 1];
    const prev = i > 0 ? line[i - 1] : '';

    if (!inDouble && !inTemplate && ch === "'" && prev !== '\\') {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && !inTemplate && ch === '"' && prev !== '\\') {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && ch === '`' && prev !== '\\') {
      inTemplate = !inTemplate;
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate && ch === '/' && next === '/') {
      return line.slice(0, i);
    }
  }

  return line;
}

function detectViolations(filePath: string, content: string): Violation[] {
  const violations: Violation[] = [];
  const lines = content.split('\n');
  const fromPattern = /\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g;
  const supabaseBoundaryPattern =
    /(\(\s*supabase\s+as\s+any\s*\)|\bsupabase\s*\.\s*(from|rpc|channel|functions|auth|storage|removeChannel)\s*\(|from\s+['"]@\/integrations\/supabase(?:\/client)?['"])/;
  const boundaryQueryPattern = /\.\s*(from|rpc|channel)\s*\(\s*['"`]/;
  const normalizedFilePath = normalizePath(filePath);
  const enforceSupabaseBoundary = BOUNDARY_ENFORCED_PATH_PATTERNS.some((pattern) =>
    normalizedFilePath.includes(pattern),
  );
  let inBlockComment = false;

  lines.forEach((line, index) => {
    let scanLine = line;

    // Skip multiline block-comment content
    if (inBlockComment) {
      const blockEnd = scanLine.indexOf('*/');
      if (blockEnd === -1) {
        return;
      }
      scanLine = scanLine.slice(blockEnd + 2);
      inBlockComment = false;
    }

    // Remove inline block comments and track opened blocks
    while (true) {
      const blockStart = scanLine.indexOf('/*');
      if (blockStart === -1) break;

      const blockEnd = scanLine.indexOf('*/', blockStart + 2);
      if (blockEnd === -1) {
        scanLine = scanLine.slice(0, blockStart);
        inBlockComment = true;
        break;
      }

      scanLine = scanLine.slice(0, blockStart) + scanLine.slice(blockEnd + 2);
    }

    scanLine = stripInlineComment(scanLine);
    if (!scanLine.trim()) {
      return;
    }

    const matches = Array.from(scanLine.matchAll(fromPattern));
    let hasProtectedTableViolation = false;

    if (matches.length > 0) {
      for (const match of matches) {
        const table = match[1];
        if (!PROTECTED_TABLES.includes(table)) {
          continue;
        }

        if (isTableSSot(filePath, table)) {
          continue;
        }

        hasProtectedTableViolation = true;
        violations.push({
          file: filePath,
          line: index + 1,
          table,
          code: scanLine.trim(),
          severity: 'error',
          message: `Direct query to protected table '${table}'. Use ${getSuggestedService(table)} instead.`,
          suggestedFix: `Use ${getSuggestedService(table)} to access '${table}' data`,
        });
      }
    }

    if (
      enforceSupabaseBoundary &&
      !hasProtectedTableViolation &&
      (supabaseBoundaryPattern.test(scanLine) || boundaryQueryPattern.test(scanLine))
    ) {
      violations.push({
        file: filePath,
        line: index + 1,
        table: 'layer_boundary',
        code: scanLine.trim(),
        severity: 'error',
        message: 'Direct Supabase access in UI/utility layer. Route data access through a service.',
        suggestedFix: 'Move this database call/import to a service and consume it via hook/component boundary',
      });
    }
  });

  return violations;
}

function scanDirectory(dir: string): Violation[] {
  let violations: Violation[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // Ignore generated/system folders
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) {
          violations = violations.concat(scanDirectory(fullPath));
        }
      } else if (stat.isFile()) {
        // Only scan TS/JS sources
        if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
          const relativePath = relative(rootDir, fullPath);

          if (!isException(relativePath) && !isAllowedDirectory(relativePath)) {
            const content = readFileSync(fullPath, 'utf-8');
            const fileViolations = detectViolations(relativePath, content);
            violations = violations.concat(fileViolations);
          }
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error);
  }

  return violations;
}

function groupViolationsByFile(violations: Violation[]): Map<string, Violation[]> {
  const grouped = new Map<string, Violation[]>();

  violations.forEach((violation) => {
    const existing = grouped.get(violation.file) || [];
    existing.push(violation);
    grouped.set(violation.file, existing);
  });

  return grouped;
}

function printReport(violations: Violation[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('SSOT COMPLIANCE REPORT');
  console.log('='.repeat(80) + '\n');

  if (violations.length === 0) {
    console.log('No SSOT violations found.\n');
    return;
  }

  console.log(`Found ${violations.length} violation(s)\n`);

  const grouped = groupViolationsByFile(violations);

  grouped.forEach((fileViolations, file) => {
    console.log(`File: ${file}`);
    console.log('-'.repeat(80));

    fileViolations.forEach((violation) => {
      console.log(`  Line ${violation.line}: ${violation.message}`);
      console.log(`  Code: ${violation.code}`);
      if (violation.suggestedFix) {
        console.log(`  Fix: ${violation.suggestedFix}`);
      }
      console.log();
    });
  });

  console.log('='.repeat(80));
  console.log('Documentation: See SSOT_REGISTRY.md for correct usage');
  console.log('='.repeat(80) + '\n');
}

function printSummary(violations: Violation[]): void {
  const tableCount = new Map<string, number>();

  violations.forEach((violation) => {
    tableCount.set(violation.table, (tableCount.get(violation.table) || 0) + 1);
  });

  if (tableCount.size > 0) {
    console.log('Violations by table:');
    tableCount.forEach((count, table) => {
      console.log(`  - ${table}: ${count} violation(s) -> Use ${getSuggestedService(table)}`);
    });
    console.log();
  }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log('Scanning for SSOT violations...\n');

  const srcDir = join(rootDir, 'src');
  const violations = scanDirectory(srcDir);

  printReport(violations);
  printSummary(violations);

  if (violations.length > 0) {
    process.exit(1);
  }
}

main();
