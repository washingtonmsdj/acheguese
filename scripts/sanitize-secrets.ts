/**
 * Script de sanitizacao automatica de secrets hardcoded
 * Remove service role keys, connection strings e URLs fixas dos scripts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATTERNS = {
  serviceRoleJwt:
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]*InNlcnZpY2Vfcm9sZSI[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+/g,
  anonJwt:
    /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]*ImFub24i[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+/g,
  connectionString:
    /postgresql:\/\/postgres\.[^:\s]+:[^@\s]+@[^'"\s]+/g,
  hardcodedSupabaseUrl:
    /https:\/\/[a-z0-9-]+\.supabase\.co/g,
};

interface SanitizationResult {
  file: string;
  changes: string[];
  success: boolean;
  error?: string;
}

const results: SanitizationResult[] = [];

function sanitizeFile(filePath: string): SanitizationResult {
  const result: SanitizationResult = {
    file: filePath,
    changes: [],
    success: false,
  };

  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;

    if (PATTERNS.serviceRoleJwt.test(content)) {
      content = content.replace(PATTERNS.serviceRoleJwt, 'process.env.SUPABASE_SERVICE_ROLE_KEY!');
      result.changes.push('Service role JWT -> process.env.SUPABASE_SERVICE_ROLE_KEY');
    }

    if (PATTERNS.anonJwt.test(content)) {
      content = content.replace(PATTERNS.anonJwt, 'process.env.VITE_SUPABASE_PUBLISHABLE_KEY!');
      result.changes.push('Anon JWT -> process.env.VITE_SUPABASE_PUBLISHABLE_KEY');
    }

    if (PATTERNS.connectionString.test(content)) {
      content = content.replace(PATTERNS.connectionString, 'process.env.SUPABASE_DB_URL!');
      result.changes.push('Connection string -> process.env.SUPABASE_DB_URL');
    }

    if (PATTERNS.hardcodedSupabaseUrl.test(content)) {
      content = content.replace(PATTERNS.hardcodedSupabaseUrl, 'process.env.VITE_SUPABASE_URL!');
      result.changes.push('Supabase URL fixa -> process.env.VITE_SUPABASE_URL');
    }

    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      result.success = true;
    } else {
      result.success = true;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
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
        if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry)) {
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

console.log('Sanitizacao de secrets hardcoded\n');

const scriptsDir = join(__dirname, '..');
const rootDir = join(__dirname, '../..');

const scriptFiles = scanDirectory(scriptsDir, ['ts', 'js', 'mjs', 'cjs']);
for (const file of scriptFiles) {
  const result = sanitizeFile(file);
  results.push(result);
}

const sanitized = results.filter((r) => r.changes.length > 0);
const errors = results.filter((r) => r.error);

console.log(`Total de arquivos escaneados: ${results.length}`);
console.log(`Arquivos sanitizados: ${sanitized.length}`);
console.log(`Erros: ${errors.length}`);

if (errors.length > 0) {
  console.log('\nErros encontrados:');
  errors.forEach((e) => {
    console.log(`- ${e.file}: ${e.error}`);
  });
}

if (sanitized.length > 0) {
  console.log('\nArquivos alterados:');
  sanitized.forEach((entry) => {
    const relativePath = entry.file.replace(rootDir, '').replace(/\\/g, '/');
    console.log(`- ${relativePath}`);
  });
}

console.log('\nSanitizacao concluida.');

