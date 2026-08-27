/**
 * Cross-platform security validation for the frontend security baseline.
 * The script intentionally uses Node filesystem APIs instead of grep so it
 * behaves the same way on Windows, Linux and CI.
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
}

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.html']);
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', '.git', '.tmp', 'coverage']);

type SourceMatch = {
  file: string;
  line: number;
  text: string;
};

class SecurityValidator {
  private results: ValidationResult[] = [];
  private readonly rootPath = process.cwd();
  private readonly srcPath = path.join(this.rootPath, 'src');
  private readonly publicPath = path.join(this.rootPath, 'public');

  async validate(): Promise<void> {
    console.log('Validando correcoes de seguranca...\n');

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

  private listSourceFiles(directory: string): string[] {
    if (!fs.existsSync(directory)) {
      return [];
    }

    const files: string[] = [];
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          files.push(...this.listSourceFiles(path.join(directory, entry.name)));
        }
        continue;
      }

      if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(path.join(directory, entry.name));
      }
    }

    return files;
  }

  private findInSource(predicate: (line: string, file: string) => boolean): SourceMatch[] {
    const matches: SourceMatch[] = [];

    for (const file of [
      ...this.listSourceFiles(this.srcPath),
      ...this.listSourceFiles(this.publicPath),
    ]) {
      const relativeFile = path.relative(this.rootPath, file).replace(/\\/g, '/');
      const lines = fs.readFileSync(file, 'utf-8').split(/\r?\n/);

      lines.forEach((line, index) => {
        if (predicate(line, relativeFile)) {
          matches.push({ file: relativeFile, line: index + 1, text: line.trim() });
        }
      });
    }

    return matches;
  }

  private formatMatches(matches: SourceMatch[]): string {
    return matches.map((match) => `${match.file}:${match.line} ${match.text}`).join('\n');
  }

  private async checkInnerHTML(): Promise<void> {
    console.log('Verificando innerHTML...');

    const matches = this.findInSource((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || !/\.innerHTML\s*=/.test(line)) {
        return false;
      }

      return !line.includes('DOMPurify') && !line.includes('// SAFE:') && !line.includes('// SEGURO:');
    });

    if (matches.length > 0) {
      this.results.push({
        passed: false,
        message: 'FALHA: innerHTML sem sanitizacao encontrado',
        details: this.formatMatches(matches),
      });
      return;
    }

    this.results.push({ passed: true, message: 'OK: nenhum innerHTML vulneravel encontrado' });
  }

  private async checkDangerouslySetInnerHTML(): Promise<void> {
    console.log('Verificando dangerouslySetInnerHTML...');

    const matches = this.findInSource((line, file) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || !line.includes('dangerouslySetInnerHTML')) {
        return false;
      }

      return file !== 'src/shared/components/security/SafeHtml.tsx';
    });

    if (matches.length > 0) {
      this.results.push({
        passed: false,
        message: 'FALHA: dangerouslySetInnerHTML fora de SafeHtml encontrado',
        details: this.formatMatches(matches),
      });
      return;
    }

    this.results.push({ passed: true, message: 'OK: dangerouslySetInnerHTML restrito ao SafeHtml' });
  }

  private async checkCSP(): Promise<void> {
    console.log('Verificando Content Security Policy...');

    const vercelJsonPath = path.join(this.rootPath, 'vercel.json');

    if (!fs.existsSync(vercelJsonPath)) {
      this.results.push({ passed: false, message: 'FALHA: vercel.json nao encontrado' });
      return;
    }

    const content = fs.readFileSync(vercelJsonPath, 'utf-8');
    if (content.includes('Content-Security-Policy')) {
      this.results.push({ passed: true, message: 'OK: CSP configurado no vercel.json' });
      return;
    }

    this.results.push({ passed: false, message: 'FALHA: CSP nao configurado no vercel.json' });
  }

  private async checkSecurityComponents(): Promise<void> {
    console.log('Verificando componentes de seguranca...');

    const components = [
      'src/shared/components/security/SafeHtml.tsx',
      'src/shared/components/security/SafeLink.tsx',
      'src/shared/components/security/SafeImage.tsx',
      'src/shared/components/security/index.ts',
    ];

    const missing = components.filter((component) => !fs.existsSync(path.join(this.rootPath, component)));
    if (missing.length > 0) {
      this.results.push({
        passed: false,
        message: 'FALHA: componentes de seguranca faltando',
        details: missing.join('\n'),
      });
      return;
    }

    this.results.push({ passed: true, message: 'OK: componentes de seguranca existem' });
  }

  private async checkESLintConfig(): Promise<void> {
    console.log('Verificando configuracao ESLint...');

    const eslintPath = path.join(this.rootPath, 'eslint-rules/configs/.eslintrc-security.json');
    if (fs.existsSync(eslintPath)) {
      this.results.push({ passed: true, message: 'OK: ESLint security configurado' });
      return;
    }

    this.results.push({ passed: false, message: 'FALHA: ESLint security nao configurado' });
  }

  private async checkPreCommitHook(): Promise<void> {
    console.log('Verificando pre-commit hook...');

    const hookPath = path.join(this.rootPath, '.husky/pre-commit-security');
    if (fs.existsSync(hookPath)) {
      this.results.push({ passed: true, message: 'OK: pre-commit hook de seguranca configurado' });
      return;
    }

    this.results.push({ passed: false, message: 'FALHA: pre-commit hook de seguranca nao configurado' });
  }

  private async checkTests(): Promise<void> {
    console.log('Verificando testes de seguranca...');

    const testPath = path.join(this.rootPath, 'tests/security/xss-prevention.test.tsx');
    if (fs.existsSync(testPath)) {
      this.results.push({ passed: true, message: 'OK: testes de seguranca existem' });
      return;
    }

    this.results.push({ passed: false, message: 'FALHA: testes de seguranca nao encontrados' });
  }

  private async checkDocumentation(): Promise<void> {
    console.log('Verificando documentacao...');

    const docs = ['docs/SECURITY_GUIDELINES.md', 'docs/fixes/SECURITY_FIXES_APPLIED.md'];
    const missing = docs.filter((doc) => !fs.existsSync(path.join(this.rootPath, doc)));

    if (missing.length > 0) {
      this.results.push({
        passed: false,
        message: 'FALHA: documentacao de seguranca faltando',
        details: missing.join('\n'),
      });
      return;
    }

    this.results.push({ passed: true, message: 'OK: documentacao de seguranca completa' });
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('RESULTADOS DA VALIDACAO');
    console.log('='.repeat(60) + '\n');

    const passed = this.results.filter((result) => result.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);

    this.results.forEach((result) => {
      console.log(result.message);
      if (result.details) {
        console.log(`   ${result.details.split('\n').join('\n   ')}`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log(`Passou: ${passed}/${total} (${percentage}%)`);
    console.log('='.repeat(60) + '\n');

    if (passed === total) {
      console.log('Todas as correcoes foram aplicadas com sucesso.\n');
      process.exit(0);
    }

    console.log('Algumas correcoes ainda precisam ser aplicadas.\n');
    process.exit(1);
  }
}

const validator = new SecurityValidator();
validator.validate().catch((error) => {
  console.error('Erro ao validar seguranca:', error);
  process.exit(1);
});
