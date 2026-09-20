#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REQUIRED_FILES = [
  'package.json',
  'vite.config.ts',
  'index.html',
  'vercel.json',
  '.vercelignore',
  'tsconfig.json',
];

const REQUIRED_PUBLIC_ASSETS = [
  'public/manifest.json',
  'public/icon-192x192.png',
  'public/icon-512x512.png',
  'public/badge-72x72.png',
  'public/og-image.png',
];

const REQUIRED_VERCEL_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_TURNSTILE_SITE_KEY',
  'VITE_PUBLIC_SITE_URL',
  'VITE_CONTACT_EMAIL',
  'VITE_DPO_NAME',
  'VITE_DPO_EMAIL',
  'VITE_LEGAL_FORUM',
];

const OPTIONAL_ENV_VARS = [
  'VITE_SENTRY_DSN',
  'VITE_FEATURE_COMMUNITY_ALERTS',
  'VITE_FEATURE_AI_VIRTUAL_TRYON',
  'VITE_FEATURE_MAPS_V4',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_ALLOWED_BILLING_REDIRECT_ORIGINS',
  'VITE_ALLOWED_QR_REDIRECT_ORIGINS',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'IBGE_DISTRICTS_URL',
  'NOMINATIM_DEFAULT_COUNTRY_NAME',
  'NOMINATIM_REQUEST_DELAY_MS',
];

const REQUIRED_SCRIPTS = [
  'typecheck:app',
  'lint',
  'build',
  'build:vercel',
  'validate:csp',
  'validate:vercel:inputs',
  'validate:turnstile:production',
  'validate:deps',
  'validate:taxonomy',
  'validate:architecture:incremental',
  'validate:architecture:core-platform',
  'validate:architecture:governance',
  'validate:session-context',
  'validate:ssot',
  'validate:hardcodes',
  'validate:upload:ssot',
  'validate:migrations',
  'validate:migrations:provenance',
  'validate:migrations:remote',
  'validate:free-release-governance',
  'validate:free-release-governance:remote',
  'validate:security-authority',
  'security:validate',
  'security:config:validate',
];
const FORBIDDEN_BILLING_ARTIFACTS = [
  'supabase/functions/stripe-webhook/index.ts',
  'supabase/functions/gastronomy-upgrade-plan/index.ts',
  'supabase/functions/gastronomy-cancel-subscription/index.ts',
  'supabase/functions/gastronomy-reactivate-subscription/index.ts',
  'supabase/functions/gastronomy-add-payment-method/index.ts',
  'src/core/billing/plans.ts',
  'src/modules/business/gastronomy/billing',
];

let hasErrors = false;
let hasWarnings = false;

function ok(message) {
  console.log(`  OK    ${message}`);
}

function warn(message) {
  console.log(`  AVISO ${message}`);
  hasWarnings = true;
}

function fail(message) {
  console.log(`  FALHA ${message}`);
  hasErrors = true;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function getPublicSiteUrl() {
  const rawUrl = process.env.VITE_PUBLIC_SITE_URL?.trim();
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:') {
      fail('VITE_PUBLIC_SITE_URL deve usar HTTPS em producao');
      return null;
    }
    return url;
  } catch {
    fail('VITE_PUBLIC_SITE_URL deve ser uma URL absoluta valida');
    return null;
  }
}

function getPublicSiteHost() {
  return getPublicSiteUrl()?.hostname ?? null;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function collectSourceFiles(root, extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])) {
  if (!existsSync(root)) return [];

  const files = [];
  for (const entry of readdirSync(root)) {
    const fullPath = `${root}/${entry}`;
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(fullPath, extensions));
      continue;
    }

    const extension = entry.slice(entry.lastIndexOf('.'));
    if (extensions.has(extension)) files.push(fullPath);
  }

  return files;
}

function isTestSourceFile(file) {
  const normalized = file.replaceAll('\\', '/');
  return (
    normalized.includes('/__tests__/') ||
    normalized.includes('.spec.') ||
    normalized.includes('.test.')
  );
}

function collectRuntimeSourceFiles(root, extensions) {
  return collectSourceFiles(root, extensions).filter((file) => !isTestSourceFile(file));
}

function runNpmScript(scriptName) {
  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npmCommand, ['run', scriptName], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (result.error) {
    fail(`falha ao executar ${scriptName}: ${result.error.message}`);
    return;
  }

  if (result.status !== 0) {
    const summary = output.split(/\r?\n/).slice(-12).join('\n');
    fail(`${scriptName} falhou${summary ? `:\n${summary}` : ''}`);
    return;
  }

  ok(`${scriptName} passou`);
}

console.log('Verificando preparacao para deploy...\n');

