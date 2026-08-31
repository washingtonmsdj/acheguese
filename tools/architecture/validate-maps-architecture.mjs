#!/usr/bin/env node

/**
 * Script de Validação de Arquitetura de Maps
 *
 * Valida:
 * 1. Lint do módulo maps (0 violações esperadas)
 * 2. Testes do módulo maps (100% passando)
 * 3. Fixtures negativos: cada violação intencional deve disparar a regra Maps esperada
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

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

function decodeCommandOutput(value) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toString('utf-8');
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runCommand(command, args, description) {
  try {
    log(`▶ ${description}...`, 'blue');
    const output = execFileSync(command, args, {
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    log(`✅ ${description} - SUCESSO`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} - FALHA`, 'red');
    const stdout = decodeCommandOutput(error.stdout);
    const stderr = decodeCommandOutput(error.stderr);
    return {
      success: false,
      output: [stdout, stderr].filter(Boolean).join('\n'),
    };
  }
}

function validateIntentionalViolation({ fixture, virtualFilename, expectedRule }) {
  const description = `Testando detecção de violação: ${fixture.split('/').pop()}`;

  if (!existsSync(fixture)) {
    log(`⚠️  Arquivo de teste não encontrado: ${fixture}`, 'yellow');
    return false;
  }

  const source = readFileSync(fixture, 'utf-8');

  try {
    log(`▶ ${description}...`, 'blue');
    execFileSync(
      npxCmd,
      [
        'eslint',
        '--stdin',
        '--stdin-filename',
        virtualFilename,
        '--config',
        'eslint.config.js',
        '--format',
        'json',
      ],
      {
        encoding: 'utf-8',
        input: source,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    log(`❌ ${description} - violação NÃO detectada`, 'red');
    log(`  Esperava a regra ${expectedRule}, mas o ESLint encerrou com sucesso.`, 'yellow');
    return false;
  } catch (error) {
    const stdout = decodeCommandOutput(error.stdout);
    const stderr = decodeCommandOutput(error.stderr);

    let report;
    try {
      report = JSON.parse(stdout);
    } catch {
      log(`❌ ${description} - ESLint falhou sem relatório JSON válido`, 'red');
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      return false;
    }

    const messages = report.flatMap((entry) => entry.messages ?? []);
    const detected = messages.find((message) => message.ruleId === expectedRule);

    if (!detected) {
      const actualRules = [...new Set(messages.map((message) => message.ruleId).filter(Boolean))];
      log(`❌ ${description} - regra esperada não detectada`, 'red');
      log(`  Esperada: ${expectedRule}`, 'yellow');
      log(`  Observadas: ${actualRules.join(', ') || '(nenhuma regra identificada)'}`, 'yellow');
      if (stderr) console.error(stderr);
      return false;
    }

    log(`✅ ${description} - SUCESSO`, 'green');
    log(`  ✅ ${expectedRule}: ${detected.message}`, 'green');
    return true;
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
    npmCmd,
    ['run', 'lint:maps'],
    'Validando código do módulo maps',
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
    npmCmd,
    ['run', 'test:maps'],
    'Executando testes do módulo maps',
  );

  results.tests = testResult.success;

  if (testResult.success) {
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

  const violations = [
    {
      fixture:
        'tests/architecture/maps-architecture-validation/test-violation-direct-provider.ts',
      // A regra é aplicada a source. O fixture permanece fora de src para não
      // quebrar o lint normal, e o validator fornece um filename virtual seguro.
      virtualFilename:
        'src/core/maps/__architecture_validation__/test-violation-direct-provider.ts',
      expectedRule: 'maps/no-direct-provider-import',
    },
    {
      fixture:
        'tests/architecture/maps-architecture-validation/test-violation-cross-layer.ts',
      // no-cross-layer-import depende semanticamente da camada indicada pelo
      // filename. Simulamos um consumidor modules sem inserir source inválido.
      virtualFilename:
        'src/modules/__architecture_validation__/test-violation-cross-layer.ts',
      expectedRule: 'maps/no-cross-layer-import',
    },
  ];

  results.violations = violations.every(validateIntentionalViolation);

  // ─────────────────────────────────────────────────────────────────────────
  // RESUMO FINAL
  // ─────────────────────────────────────────────────────────────────────────

  section('RESUMO DA VALIDAÇÃO');

  const checks = [
    { name: 'Lint do módulo maps', passed: results.lint },
    { name: 'Testes do módulo maps', passed: results.tests },
    { name: 'Detecção de violações', passed: results.violations },
  ];

  checks.forEach((check) => {
    const icon = check.passed ? '✅' : '❌';
    const color = check.passed ? 'green' : 'red';
    log(`${icon} ${check.name}`, color);
  });

  const allPassed = checks.every((check) => check.passed);

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    log('\n🎉 VALIDAÇÃO COMPLETA: Arquitetura de maps íntegra!\n', 'green');
    process.exit(0);
  }

  log('\n❌ VALIDAÇÃO FALHOU: Corrija os problemas acima\n', 'red');
  process.exit(1);
}

main();
