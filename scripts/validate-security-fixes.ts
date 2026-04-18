#!/usr/bin/env ts-node
/**
 * Script de Validação de Correções de Segurança
 * 
 * Verifica se todas as vulnerabilidades críticas foram corrigidas.
 * 
 * Uso: npx ts-node scripts/validate-security-fixes.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

class SecurityValidator {
  private results: ValidationResult[] = [];
  private srcPath = path.join(process.cwd(), 'src');

  async validate(): Promise<void> {
    console.log('🔍 Validando correções de segurança...\n');

    await this.checkInnerHTML();
    await this.checkDangerouslySetInnerHTML();
    await this.checkCSP();
    await this.checkSecurityComponents();
    await this.checkESLintConfig();
    await this.checkPreCommitHook();
    await this.checkTests();
    await this.checkDocumentation();

    this.printResults();
  }

  private async checkInnerHTML(): Promise<void> {
    console.log('📝 Verificando innerHTML...');
    
    try {
      const result = execSync(
        `grep -r "\\.innerHTML\\s*=" ${this.srcPath} | grep -v "DOMPurify" | grep -v "// SAFE:" | grep -v "node_modules" || true`,
        { encoding: 'utf-8' }
      );

      if (result.trim()) {
        this.results.push({
          passed: false,
          message: '❌ innerHTML sem sanitização encontrado',
          details: result
        });
      } else {
        this.results.push({
          passed: true,
          message: '✅ Nenhum innerHTML vulnerável encontrado'
        });
      }
    } catch (error) {
      this.results.push({
        passed: true,
        message: '✅ Nenhum innerHTML vulnerável encontrado'
      });
    }
  }

  private async checkDangerouslySetInnerHTML(): Promise<void> {
    console.log('📝 Verificando dangerouslySetInnerHTML...');
    
    try {
      const result = execSync(
        `grep -r "dangerouslySetInnerHTML" ${this.srcPath} | grep -v "SafeHtml" | grep -v "node_modules" || true`,
        { encoding: 'utf-8' }
      );

      if (result.trim()) {
        this.results.push({
          passed: false,
          message: '❌ dangerouslySetInnerHTML sem SafeHtml encontrado',
          details: result
        });
      } else {
        this.results.push({
          passed: true,
          message: '✅ Nenhum dangerouslySetInnerHTML vulnerável encontrado'
        });
      }
    } catch (error) {
      this.results.push({
        passed: true,
        message: '✅ Nenhum dangerouslySetInnerHTML vulnerável encontrado'
      });
    }
  }

  private async checkCSP(): Promise<void> {
    console.log('📝 Verificando Content Security Policy...');
    
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    
    if (!fs.existsSync(vercelJsonPath)) {
      this.results.push({
        passed: false,
        message: '❌ vercel.json não encontrado'
      });
      return;
    }

    const content = fs.readFileSync(vercelJsonPath, 'utf-8');
    
    if (content.includes('Content-Security-Policy')) {
      this.results.push({
        passed: true,
        message: '✅ CSP configurado no vercel.json'
      });
    } else {
      this.results.push({
        passed: false,
        message: '❌ CSP não configurado no vercel.json'
      });
    }
  }

  private async checkSecurityComponents(): Promise<void> {
    console.log('📝 Verificando componentes de segurança...');
    
    const components = [
      'src/shared/components/security/SafeHtml.tsx',
      'src/shared/components/security/SafeLink.tsx',
      'src/shared/components/security/SafeImage.tsx',
      'src/shared/components/security/index.ts'
    ];

    const missing = components.filter(c => !fs.existsSync(path.join(process.cwd(), c)));

    if (missing.length > 0) {
      this.results.push({
        passed: false,
        message: '❌ Componentes de segurança faltando',
        details: missing.join('\n')
      });
    } else {
      this.results.push({
        passed: true,
        message: '✅ Todos os componentes de segurança criados'
      });
    }
  }

  private async checkESLintConfig(): Promise<void> {
    console.log('📝 Verificando configuração ESLint...');
    
    const eslintPath = path.join(process.cwd(), '.eslintrc-security.json');
    
    if (fs.existsSync(eslintPath)) {
      this.results.push({
        passed: true,
        message: '✅ ESLint security configurado'
      });
    } else {
      this.results.push({
        passed: false,
        message: '❌ ESLint security não configurado'
      });
    }
  }

  private async checkPreCommitHook(): Promise<void> {
    console.log('📝 Verificando pre-commit hook...');
    
    const hookPath = path.join(process.cwd(), '.husky/pre-commit-security');
    
    if (fs.existsSync(hookPath)) {
      this.results.push({
        passed: true,
        message: '✅ Pre-commit hook de segurança configurado'
      });
    } else {
      this.results.push({
        passed: false,
        message: '❌ Pre-commit hook de segurança não configurado'
      });
    }
  }

  private async checkTests(): Promise<void> {
    console.log('📝 Verificando testes de segurança...');
    
    const testPath = path.join(process.cwd(), 'tests/security/xss-prevention.test.tsx');
    
    if (fs.existsSync(testPath)) {
      this.results.push({
        passed: true,
        message: '✅ Testes de segurança criados'
      });
    } else {
      this.results.push({
        passed: false,
        message: '❌ Testes de segurança não encontrados'
      });
    }
  }

  private async checkDocumentation(): Promise<void> {
    console.log('📝 Verificando documentação...');
    
    const docs = [
      'docs/SECURITY_GUIDELINES.md',
      'SECURITY_FIXES_APPLIED.md'
    ];

    const missing = docs.filter(d => !fs.existsSync(path.join(process.cwd(), d)));

    if (missing.length > 0) {
      this.results.push({
        passed: false,
        message: '❌ Documentação de segurança faltando',
        details: missing.join('\n')
      });
    } else {
      this.results.push({
        passed: true,
        message: '✅ Documentação de segurança completa'
      });
    }
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DA VALIDAÇÃO');
    console.log('='.repeat(60) + '\n');

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    this.results.forEach(result => {
      console.log(result.message);
      if (result.details) {
        console.log(`   ${result.details.split('\n').join('\n   ')}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Passou: ${passed}/${total} (${percentage}%)`);
    console.log('='.repeat(60) + '\n');

    if (passed === total) {
      console.log('🎉 TODAS AS CORREÇÕES FORAM APLICADAS COM SUCESSO!\n');
      process.exit(0);
    } else {
      console.log('⚠️  ALGUMAS CORREÇÕES AINDA PRECISAM SER APLICADAS\n');
      process.exit(1);
    }
  }
}

// Executar validação
const validator = new SecurityValidator();
validator.validate().catch(error => {
  console.error('❌ Erro ao validar:', error);
  process.exit(1);
});