console.log('Arquivos obrigatorios');
for (const file of REQUIRED_FILES) {
  existsSync(file) ? ok(file) : fail(`${file} nao encontrado`);
}
console.log();

console.log('package.json');
try {
  const pkg = readJson('package.json');
  pkg.name ? ok(`nome do projeto: ${pkg.name}`) : warn('nome do projeto nao definido');
  pkg.type === 'module' ? ok('type module configurado') : warn('package.json deveria declarar type=module');

  for (const scriptName of REQUIRED_SCRIPTS) {
    pkg.scripts?.[scriptName]
      ? ok(`script ${scriptName}: ${pkg.scripts[scriptName]}`)
      : fail(`script obrigatorio ausente: ${scriptName}`);
  }
} catch (error) {
  fail(`erro ao ler package.json: ${error.message}`);
}
console.log();

console.log('vercel.json');
try {
  const vercelConfig = readJson('vercel.json');
  vercelConfig.git?.deploymentEnabled?.['*'] === false &&
  vercelConfig.git?.deploymentEnabled?.main === true
    ? ok('automatic Vercel deployments: main only')
    : fail('git.deploymentEnabled deve bloquear previews automáticos e permitir main');

  vercelConfig.ignoreCommand === 'node tools/release/vercel-ignore-build.mjs'
    ? ok(`ignore command: ${vercelConfig.ignoreCommand}`)
    : fail('ignoreCommand deve usar o guard canônico de build');

  vercelConfig.installCommand ===
  'node tools/release/validate-package-lock-consistency.mjs && npm ci'
    ? ok('install command: lockfile consistency + npm ci')
    : fail('installCommand deve validar o lockfile antes do npm ci');

  vercelConfig.buildCommand === 'node tools/release/run-vercel-production-build.mjs'
    ? ok(`build command: ${vercelConfig.buildCommand}`)
    : fail('buildCommand deve executar o runner canônico de produção');
  vercelConfig.outputDirectory ? ok(`output directory: ${vercelConfig.outputDirectory}`) : fail('outputDirectory nao definido');
  Array.isArray(vercelConfig.rewrites) && vercelConfig.rewrites.length > 0 ? ok('rewrites configurados para SPA') : fail('rewrites nao configurados');
  Array.isArray(vercelConfig.headers) && vercelConfig.headers.length > 0 ? ok('headers configurados') : fail('headers nao configurados');

  const serializedHeaders = JSON.stringify(vercelConfig.headers ?? []);
  serializedHeaders.includes('Content-Security-Policy') ? ok('Content-Security-Policy configurada') : fail('Content-Security-Policy ausente');
  serializedHeaders.includes('Strict-Transport-Security') ? ok('Strict-Transport-Security configurado') : fail('Strict-Transport-Security ausente');
} catch (error) {
  fail(`erro ao ler vercel.json: ${error.message}`);
}
console.log();

console.log('Variaveis de ambiente da Vercel');
console.log('  Obrigatorias para build/browser:');
for (const envVar of REQUIRED_VERCEL_ENV_VARS) {
  const value = process.env[envVar];
  if (!value) {
    fail(`${envVar} ausente`);
    continue;
  }

  if (/your[-_]|placeholder|publishable_key|example|_here$/i.test(value)) {
    fail(`${envVar} contem placeholder`);
  } else {
    ok(`${envVar} configurada`);
  }
}

for (const emailVar of ['VITE_CONTACT_EMAIL', 'VITE_DPO_EMAIL']) {
  const value = process.env[emailVar]?.trim() ?? '';
  if (value && !isValidEmail(value)) {
    fail(`${emailVar} deve conter um email valido`);
  }
}

const dpoName = process.env.VITE_DPO_NAME?.trim() ?? '';
if (dpoName && dpoName.length < 3) {
  fail('VITE_DPO_NAME deve identificar publicamente o encarregado');
}

const legalForum = process.env.VITE_LEGAL_FORUM?.trim() ?? '';
if (legalForum && legalForum.length < 3) {
  fail('VITE_LEGAL_FORUM deve identificar o foro aplicavel');
}

getPublicSiteUrl();
console.log('  Opcionais recomendadas:');
for (const envVar of OPTIONAL_ENV_VARS) console.log(`    - ${envVar}`);
console.log('  Supabase Edge:');
console.log('    - secrets privados pertencem ao runtime Edge, nao ao build/browser da Vercel');
console.log('    - valide cada Edge Function habilitada com tools/security/supabase-edge-secrets-preflight.mjs --function <slug> --json');
console.log();

console.log('Estrutura de build');
existsSync('src/main.tsx') || existsSync('src/main.ts') ? ok('entry point encontrado') : fail('entry point ausente');
existsSync('src/App.tsx') || existsSync('src/App.ts') ? ok('App component encontrado') : fail('App component ausente');
existsSync('public') ? ok('pasta public existe') : fail('pasta public ausente');
console.log();

