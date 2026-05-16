#!/usr/bin/env node

/**
 * Script de typecheck otimizado
 * - Usa compilação incremental
 * - Verifica apenas arquivos modificados quando possível
 * - Usa cache de build
 */

import { execSync } from 'child_process';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const BUILD_INFO_APP = join(ROOT, '.tmp', 'tsconfig.app.tsbuildinfo');
const BUILD_INFO_NODE = join(ROOT, '.tmp', 'tsconfig.node.tsbuildinfo');

console.log('🔍 Iniciando typecheck otimizado...\n');

// Verificar se é primeira execução ou se precisa rebuild
const needsRebuild = !existsSync(BUILD_INFO_APP) || !existsSync(BUILD_INFO_NODE);

if (needsRebuild) {
  console.log('⚠️  Primeira execução ou cache limpo - isso pode demorar alguns minutos...');
  console.log('   Próximas execuções serão muito mais rápidas!\n');
}

try {
  const startTime = Date.now();
  
  // Usar tsc -b para compilação incremental com project references
  console.log('📦 Verificando tsconfig.app.json...');
  execSync('npx tsc -b tsconfig.app.json', {
    stdio: 'inherit',
    cwd: ROOT
  });
  
  console.log('📦 Verificando tsconfig.node.json...');
  execSync('npx tsc -b tsconfig.node.json', {
    stdio: 'inherit',
    cwd: ROOT
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✅ Typecheck concluído com sucesso em ${duration}s`);
  
  if (needsRebuild) {
    console.log('💡 Cache criado! Próximas execuções serão incrementais e muito mais rápidas.');
  }
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Typecheck falhou');
  process.exit(1);
}
