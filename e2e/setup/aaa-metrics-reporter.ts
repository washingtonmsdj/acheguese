/**
 * 📊 AAA Metrics Reporter - Custom Playwright Reporter
 * 
 * Coleta métricas de qualidade AAA:
 * - Taxa de sucesso
 * - Tempo médio de execução
 * - Retries necessários
 * - Flaky tests
 * 
 * @version 1.0.0
 */

import { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

interface TestMetrics {
  title: string;
  duration: number;
  status: string;
  retryCount: number;
  flaky: boolean;
}

class AAAMetricsReporter implements Reporter {
  private metrics: TestMetrics[] = [];
  private startTime: number = 0;
  
  onBegin(): void {
    this.startTime = Date.now();
    console.log('\n🏆 AAA Metrics Reporter - Iniciado\n');
  }
  
  onTestEnd(test: TestCase, result: TestResult): void {
    const metric: TestMetrics = {
      title: test.title,
      duration: result.duration,
      status: result.status,
      retryCount: test.results.length - 1,
      flaky: test.results.length > 1 && result.status === 'passed'
    };
    
    this.metrics.push(metric);
    
    // Log imediato para testes flaky
    if (metric.flaky) {
      console.log(`⚠️ FLAKY: ${test.title} (passou após ${metric.retryCount} retries)`);
    }
  }
  
  onEnd(result: FullResult): void {
    const totalDuration = Date.now() - this.startTime;
    
    // Calcular estatísticas
    const total = this.metrics.length;
    const passed = this.metrics.filter(m => m.status === 'passed').length;
    const failed = this.metrics.filter(m => m.status === 'failed').length;
    const skipped = this.metrics.filter(m => m.status === 'skipped').length;
    const flaky = this.metrics.filter(m => m.flaky).length;
    
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / total;
    const maxDuration = Math.max(...this.metrics.map(m => m.duration));
    
    const totalRetries = this.metrics.reduce((sum, m) => sum + m.retryCount, 0);
    
    // Relatório AAA
    console.log('\n' + '='.repeat(60));
    console.log('📊 AAA QUALITY METRICS REPORT');
    console.log('='.repeat(60));
    console.log(`
    📈 Resumo:
       • Total de testes:    ${total}
       • Passaram:           ${passed} (${((passed/total)*100).toFixed(1)}%)
       • Falharam:           ${failed}
       • Pulados:            ${skipped}
       • Flaky:              ${flaky}
       
    ⏱️  Performance:
       • Duração total:      ${(totalDuration/1000).toFixed(2)}s
       • Média por teste:    ${avgDuration.toFixed(0)}ms
       • Teste mais lento:   ${maxDuration}ms
       
    🔄 Resiliência:
       • Total de retries:   ${totalRetries}
       • Retries/teste:      ${(totalRetries/total).toFixed(2)}
       
    ✅ Status: ${failed === 0 ? 'PASSOU AAA' : 'FALHOU'}
    `);
    console.log('='.repeat(60) + '\n');
    
    // Guardar métricas para CI/CD
    if (process.env.CI) {
      const metricsJson = JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
          total,
          passed,
          failed,
          skipped,
          flaky,
          passRate: ((passed/total)*100).toFixed(1)
        },
        performance: {
          totalDuration,
          avgDuration,
          maxDuration
        },
        resiliency: {
          totalRetries,
          retriesPerTest: (totalRetries/total).toFixed(2)
        }
      }, null, 2);
      
      // Salvar para análise posterior
      const fs = require('fs');
      fs.writeFileSync('test-results/aaa-metrics.json', metricsJson);
    }
  }
}

export default AAAMetricsReporter;
