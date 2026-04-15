#!/usr/bin/env tsx

/**
 * Session Context Ambiguous Identifier Validator
 *
 * Scans all .ts and .tsx files under src/ for ambiguous identifiers
 * defined in canonical-boundary.ts (ProhibitedIdentifier type).
 *
 * Validates: Requirements 9.5, 9.6, 11.5–11.7
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

interface Violation {
  file: string;
  line: number;
  identifier: string;
  suggestion: string;
}

// Maps each prohibited identifier to its qualified replacement
const AMBIGUOUS_IDENTIFIERS: Record<string, string> = {
  author_id:     'author_profile_id',
  authorId:      'authorProfileId',
  owner_id:      'owner_profile_id',
  ownerId:       'ownerProfileId',
  creator_id:    'creator_profile_id',
  creatorId:     'creatorProfileId',
  driver_id:     'driver_profile_id',
  driverId:      'driverProfileId',
  sender_id:     'sender_profile_id',
  senderId:      'senderProfileId',
  recipient_id:  'recipient_profile_id',
  recipientId:   'recipientProfileId',
  moderator_id:  'moderator_profile_id',
  moderatorId:   'moderatorProfileId',
  reviewer_id:   'reviewer_profile_id',
  reviewerId:    'reviewerProfileId',
};

// ─── Regression Guards ───────────────────────────────────────────────────────
// Symbols that were removed and must never return to the codebase.
// Each entry: pattern (regex string) → message shown on violation.

interface RegressionGuard {
  pattern: RegExp;
  message: string;
  // If true, also flag occurrences inside comment lines
  includeComments?: boolean;
}

const REGRESSION_GUARDS: RegressionGuard[] = [
  {
    pattern: /\buseAuthContext\b/,
    message: '❌ REGRESSION: useAuthContext was removed. Use useSessionContext from @/core/session instead.',
  },
  {
    pattern: /\bAuthProvider\b/,
    message: '❌ REGRESSION: AuthProvider was removed. SessionProvider is the only auth provider.',
  },
  {
    pattern: /\bcanUserPerformAction\b/,
    message: '❌ REGRESSION: canUserPerformAction was removed. Use AuthorizationEngine.canProfilePerformAction() instead.',
  },
  {
    pattern: /\buseUserPermissions\b/,
    message: '❌ REGRESSION: useUserPermissions was removed. Use usePermission (reactive) or useAuthorization (imperative) from @/core/authorization instead.',
  },
  {
    pattern: /\buseActiveProfile\b/,
    message: '❌ REGRESSION: useActiveProfile was removed. Use useSessionContext from @/core/session instead.',
  },
  {
    pattern: /\buseUserProfiles\b/,
    message: '❌ REGRESSION: useUserProfiles was removed. Use useSessionContext from @/core/session instead.',
  },
];

interface RegressionViolation {
  file: string;
  line: number;
  symbol: string;
  message: string;
}

// Pre-build a single regex that matches any prohibited identifier as a whole word
const IDENTIFIER_PATTERN = new RegExp(
  `\\b(${Object.keys(AMBIGUOUS_IDENTIFIERS).join('|')})\\b`,
  'g'
);

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

// Files that are allowed to use regression-guarded symbols
// Multi-profile implementation (Phases 4-6) uses useActiveProfile as a NEW hook
const REGRESSION_WHITELIST = new Set([
  'src/core/profiles/hooks/useActiveProfile.ts',
  'src/core/profiles/hooks/useProfiles.ts',
  'src/core/profiles/hooks/useProfileMembers.ts',
  'src/core/profiles/hooks/useProfileLinks.ts',
  'src/core/profiles/hooks/index.ts',
  'src/core/profiles/contexts/MultiProfileContext.tsx',
  'src/core/profiles/components/MultiProfileSwitcher.tsx',
  'src/core/profiles/components/PrivacySettings.tsx',
  'src/core/profiles/components/ProfileLinksManager.tsx',
  'src/core/profiles/components/ProfileMembersManager.tsx',
  'src/app/pages/ProfileSettingsPage.tsx',
  'src/app/pages/PublicProfilePage.tsx',
]);

function isCommentLine(line: string): boolean {
  const trimmed = line.trimStart();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*')
  );
}

function walkDir(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath, files);
    } else {
      const ext = extname(entry);
      if (ext === '.ts' || ext === '.tsx') {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function scanFile(filePath: string, cwd: string): Violation[] {
  const violations: Violation[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(cwd, filePath).replace(/\\/g, '/');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isCommentLine(line)) continue;

    IDENTIFIER_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = IDENTIFIER_PATTERN.exec(line)) !== null) {
      const identifier = match[1];
      violations.push({
        file: relPath,
        line: i + 1,
        identifier,
        suggestion: AMBIGUOUS_IDENTIFIERS[identifier],
      });
    }
  }

  return violations;
}

function scanFileForRegressions(filePath: string, cwd: string): RegressionViolation[] {
  const violations: RegressionViolation[] = [];
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = relative(cwd, filePath).replace(/\\/g, '/');

  // Skip files in whitelist
  if (REGRESSION_WHITELIST.has(relPath)) {
    return violations;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip pure comment lines for regression guards
    if (isCommentLine(line)) continue;

    for (const guard of REGRESSION_GUARDS) {
      guard.pattern.lastIndex = 0;
      if (guard.pattern.test(line)) {
        const symbolMatch = line.match(guard.pattern);
        violations.push({
          file: relPath,
          line: i + 1,
          symbol: symbolMatch ? symbolMatch[0] : guard.pattern.source,
          message: guard.message,
        });
      }
    }
  }

  return violations;
}

function run(): void {
  const cwd = process.cwd();
  const srcDir = join(cwd, 'src');

  const files = walkDir(srcDir);
  const allViolations: Violation[] = [];
  const allRegressions: RegressionViolation[] = [];

  for (const file of files) {
    allViolations.push(...scanFile(file, cwd));
    allRegressions.push(...scanFileForRegressions(file, cwd));
  }

  let hasErrors = false;

  if (allRegressions.length > 0) {
    hasErrors = true;
    console.error('\n🚨 REGRESSION GUARD VIOLATIONS:');
    for (const v of allRegressions) {
      console.error(`  ${v.file}:${v.line} — ${v.message}`);
    }
    console.error(`\n❌ ${allRegressions.length} regression(s) detected. These symbols were removed and must not return.`);
  }

  if (allViolations.length > 0) {
    hasErrors = true;
    console.error('\n⚠️  AMBIGUOUS IDENTIFIER VIOLATIONS:');
    for (const v of allViolations) {
      console.error(
        `  ${v.file}:${v.line} - ambiguous identifier "${v.identifier}" found. Use "${v.suggestion}" instead.`
      );
    }
    console.error(`\n❌ ${allViolations.length} ambiguous identifier violation(s) found.`);
  }

  if (!hasErrors) {
    console.log('✅ No ambiguous session-context identifiers found.');
    console.log('✅ No regression guard violations found.');
    process.exit(0);
  }

  process.exit(1);
}

// Run only when executed as main script
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('validate-session-context.ts') ||
  process.argv[1]?.endsWith('validate-session-context.js');

if (isMain) {
  run();
}

export { run, scanFile, scanFileForRegressions, walkDir };
