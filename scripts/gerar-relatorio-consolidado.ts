#!/usr/bin/env tsx

/**
 * GERADOR DE RELATÓRIO CONSOLIDADO
 * Consolida todos os resultados de homologação em um único relatório
 */

import * as fs from 'fs';

interface Relatorio {
  data: string;
  testes: any[];
  resumo: { total: number; passou: number; falhou: number };
}

function carregarRelatorio(arquivo: string): Relatorio | null {
  try {
    const conteudo = fs.readFileSync(arquivo, 'utf-8');
    return JSON.parse(conteudo);
  } catch {
    return null;
  }
}

function gerarRelatorioConsolidado() {
  console.log('📊 GERANDO RELATÓRIO CONSOLIDADO\n');

  const relatorios = {
    criacao: carregarRelatorio('HOMOLOGACAO_CRIACAO_PERFIS.json'),
    membros: carregarRelatorio('HOMOLOGACAO_MEMBROS_LINKS.json'),
    privacidade: carregarRelatorio('HOMOLOGACAO_PRIVACIDADE.json'),
    seguranca: carregarRelatorio('HOMOLOGACAO_SEGURANCA_RLS.json')
  };

  let totalTestes = 0;
  let totalPassou = 0;
  let totalFalhou = 0;

  console.log('='.repeat(80));
  console.log('RELATÓRIO CONSOLIDADO DE HOMOLOGAÇÃO');
  console.log('='.repeat(80) + '\n');

  for (const [nome, relatorio] of Object.entries(relatorios)) {
    if (!relatorio) {
      console.log(`⚠️  ${nome.toUpperCase()}: Relatório não encontrado\n`);
      continue;
    }

    console.log(`\n📋 ${nome.toUpperCase()}`);
    console.log(`   Total: ${relatorio.resumo.total} testes`);
    console.log(`   ✅ Passou: ${relatorio.resumo.passou}`);
    console.log(`   ❌ Falhou: ${relatorio.resumo.falhou}`);
    console.log(`   Taxa: ${((relatorio.resumo.passou / relatorio.resumo.total) * 100).toFixed(1)}%`);

    totalTestes += relatorio.resumo.total;
    totalPassou += relatorio.resumo.passou;
    totalFalhou += relatorio.resumo.falhou;
  }

  console.log('\n' + '='.repeat(80));
  console.log('RESULTADO GERAL');
  console.log('='.repeat(80));
  console.log(`\nTotal de Testes: ${totalTestes}`);
  console.log(`✅ Passou: ${totalPassou} (${((totalPassou / totalTestes) * 100).toFixed(1)}%)`);
  console.log(`❌ Falhou: ${totalFalhou} (${((totalFalhou / totalTestes) * 100).toFixed(1)}%)`);
  console.log('\n' + '='.repeat(80));

  if (totalFalhou === 0) {
    console.log('\n🎉 HOMOLOGAÇÃO COMPLETA: Todos os testes passaram!');
    console.log('✅ Sistema validado e pronto para staging\n');
  } else {
    console.log(`\n⚠️  HOMOLOGAÇÃO INCOMPLETA: ${totalFalhou} testes falharam`);
    console.log('❌ Revisar falhas antes de prosseguir\n');
  }

  // Salvar consolidado
  const consolidado = {
    data: new Date().toISOString(),
    relatorios: {
      criacao: relatorios.criacao?.resumo,
      membros: relatorios.membros?.resumo,
      privacidade: relatorios.privacidade?.resumo,
      seguranca: relatorios.seguranca?.resumo
    },
    total: {
      testes: totalTestes,
      passou: totalPassou,
      falhou: totalFalhou,
      taxa_sucesso: ((totalPassou / totalTestes) * 100).toFixed(1) + '%'
    },
    status: totalFalhou === 0 ? 'HOMOLOGADO' : 'PENDENTE'
  };

  fs.writeFileSync('HOMOLOGACAO_CONSOLIDADA.json', JSON.stringify(consolidado, null, 2), 'utf-8');
  console.log('📄 Relatório consolidado salvo em: HOMOLOGACAO_CONSOLIDADA.json\n');

  process.exit(totalFalhou > 0 ? 1 : 0);
}

gerarRelatorioConsolidado();
