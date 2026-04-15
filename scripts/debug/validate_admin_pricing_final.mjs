#!/usr/bin/env node

/**
 * VALIDAÇÃO FINAL - ADMIN PRICING UI
 * 
 * Executa checklist completo de validação no navegador
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const ADMIN_PRICING_URL = `${BASE_URL}/admin/pricing`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function validateAdminPricing() {
  log('\n' + '='.repeat(70), 'blue');
  log('VALIDAÇÃO FINAL - ADMIN PRICING UI', 'blue');
  log('='.repeat(70), 'blue');

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  const results = {
    passed: [],
    failed: [],
    warnings: [],
  };

  try {
    // ============================================
    // STEP 1: Navegar e aguardar carregamento
    // ============================================
    logStep(1, 'Navegando para /admin/pricing');
    
    try {
      await page.goto(ADMIN_PRICING_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      
      // Aguardar React renderizar
      await page.waitForTimeout(3000);
      
      logSuccess('Página carregada');
      results.passed.push('Navegação para /admin/pricing');
    } catch (error) {
      logError(`Falha ao carregar: ${error.message}`);
      results.failed.push(`Navegação: ${error.message}`);
      await page.screenshot({ path: './test-results/error-navigation.png', fullPage: true });
      throw error;
    }

    // ============================================
    // STEP 2: Verificar ausência de Error Boundary
    // ============================================
    logStep(2, 'Verificando se Error Boundary NÃO apareceu');
    
    try {
      const errorBoundary = page.getByText(/Error Boundary|algo deu errado|ocorreu um erro/i);
      const errorCount = await errorBoundary.count();
      
      if (errorCount === 0) {
        logSuccess('Nenhum Error Boundary detectado');
        results.passed.push('Página sem Error Boundary');
      } else {
        logError('Error Boundary apareceu - página quebrada');
        results.failed.push('Error Boundary detectado');
        await page.screenshot({ path: './test-results/error-boundary.png', fullPage: true });
      }
    } catch (error) {
      logWarning(`Erro ao verificar Error Boundary: ${error.message}`);
    }

    // ============================================
    // STEP 3: Verificar elementos principais
    // ============================================
    logStep(3, 'Verificando elementos principais da página');
    
    try {
      // Título
      const title = page.getByText('Gerenciamento de Pricing');
      await title.waitFor({ state: 'visible', timeout: 5000 });
      logSuccess('Título encontrado');
      
      // Botões
      const newRuleButton = page.getByRole('button', { name: /Nova Regra/i });
      await newRuleButton.waitFor({ state: 'visible', timeout: 5000 });
      logSuccess('Botão "Nova Regra" encontrado');
      
      const auditButton = page.getByRole('button', { name: /Ver.*Auditoria/i });
      await auditButton.waitFor({ state: 'visible', timeout: 5000 });
      logSuccess('Botão "Ver Auditoria" encontrado');
      
      results.passed.push('Elementos principais da página');
    } catch (error) {
      logError(`Elementos principais não encontrados: ${error.message}`);
      results.failed.push(`Elementos principais: ${error.message}`);
      await page.screenshot({ path: './test-results/error-main-elements.png', fullPage: true });
    }

    // ============================================
    // STEP 4: Verificar lista de regras
    // ============================================
    logStep(4, 'Verificando lista de regras');
    
    try {
      await page.waitForSelector('.space-y-4', { timeout: 5000 });
      
      const ruleGroups = await page.locator('.border.rounded-lg.bg-card').count();
      log(`   Encontrados ${ruleGroups} grupos de regras`, 'cyan');
      
      if (ruleGroups >= 4) {
        logSuccess(`Lista exibe ${ruleGroups} grupos (esperado: 4+)`);
        results.passed.push(`Lista de regras (${ruleGroups} grupos)`);
      } else {
        logWarning(`Lista exibe apenas ${ruleGroups} grupos (esperado: 4+)`);
        results.warnings.push(`Lista com menos grupos: ${ruleGroups}`);
      }
      
      // Verificar modalidades
      const modes = ['Corrida', 'Entrega', 'Mototáxi', 'Motoboy'];
      for (const mode of modes) {
        const modeElement = page.getByText(mode, { exact: false });
        if (await modeElement.count() > 0) {
          logSuccess(`Modalidade "${mode}" encontrada`);
        } else {
          logWarning(`Modalidade "${mode}" não encontrada`);
          results.warnings.push(`Modalidade "${mode}" ausente`);
        }
      }
      
    } catch (error) {
      logError(`Falha ao verificar lista: ${error.message}`);
      results.failed.push(`Lista de regras: ${error.message}`);
      await page.screenshot({ path: './test-results/error-rules-list.png', fullPage: true });
    }

    // ============================================
    // STEP 5: Abrir diálogo de criação
    // ============================================
    logStep(5, 'Abrindo diálogo de criação');
    
    try {
      const newRuleButton = page.getByRole('button', { name: /Nova Regra/i });
      await newRuleButton.click();
      await page.waitForTimeout(800);
      
      const dialogTitle = page.getByText('Nova Regra de Pricing');
      await dialogTitle.waitFor({ state: 'visible', timeout: 3000 });
      
      logSuccess('Diálogo de criação aberto');
      results.passed.push('Abertura do diálogo de criação');
      
      // Verificar campos
      const fields = ['Modalidade', 'Nome da Regra', 'Tarifa Base', 'Preço por Km'];
      for (const field of fields) {
        const fieldElement = page.getByText(field, { exact: false });
        if (await fieldElement.count() > 0) {
          logSuccess(`Campo "${field}" encontrado`);
        } else {
          logWarning(`Campo "${field}" não encontrado`);
        }
      }
      
      // Fechar dialog
      const cancelButton = page.getByRole('button', { name: /Cancelar/i });
      await cancelButton.click();
      await page.waitForTimeout(500);
      
      logSuccess('Diálogo fechado');
      
    } catch (error) {
      logError(`Falha ao abrir diálogo: ${error.message}`);
      results.failed.push(`Diálogo de criação: ${error.message}`);
      await page.screenshot({ path: './test-results/error-create-dialog.png', fullPage: true });
    }

    // ============================================
    // STEP 6: Criar regra de teste (inativa)
    // ============================================
    logStep(6, 'Criando regra de teste (inativa)');
    
    const testRuleName = `Teste UI ${Date.now()}`;
    
    try {
      await page.getByRole('button', { name: /Nova Regra/i }).click();
      await page.waitForTimeout(500);
      
      await page.getByLabel(/Nome da Regra/i).fill(testRuleName);
      await page.getByLabel(/Tarifa Base/i).fill('5.00');
      await page.getByLabel(/Preço por Km/i).fill('2.50');
      await page.getByLabel(/Preço por Minuto/i).fill('0.50');
      await page.getByLabel(/Valor Mínimo/i).fill('8.00');
      
      // Desativar regra
      const activeSwitch = page.locator('[role="switch"]').first();
      const isChecked = await activeSwitch.getAttribute('data-state');
      if (isChecked === 'checked') {
        await activeSwitch.click();
        await page.waitForTimeout(300);
      }
      
      await page.getByRole('button', { name: /Criar/i }).click();
      await page.waitForTimeout(2000);
      
      const successToast = page.getByText(/criada com sucesso/i);
      if (await successToast.count() > 0) {
        logSuccess('Regra criada com sucesso');
        results.passed.push('Criação de regra');
      } else {
        logWarning('Regra criada mas toast não detectado');
        results.warnings.push('Toast de sucesso não apareceu');
      }
      
    } catch (error) {
      logError(`Falha ao criar regra: ${error.message}`);
      results.failed.push(`Criação de regra: ${error.message}`);
      await page.screenshot({ path: './test-results/error-create-rule.png', fullPage: true });
    }

    // ============================================
    // STEP 7: Ver auditoria
    // ============================================
    logStep(7, 'Verificando auditoria');
    
    try {
      const auditButton = page.getByRole('button', { name: /Ver.*Auditoria/i });
      await auditButton.click();
      await page.waitForTimeout(1000);
      
      const auditSection = page.locator('.border.rounded-lg.p-4.bg-card').filter({ hasText: /Histórico/i });
      
      if (await auditSection.count() > 0) {
        logSuccess('Seção de auditoria expandida');
        results.passed.push('Auditoria visível');
      } else {
        logWarning('Seção de auditoria não encontrada');
        results.warnings.push('Auditoria não renderizada');
      }
      
    } catch (error) {
      logError(`Falha ao verificar auditoria: ${error.message}`);
      results.failed.push(`Auditoria: ${error.message}`);
      await page.screenshot({ path: './test-results/error-audit.png', fullPage: true });
    }

    // ============================================
    // STEP 8: Verificar console
    // ============================================
    logStep(8, 'Verificando erros no console');
    
    // Filtrar erros críticos (ignorar warnings de desenvolvimento)
    const criticalErrors = consoleErrors.filter(err => 
      err.includes('TypeError') || 
      err.includes('Cannot convert object') ||
      err.includes('lazy') ||
      err.includes('Error Boundary')
    );
    
    const criticalPageErrors = pageErrors.filter(err =>
      err.includes('TypeError') ||
      err.includes('Cannot convert object')
    );
    
    if (criticalErrors.length === 0 && criticalPageErrors.length === 0) {
      logSuccess('Nenhum erro crítico no console');
      results.passed.push('Console sem erros críticos');
    } else {
      if (criticalErrors.length > 0) {
        logError(`${criticalErrors.length} erros críticos no console:`);
        criticalErrors.slice(0, 3).forEach(err => {
          log(`   - ${err.substring(0, 100)}`, 'red');
        });
        results.failed.push(`${criticalErrors.length} erros críticos no console`);
      }
      
      if (criticalPageErrors.length > 0) {
        logError(`${criticalPageErrors.length} erros de página:`);
        criticalPageErrors.slice(0, 3).forEach(err => {
          log(`   - ${err.substring(0, 100)}`, 'red');
        });
        results.failed.push(`${criticalPageErrors.length} erros de página`);
      }
    }

    // ============================================
    // STEP 9: Screenshot final
    // ============================================
    logStep(9, 'Capturando screenshot final');
    
    await page.screenshot({ 
      path: './test-results/final-state.png',
      fullPage: true 
    });
    
    logSuccess('Screenshot salvo em ./test-results/final-state.png');

  } catch (error) {
    logError(`Erro fatal: ${error.message}`);
    results.failed.push(`Erro fatal: ${error.message}`);
    
    try {
      await page.screenshot({ path: './test-results/fatal-error.png', fullPage: true });
    } catch {}
  } finally {
    await context.close();
    await browser.close();
  }

  // ============================================
  // RELATÓRIO FINAL
  // ============================================
  log('\n' + '='.repeat(70), 'blue');
  log('RELATÓRIO FINAL', 'blue');
  log('='.repeat(70), 'blue');

  log(`\n✅ PASSOU: ${results.passed.length}`, 'green');
  results.passed.forEach(item => log(`   - ${item}`, 'green'));

  if (results.warnings.length > 0) {
    log(`\n⚠️  AVISOS: ${results.warnings.length}`, 'yellow');
    results.warnings.forEach(item => log(`   - ${item}`, 'yellow'));
  }

  if (results.failed.length > 0) {
    log(`\n❌ FALHOU: ${results.failed.length}`, 'red');
    results.failed.forEach(item => log(`   - ${item}`, 'red'));
  }

  const totalTests = results.passed.length + results.failed.length;
  const successRate = totalTests > 0 ? ((results.passed.length / totalTests) * 100).toFixed(1) : 0;

  log(`\n📊 Taxa de Sucesso: ${successRate}%`, successRate >= 80 ? 'green' : 'red');
  
  // Veredito
  if (results.failed.length === 0) {
    log('\n🎉 VALIDAÇÃO COMPLETA - ADMIN PRICING OPERACIONAL!', 'green');
  } else {
    log('\n⚠️  VALIDAÇÃO INCOMPLETA - Correções necessárias', 'yellow');
  }
  
  log('='.repeat(70) + '\n', 'blue');

  return results.failed.length === 0 ? 0 : 1;
}

// Executar
validateAdminPricing()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
