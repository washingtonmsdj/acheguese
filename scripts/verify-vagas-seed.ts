/**
 * Script para verificar se as vagas foram criadas no banco remoto
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyVagas() {
  console.log('🔍 Verificando vagas no banco remoto...\n');

  try {
    // Buscar todas as vagas
    const { data: vagas, error, count } = await supabase
      .from('vagas')
      .select('titulo, empresa, contrato, modalidade, nivel, status, destaque, urgencia', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar vagas:', error.message);
      process.exit(1);
    }

    if (!vagas || vagas.length === 0) {
      console.log('⚠️  Nenhuma vaga encontrada no banco');
      console.log('Execute: npx supabase db push');
      process.exit(0);
    }

    console.log(`✅ Total de vagas: ${count}\n`);

    // Estatísticas
    const stats = {
      total: vagas.length,
      ativas: vagas.filter(v => v.status === 'ativa').length,
      pausadas: vagas.filter(v => v.status === 'pausada').length,
      encerradas: vagas.filter(v => v.status === 'encerrada').length,
      preenchidas: vagas.filter(v => v.status === 'preenchida').length,
      destaque: vagas.filter(v => v.destaque).length,
      urgentes: vagas.filter(v => v.urgencia === 'urgente').length,
    };

    console.log('📊 Estatísticas:');
    console.log(`   Ativas: ${stats.ativas}`);
    console.log(`   Pausadas: ${stats.pausadas}`);
    console.log(`   Encerradas: ${stats.encerradas}`);
    console.log(`   Preenchidas: ${stats.preenchidas}`);
    console.log(`   Em Destaque: ${stats.destaque}`);
    console.log(`   Urgentes: ${stats.urgentes}\n`);

    // Listar vagas
    console.log('📋 Vagas encontradas:\n');
    vagas.forEach((vaga, index) => {
      const badges = [];
      if (vaga.destaque) badges.push('⭐');
      if (vaga.urgencia === 'urgente') badges.push('🔥');
      
      const statusEmoji = {
        ativa: '✅',
        pausada: '⏸️',
        encerrada: '🔒',
        preenchida: '✔️',
      }[vaga.status] || '❓';

      console.log(`${index + 1}. ${statusEmoji} ${vaga.titulo} ${badges.join(' ')}`);
      console.log(`   ${vaga.empresa} • ${vaga.contrato} • ${vaga.modalidade} • ${vaga.nivel}`);
      console.log('');
    });

    console.log('✅ Verificação concluída com sucesso!');
    console.log('\n💡 Acesse /admin/vagas para gerenciar as vagas');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    process.exit(1);
  }
}

verifyVagas();
