/**
 * Gera baseline de ocorrências antes da limpeza estrutural
 * Fase 3 - Limpeza Estrutural
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const patterns = [
  '/business/',
  '/businesss/',
  'ProfileIdentityService',
  'gerarUrlEmpresa',
  'gerarUrlCanonica',
  'gerarUrlAbsoluta',
  'parseUrlEmpresa',
  'isUrlLegacy',
  'extrairSlugLegacy',
  'StandaloneRoute',
  'modules/business/services/BusinessService',
  'modules/business/types',
  'gerarUrlCompletaEmpresa',
  'gerarTodasUrlsEmpresa',
  'isUrlLegacy',
];

function countOccurrences(pattern: string): number {
  try {
    // Escape special regex characters for ripgrep
    const escaped = pattern.replace(/[/()[\]{}+*?^$|.\\]/g, '\\$&');
    const result = execSync(
      `rg -c "${escaped}" --type ts --type tsx --type md 2>nul || echo 0`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );
    // Sum all counts from multiple files
    const lines = result.trim().split('\n');
    let total = 0;
    for (const line of lines) {
      const match = line.match(/:(\d+)$/);
      if (match) {
        total += parseInt(match[1]);
      }
    }
    return total;
  } catch {
    return 0;
  }
}

function generateBaseline(): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let output = `=== BASELINE DE OCORRÊNCIAS - ANTES DA LIMPEZA ===\n`;
  output += `Data: ${timestamp}\n\n`;

  for (const pattern of patterns) {
    const count = countOccurrences(pattern);
    output += `${pattern} : ${count}\n`;
  }

  return output;
}

const baseline = generateBaseline();
writeFileSync('FASE_LIMPEZA_BASELINE_ANTES.txt', baseline);
console.log(baseline);
console.log('\n✅ Baseline salvo em FASE_LIMPEZA_BASELINE_ANTES.txt');
