/**
 * Migra variáveis de ambiente de VITE_* para nomes server-side corretos
 * VITE_* deve ser usado apenas para variáveis expostas ao frontend
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const REPLACEMENTS = [
  {
    old: 'process.env.SUPABASE_SERVICE_ROLE_KEY',
    new: 'process.env.SUPABASE_SERVICE_ROLE_KEY',
    description: 'Service role key (server-side)',
  },
  {
    old: 'SUPABASE_SERVICE_ROLE_KEY',
    new: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Service role key variable name',
  },
  // Manter VITE_SUPABASE_URL para compatibilidade com frontend
  // mas adicionar SUPABASE_URL para scripts server-side
];

interface MigrationResult {
  file: string;
  changes: number;
  success: boolean;
}

const results: MigrationResult[] = [];

function migrateFile(filePath: string): MigrationResult {
  const result: MigrationResult = {
    file: filePath,
    changes: 0,
    success: false,
  };

  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Aplicar substituições
    for (const replacement of REPLACEMENTS) {
      const regex = new RegExp(replacement.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, replacement.new);
        result.changes += matches.length;
      }
    }

    // Se houve mudanças, salvar
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      result.success = true;
    } else {
      result.success = true;
    }

  } catch (error) {
    console.error(`Erro em ${filePath}:`, error);
  }

  return result;
}

function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function scan(currentDir: string) {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      const fullPath = join(currentDir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(entry)) {
          scan(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = entry.split('.').pop();
        if (ext && extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  scan(dir);
  return files;
}

console.log('🔄 MIGRAÇÃO DE VARIÁVEIS DE AMBIENTE\n');

const scriptsDir = join(__dirname, '..');
const rootDir = join(__dirname, '../..');

// Escanear apenas scripts (não frontend)
console.log('📂 Escaneando scripts...');
const scriptFiles = scanDirectory(scriptsDir, ['ts', 'js', 'mjs']);
console.log(`   Encontrados: ${scriptFiles.length} arquivos\n`);

// Migrar helper
const helperFile = join(scriptsDir, 'lib', 'supabase-client.ts');
if (scriptFiles.includes(helperFile)) {
  console.log('🔧 Migrando helper centralizado...\n');
  const result = migrateFile(helperFile);
  results.push(result);
  if (result.changes > 0) {
    console.log(`✅ ${helperFile.replace(rootDir, '')}`);
    console.log(`   ${result.changes} substituições\n`);
  }
}

// Migrar outros scripts
console.log('🔧 Migrando scripts...\n');
let migrated = 0;
for (const file of scriptFiles) {
  if (file === helperFile) continue; // Já migrado
  
  const result = migrateFile(file);
  results.push(result);

  if (result.changes > 0) {
    migrated++;
    const relativePath = file.replace(rootDir, '').replace(/\\/g, '/');
    console.log(`✅ ${relativePath} (${result.changes} mudanças)`);
  }
}

console.log(`\n📊 RESUMO\n`);
console.log(`Total de arquivos: ${results.length}`);
console.log(`Arquivos migrados: ${migrated}`);
console.log(`Total de substituições: ${results.reduce((sum, r) => sum + r.changes, 0)}`);

console.log('\n✅ Migração concluída!');
console.log('\n⚠️  PRÓXIMOS PASSOS:');
console.log('1. Atualizar .env com SUPABASE_SERVICE_ROLE_KEY (sem VITE_)');
console.log('2. Testar scripts críticos');
