#!/usr/bin/env tsx

/**
 * SSOT Compliance Validator
 * 
 * Valida se o código segue a REGRA DEFINITIVA do SSOT
 * Baseado em SSOT_REGRA_DEFINITIVA.md
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { pathToFileURL } from 'url';

interface SSotViolation {
  file: string;
  line: number;
  type: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  rule: string;
  violation: string;
  suggestion: string;
}

class SSotValidator {
  private violations: SSotViolation[] = [];
  private processedFiles = 0;

  // Padrões proibidos
  private readonly FORBIDDEN_PATTERNS = {
    // Uso direto de user.id em contexto social
    USER_ID_SOCIAL: {
      pattern: /(?:insert|upsert|update)\s*\([^)]*(?:user\.id|getUser\(\).*\.id)/g,
      rule: 'Regra 1: Toda ação de domínio usa profile',
      suggestion: 'Use getRequiredActiveProfile() ou getActiveProfile()',
      type: 'CRITICAL' as const
    },
    
    // Nomenclatura ambígua
    AMBIGUOUS_NAMING: {
      pattern: /\b(?:author_id|owner_id|creator_id)\s*[:=]/g,
      rule: 'Regra 2: Nomenclatura explícita obrigatória',
      suggestion: 'Use author_profile_id, owner_profile_id, creator_profile_id',
      type: 'HIGH' as const
    },
    
    // user_id em contexto social (SQL)
    USER_ID_IN_SOCIAL_SQL: {
      pattern: /(?:user_id.*(?:posts|comments|likes|reviews|messages|classifieds|businesses))/g,
      rule: 'Regra 3: user_id só em contexto global/técnico',
      suggestion: 'Use *_profile_id para contexto social',
      type: 'CRITICAL' as const
    }};

  // Contextos onde user_id é permitido (exceções)
  private readonly ALLOWED_USER_ID_CONTEXTS = [
    'notifications',
    'user_subscriptions',
    'audit_logs',
    'user_roles',
    'banned_users',
    'user_settings',
    'moderation_actions',
    'profiles', // Exceção: profiles.user_id
    'auth', // Contexto de autenticação
    'billing', // Contexto de billing
    'admin', // Contexto administrativo
    'family' // Contexto familiar usa user_id como owner t�cnico
  ];

  async validateProject(): Promise<void> {
    console.log('🔍 Validando conformidade SSOT...\n');
    
    const srcPath = join(process.cwd(), 'src');
    await this.validateDirectory(srcPath);
    
    this.printReport();
  }

  private async validateDirectory(dirPath: string): Promise<void> {
    const entries = readdirSync(dirPath);
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.startsWith('.') && entry !== 'node_modules') {
          await this.validateDirectory(fullPath);
        }
      } else if (this.isTypeScriptFile(fullPath)) {
        await this.validateFile(fullPath);
      }
    }
  }

  private isTypeScriptFile(filePath: string): boolean {
    const ext = extname(filePath);
    return ['.ts', '.tsx'].includes(ext);
  }

  private async validateFile(filePath: string): Promise<void> {
    try {
      if (this.shouldSkipFile(filePath)) {
        return;
      }

      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      this.processedFiles++;
      
      // Validar cada linha
      lines.forEach((line, index) => {
        this.validateLine(filePath, line, index + 1);
      });
      
    } catch (error) {
      console.warn(`⚠️  Erro ao processar ${filePath}:`, error);
    }
  }

  private validateLine(filePath: string, line: string, lineNumber: number): void {
    // Skip comentários e strings
    if (this.isCommentOrString(line)) {
      return;
    }

    // Validar cada padrão proibido
    Object.entries(this.FORBIDDEN_PATTERNS).forEach(([key, config]) => {
      const matches = line.match(config.pattern);
      
      if (matches) {
        // Verificar se é exceção válida para user_id
        if (key.includes('USER_ID') && this.isAllowedUserIdContext(filePath, line)) {
          return;
        }
        
        matches.forEach(match => {
          this.violations.push({
            file: this.getRelativePath(filePath),
            line: lineNumber,
            type: config.type,
            rule: config.rule,
            violation: match.trim(),
            suggestion: config.suggestion
          });
        });
      }
    });
  }

  private shouldSkipFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');

    return (
      normalizedPath.includes('/__tests__/') ||
      normalizedPath.includes('/__fixtures__/') ||
      normalizedPath.includes('/types/') ||
      normalizedPath.endsWith('.generated.ts') ||
      normalizedPath.endsWith('.test.ts') ||
      normalizedPath.endsWith('.test.tsx') ||
      normalizedPath.endsWith('.spec.ts') ||
      normalizedPath.endsWith('.spec.tsx')
    );
  }

  private isCommentOrString(line: string): boolean {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.includes('COMMENT ON') ||
      /^['"`].*['"`]$/.test(trimmed)
    );
  }

  private isAllowedUserIdContext(filePath: string, line: string): boolean {
    const lowerPath = filePath.toLowerCase();
    const lowerLine = line.toLowerCase();
    
    return this.ALLOWED_USER_ID_CONTEXTS.some(context => 
      lowerPath.includes(context) || lowerLine.includes(context)
    );
  }

  private getRelativePath(fullPath: string): string {
    return fullPath
      .replace(process.cwd(), '')
      .replace(/^[\\/]/, '')
      .replace(/\\/g, '/');
  }

  private printReport(): void {
    console.log('📊 RELATÓRIO DE CONFORMIDADE SSOT\n');
    console.log(`Arquivos analisados: ${this.processedFiles}`);
    console.log(`Violações encontradas: ${this.violations.length}\n`);

    if (this.violations.length === 0) {
      console.log('✅ PARABÉNS! Código 100% conforme com SSOT\n');
      return;
    }

    // Agrupar por tipo
    const critical = this.violations.filter(v => v.type === 'CRITICAL');
    const high = this.violations.filter(v => v.type === 'HIGH');
    const medium = this.violations.filter(v => v.type === 'MEDIUM');

    if (critical.length > 0) {
      console.log(`🚨 VIOLAÇÕES CRÍTICAS (${critical.length}):`);
      critical.forEach(v => this.printViolation(v));
      console.log();
    }

    if (high.length > 0) {
      console.log(`⚠️  VIOLAÇÕES ALTAS (${high.length}):`);
      high.forEach(v => this.printViolation(v));
      console.log();
    }

    if (medium.length > 0) {
      console.log(`📝 VIOLAÇÕES MÉDIAS (${medium.length}):`);
      medium.forEach(v => this.printViolation(v));
      console.log();
    }

    // Resumo por regra
    console.log('📋 RESUMO POR REGRA:');
    const byRule = this.groupByRule();
    Object.entries(byRule).forEach(([rule, count]) => {
      console.log(`   ${rule}: ${count} violações`);
    });

    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Corrigir violações CRÍTICAS primeiro');
    console.log('2. Consultar SSOT_REGRA_DEFINITIVA.md para padrões corretos');
    console.log('3. Executar novamente após correções');
    
    // Exit code para CI/CD
    process.exit(this.violations.length > 0 ? 1 : 0);
  }

  private printViolation(violation: SSotViolation): void {
    console.log(`   ${violation.file}:${violation.line}`);
    console.log(`   Regra: ${violation.rule}`);
    console.log(`   Violação: "${violation.violation}"`);
    console.log(`   Sugestão: ${violation.suggestion}`);
    console.log();
  }

  private groupByRule(): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    this.violations.forEach(v => {
      grouped[v.rule] = (grouped[v.rule] || 0) + 1;
    });
    
    return grouped;
  }
}

// Executar validação
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log('🔍 Iniciando validação SSOT...');
  const validator = new SSotValidator();
  validator.validateProject().catch(console.error);
}

export { SSotValidator };
