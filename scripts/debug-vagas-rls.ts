/**
 * Script para debugar problema de RLS nas vagas
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xhdowzacfujckjelqhtd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_WVn4OOnU853X3kGXwi2miA_9HmLO83V';

const supabase = createClient(supabaseUrl, supabaseKey);

const SALVADOR_LOCATION_ID = '63c41c29-adce-40f5-a552-e52d176123c3';

async function debugVagasRLS() {
  console.log('🔍 Debugando RLS de vagas...\n');

  try {
    // 1. Buscar TODAS as vagas (sem filtro de RLS - vai falhar se RLS estiver ativo)
    console.log('1️⃣ Tentando buscar todas as vagas (ignora RLS)...');
    const { data: allVagas, error: allError } = await supabase
      .from('vagas')
      .select('id, titulo, status, location_id, expires_at');

    if (allError) {
      console.log(`   ❌ Erro: ${allError.message}`);
    } else {
      console.log(`   ✅ Encontradas: ${allVagas?.length || 0} vagas`);
      allVagas?.forEach(v => {
        console.log(`      - ${v.titulo}: status=${v.status}, location=${v.location_id.substring(0, 8)}...`);
      });
    }

    // 2. Buscar vagas ativas (policy permite)
    console.log('\n2️⃣ Buscando vagas com status=ativa...');
    const { data: ativasVagas, error: ativasError } = await supabase
      .from('vagas')
      .select('id, titulo, status, location_id, expires_at')
      .eq('status', 'ativa');

    if (ativasError) {
      console.log(`   ❌ Erro: ${ativasError.message}`);
    } else {
      console.log(`   ✅ Encontradas: ${ativasVagas?.length || 0} vagas ativas`);
    }

    // 3. Buscar vagas de Salvador especificamente
    console.log('\n3️⃣ Buscando vagas de Salvador (location_id específico)...');
    const { data: salvadorVagas, error: salvadorError } = await supabase
      .from('vagas')
      .select('id, titulo, status, location_id, expires_at')
      .eq('location_id', SALVADOR_LOCATION_ID);

    if (salvadorError) {
      console.log(`   ❌ Erro: ${salvadorError.message}`);
    } else {
      console.log(`   ✅ Encontradas: ${salvadorVagas?.length || 0} vagas em Salvador`);
      salvadorVagas?.forEach(v => {
        const expired = v.expires_at && new Date(v.expires_at) < new Date();
        console.log(`      - ${v.titulo}: status=${v.status}, expired=${expired}`);
      });
    }

    // 4. Buscar vagas ativas de Salvador (query completa do VagasService)
    console.log('\n4️⃣ Buscando vagas ativas de Salvador (query completa)...');
    const { data: finalVagas, error: finalError } = await supabase
      .from('vagas')
      .select('*')
      .eq('status', 'ativa')
      .eq('location_id', SALVADOR_LOCATION_ID)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    if (finalError) {
      console.log(`   ❌ Erro: ${finalError.message}`);
    } else {
      console.log(`   ✅ Encontradas: ${finalVagas?.length || 0} vagas (query final)`);
      if (finalVagas && finalVagas.length > 0) {
        console.log('\n   📋 Vagas encontradas:');
        finalVagas.forEach((v, i) => {
          console.log(`      ${i + 1}. ${v.titulo} (${v.empresa})`);
        });
      }
    }

    // 5. Verificar RLS policy
    console.log('\n5️⃣ Verificando RLS policy...');
    console.log('   Policy: vagas_public_read');
    console.log('   Condição: status = \'ativa\' AND (expires_at IS NULL OR expires_at > now())');
    console.log('   Usuário: anon (não autenticado)');

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error);
    process.exit(1);
  }
}

debugVagasRLS();
