#!/usr/bin/env node

/**
 * Diagnóstico de problemas de typecheck
 * Identifica arquivos problemáticos que podem estar causando lentidão
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const execAsync = promisify(exec);
const ROOT = process.cwd();

console.log('🔍 Diagnóstico de Typecheck\n');

// 1. Verificar tamanho dos arquivos
console.log('📊 Analisando tamanho dos arquivos...\n');

function getAllTsFiles(dir, files = []) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          if (!item.includes('node_modules') && !item.includes('.git') && !item.includes('dist')) {
            getAllTsFiles(fullPath, files);
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          files.push({ path: fullPath, size: stat.size });
        }
      } catch (e) {
        // Ignorar erros de acesso
      }
    }
  } catch (e) {
    // Ignorar erros de acesso
  }
  return files;
}

const allFiles = getAllTsFiles(join(ROOT, 'src'));
const largeFiles = allFiles
  .filter(f => f.size > 50 * 1024) // > 50KB
  .sort((a, b) => b.size - a.size)
  .slice(0, 10);

console.log('📁 Top 10 maiores arquivos:');
for (const file of largeFiles) {
  const rel = relative(ROOT, file.path);
  const sizeKB = (file.size / 1024).toFixed(1);
  console.log(`   ${sizeKB.padStart(6)} KB - ${rel}`);
}

// 2. Verificar imports circulares potenciais
console.log('\n🔄 Verificando imports circulares...\n');

function countImports(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const imports = content.match(/^import .* from ['"].*['"];?$/gm) || [];
    return imports.length;
  } catch {
    return 0;
  }
}

const filesWithManyImports = allFiles
  .map(f => ({ ...f, imports: countImports(f.path) }))
  .filter(f => f.imports > 20)
  .sort((a, b) => b.imports - a.imports)
  .slice(0, 10);

console.log('📦 Top 10 arquivos com mais imports:');
for (const file of filesWithManyImports) {
  const rel = relative(ROOT, file.path);
  console.log(`   ${String(file.imports).padStart(3)} imports - ${rel}`);
}

// 3. Estatísticas gerais
console.log('\n📈 Estatísticas gerais:');
console.log(`   Total de arquivos TS/TSX: ${allFiles.length}`);
console.log(`   Tamanho total: ${(allFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(1)} MB`);
console.log(`   Arquivos > 50KB: ${allFiles.filter(f => f.size > 50 * 1024).length}`);
console.log(`   Arquivos > 100KB: ${allFiles.filter(f => f.size > 100 * 1024).length}`);

// 4. Recomendações
console.log('\n💡 Recomendações:');

if (largeFiles.length > 0 && largeFiles[0].size > 500 * 1024) {
  console.log('   ⚠️  Arquivos muito grandes detectados (>500KB)');
  console.log('   → Considere excluir arquivos gerados do typecheck');
}

if (allFiles.length > 1500) {
  console.log('   ⚠️  Muitos arquivos TypeScript (>1500)');
  console.log('   → Considere usar compilação incremental');
}

if (filesWithManyImports.length > 0 && filesWithManyImports[0].imports > 50) {
  console.log('   ⚠️  Arquivos com muitos imports detectados (>50)');
  console.log('   → Podem causar lentidão na resolução de tipos');
}

console.log('\n✅ Diagnóstico concluído\n');
