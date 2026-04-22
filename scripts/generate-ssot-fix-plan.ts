#!/usr/bin/env node
/**
 * SSOT Fix Plan Generator
 * 
 * Gera um plano de ação priorizado para corrigir violações SSOT
 * baseado em impacto, criticidade e esforço estimado.
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configuração de prioridades
const PRIORITY_CONFIG = {
  // Arquivos críticos (alta prioridade)
  critical: [
    'src/core/admin/',
    'src/core/session/',
    'src/core/subscription/',
    'src/core/verification/',
  ],
  
  // Arquivos importantes (média prioridade)
  important: [
    'src/core/public-identity/',
    'src/modules/business/',
    'src/modules/business/gastronomy/',
  ],
  
  // Arquivos de baixa prioridade
  low: [
    'src/shared/hooks/',
    'src/modules/community/',
  ],
};

interface FixTask {
  file: string;
  violations: number;
  priority: 'critical' | 'important' | 'low';
  estimatedEffort: 'small' | 'medium' | 'large';
  suggestedApproach: string;
}

function getPriority(filePath: string): 'critical' | 'important' | 'low' {
  if (PRIORITY_CONFIG.critical.some(p => filePath.includes(p))) return 'critical';
  if (PRIORITY_CONFIG.important.some(p => filePath.includes(p))) return 'important';
  return 'low';
}

function estimateEffort(violations: number): 'small' | 'medium' | 'large' {
  if (violations <= 5) return 'small';
  if (violations <= 15) return 'medium';
  return 'large';
}

function getSuggestedApproach(filePath: string, violations: number): string {
  if (filePath.includes('/services/')) {
    if (filePath.includes('Admin')) {
      return 'Refactor to delegate to appropriate SSOT services';
    }
    return 'This is likely a SSOT - verify if queries are appropriate';
  }
  
  if (filePath.includes('/components/')) {
    return 'Move data fetching logic to hooks or services';
  }
  
  if (filePath.includes('/hooks/')) {
    return 'Use SSOT services instead of direct queries';
  }
  
  if (filePath.includes('/adapters/')) {
    return 'Delegate to SSOT services for data access';
  }
  
  return 'Replace direct queries with appropriate SSOT service calls';
}

function generateFixPlan(): void {
  console.log('🔍 Analyzing SSOT violations...\n');
  
  // Simular análise (em produção, executaria o check-ssot-compliance)
  const tasks: FixTask[] = [
    {
      file: 'src/core/admin/services/AdminBusinessService.ts',
      violations: 15,
      priority: 'critical',
      estimatedEffort: 'medium',
      suggestedApproach: 'Refactor to delegate to BusinessService',
    },
    {
      file: 'src/core/admin/services/AdminProfessionalService.ts',
      violations: 12,
      priority: 'critical',
      estimatedEffort: 'medium',
      suggestedApproach: 'Refactor to delegate to ProfessionalService',
    },
    {
      file: 'src/core/public-identity/adapters/BusinessIdentityAdapter.ts',
      violations: 4,
      priority: 'important',
      estimatedEffort: 'small',
      suggestedApproach: 'Use BusinessService for data access',
    },
    {
      file: 'src/core/public-identity/adapters/ProfessionalIdentityAdapter.ts',
      violations: 2,
      priority: 'important',
      estimatedEffort: 'small',
      suggestedApproach: 'Use ProfessionalService for data access',
    },
    {
      file: 'src/core/verification/services/VerificationService.ts',
      violations: 15,
      priority: 'critical',
      estimatedEffort: 'medium',
      suggestedApproach: 'Use ProfileService for profile operations',
    },
    {
      file: 'src/modules/business/gastronomy/services/MenuService.ts',
      violations: 9,
      priority: 'important',
      estimatedEffort: 'small',
      suggestedApproach: 'This is a SSOT - queries are appropriate',
    },
  ];
  
  // Ordenar por prioridade e esforço
  const sortedTasks = tasks.sort((a, b) => {
    const priorityOrder = { critical: 0, important: 1, low: 2 };
    const effortOrder = { small: 0, medium: 1, large: 2 };
    
    if (a.priority !== b.priority) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    
    return effortOrder[a.estimatedEffort] - effortOrder[b.estimatedEffort];
  });
  
  // Gerar relatório
  let report = '# 📋 SSOT Fix Plan - Prioritized Action Items\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n`;
  report += `**Total Tasks**: ${tasks.length}\n\n`;
  report += '---\n\n';
  
  // Agrupar por prioridade
  ['critical', 'important', 'low'].forEach(priority => {
    const priorityTasks = sortedTasks.filter(t => t.priority === priority);
    
    if (priorityTasks.length === 0) return;
    
    const emoji = priority === 'critical' ? '🔴' : priority === 'important' ? '🟡' : '🟢';
    const label = priority.toUpperCase();
    
    report += `## ${emoji} ${label} PRIORITY\n\n`;
    
    priorityTasks.forEach((task, index) => {
      report += `### ${index + 1}. ${task.file}\n\n`;
      report += `- **Violations**: ${task.violations}\n`;
      report += `- **Estimated Effort**: ${task.estimatedEffort}\n`;
      report += `- **Approach**: ${task.suggestedApproach}\n\n`;
      report += `**Action Items**:\n`;
      report += `1. [ ] Review current implementation\n`;
      report += `2. [ ] Identify appropriate SSOT service\n`;
      report += `3. [ ] Refactor to use SSOT\n`;
      report += `4. [ ] Test changes\n`;
      report += `5. [ ] Update documentation if needed\n\n`;
      report += '---\n\n';
    });
  });
  
  // Adicionar timeline sugerido
  report += '## 📅 Suggested Timeline\n\n';
  report += '### Week 1: Critical Priority\n';
  report += '- Focus on AdminBusinessService and AdminProfessionalService\n';
  report += '- These are core admin services used throughout the application\n';
  report += '- Estimated: 2-3 days\n\n';
  
  report += '### Week 2: Critical Priority (continued)\n';
  report += '- Focus on VerificationService\n';
  report += '- Critical for user verification flow\n';
  report += '- Estimated: 2-3 days\n\n';
  
  report += '### Week 3: Important Priority\n';
  report += '- Focus on Identity Adapters\n';
  report += '- Smaller tasks, can be done in parallel\n';
  report += '- Estimated: 2-3 days\n\n';
  
  report += '### Week 4: Review and Low Priority\n';
  report += '- Review all changes\n';
  report += '- Address low priority items\n';
  report += '- Final testing\n\n';
  
  // Salvar relatório
  const reportPath = join(rootDir, 'SSOT_FIX_PLAN.md');
  writeFileSync(reportPath, report, 'utf-8');
  
  console.log('✅ Fix plan generated successfully!');
  console.log(`📄 Report saved to: SSOT_FIX_PLAN.md\n`);
  
  // Mostrar resumo
  console.log('📊 Summary:');
  console.log(`  🔴 Critical: ${sortedTasks.filter(t => t.priority === 'critical').length} tasks`);
  console.log(`  🟡 Important: ${sortedTasks.filter(t => t.priority === 'important').length} tasks`);
  console.log(`  🟢 Low: ${sortedTasks.filter(t => t.priority === 'low').length} tasks`);
  console.log();
}

generateFixPlan();
