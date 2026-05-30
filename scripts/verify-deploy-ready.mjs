#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

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

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_PUBLIC_SITE_URL',
  'VITE_CONTACT_EMAIL',
  'VITE_DPO_EMAIL',
  'BASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ALLOWED_ORIGINS',
  'ALLOWED_REDIRECT_DOMAINS',
  'CRON_SECRET',
  'VAPID_PUBLIC_KEY',
  'RESEND_API_KEY',
  'FROM_EMAIL',
  'EMAIL_FROM_DOMAIN',
  'EMAIL_FROM_NAME',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'LOVABLE_API_KEY',
  'REPLICATE_API_TOKEN',
  'TRYON_REPLICATE_MODEL_VERSION',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT',
  'NOMINATIM_BASE_URL',
  'NOMINATIM_USER_AGENT',
  'NOMINATIM_ACCEPT_LANGUAGE',
  'NOMINATIM_DEFAULT_COUNTRY',
  'NOMINATIM_DEFAULT_COUNTRY_CODES',
  'NOMINATIM_DEFAULT_FORMAT',
  'NOMINATIM_DEFAULT_ADDRESSDETAILS',
  'NOMINATIM_DEFAULT_LIMIT',
];

const REQUIRED_ENV_GROUPS = [
  {
    name: 'TRYON_REPLICATE_HUMAN_IMAGE_*',
    vars: [
      'TRYON_REPLICATE_HUMAN_IMAGE_URL',
      'TRYON_REPLICATE_HUMAN_IMAGE_MALE_URL',
      'TRYON_REPLICATE_HUMAN_IMAGE_FEMALE_URL',
      'TRYON_REPLICATE_HUMAN_IMAGE_NEUTRAL_URL',
    ],
    featureFlagEnv: 'VITE_FEATURE_AI_VIRTUAL_TRYON',
    message:
      'configure TRYON_REPLICATE_HUMAN_IMAGE_URL or all gender-specific human image URLs',
  },
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

const REQUIRED_SCRIPTS = ['build', 'typecheck:app', 'lint', 'validate:ssot', 'security:validate'];
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

function getPublicSiteHost() {
  const rawUrl = process.env.VITE_PUBLIC_SITE_URL?.trim();
  if (!rawUrl) return null;

  try {
    return new URL(rawUrl).hostname;
  } catch {
    fail('VITE_PUBLIC_SITE_URL deve ser uma URL absoluta valida');
    return null;
  }
}

function isEnabledEnvironmentFlag(envVar) {
  return process.env[envVar]?.trim().toLowerCase() === 'true';
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
  vercelConfig.buildCommand ? ok(`build command: ${vercelConfig.buildCommand}`) : fail('buildCommand nao definido');
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

console.log('Variaveis de ambiente para configurar na Vercel');
console.log('  Obrigatorias:');
for (const envVar of REQUIRED_ENV_VARS) {
  const value = process.env[envVar];
  if (!value) {
    console.log(`    - ${envVar}`);
    continue;
  }

  if (/your[-_]|placeholder|publishable_key|example|_here$/i.test(value)) {
    fail(`${envVar} contem placeholder`);
  } else {
    ok(`${envVar} configurada`);
  }
}
console.log('  Grupos obrigatorios:');
for (const group of REQUIRED_ENV_GROUPS) {
  if (group.featureFlagEnv && !isEnabledEnvironmentFlag(group.featureFlagEnv)) {
    ok(`${group.name} nao exigido porque ${group.featureFlagEnv} nao esta ativo`);
    continue;
  }

  const values = group.vars.map((envVar) => process.env[envVar]?.trim() ?? '');
  const hasGlobal = Boolean(values[0]);
  const hasAllSpecific = values.slice(1).every(Boolean);

  if (!hasGlobal && !hasAllSpecific) {
    fail(`${group.name}: ${group.message}`);
    continue;
  }

  ok(`${group.name} configurado`);
}
console.log('  Opcionais recomendadas:');
for (const envVar of OPTIONAL_ENV_VARS) console.log(`    - ${envVar}`);
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

  const eventFiles = collectRuntimeSourceFiles('src/features/events');
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
