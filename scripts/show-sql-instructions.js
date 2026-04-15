#!/usr/bin/env node

/**
 * Script para mostrar instruções de aplicação das migrations
 * Uso: node scripts/show-sql-instructions.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\n' + '='.repeat(70));
console.log('🔧 APLICAÇÃO DE MIGRATIONS - INSTRUÇÕES');
console.log('='.repeat(70) + '\n');

// Ler o SQL consolidado
const sqlFile = join(rootDir, 'APLICAR_NO_SUPABASE_SQL_EDITOR.sql');
const sql = readFileSync(sqlFile, 'utf-8');

console.log('📋 SQL PRONTO PARA APLICAR\n');
console.log('O SQL abaixo foi copiado para seu clipboard (se disponível).\n');

console.log('━'.repeat(70));
console.log('PASSO 1: Acesse o Supabase SQL Editor');
console.log('━'.repeat(70));
console.log('\n🌐 URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql\n');

console.log('━'.repeat(70));
console.log('PASSO 2: Cole o SQL e Execute');
console.log('━'.repeat(70));
console.log('\n1. Cole o conteúdo do arquivo APLICAR_NO_SUPABASE_SQL_EDITOR.sql');
console.log('2. Clique no botão "Run" (ou Ctrl+Enter)');
console.log('3. Aguarde a execução completar\n');

console.log('━'.repeat(70));
console.log('PASSO 3: Verifique os Resultados');
console.log('━'.repeat(70));
console.log('\nExecute estas queries para verificar:\n');

console.log('-- Verificar RPC functions criadas');
console.log('SELECT routine_name, routine_type');
console.log('FROM information_schema.routines');
console.log('WHERE routine_schema = \'public\'');
console.log('  AND routine_name IN (\'get_business_reviews\', \'can_user_review_business\');');
console.log('-- Deve retornar 2 linhas\n');

console.log('-- Verificar localizações inseridas');
console.log('SELECT geographic_path, name, type');
console.log('FROM locations');
console.log('WHERE geographic_path LIKE \'ba%\'');
console.log('ORDER BY geographic_path;');
console.log('-- Deve retornar 6 linhas (BA, Salvador, 4 bairros)\n');

console.log('━'.repeat(70));
console.log('CONTEÚDO DO SQL (primeiras 50 linhas)');
console.log('━'.repeat(70) + '\n');

const lines = sql.split('\n');
const preview = lines.slice(0, 50).join('\n');
console.log(preview);

if (lines.length > 50) {
  console.log(`\n... (${lines.length - 50} linhas restantes)\n`);
}

console.log('━'.repeat(70));
console.log('📄 Arquivo completo: APLICAR_NO_SUPABASE_SQL_EDITOR.sql');
console.log('━'.repeat(70) + '\n');

// Tentar copiar para clipboard
async function copyToClipboard() {
  try {
    // Windows
    if (process.platform === 'win32') {
      await execAsync(`echo ${sql} | clip`);
      console.log('✅ SQL copiado para clipboard (Windows)\n');
      return true;
    }
    // macOS
    if (process.platform === 'darwin') {
      await execAsync(`echo "${sql}" | pbcopy`);
      console.log('✅ SQL copiado para clipboard (macOS)\n');
      return true;
    }
    // Linux
    if (process.platform === 'linux') {
      await execAsync(`echo "${sql}" | xclip -selection clipboard`);
      console.log('✅ SQL copiado para clipboard (Linux)\n');
      return true;
    }
  } catch (error) {
    console.log('ℹ️  Não foi possível copiar automaticamente para clipboard');
    console.log('   Copie manualmente o arquivo: APLICAR_NO_SUPABASE_SQL_EDITOR.sql\n');
    return false;
  }
}

copyToClipboard().then(() => {
  console.log('━'.repeat(70));
  console.log('🎯 PRÓXIMOS PASSOS');
  console.log('━'.repeat(70));
  console.log('\n1. Abra o SQL Editor do Supabase (link acima)');
  console.log('2. Cole o SQL (Ctrl+V)');
  console.log('3. Execute (Ctrl+Enter ou botão Run)');
  console.log('4. Verifique os resultados com as queries acima');
  console.log('5. Recarregue a aplicação e verifique o console\n');
  
  console.log('━'.repeat(70) + '\n');
});
