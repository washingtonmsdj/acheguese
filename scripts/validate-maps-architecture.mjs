#!/usr/bin/env node

/**
 * Script de Validação de Arquitetura de Maps
 * 
 * Valida:
 * 1. Lint do módulo maps (0 violações esperadas)
 * 2. Testes do módulo maps (100% passando)
 * 3. Testes de violação intencional (devem falhar corretamente)
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function section(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

function runCommand(command, description) {
  try {
    log(`▶ ${description}...`, 'blue');
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log(`✅ ${description} - SUCESSO`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - FALHA`, 'red');
    return { success: false, output: error.stdout || error.stderr };
  }
}

function main() {
  log('\n🗺️  VALIDAÇÃO DE ARQUITETURA DO MÓDULO MAPS\n', 'cyan');
  
  const results = {
    lint: false,
    tests: false,
    violations: false,
  };

  // ─────────────────────────────────────────────────────────────────────────
  // 1. LINT DO MÓDULO MAPS
  // ─────────────────────────────────────────────────────────────────────────
  
  section('1. LINT DO MÓDULO MAPS');
  
  const lintResult = runCommand(
    'npm run lint:maps',
    'Validando código do módulo maps'
  );
  
  results.lint = lintResult.success;
  
  if (!lintResult.success) {
    log('\n📋 Output do lint:', 'yellow');
    console.log(lintResult.output);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. TESTES DO MÓDULO MAPS
  // ─────────────────────────────────────────────────────────────────────────
  
  section('2. TESTES DO MÓDULO MAPS');
  
  const testResult = runCommand(
    'npm run test:maps',
    'Executando testes do módulo maps'
  );
  
  results.tests = testResult.success;
  
  if (testResult.success) {
    // Extrair estatísticas dos testes
    const match = testResult.output.match(/Tests\s+(\d+)\s+passed\s+\((\d+)\)/);
    if (match) {
      log(`\n📊 Testes: ${match[1]}/${match[2]} passando (100%)`, 'green');
    }
  } else {
    log('\n📋 Output dos testes:', 'yellow');
    console.log(testResult.output);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. VALIDAÇÃO DE VIOLAÇÕES INTENCIONAIS
  // ─────────────────────────────────────────────────────────────────────────
  
  section('3. VALIDAÇÃO DE VIOLAÇÕES INTENCIONAIS');
  
  const violationFiles = [
    'src/__tests__/maps-architecture-validation/test-violation-direct-provider.ts',
    'src/__tests__/maps-architecture-validation/test-violation-cross-layer.ts',
  ];
  
  let allViolationsDetected = true;
  
  for (const file of violationFiles) {
    if (!existsSync(file)) {
      log(`⚠️  Arquivo de teste não encontrado: ${file}`, 'yellow');
      allViolationsDetected = false;
      continue;
    }
    
    // Usar --no-ignore para forçar lint nos arquivos de violação intencional
    const violationResult = runCommand(
      `npx eslint "${file}" --no-ignore --config eslint.config.js`,
      `Testando detecção de violação: ${file.split('/').pop()}`
    );
    
    // Esperamos que FALHE (violação detectada)
    if (!violationResult.success) {
      if (violationResult.output.includes('MAPS BLINDAGEM')) {
        log(`  ✅ Violação detectada corretamente`, 'green');
      } else {
        log(`  ⚠️  Falhou mas sem mensagem de blindagem`, 'yellow');
        allViolationsDetected = false;
      }
    } else {
      log(`  ❌ Violação NÃO foi detectada (esperava falha)`, 'red');
      allViolationsDetected = false;
    }
  }
  
  results.violations = allViolationsDetected;

  // ─────────────────────────────────────────────────────────────────────────
  // RESUMO FINAL
  // ─────────────────────────────────────────────────────────────────────────
  
  section('RESUMO DA VALIDAÇÃO');
  
  const checks = [
    { name: 'Lint do módulo maps', passed: results.lint },
    { name: 'Testes do módulo maps', passed: results.tests },
    { name: 'Detecção de violações', passed: results.violations },
  ];
  
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    const color = check.passed ? 'green' : 'red';
    log(`${icon} ${check.name}`, color);
  });
  
  const allPassed = checks.every(c => c.passed);
  
  console.log('\n' + '='.repeat(60));
  
  if (allPassed) {
    log('\n🎉 VALIDAÇÃO COMPLETA: Arquitetura de maps íntegra!\n', 'green');
    process.exit(0);
  } else {
    log('\n❌ VALIDAÇÃO FALHOU: Corrija os problemas acima\n', 'red');
    process.exit(1);
  }
}

main();
