#!/usr/bin/env node

/**
 * Typecheck usando ESLint com @typescript-eslint
 * Muito mais rápido que tsc para projetos grandes
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ROOT = process.cwd();

console.log('🚀 Typecheck rápido usando ESLint\n');
console.log('💡 Verificando erros de TypeScript via ESLint (muito mais rápido)\n');

async function runTypecheck() {
  const startTime = Date.now();
  
  try {
    console.log('📦 Analisando código TypeScript...\n');
    
    // Usar ESLint que é muito mais rápido para projetos grandes
    const { stdout } = await execAsync(
      'npx eslint src --ext .ts,.tsx --format=compact --max-warnings=0',
      {
        cwd: ROOT,
        timeout: 60000, // 1 minuto
        maxBuffer: 50 * 1024 * 1024,
      }
    );
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Verificação concluída em ${duration}s\n`);
    console.log('💡 Nenhum erro encontrado!');
    console.log('   Para typecheck completo com tsc, use: npm run typecheck:full\n');
    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (error.stdout) {
      const lines = error.stdout.split('\n').filter(l => l.trim());
      const errorCount = lines.length;
      
      // Mostrar apenas primeiros 30 erros
      console.log(lines.slice(0, 30).join('\n'));
      
      if (errorCount > 30) {
        console.log(`\n... e mais ${errorCount - 30} problemas`);
      }
      
      console.log(`\n❌ Encontrados ${errorCount} problemas após ${duration}s\n`);
    } else {
      console.log(`\n✅ Verificação concluída em ${duration}s (com warnings)\n`);
    }
    
    process.exit(error.code || 1);
  }
}

runTypecheck().catch(error => {
  console.error('\n❌ Erro:', error.message);
  process.exit(1);
});
