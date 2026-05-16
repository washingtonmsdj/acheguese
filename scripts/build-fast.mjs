#!/usr/bin/env node

/**
 * Build rápido para desenvolvimento
 * Desabilita otimizações pesadas para builds mais rápidos
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('⚡ Build rápido (desenvolvimento)\n');
console.log('💡 Otimizações desabilitadas para velocidade');
console.log('   Para build de produção, use: npm run build\n');

async function buildFast() {
  const startTime = Date.now();
  
  try {
    console.log('📦 Compilando...\n');
    
    // Build sem minificação e sem source maps para velocidade
    await execAsync('vite build --mode development --minify false', {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        VITE_SKIP_SOURCEMAP: 'true'
      }
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Build concluído em ${duration}s\n`);
    console.log('💡 Este build é apenas para testes locais');
    console.log('   Para produção, use: npm run build\n');
    
    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n❌ Build falhou após ${duration}s\n`);
    process.exit(1);
  }
}

buildFast();
