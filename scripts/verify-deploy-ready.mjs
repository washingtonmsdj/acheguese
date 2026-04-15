#!/usr/bin/env node

/**
 * Script de Verificação Pré-Deploy
 * 
 * Verifica se o projeto está pronto para deploy na Vercel
 * 
 * @usage node scripts/verify-deploy-ready.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REQUIRED_FILES = [
  'package.json',
  'vite.config.ts',
  'index.html',
  'vercel.json',
  '.vercelignore',
  'tsconfig.json',
];

const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
];

const OPTIONAL_ENV_VARS = [
  'VITE_SENTRY_DSN',
  'VITE_FEATURE_COMMUNITY_ALERTS',
  'VITE_FEATURE_MAPS_V4',
  'VITE_GOOGLE_MAPS_API_KEY',
];

console.log('🔍 Verificando preparação para deploy...\n');

let hasErrors = false;
let hasWarnings = false;

// ── Verificar arquivos obrigatórios ──────────────────────────────────────────

console.log('📁 Verificando arquivos obrigatórios...');
for (const file of REQUIRED_FILES) {
  if (existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTANDO`);
    hasErrors = true;
  }
}
console.log();

// ── Verificar package.json ───────────────────────────────────────────────────

console.log('📦 Verificando package.json...');
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  
  if (pkg.scripts?.build) {
    console.log(`  ✅ Script "build" encontrado: ${pkg.scripts.build}`);
  } else {
    console.log('  ❌ Script "build" não encontrado');
    hasErrors = true;
  }
  
  if (pkg.name) {
    console.log(`  ✅ Nome do projeto: ${pkg.name}`);
  } else {
    console.log('  ⚠️  Nome do projeto não definido');
    hasWarnings = true;
  }
  
  if (pkg.type === 'module') {
    console.log('  ✅ Tipo: module');
  } else {
    console.log('  ⚠️  Tipo não é "module"');
    hasWarnings = true;
  }
} catch (error) {
  console.log(`  ❌ Erro ao ler package.json: ${error.message}`);
  hasErrors = true;
}
console.log();

// ── Verificar vercel.json ────────────────────────────────────────────────────

console.log('⚙️  Verificando vercel.json...');
try {
  const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'));
  
  if (vercelConfig.buildCommand) {
    console.log(`  ✅ Build command: ${vercelConfig.buildCommand}`);
  } else {
    console.log('  ⚠️  Build command não definido');
    hasWarnings = true;
  }
  
  if (vercelConfig.outputDirectory) {
    console.log(`  ✅ Output directory: ${vercelConfig.outputDirectory}`);
  } else {
    console.log('  ⚠️  Output directory não definido');
    hasWarnings = true;
  }
  
  if (vercelConfig.rewrites?.length > 0) {
    console.log('  ✅ Rewrites configurados (SPA routing)');
  } else {
    console.log('  ⚠️  Rewrites não configurados - rotas podem não funcionar');
    hasWarnings = true;
  }
  
  if (vercelConfig.headers?.length > 0) {
    console.log('  ✅ Headers de segurança configurados');
  } else {
    console.log('  ⚠️  Headers de segurança não configurados');
    hasWarnings = true;
  }
} catch (error) {
  console.log(`  ❌ Erro ao ler vercel.json: ${error.message}`);
  hasErrors = true;
}
console.log();

// ── Verificar variáveis de ambiente ──────────────────────────────────────────

console.log('🔐 Variáveis de ambiente necessárias:');
console.log('\n  📌 OBRIGATÓRIAS (configure na Vercel):');
for (const envVar of REQUIRED_ENV_VARS) {
  console.log(`     • ${envVar}`);
}

console.log('\n  📌 OPCIONAIS (recomendadas):');
for (const envVar of OPTIONAL_ENV_VARS) {
  console.log(`     • ${envVar}`);
}
console.log();

// ── Verificar estrutura de build ─────────────────────────────────────────────

console.log('🏗️  Verificando estrutura de build...');
if (existsSync('src/main.tsx') || existsSync('src/main.ts')) {
  console.log('  ✅ Entry point encontrado (src/main.tsx ou src/main.ts)');
} else {
  console.log('  ❌ Entry point não encontrado');
  hasErrors = true;
}

if (existsSync('src/App.tsx') || existsSync('src/App.ts')) {
  console.log('  ✅ App component encontrado');
} else {
  console.log('  ⚠️  App component não encontrado');
  hasWarnings = true;
}

if (existsSync('public')) {
  console.log('  ✅ Pasta public/ existe');
} else {
  console.log('  ⚠️  Pasta public/ não encontrada');
  hasWarnings = true;
}
console.log();

// ── Verificar TypeScript ─────────────────────────────────────────────────────

console.log('📘 Verificando TypeScript...');
if (existsSync('tsconfig.json')) {
  try {
    const tsconfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'));
    console.log('  ✅ tsconfig.json válido');
    
    if (tsconfig.compilerOptions?.strict) {
      console.log('  ✅ Modo strict ativado');
    } else {
      console.log('  ⚠️  Modo strict não ativado');
      hasWarnings = true;
    }
  } catch (error) {
    console.log(`  ❌ Erro ao ler tsconfig.json: ${error.message}`);
    hasErrors = true;
  }
} else {
  console.log('  ❌ tsconfig.json não encontrado');
  hasErrors = true;
}
console.log();

// ── Verificar SEO ────────────────────────────────────────────────────────────

console.log('🔍 Verificando SEO...');
try {
  const indexHtml = readFileSync('index.html', 'utf-8');
  
  if (indexHtml.includes('<title>')) {
    console.log('  ✅ Tag <title> encontrada');
  } else {
    console.log('  ⚠️  Tag <title> não encontrada');
    hasWarnings = true;
  }
  
  if (indexHtml.includes('description')) {
    console.log('  ✅ Meta description encontrada');
  } else {
    console.log('  ⚠️  Meta description não encontrada');
    hasWarnings = true;
  }
  
  if (indexHtml.includes('og:')) {
    console.log('  ✅ Open Graph tags encontradas');
  } else {
    console.log('  ⚠️  Open Graph tags não encontradas');
    hasWarnings = true;
  }
} catch (error) {
  console.log(`  ⚠️  Erro ao verificar index.html: ${error.message}`);
  hasWarnings = true;
}
console.log();

// ── Verificar robots.txt ─────────────────────────────────────────────────────

console.log('🤖 Verificando robots.txt...');
if (existsSync('public/robots.txt')) {
  try {
    const robots = readFileSync('public/robots.txt', 'utf-8');
    if (robots.includes('acheguese.com.br')) {
      console.log('  ✅ robots.txt configurado com domínio correto');
    } else {
      console.log('  ⚠️  robots.txt não contém domínio acheguese.com.br');
      hasWarnings = true;
    }
  } catch (error) {
    console.log(`  ⚠️  Erro ao ler robots.txt: ${error.message}`);
    hasWarnings = true;
  }
} else {
  console.log('  ⚠️  robots.txt não encontrado');
  hasWarnings = true;
}
console.log();

// ── Resultado final ──────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════════════');
if (hasErrors) {
  console.log('❌ PROJETO NÃO ESTÁ PRONTO PARA DEPLOY');
  console.log('   Corrija os erros acima antes de fazer deploy.');
  process.exit(1);
} else if (hasWarnings) {
  console.log('⚠️  PROJETO PODE SER DEPLOYADO, MAS HÁ AVISOS');
  console.log('   Recomenda-se corrigir os avisos para melhor resultado.');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Corrija os avisos (opcional)');
  console.log('   2. Configure variáveis de ambiente na Vercel');
  console.log('   3. Faça push para o repositório');
  console.log('   4. Deploy será automático');
  process.exit(0);
} else {
  console.log('✅ PROJETO PRONTO PARA DEPLOY!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Configure variáveis de ambiente na Vercel:');
  for (const envVar of REQUIRED_ENV_VARS) {
    console.log(`      • ${envVar}`);
  }
  console.log('   2. Faça push para o repositório');
  console.log('   3. Deploy será automático');
  console.log('\n📖 Consulte DEPLOY.md para instruções detalhadas');
  process.exit(0);
}
