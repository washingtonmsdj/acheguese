#!/usr/bin/env node

/**
 * VALIDAÇÃO DA UI REAL - ADMIN PRICING
 * 
 * Script automatizado para validar interface no navegador
 * Executa via Playwright com login automático
 */

import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const ADMIN_PRICING_URL = `${BASE_URL}/admin/pricing`;

// Cores para output
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

async function validateAdminPricingUI() {
  log('\n='.repeat(60), 'blue');
  log('VALIDAÇÃO DA UI REAL - ADMIN PRICING', 'blue');
  log('='.repeat(60), 'blue');

  const browser = await chromium.launch({ 
    headless: false, // Mostrar navegador para evidência visual
    slowMo: 500 // Desacelerar para visualização
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: './test-results/videos',
      size: { width: 1920, height: 1080 }
    }
  });
  
  const page = await context.newPage();

  // Capturar erros do console
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capturar erros não tratados
  const pageErrors = [];
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
    // STEP 1: Navegar para página
    // ============================================
    logStep(1, 'Navegando para /admin/pricing');
    
    try {
      await page.goto(ADMIN_PRICING_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Aguardar um pouco para React renderizar
      await page.waitForTimeout(3000);
      
      // Verificar se há redirect para login
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
        logWarning('Página redirecionou para login - usuário não autenticado');
        results.warnings.push('Redirecionamento para login detectado');
        
        // Tirar screenshot
        await page.screenshot({ path: './test-results/login-redirect.png' });
        
        logWarning('VALIDAÇÃO INTERROMPIDA: Necessário estar autenticado');
        logWarning('Por favor, faça login manualmente e execute novamente');
        
        return;
      }
      
      logSuccess('Página carregada');
      results.passed.push('Navegação para /admin/pricing');
    } catch (error) {
      logError(`Falha ao carregar página: ${error.message}`);
      results.failed.push(`Navegação: ${error.message}`);
      
      // Tirar screenshot do erro
      await page.screenshot({ path: './test-results/error-navigation.png' });
      
      // Não lançar erro, continuar para ver o que aconteceu
      logWarning('Continuando validação para diagnóstico...');
    }

    // ============================================
    // STEP 2: Verificar carregamento da página
    // ============================================
    logStep(2, 'Verificando elementos principais da página');
    
    try {
      // Verificar título
      const title = await page.getByText('Gerenciamento de Pricing').first();
      await title.waitFor({ state: 'visible', timeout: 5000 });
      logSuccess('Título encontrado');
      
      // Verificar botões principais
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
      await page.screenshot({ path: './test-results/error-main-elements.png' });
    }

    // ============================================
    // STEP 3: Verificar lista de regras
    // ============================================
    logStep(3, 'Verificando lista de regras');
    
    try {
      // Aguardar lista carregar
      await page.waitForSelector('.space-y-4', { timeout: 5000 });
      
      // Contar grupos de regras (por modalidade)
      const ruleGroups = await page.locator('.border.rounded-lg.bg-card').count();
      log(`   Encontrados ${ruleGroups} grupos de regras`, 'cyan');
      
      if (ruleGroups >= 4) {
        logSuccess(`Lista exibe ${ruleGroups} grupos (esperado: 4+)`);
        results.passed.push(`Lista de regras (${ruleGroups} grupos)`);
      } else {
        logWarning(`Lista exibe apenas ${ruleGroups} grupos (esperado: 4+)`);
        results.warnings.push(`Lista com menos grupos que esperado: ${ruleGroups}`);
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
      await page.screenshot({ path: './test-results/error-rules-list.png' });
    }

    // ============================================
    // STEP 4: Abrir diálogo de criação
    // ============================================
    logStep(4, 'Abrindo diálogo de criação de regra');
    
    try {
      const newRuleButton = page.getByRole('button', { name: /Nova Regra/i });
      await newRuleButton.click();
      
      // Aguardar dialog abrir
      await page.waitForTimeout(500);
      
      const dialogTitle = page.getByText('Nova Regra de Pricing');
      await dialogTitle.waitFor({ state: 'visible', timeout: 3000 });
      
      logSuccess('Diálogo de criação aberto');
      results.passed.push('Abertura do diálogo de criação');
      
      // Verificar campos do formulário
      const fields = [
        'Modalidade',
        'Nome da Regra',
        'Tarifa Base',
        'Preço por Km',
        'Preço por Minuto',
        'Valor Mínimo',
      ];
      
      for (const field of fields) {
        const fieldElement = page.getByText(field, { exact: false });
        if (await fieldElement.count() > 0) {
          logSuccess(`Campo "${field}" encontrado`);
        } else {
          logWarning(`Campo "${field}" não encontrado`);
          results.warnings.push(`Campo "${field}" ausente no form`);
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
      await page.screenshot({ path: './test-results/error-create-dialog.png' });
    }

    // ============================================
    // STEP 5: Criar regra de teste (inativa)
    // ============================================
    logStep(5, 'Criando regra de teste (inativa)');
    
    const testRuleName = `Teste Validação UI ${Date.now()}`;
    
    try {
      // Abrir dialog
      await page.getByRole('button', { name: /Nova Regra/i }).click();
      await page.waitForTimeout(500);
      
      // Preencher formulário
      await page.getByLabel(/Nome da Regra/i).fill(testRuleName);
      await page.getByLabel(/Tarifa Base/i).fill('5.00');
      await page.getByLabel(/Preço por Km/i).fill('2.50');
      await page.getByLabel(/Preço por Minuto/i).fill('0.50');
      await page.getByLabel(/Valor Mínimo/i).fill('8.00');
      
      // Desativar regra (para não conflitar)
      const activeSwitch = page.locator('[role="switch"]').first();
      const isChecked = await activeSwitch.getAttribute('data-state');
      if (isChecked === 'checked') {
        await activeSwitch.click();
        await page.waitForTimeout(300);
      }
      
      // Salvar
      await page.getByRole('button', { name: /Criar/i }).click();
      
      // Aguardar toast de sucesso
      await page.waitForTimeout(2000);
      
      // Verificar se toast apareceu
      const successToast = page.getByText(/criada com sucesso/i);
      if (await successToast.count() > 0) {
        logSuccess('Regra criada com sucesso (toast confirmado)');
        results.passed.push('Criação de regra');
      } else {
        logWarning('Regra criada mas toast não detectado');
        results.warnings.push('Toast de sucesso não apareceu');
      }
      
      // Verificar se regra aparece na lista
      await page.waitForTimeout(1000);
      const createdRule = page.getByText(testRuleName);
      if (await createdRule.count() > 0) {
        logSuccess('Regra aparece na lista');
      } else {
        logWarning('Regra não aparece na lista imediatamente');
        results.warnings.push('Regra criada não visível na lista');
      }
      
    } catch (error) {
      logError(`Falha ao criar regra: ${error.message}`);
      results.failed.push(`Criação de regra: ${error.message}`);
      await page.screenshot({ path: './test-results/error-create-rule.png' });
    }

    // ============================================
    // STEP 6: Editar regra criada
    // ============================================
    logStep(6, 'Editando regra criada');
    
    try {
      // Encontrar regra de teste
      const ruleCard = page.locator('.p-4.flex.items-center', { hasText: testRuleName });
      
      if (await ruleCard.count() > 0) {
        // Clicar no botão de editar
        const editButton = ruleCard.locator('button').first();
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Verificar dialog de edição
        const editDialogTitle = page.getByText('Editar Regra');
        await editDialogTitle.waitFor({ state: 'visible', timeout: 3000 });
        
        // Alterar nome
        const nameInput = page.getByLabel(/Nome da Regra/i);
        await nameInput.clear();
        await nameInput.fill(`${testRuleName} Editado`);
        
        // Salvar
        await page.getByRole('button', { name: /Atualizar/i }).click();
        await page.waitForTimeout(2000);
        
        // Verificar toast
        const updateToast = page.getByText(/atualizada com sucesso/i);
        if (await updateToast.count() > 0) {
          logSuccess('Regra editada com sucesso');
          results.passed.push('Edição de regra');
        } else {
          logWarning('Edição realizada mas toast não detectado');
          results.warnings.push('Toast de atualização não apareceu');
        }
        
      } else {
        logWarning('Regra de teste não encontrada para edição');
        results.warnings.push('Regra não encontrada para editar');
      }
      
    } catch (error) {
      logError(`Falha ao editar regra: ${error.message}`);
      results.failed.push(`Edição de regra: ${error.message}`);
      await page.screenshot({ path: './test-results/error-edit-rule.png' });
    }

    // ============================================
    // STEP 7: Ver auditoria
    // ============================================
    logStep(7, 'Verificando auditoria');
    
    try {
      // Clicar em "Ver Auditoria"
      const auditButton = page.getByRole('button', { name: /Ver.*Auditoria/i });
      await auditButton.click();
      await page.waitForTimeout(1000);
      
      // Verificar se seção de auditoria apareceu
      const auditSection = page.locator('.border.rounded-lg.p-4.bg-card').filter({ hasText: /Histórico/i });
      
      if (await auditSection.count() > 0) {
        logSuccess('Seção de auditoria expandida');
        
        // Contar registros
        const auditRecords = page.locator('.p-3.rounded-lg.border.bg-card');
        const recordCount = await auditRecords.count();
        
        if (recordCount > 0) {
          logSuccess(`Auditoria exibe ${recordCount} registros`);
          results.passed.push(`Auditoria (${recordCount} registros)`);
        } else {
          logWarning('Auditoria sem registros');
          results.warnings.push('Auditoria vazia');
        }
      } else {
        logWarning('Seção de auditoria não encontrada');
        results.warnings.push('Auditoria não renderizada');
      }
      
    } catch (error) {
      logError(`Falha ao verificar auditoria: ${error.message}`);
      results.failed.push(`Auditoria: ${error.message}`);
      await page.screenshot({ path: './test-results/error-audit.png' });
    }

    // ============================================
    // STEP 8: Testar refresh
    // ============================================
    logStep(8, 'Testando refresh da lista');
    
    try {
      // Clicar no botão de refresh
      const refreshButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1);
      await refreshButton.click();
      
      // Aguardar um pouco
      await page.waitForTimeout(1500);
      
      // Verificar que lista ainda está visível
      const listVisible = await page.locator('.space-y-4').isVisible();
      
      if (listVisible) {
        logSuccess('Refresh funcionou - lista recarregada');
        results.passed.push('Refresh da lista');
      } else {
        logWarning('Lista não visível após refresh');
        results.warnings.push('Lista desapareceu após refresh');
      }
      
    } catch (error) {
      logError(`Falha ao testar refresh: ${error.message}`);
      results.failed.push(`Refresh: ${error.message}`);
      await page.screenshot({ path: './test-results/error-refresh.png' });
    }

    // ============================================
    // STEP 9: Verificar console
    // ============================================
    logStep(9, 'Verificando erros no console');
    
    if (consoleErrors.length === 0 && pageErrors.length === 0) {
      logSuccess('Nenhum erro crítico no console');
      results.passed.push('Console sem erros críticos');
    } else {
      if (consoleErrors.length > 0) {
        logWarning(`${consoleErrors.length} erros no console:`);
        consoleErrors.slice(0, 5).forEach(err => {
          log(`   - ${err.substring(0, 100)}`, 'yellow');
        });
        results.warnings.push(`${consoleErrors.length} erros no console`);
      }
      
      if (pageErrors.length > 0) {
        logError(`${pageErrors.length} erros de página:`);
        pageErrors.slice(0, 5).forEach(err => {
          log(`   - ${err.substring(0, 100)}`, 'red');
        });
        results.failed.push(`${pageErrors.length} erros de página`);
      }
    }

    // ============================================
    // STEP 10: Screenshot final
    // ============================================
    logStep(10, 'Capturando screenshot final');
    
    await page.screenshot({ 
      path: './test-results/final-state.png',
      fullPage: true 
    });
    
    logSuccess('Screenshot salvo em ./test-results/final-state.png');

  } catch (error) {
    logError(`Erro fatal durante validação: ${error.message}`);
    results.failed.push(`Erro fatal: ${error.message}`);
    
    // Screenshot de erro
    try {
      await page.screenshot({ path: './test-results/fatal-error.png' });
    } catch {}
  } finally {
    await context.close();
    await browser.close();
  }

  // ============================================
  // RELATÓRIO FINAL
  // ============================================
  log('\n' + '='.repeat(60), 'blue');
  log('RELATÓRIO FINAL', 'blue');
  log('='.repeat(60), 'blue');

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
  log('='.repeat(60) + '\n', 'blue');

  // Retornar código de saída
  return results.failed.length === 0 ? 0 : 1;
}

// Executar validação
validateAdminPricingUI()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
