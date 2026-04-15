import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.remote' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('=== DIAGNÓSTICO business_data ===\n');

  // 1. Verificar colunas reais da tabela via query direta
  const { data: sample, error: sampleErr } = await supabase
    .from('business_data' as any)
    .select('*')
    .limit(1);

  if (sampleErr) {
    console.error('Erro ao buscar sample:', sampleErr.message);
  } else {
    console.log('Colunas de business_data (via sample):');
    if (sample?.[0]) {
      Object.keys(sample[0]).forEach(k => console.log(`  ${k}: ${typeof (sample[0] as any)[k]}`));
    }
  }

  console.log('\n=== TESTE DE QUERY SIMPLES ===\n');

  // 2. Query mínima sem filtros
  const { data: simple, error: simpleErr } = await supabase
    .from('business_data' as any)
    .select('id, profile_id, status, category')
    .limit(3);

  if (simpleErr) {
    console.error('Erro query simples:', simpleErr);
  } else {
    console.log('Query simples OK:', simple?.length, 'registros');
    console.log('Exemplo:', simple?.[0]);
  }

  console.log('\n=== TESTE COM FILTRO status=active ===\n');

  // 3. Query com status=active
  const { data: active, error: activeErr } = await supabase
    .from('business_data' as any)
    .select('id, profile_id, status, category')
    .eq('status', 'active')
    .limit(3);

  if (activeErr) {
    console.error('Erro query active:', activeErr);
  } else {
    console.log('Query active OK:', active?.length, 'registros');
  }

  console.log('\n=== TESTE getSimilarBusinesses ===\n');

  // 4. Simular a query exata que falha
  const { data: similar, error: similarErr } = await supabase
    .from('business_data' as any)
    .select('profile_id, business_name, category, logo, slug, is_verified, is_premium')
    .eq('category', 'Beleza e Cosméticos')
    .eq('status', 'active')
    .neq('profile_id', '4fdc4c5d-83c7-41af-a0f0-72bc87885347')
    .limit(5);

  if (similarErr) {
    console.error('Erro getSimilarBusinesses:', JSON.stringify(similarErr, null, 2));
  } else {
    console.log('getSimilarBusinesses OK:', similar?.length, 'registros');
  }

  console.log('\n=== POLÍTICAS RLS de business_data ===\n');

  const { data: policies, error: polErr } = await supabase
    .from('pg_policies' as any)
    .select('policyname, cmd, qual')
    .eq('tablename', 'business_data');

  if (polErr) {
    console.error('Erro políticas:', polErr.message);
  } else {
    policies?.forEach(p => console.log(`  [${p.cmd}] ${p.policyname}: ${p.qual}`));
  }
}

diagnose().catch(console.error);