console.log('PWA e assets sociais');
for (const asset of REQUIRED_PUBLIC_ASSETS) {
  existsSync(asset) ? ok(asset) : fail(`${asset} ausente`);
}
console.log();

console.log('Billing canonico');
for (const file of FORBIDDEN_BILLING_ARTIFACTS) {
  existsSync(file) ? fail(`${file} nao deve existir`) : ok(`${file} removido`);
}
console.log();

console.log('Qualidade de codigo');
runNpmScript('build:vercel');
console.log();

console.log('Arquitetura e SSOT');
runNpmScript('validate:deps');
runNpmScript('validate:taxonomy');
runNpmScript('validate:architecture:incremental');
runNpmScript('validate:architecture:core-platform');
runNpmScript('validate:architecture:governance');
runNpmScript('validate:session-context');
runNpmScript('validate:ssot');
runNpmScript('validate:hardcodes');
runNpmScript('validate:upload:ssot');
console.log();

console.log('Supabase remoto');
runNpmScript('validate:migrations');
runNpmScript('validate:migrations:provenance');
runNpmScript('validate:migrations:remote');
console.log();

console.log('Security Authority');
runNpmScript('validate:security-authority');
console.log();

console.log('Seguranca');
runNpmScript('security:validate');
runNpmScript('security:config:validate');
console.log();

console.log('Higiene de runtime');
try {
  const sourceFiles = collectRuntimeSourceFiles('src');
  const nativeDialogPattern = /\b(?:window\.)?(alert|prompt)\s*\(|window\.confirm\s*\(|\bconfirm\s*\(\s*["']/;
  const nativeDialogAllowlist = new Set([
    'src/shared/hooks/useConfirmActionDialog.tsx',
  ]);
  const nativeDialogFindings = sourceFiles.filter((file) => {
    if (nativeDialogAllowlist.has(file)) return false;
    const content = readFileSync(file, 'utf-8');
    return nativeDialogPattern.test(content);
  });

  nativeDialogFindings.length === 0
    ? ok('sem dialogos nativos de navegador no runtime')
    : fail(`dialogos nativos encontrados: ${nativeDialogFindings.join(', ')}`);

  const eventFiles = collectRuntimeSourceFiles('src/modules/community-events');
  const eventPlaceholderPattern = /\bTODO\b|\bFIXME\b|sera implementado|será implementado/i;
  const eventPlaceholderFindings = eventFiles.filter((file) =>
    eventPlaceholderPattern.test(readFileSync(file, 'utf-8')),
  );

  eventPlaceholderFindings.length === 0
    ? ok('eventos sem placeholders operacionais')
    : fail(`placeholders operacionais em eventos: ${eventPlaceholderFindings.join(', ')}`);
} catch (error) {
  fail(`erro ao verificar higiene de runtime: ${error.message}`);
}
console.log();

console.log('TypeScript');
try {
  const tsconfig = readJson('tsconfig.json');
  Array.isArray(tsconfig.references) && tsconfig.references.length > 0 ? ok('project references configuradas') : warn('project references nao configuradas');
  ok('tsconfig.json valido');
} catch (error) {
  fail(`erro ao ler tsconfig.json: ${error.message}`);
}
console.log();

console.log('SEO');
try {
  const indexHtml = readFileSync('index.html', 'utf-8');
  indexHtml.includes('<title>') ? ok('tag title encontrada') : warn('tag title nao encontrada');
  indexHtml.includes('description') ? ok('meta description encontrada') : warn('meta description nao encontrada');
  indexHtml.includes('og:') ? ok('Open Graph encontrado') : warn('Open Graph nao encontrado');
} catch (error) {
  warn(`erro ao verificar index.html: ${error.message}`);
}
console.log();

console.log('robots.txt');
if (existsSync('public/robots.txt')) {
  try {
    const publicDomain = getPublicSiteHost();
    const robots = readFileSync('public/robots.txt', 'utf-8');
    if (publicDomain) {
      robots.includes(publicDomain)
        ? ok(`robots.txt aponta para ${publicDomain}`)
        : fail(`robots.txt nao contem ${publicDomain}`);
    }
  } catch (error) {
    fail(`erro ao ler robots.txt: ${error.message}`);
  }
} else {
  fail('robots.txt nao encontrado');
}
console.log();

console.log('='.repeat(64));
if (hasErrors) {
  console.log('PROJETO NAO ESTA PRONTO PARA DEPLOY');
  process.exit(1);
}

if (hasWarnings) {
  console.log('PROJETO PODE SER DEPLOYADO, MAS HA AVISOS');
  process.exit(0);
}

console.log('PROJETO PRONTO PARA DEPLOY');
process.exit(0);
