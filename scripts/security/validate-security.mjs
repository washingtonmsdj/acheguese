#!/usr/bin/env node

/**
 * SECURITY VALIDATION SCRIPT
 * 
 * Valida configurações de segurança do projeto antes de deploy
 * 
 * Uso:
 *   node scripts/security/validate-security.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '../..');

// ══════════════════════════════════════════════════════════════════════════
// VALIDATION RULES
// ══════════════════════════════════════════════════════════════════════════

const SECURITY_CHECKS = {
  // Credenciais hardcoded
  hardcodedSecrets: {
    name: 'Credenciais Hardcoded',
    severity: 'CRÍTICO',
    patterns: [
      /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
      /sk_live_[A-Za-z0-9]+/g,
      /sk_test_[A-Za-z0-9]+/g,
      /whsec_[A-Za-z0-9]+/g,
    ],
    excludeFiles: [
      '.env.example',
      '.env.local.example',
      'SECURITY.md',
      '.gitleaks.toml',
      'validate-security.mjs',
    ],
  },
  
  // URLs hardcoded
  hardcodedUrls: {
    name: 'URLs do Supabase Hardcoded',
    severity: 'ALTO',
    patterns: [
      /https:\/\/[a-z0-9]+\.supabase\.co/g,
    ],
    excludeFiles: [
      '.env',  // .env pode ter URL (é template público)
      '.env.example',
      '.env.local.example',
      'SECURITY.md',
      'validate-security.mjs',
      // Arquivos de documentação podem ter URLs de exemplo
      '.md',
    ],
  },
  
  // Senhas fracas
  weakPasswords: {
    name: 'Senhas Fracas em Testes',
    severity: 'MÉDIO',
    patterns: [
      /TestUser123/g,
      /TestAdmin123/g,
      /TestDriver123/g,
      /password123/gi,
      /admin123/gi,
    ],
    excludeFiles: [
      '.env.example',
      'SECURITY.md',
      'validate-security.mjs',
      // Documentação pode mencionar senhas fracas como exemplo do que NÃO fazer
      'docs/',
    ],
  },
  
  // CORS permissivo
  corsWildcard: {
    name: 'CORS Permissivo (*)',
    severity: 'CRÍTICO',
    patterns: [
      /'Access-Control-Allow-Origin':\s*'\*'/g,
      /"Access-Control-Allow-Origin":\s*"\*"/g,
    ],
    excludeFiles: [
      'SECURITY.md',
      'validate-security.mjs',
    ],
  },
};

// ══════════════════════════════════════════════════════════════════════════
// ENVIRONMENT VALIDATION
// ══════════════════════════════════════════════════════════════════════════

function validateEnvironment() {
  const issues = [];
  
  // Verifica se .env.local existe
  if (!existsSync(join(ROOT_DIR, '.env.local'))) {
    issues.push({
      severity: 'AVISO',
      message: '.env.local não encontrado - crie a partir de .env.local.example',
    });
  }
  
  // Verifica se .env tem credenciais
  if (existsSync(join(ROOT_DIR, '.env'))) {
    const envContent = readFileSync(join(ROOT_DIR, '.env'), 'utf-8');
    
    if (envContent.includes('E2E_USER_PASSWORD=') && 
        !envContent.includes('E2E_USER_PASSWORD="[') &&
        !envContent.includes('# E2E Test Credentials (MOVIDO')) {
      issues.push({
        severity: 'CRÍTICO',
        message: '.env contém credenciais de teste - mova para .env.local',
      });
    }
  }
  
  return issues;
}

// ══════════════════════════════════════════════════════════════════════════
// FILE SCANNING
// ══════════════════════════════════════════════════════════════════════════

function shouldExcludeFile(filePath, excludePatterns) {
  return excludePatterns.some(pattern => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern);
    }
    return filePath.includes(pattern) || filePath.endsWith(pattern);
  });
}

function scanFile(filePath, check) {
  if (shouldExcludeFile(filePath, check.excludeFiles)) {
    return [];
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const issues = [];
    
    for (const pattern of check.patterns) {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          severity: check.severity,
          file: filePath,
          check: check.name,
          matches: matches.length,
        });
      }
    }
    
    return issues;
  } catch (error) {
    // Ignora erros de leitura (arquivos binários, etc)
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN VALIDATION
// ══════════════════════════════════════════════════════════════════════════

function main() {
  console.log('🔒 VALIDAÇÃO DE SEGURANÇA\n');
  
  const allIssues = [];
  
  // 1. Validar ambiente
  console.log('1️⃣ Validando configuração de ambiente...');
  const envIssues = validateEnvironment();
  allIssues.push(...envIssues);
  
  if (envIssues.length === 0) {
    console.log('   ✅ Configuração de ambiente OK\n');
  } else {
    console.log(`   ⚠️  ${envIssues.length} problema(s) encontrado(s)\n`);
  }
  
  // 2. Escanear arquivos críticos
  console.log('2️⃣ Escaneando arquivos críticos...');
  
  const criticalFiles = [
    '.env',
    'apply-migrations.mjs',
    'apply-migrations-api.mjs',
    'apply-migrations-final.mjs',
    'scripts/test/apply-pricing-rule.mjs',
    'src/modules/mobility/scripts/apply-motoboy-migration.ts',
    'tests/operational/gate4-reconnection-test.test.ts',
    'supabase/functions/_shared/adminAuth.ts',
    'supabase/functions/stripe-webhook/index.ts',
  ];
  
  for (const file of criticalFiles) {
    const filePath = join(ROOT_DIR, file);
    if (!existsSync(filePath)) continue;
    
    for (const [checkName, check] of Object.entries(SECURITY_CHECKS)) {
      const issues = scanFile(filePath, check);
      allIssues.push(...issues);
    }
  }
  
  if (allIssues.length === 0) {
    console.log('   ✅ Nenhum problema encontrado\n');
  } else {
    console.log(`   ⚠️  ${allIssues.length} problema(s) encontrado(s)\n`);
  }
  
  // 3. Relatório
  console.log('📊 RELATÓRIO\n');
  
  const critical = allIssues.filter(i => i.severity === 'CRÍTICO');
  const high = allIssues.filter(i => i.severity === 'ALTO');
  const medium = allIssues.filter(i => i.severity === 'MÉDIO');
  const warnings = allIssues.filter(i => i.severity === 'AVISO');
  
  if (critical.length > 0) {
    console.log('🔴 CRÍTICO:');
    critical.forEach(issue => {
      console.log(`   - ${issue.check || issue.message}`);
      if (issue.file) console.log(`     Arquivo: ${issue.file}`);
      if (issue.matches) console.log(`     Ocorrências: ${issue.matches}`);
    });
    console.log('');
  }
  
  if (high.length > 0) {
    console.log('🟠 ALTO:');
    high.forEach(issue => {
      console.log(`   - ${issue.check || issue.message}`);
      if (issue.file) console.log(`     Arquivo: ${issue.file}`);
      if (issue.matches) console.log(`     Ocorrências: ${issue.matches}`);
    });
    console.log('');
  }
  
  if (medium.length > 0) {
    console.log('🟡 MÉDIO:');
    medium.forEach(issue => {
      console.log(`   - ${issue.check || issue.message}`);
      if (issue.file) console.log(`     Arquivo: ${issue.file}`);
    });
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('ℹ️  AVISOS:');
    warnings.forEach(issue => {
      console.log(`   - ${issue.message}`);
    });
    console.log('');
  }
  
  // 4. Resultado final
  if (critical.length > 0 || high.length > 0) {
    console.log('❌ VALIDAÇÃO FALHOU - Corrija os problemas antes de fazer deploy\n');
    process.exit(1);
  } else if (medium.length > 0 || warnings.length > 0) {
    console.log('⚠️  VALIDAÇÃO PASSOU COM AVISOS - Revise antes de fazer deploy\n');
    process.exit(0);
  } else {
    console.log('✅ VALIDAÇÃO PASSOU - Projeto seguro para deploy\n');
    process.exit(0);
  }
}

main();
