#!/usr/bin/env tsx
/**
 * Verifica o schema da tabela territorial_group_members
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = 'process.env.SUPABASE_SERVICE_ROLE_KEY!';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('🔍 Verificando schema de territorial_group_members...\n');

  // Tentar inserir um registro vazio para ver o erro
  const { error } = await supabase
    .from('territorial_group_members')
    .insert({});

  console.log('Erro ao inserir vazio:');
  console.log(error);
  console.log('');

  // Tentar buscar qualquer registro
  const { data, error: selectError } = await supabase
    .from('territorial_group_members')
    .select('*')
    .limit(1);

  console.log('Resultado do select:');
  console.log('Data:', data);
  console.log('Error:', selectError);
}

checkSchema();
