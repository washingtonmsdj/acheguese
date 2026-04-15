#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

interface SSotViolation {
  file: string;
  line: number;
  type: 'user_id_usage' | 'missing_profile_id' | 'inline_permission' | 'ambiguous_naming';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

class SSotAuditor {
  private violations: SSotViolation[] = [];
  private processedFiles = 0;

  async auditProject(): Promise<void> {
    console.log('🔍 SSOT AUDIT - Iniciando auditoria estrutural...\n');
    
    // Auditar código TypeScript
    await this.auditDirectory('src');
    
    // Gerar relatório
    this.generateReport();
  }

  private async auditDirectory(dirPath: string): Promise<void> {
    const fullPath = join(process.cwd(), dirPath);
    
    try {
      const items = readdirSync(fullPath);
      
      for (const item of items) {
        const itemPath = join(fullPath, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          // Recursivamente auditar subdiretórios
          await this.auditDirectory(join(dirPath, item));
        } else if (stat.isFile() && this.isTypeScriptFile(item)) {
          await this.auditFile(itemPath, join(dirPath, item));
        }
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao ler diretório ${dirPath}:`, error);
    }
  }

  private isTypeScriptFile(filename: string): boolean {
    const ext = extname(filename);
    return ['.ts', '.tsx'].includes(ext) && !filename.includes('.test.') && !filename.includes('.spec.');
  }

  private async auditFile(fullPath: string, relativePath: string): Promise<void> {
    try {
      const content = readFileSync(fullPath, 'utf-8');
      const lines = content.split('\n');
      
      this.processedFiles++;
      
      lines.forEach((line, index) => {
        this.checkUserIdUsage(line, index + 1, relativePath);
        this.checkInlinePermissions(line, index + 1, relativePath);
        this.checkAmbiguousNaming(line, index + 1, relativePath);
      });
      
      // Log progresso a cada 50 arquivos
      if (this.processedFiles % 50 === 0) {
        console.log(`📄 Processados ${this.processedFiles} arquivos...`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Erro ao ler arquivo ${relativePath}:`, error);
    }
  }

  private checkUserIdUsage(line: string, lineNumber: number, file: string): void {
    // Detectar uso direto de user.id sem getActiveProfile
    if (line.includes('user.id') && !line.includes('//') && !line.includes('*')) {
      // Verificar se não é um contexto válido (admin, billing, etc.)
      const validContexts = [
        'admin', 'billing', 'auth', 'notification', 'subscription', 
        'audit', 'log', 'user_id', 'getUser', 'AdminService', 'MessagingService',
        'user_metadata', 'updateProfile', 'profileService', 'user.email', 'user.phone'
      ];
      
      const isValidContext = validContexts.some(context => 
        line.toLowerCase().includes(context.toLowerCase())
      );
      
      // Verificar se é acesso a propriedades do user (não user.id para contexto social)
      const isUserProperty = line.includes('user.email') || line.includes('user.phone') || 
                            line.includes('user.name') || line.includes('user_metadata') ||
                            line.includes('user?.') && !line.includes('user.id');
      
      if (!isValidContext && !isUserProperty) {
        this.violations.push({
          file,
          line: lineNumber,
          type: 'user_id_usage',
          description: 'Uso direto de user.id sem getActiveProfile() - deveria usar contexto de profile',
          severity: 'critical'
        });
      }
    }

    // Detectar getUser() sem getActiveProfile
    if (line.includes('getUser()') && !line.includes('//') && !line.includes('*')) {
      const hasActiveProfile = line.includes('getActiveProfile') || line.includes('getRequiredActiveProfile');
      
      if (!hasActiveProfile) {
        this.violations.push({
          file,
          line: lineNumber,
          type: 'user_id_usage',
          description: 'Uso de getUser() sem getActiveProfile() - contexto social deve usar profile',
          severity: 'high'
        });
      }
    }
  }

