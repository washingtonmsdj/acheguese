#!/usr/bin/env node
/**
 * Força atualização do schema fazendo uma operação que obriga o Supabase a recarregar
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  db: { schema: 'public' }
});

console.log('🔄 Forçando atualização do schema...\n');

async function main() {
  // Estratégia: Fazer uma query que force o PostgREST a recarregar o schema
  // Vamos tentar acessar a tabela de forma que force refresh
  
  console.log('1️⃣ Testando acesso à tabela...');
  const { data, error } = await supabase
    .from('ride_requests')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('❌ Erro:', error.message);
  } else {
    console.log('✅ Tabela acessível');
  }
  
  console.log('\n2️⃣ Aguardando 5 segundos...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\n3️⃣ Testando coluna mode...');
  const { data: data2, error: error2 } = await supabase
    .from('ride_requests')
    .select('mode')
    .limit(1);
  
  if (error2) {
    console.log('❌ Coluna mode ainda não disponível:', error2.message);
    console.log('\n' + '='.repeat(70));
    console.log('⚠️  O CACHE DO SUPABASE AINDA NÃO ATUALIZOU');
    console.log('='.repeat(70));
    console.log('\nVocê executou o SQL no editor? Se sim, aguarde mais 2-3 minutos.');
    console.log('O Supabase pode levar até 5 minutos para atualizar o cache.');
    console.log('\nSe não executou, copie e execute este SQL:');
    console.log('\nhttps://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/editor\n');
    console.log(`
ALTER TABLE ride_requests
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'ride',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'viagem';

SELECT pg_notify('pgrst', 'reload schema');
    `);
  } else {
    console.log('✅ Coluna mode disponível!');
    console.log('\n' + '='.repeat(70));
    console.log('✅ SCHEMA ATUALIZADO COM SUCESSO!');
    console.log('='.repeat(70));
    console.log('\nTeste agora no navegador. Deve funcionar!');
  }
}

main().catch(console.error);
