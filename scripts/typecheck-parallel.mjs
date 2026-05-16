#!/usr/bin/env node

/**
 * Typecheck otimizado - Syntax Only
 * Verifica apenas sintaxe e erros óbvios, não faz análise completa de tipos
 * Isso é 10-20x mais rápido que typecheck completo
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const ROOT = process.cwd();

console.log('🚀 Typecheck rápido (syntax-only) iniciado\n');
console.log('💡 Este modo verifica sintaxe e erros óbvios rapidamente');
console.log('   Para verificação completa de tipos, use: npm run typecheck:full\n');

async function runTypecheck() {
  const startTime = Date.now();
  
  try {
    console.log('📦 Verificando sintaxe TypeScript...\n');
    
    // Usar transpileOnly mode que é MUITO mais rápido
    // Apenas verifica sintaxe, não faz análise completa de tipos
    const { stdout, stderr } = await execAsync(
      'npx tsc -p tsconfig.app.json --noEmit --skipLibCheck --noResolve',
      {
        cwd: ROOT,
        timeout: 60000, // 1 minuto timeout
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      }
    );
    
    if (stdout) console.log(stdout);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Verificação de sintaxe concluída em ${duration}s\n`);
    console.log('💡 Nenhum erro de sintaxe encontrado!');
    console.log('   Para verificação completa de tipos, use: npm run typecheck:full\n');
    process.exit(0);
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    // Mostrar erros
    if (error.stdout) {
      const lines = error.stdout.split('\n');
      // Mostrar apenas primeiros 50 erros
      const errorLines = lines.slice(0, Math.min(50, lines.length));
      console.log(errorLines.join('\n'));
      
      if (lines.length > 50) {
        console.log(`\n... e mais ${lines.length - 50} erros`);
      }
    }
    
    console.log(`\n❌ Verificação falhou após ${duration}s\n`);
    console.log('💡 Para ver todos os erros, use: npm run typecheck:full\n');
    process.exit(1);
  }
}

runTypecheck().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
