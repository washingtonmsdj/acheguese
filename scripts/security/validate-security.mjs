#!/usr/bin/env node

/**
 * SECURITY VALIDATION SCRIPT
 *
 * Valida configuracoes criticas de seguranca antes de deploy.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { dirname, extname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../..');

const CHECKS = [
  {
    id: 'hardcoded-secrets',
    name: 'Credenciais hardcoded',
    severity: 'CRITICO',
    patterns: [
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      /sk_live_[A-Za-z0-9]+/g,
      /sk_test_[A-Za-z0-9]+/g,
      /whsec_[A-Za-z0-9]+/g,
      /sb_secret_[A-Za-z0-9_-]{20,}/g,
    ],
    exclude: [
      '.env.example',
      '.env.local.example',
      '.env.remote.example',
      '.gitleaks.toml',
      'scripts/security/validate-security.mjs',
      'scripts/sanitize-secrets.ts',
      'docs/',
      '.md',
    ],
  },
  {
    id: 'cors-wildcard',
    name: 'CORS permissivo com wildcard',
    severity: 'CRITICO',
    patterns: [
      /'Access-Control-Allow-Origin':\s*'\*'/g,
      /"Access-Control-Allow-Origin":\s*"\*"/g,
    ],
    exclude: ['scripts/security/validate-security.mjs', 'docs/', '.md'],
  },
  {
    id: 'vite-service-role',
    name: 'Uso de VITE_SUPABASE_SERVICE_ROLE_KEY',
    severity: 'ALTO',
    patterns: [
      /process\.env\.VITE_SUPABASE_SERVICE_ROLE_KEY/g,
      /import\.meta\.env\.VITE_SUPABASE_SERVICE_ROLE_KEY/g,
    ],
    exclude: [
      'docs/',
      '.md',
      'scripts/security/validate-security.mjs',
      'src/integrations/supabase/supabaseAdmin.ts',
    ],
  },
];

const SCAN_PREFIXES = [
  'supabase/functions/',
  'src/integrations/supabase/',
  'src/core/admin/',
  'src/modules/admin/',
  'scripts/',
  'public/',
  '.env',
  'vercel.json',
];

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.sql',
  '.ps1',
  '.sh',
  '.json',
  '.html',
  '.env',
]);

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function shouldExclude(filePath, excludePatterns) {
  return excludePatterns.some((pattern) => {
    if (pattern.endsWith('/')) return filePath.includes(pattern);
    return filePath.endsWith(pattern) || filePath.includes(pattern);
  });
}

function shouldScan(filePath) {
  const normalized = toPosix(filePath);
  if (normalized.startsWith('scripts/debug/')) return false;
  const hasPrefix = SCAN_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!hasPrefix) return false;

  if (normalized.endsWith('.env')) return true;
  return SCAN_EXTENSIONS.has(extname(normalized));
}

function listTrackedFiles() {
  const files = [];

  function walk(relativeDir) {
    const absoluteDir = join(ROOT_DIR, relativeDir);
    const entries = readdirSync(absoluteDir);

    for (const entry of entries) {
      const nextRelative = relativeDir ? `${relativeDir}/${entry}` : entry;
      const nextAbsolute = join(ROOT_DIR, nextRelative);
      const stats = statSync(nextAbsolute);

      if (stats.isDirectory()) {
        if (
          entry === '.git' ||
          entry === 'node_modules' ||
          entry === 'dist' ||
          entry === 'coverage' ||
          entry === 'playwright-report' ||
          entry === 'test-results'
        ) {
          continue;
        }
        walk(nextRelative);
        continue;
      }

      if (stats.isFile()) {
        files.push(toPosix(nextRelative));
      }
    }
  }

  walk('');
  return files;
}

function validateEnvironment() {
  const issues = [];

  const localEnvPath = join(ROOT_DIR, '.env.local');
  if (!existsSync(localEnvPath)) {
    issues.push({
      severity: 'AVISO',
      message: '.env.local nao encontrado - crie a partir de .env.local.example',
    });
  }

  const envPath = join(ROOT_DIR, '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');

    if (envContent.includes('VITE_SUPABASE_SERVICE_ROLE_KEY=')) {
      issues.push({
        severity: 'CRITICO',
        message: '.env contem VITE_SUPABASE_SERVICE_ROLE_KEY - isso expoe chave sensivel no frontend',
      });
    }

    if (
      envContent.includes('E2E_USER_PASSWORD=') &&
      !envContent.includes('E2E_USER_PASSWORD="[') &&
      !envContent.includes('# E2E Test Credentials (MOVIDO')
    ) {
      issues.push({
        severity: 'CRITICO',
        message: '.env contem credenciais de teste - mova para .env.local',
      });
    }
  }

  return issues;
}

function scanFile(relativePath, check) {
  if (shouldExclude(relativePath, check.exclude)) {
    return [];
  }

  const absolutePath = join(ROOT_DIR, relativePath);

  try {
    const content = readFileSync(absolutePath, 'utf-8');
    const issues = [];

    for (const pattern of check.patterns) {
      const matches = content.match(pattern);
      if (matches?.length) {
        issues.push({
          severity: check.severity,
          check: check.name,
          file: relativePath,
          matches: matches.length,
        });
      }
    }

    return issues;
  } catch {
    return [];
  }
}

function main() {
  console.log('SECURITY VALIDATION\n');

  const allIssues = [];

  console.log('1) Validando ambiente...');
  const envIssues = validateEnvironment();
  allIssues.push(...envIssues);
  console.log(envIssues.length === 0 ? '   OK\n' : `   ${envIssues.length} problema(s)\n`);

  console.log('2) Escaneando arquivos de risco...');
  const trackedFiles = listTrackedFiles().filter(shouldScan);

  for (const file of trackedFiles) {
    for (const check of CHECKS) {
      const issues = scanFile(file, check);
      allIssues.push(...issues);
    }
  }

  console.log(allIssues.length === 0 ? '   Nenhum problema\n' : `   ${allIssues.length} problema(s)\n`);

  const critical = allIssues.filter((issue) => issue.severity === 'CRITICO');
  const high = allIssues.filter((issue) => issue.severity === 'ALTO');
  const warnings = allIssues.filter((issue) => issue.severity === 'AVISO');

  if (critical.length > 0) {
    console.log('CRITICO:');
    for (const issue of critical) {
      console.log(`- ${issue.check || issue.message}`);
      if (issue.file) console.log(`  arquivo: ${issue.file}`);
      if (issue.matches) console.log(`  ocorrencias: ${issue.matches}`);
    }
    console.log('');
  }

  if (high.length > 0) {
    console.log('ALTO:');
    for (const issue of high) {
      console.log(`- ${issue.check || issue.message}`);
      if (issue.file) console.log(`  arquivo: ${issue.file}`);
      if (issue.matches) console.log(`  ocorrencias: ${issue.matches}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('AVISO:');
    for (const issue of warnings) {
      console.log(`- ${issue.message}`);
    }
    console.log('');
  }

  if (critical.length > 0 || high.length > 0) {
    console.log('VALIDACAO FALHOU');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.log('VALIDACAO PASSOU COM AVISOS');
    process.exit(0);
  }

  console.log('VALIDACAO PASSOU');
  process.exit(0);
}

main();
