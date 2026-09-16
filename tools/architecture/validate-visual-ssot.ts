#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const CANONICAL_BRAND_TOKENS = [
  '--brand-petroleum: 178.636 55% 15.686%; /* #123E3D */',
  '--brand-solar: 45.629 87.435% 62.549%; /* #F3CB4C */',
  '--brand-surface: 75 33.333% 97.647%; /* #FAFBF7 */',
  '--brand-text: 177.143 24.706% 16.667%; /* #203534 */',
  '--brand-text-secondary: 156.667 8.491% 41.569%; /* #61736C */',
] as const;

const MIGRATED_RUNTIME_FILES = [
  'src/app/components/auth/AuthBrandHeader.tsx',
  'src/app/components/auth/AuthFooter.tsx',
  'src/app/components/auth/auth-concept-layout.css',
  'src/app/pages/LoginPage.tsx',
  'src/app/pages/EmailChangeConfirmationPage.tsx',
  'src/styles/theme.ts',
] as const;

const LEGACY_FONT_RE = /(?:DM Sans|Space Grotesk|Manrope|Bricolage Grotesque)/;
const RAW_RUNTIME_COLOR_RE = /(?:#[0-9a-fA-F]{3,8}\b|\brgba?\s*\()/;

const EMAIL_BRAND_HEX = new Set([
  '#123E3D',
  '#F3CB4C',
  '#FAFBF7',
  '#203534',
  '#61736C',
  '#FFFFFF',
  '#D6DFDA',
  '#F6F8F3',
]);

function readRequired(relative: string, violations: string[]): string {
  const absolute = path.join(ROOT, relative);
  if (!fs.existsSync(absolute)) {
    violations.push(`${relative}: required visual identity owner/consumer is missing.`);
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
}

function findHexColors(content: string): string[] {
  return Array.from(content.matchAll(/#[0-9a-fA-F]{6}\b/g), (match) => match[0]);
}

function requireIncludes(
  relative: string,
  content: string,
  expected: readonly string[],
  violations: string[],
): void {
  for (const token of expected) {
    if (!content.includes(token)) {
      violations.push(`${relative}: canonical visual SSOT token missing: ${token}`);
    }
  }
}

function main(): void {
  const violations: string[] = [];

  const indexCss = readRequired('src/index.css', violations);
  requireIncludes('src/index.css', indexCss, CANONICAL_BRAND_TOKENS, violations);
  requireIncludes(
    'src/index.css',
    indexCss,
    [
      '--font-sans: "Plus Jakarta Sans", Arial, Helvetica, sans-serif;',
      '--font-heading: var(--font-sans);',
      '--territory-raised: var(--territory-surface-raised);',
    ],
    violations,
  );

  const tailwind = readRequired('tailwind.config.ts', violations);
  requireIncludes(
    'tailwind.config.ts',
    tailwind,
    [
      'sans: ["var(--font-sans)"]',
      'display: ["var(--font-heading)"]',
      'heading: ["var(--font-heading)"]',
    ],
    violations,
  );
  if (tailwind.includes('ACHEGUE_SE_FONT_FAMILY') || tailwind.includes('addBase')) {
    violations.push(
      'tailwind.config.ts: typography primitives must be consumed from src/index.css, not re-declared by a Tailwind plugin.',
    );
  }

  const indexHtml = readRequired('index.html', violations);
  requireIncludes(
    'index.html',
    indexHtml,
    [
      'family=Plus+Jakarta+Sans:wght@400;500;600;700;800',
      '<meta name="theme-color" content="#123E3D"',
    ],
    violations,
  );
  if (LEGACY_FONT_RE.test(indexHtml)) {
    violations.push('index.html: legacy font family found in the global font loader.');
  }

  for (const relative of MIGRATED_RUNTIME_FILES) {
    const content = readRequired(relative, violations);
    if (RAW_RUNTIME_COLOR_RE.test(content)) {
      violations.push(
        `${relative}: raw runtime color found after SSOT migration; use semantic CSS/Tailwind tokens.`,
      );
    }
    if (LEGACY_FONT_RE.test(content)) {
      violations.push(`${relative}: legacy font found after Plus Jakarta Sans migration.`);
    }
  }

  const authEmail = readRequired('supabase/templates/confirmation.html', violations);
  requireIncludes(
    'supabase/templates/confirmation.html',
    authEmail,
    [
      "font-family:'Plus Jakarta Sans', Arial, Helvetica, sans-serif",
      '{{ .ConfirmationURL }}',
      '#123E3D',
      '#F3CB4C',
      '#FAFBF7',
      '#203534',
      '#61736C',
    ],
    violations,
  );
  for (const color of findHexColors(authEmail)) {
    if (!EMAIL_BRAND_HEX.has(color.toUpperCase())) {
      violations.push(
        `supabase/templates/confirmation.html: non-canonical email color ${color}.`,
      );
    }
  }

  const emailService = readRequired(
    'src/core/notifications/services/EmailService.ts',
    violations,
  );
  requireIncludes(
    'src/core/notifications/services/EmailService.ts',
    emailService,
    [
      "const EMAIL_FONT_STACK = \"'Plus Jakarta Sans', Arial, Helvetica, sans-serif\";",
      "petroleum: '#123E3D'",
      "solar: '#F3CB4C'",
      "ivory: '#FAFBF7'",
      "text: '#203534'",
      "textSecondary: '#61736C'",
    ],
    violations,
  );
  for (const color of findHexColors(emailService)) {
    if (!EMAIL_BRAND_HEX.has(color.toUpperCase())) {
      violations.push(
        `src/core/notifications/services/EmailService.ts: non-canonical email color ${color}.`,
      );
    }
  }

  if (violations.length > 0) {
    console.error('Visual identity SSOT violations:\n');
    for (const violation of violations) console.error(`- ${violation}`);
    process.exit(1);
  }

  console.log(
    'Visual identity SSOT valid: canonical brand primitives and typography are owned by src/index.css, Tailwind/theme consume them, migrated auth surfaces use semantic tokens, and email projections stay synchronized with the brand palette.',
  );
}

main();