  private checkInlinePermissions(line: string, lineNumber: number, file: string): void {
    // Detectar verificações inline de permissões
    const permissionChecks = [
      'is_suspended', 'is_verified', 'verified', 'profile_type', 
      'role', 'plan', 'premium', 'is_active'
    ];
    
    permissionChecks.forEach(check => {
      if (line.includes(check) && line.includes('if') && !line.includes('//') && !line.includes('*')) {
        // Verificar se não está usando canUserPerformAction
        if (!line.includes('canUserPerformAction')) {
          this.violations.push({
            file,
            line: lineNumber,
            type: 'inline_permission',
            description: `Verificação inline de ${check} - deveria usar ProfileService.canUserPerformAction()`,
            severity: 'medium'
          });
        }
      }
    });
  }

  private checkAmbiguousNaming(line: string, lineNumber: number, file: string): void {
    // Detectar nomenclatura ambígua
    const ambiguousPatterns = [
      'author_id', 'creator_id', 'owner_id', 'user_id.*profile', 'profile_id.*author'
    ];
    
    ambiguousPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(line) && !line.includes('//') && !line.includes('*')) {
        this.violations.push({
          file,
          line: lineNumber,
          type: 'ambiguous_naming',
          description: `Nomenclatura ambígua: ${pattern} - usar padrão explícito (*_profile_id)`,
          severity: 'high'
        });
      }
    });
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE AUDITORIA SSOT');
    console.log('='.repeat(80));
    
    console.log(`\n📄 Arquivos processados: ${this.processedFiles}`);
    console.log(`🚨 Total de violações: ${this.violations.length}`);
    
    // Agrupar por severidade
    const bySeverity = this.groupBy(this.violations, 'severity');
    console.log('\n📈 Violações por severidade:');
    Object.entries(bySeverity).forEach(([severity, violations]) => {
      const icon = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${icon} ${severity.toUpperCase()}: ${violations.length}`);
    });
    
    // Agrupar por tipo
    const byType = this.groupBy(this.violations, 'type');
    console.log('\n📋 Violações por tipo:');
    Object.entries(byType).forEach(([type, violations]) => {
      console.log(`  • ${type}: ${violations.length}`);
    });
    
    // Top 10 arquivos com mais violações
    const byFile = this.groupBy(this.violations, 'file');
    const topFiles = Object.entries(byFile)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10);
    
    if (topFiles.length > 0) {
      console.log('\n🏆 Top 10 arquivos com mais violações:');
      topFiles.forEach(([file, violations], index) => {
        console.log(`  ${index + 1}. ${file}: ${violations.length} violações`);
      });
    }
    
    // Detalhes das violações críticas
    const criticalViolations = this.violations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      console.log('\n🔴 VIOLAÇÕES CRÍTICAS (Primeiras 10):');
      criticalViolations.slice(0, 10).forEach((violation, index) => {
        console.log(`\n  ${index + 1}. ${violation.file}:${violation.line}`);
        console.log(`     ${violation.description}`);
      });
      
      if (criticalViolations.length > 10) {
        console.log(`\n     ... e mais ${criticalViolations.length - 10} violações críticas`);
      }
    }
    
    // Status final
    console.log('\n' + '='.repeat(80));
    if (this.violations.length === 0) {
      console.log('✅ SSOT COMPLIANT - Nenhuma violação encontrada!');
    } else {
      const criticalCount = bySeverity.critical?.length || 0;
      const highCount = bySeverity.high?.length || 0;
      
      if (criticalCount > 0) {
        console.log(`❌ SSOT NÃO COMPLIANT - ${criticalCount} violações críticas encontradas`);
      } else if (highCount > 0) {
        console.log(`⚠️ SSOT PARCIALMENTE COMPLIANT - ${highCount} violações de alta prioridade`);
      } else {
        console.log('✅ SSOT MAJORITARIAMENTE COMPLIANT - Apenas violações menores');
      }
    }
    console.log('='.repeat(80));
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const group = String(item[key]);
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

// Executar auditoria
const auditor = new SSotAuditor();
auditor.auditProject().catch(console.error);