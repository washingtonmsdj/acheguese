import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { exec } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('=== EXECUTANDO SQL NO SUPABASE ===\n');

const sql = readFileSync('APLICAR_NO_SUPABASE.sql', 'utf-8');

console.log('Arquivo lido:', sql.length, 'caracteres\n');
console.log('Tentando executar SQL...\n');

try {
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql: sql })
  });
  
  const result = await response.text();
  
  if (!response.ok) {
    console.log('ERRO: API REST nao suporta DDL (CREATE FUNCTION, CREATE TRIGGER)');
    console.log('Resposta:', result.substring(0, 200));
    console.log('\nSOLUCAO: Executar SQL manualmente no SQL Editor do Supabase\n');
    console.log('Copiando SQL para clipboard e abrindo navegador...\n');
    
    // Copiar para clipboard
    const sqlEscaped = sql.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    exec(`powershell -command "Set-Clipboard -Value @'\n${sqlEscaped}\n'@"`, (err) => {
      if (err) {
        console.log('Erro ao copiar:', err.message);
      } else {
        console.log('OK: SQL copiado para clipboard');
      }
    });
    
    // Abrir navegador
    const url = 'https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/sql/new';
    exec(`start ${url}`);
    
    console.log('\nPROXIMOS PASSOS:');
    console.log('1. SQL Editor vai abrir no navegador');
    console.log('2. Cole o SQL (Ctrl+V) - ja esta no clipboard');
    console.log('3. Clique em RUN ou pressione Ctrl+Enter');
    console.log('4. Aguarde execucao');
    console.log('5. Verifique se apareceu "Success"');
    console.log('6. Execute: node validar-sql-aplicado.mjs');
  } else {
    console.log('OK: SQL executado com sucesso!');
    console.log('Resultado:', result);
  }
} catch (error) {
  console.log('ERRO:', error.message);
}
