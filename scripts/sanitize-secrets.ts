/**
 * Script de sanitização automática de secrets hardcoded
 * Remove service role keys, connection strings e anon keys dos scripts
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Padrões a serem substituídos
const PATTERNS = {
  serviceRoleKey: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZG93emFjZnVqY2tqZWxxaHRkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDUwNDA4OSwiZXhwIjoyMDkwMDgwMDg5fQ\.mRgz7fJ_TfHwvUkp91ymY4L1uKTSQIgeAU1XywpiU-c/g,
  anonKey: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZG93emFjZnVqY2tqZWxxaHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MDQwODksImV4cCI6MjA5MDA4MDA4OX0\.Dn7uIaD0CTpVBi-qM_L4JYH_YXlc6T9tpR0KxO4nzSA/g,
  connectionString: /postgresql:\/\/postgres\.xhdowzacfujckjelqhtd:mRgz7fJ_TfHwvUkp91ymY4L1uKTSQIgeAU1XywpiU-c@[^'"\s]+/g,
  hardcodedUrl: /'https:\/\/xhdowzacfujckjelqhtd\.supabase\.co'/g,
  hardcodedUrlDouble: /"https:\/\/xhdowzacfujckjelqhtd\.supabase\.co"/g,
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

    // Substituir service role key
    if (PATTERNS.serviceRoleKey.test(content)) {
      content = content.replace(PATTERNS.serviceRoleKey, "process.env.SUPABASE_SERVICE_ROLE_KEY!");
      result.changes.push('Service role key → process.env.SUPABASE_SERVICE_ROLE_KEY');
    }

    // Substituir anon key
    if (PATTERNS.anonKey.test(content)) {
      content = content.replace(PATTERNS.anonKey, "process.env.VITE_SUPABASE_PUBLISHABLE_KEY!");
      result.changes.push('Anon key → process.env.VITE_SUPABASE_PUBLISHABLE_KEY');
    }

    // Substituir connection strings
    if (PATTERNS.connectionString.test(content)) {
      content = content.replace(PATTERNS.connectionString, "process.env.SUPABASE_DB_URL!");
      result.changes.push('Connection string → process.env.SUPABASE_DB_URL');
    }

    // Substituir URLs hardcoded
    if (PATTERNS.hardcodedUrl.test(content) || PATTERNS.hardcodedUrlDouble.test(content)) {
      content = content.replace(PATTERNS.hardcodedUrl, "process.env.VITE_SUPABASE_URL!");
      content = content.replace(PATTERNS.hardcodedUrlDouble, "process.env.VITE_SUPABASE_URL!");
      result.changes.push('Hardcoded URL → process.env.VITE_SUPABASE_URL');
    }

    // Se houve mudanças, salvar arquivo
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      result.success = true;
    } else {
      result.success = true; // Arquivo não precisava de mudanças
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
        // Ignorar node_modules, .git, etc
        if (!['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) {
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

// Executar sanitização
console.log('🔒 SANITIZAÇÃO DE SECRETS HARDCODED\n');

const scriptsDir = join(__dirname, '..');
const rootDir = join(__dirname, '../..');

// Escanear scripts
console.log('📂 Escaneando scripts...');
const scriptFiles = scanDirectory(scriptsDir, ['ts', 'js', 'mjs']);
console.log(`   Encontrados: ${scriptFiles.length} arquivos\n`);

// Sanitizar cada arquivo
console.log('🔧 Sanitizando arquivos...\n');
for (const file of scriptFiles) {
  const result = sanitizeFile(file);
  results.push(result);

  if (result.changes.length > 0) {
    const relativePath = file.replace(rootDir, '').replace(/\\/g, '/');
    console.log(`✅ ${relativePath}`);
    result.changes.forEach(change => console.log(`   - ${change}`));
  }
}

// Sanitizar arquivos na raiz também
const rootFiles = [
  'execute_fix_remote.ts',
  'health-check-dispatch.ps1',
  'validar_5_pontos_pricing.mjs',
  'validar_safety_completo.mjs',
  'validate_admin_pricing_ui.mjs',
  'validate_pricing_db.mjs',
  'corrigir_schema_completo.mjs',
  'apply-seed-node.mjs',
].map(f => join(rootDir, f)).filter(f => {
  try {
    statSync(f);
    return true;
  } catch {
    return false;
  }
});

for (const file of rootFiles) {
  const result = sanitizeFile(file);
  results.push(result);

  if (result.changes.length > 0) {
    const relativePath = file.replace(rootDir, '').replace(/\\/g, '/');
    console.log(`✅ ${relativePath}`);
    result.changes.forEach(change => console.log(`   - ${change}`));
  }
}

// Resumo
console.log('\n📊 RESUMO\n');
const sanitized = results.filter(r => r.changes.length > 0);
const errors = results.filter(r => r.error);

console.log(`Total de arquivos escaneados: ${results.length}`);
console.log(`Arquivos sanitizados: ${sanitized.length}`);
console.log(`Erros: ${errors.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERROS:\n');
  errors.forEach(e => {
    console.log(`   ${e.file}: ${e.error}`);
  });
}

console.log('\n✅ Sanitização concluída!');
console.log('\n⚠️  PRÓXIMOS PASSOS:');
console.log('1. Adicionar ao .env: SUPABASE_DB_URL (para connection strings)');
console.log('2. Testar scripts críticos para garantir que não quebraram');
console.log('3. Rotacionar service role key no Supabase Dashboard');
console.log('4. Atualizar .env com nova key');
