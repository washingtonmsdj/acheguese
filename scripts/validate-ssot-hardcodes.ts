/**
 * SCRIPT DE VALIDAÇÃO - Detectar Hardcodes Indevidos
 * 
 * Uso: npm run validate:hardcodes
 * 
 * Este script escaneia o código em busca de hardcodes que violam o SSOT
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface Violation {
  file: string;
  line: number;
  type: string;
  code: string;
  severity: 'critical' | 'high' | 'medium';
}

const violations: Violation[] = [];

// Padrões de detecção
const PATTERNS = {
  // Preços e valores monetários
  hardcodedPrice: {
    regex: /(?:price|fare|rate|valor|preco).*?[:=]\s*\d+\.?\d*/gi,
    severity: 'critical' as const,
    type: 'Preço hardcoded',
  },
  
  // Coordenadas geográficas
  hardcodedCoordinates: {
    regex: /(?:lat|latitude|lng|longitude).*?[:=]\s*-?\d+\.\d+/gi,
    severity: 'critical' as const,
    type: 'Coordenada hardcoded',
  },
  
  // UUIDs
  hardcodedUUID: {
    regex: /['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi,
    severity: 'critical' as const,
    type: 'UUID hardcoded',
  },
  
  // Imports de mocks
  mockImport: {
    regex: /import.*(?:mock-|__mocks__|\/data\/mock)/gi,
    severity: 'critical' as const,
    type: 'Import de mock em runtime',
  },
  
  // Status hardcoded
  hardcodedStatus: {
    regex: /status:\s*['"](?:active|inactive|pending|approved|rejected)['"]/gi,
    severity: 'high' as const,
    type: 'Status hardcoded',
  },
  
  // Limites operacionais
  hardcodedLimit: {
    regex: /(?:MAX|MIN|LIMIT)_[A-Z_]+\s*=\s*\d+/g,
    severity: 'high' as const,
    type: 'Limite operacional hardcoded',
  },
};

// Diretórios a escanear
const SCAN_DIRS = [
  'src/modules',
  'src/core',
  'src/pages',
  'src/shared/components',
];

// Diretórios a ignorar
const IGNORE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '__tests__',
  '__mocks__',
  '__fixtures__',
  '.test.',
  '.spec.',
  '.stories.',
];

/**
 * Verifica se o arquivo deve ser ignorado
 */
function shouldIgnore(filePath: string): boolean {
  return IGNORE_DIRS.some(dir => filePath.includes(dir));
}

/**
 * Escaneia um arquivo em busca de violações
 */
function scanFile(filePath: string): void {
  if (shouldIgnore(filePath)) return;
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Verificar cada padrão
    Object.entries(PATTERNS).forEach(([key, pattern]) => {
      lines.forEach((line, index) => {
        const matches = line.match(pattern.regex);
        if (matches) {
          // Ignorar comentários
          if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
            return;
          }

          violations.push({
            file: filePath,
            line: index + 1,
            type: pattern.type,
            code: line.trim(),
            severity: pattern.severity,
          });
        }
      });
    });
  } catch (error) {
    console.error(`Erro ao escanear ${filePath}:`, error);
  }
}

/**
 * Escaneia um diretório recursivamente
 */
function scanDirectory(dirPath: string): void {
  try {
    const entries = readdirSync(dirPath);

    entries.forEach(entry => {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        if (!shouldIgnore(fullPath)) {
          scanDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        scanFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`Erro ao escanear diretório ${dirPath}:`, error);
  }
}

/**
 * Gera relatório de violações
 */
function generateReport(): void {
  console.log('\n🔍 RELATÓRIO DE VALIDAÇÃO SSOT - HARDCODES\n');
  console.log('═'.repeat(80));

  if (violations.length === 0) {
    console.log('\n✅ Nenhuma violação encontrada!\n');
    return;
  }

  // Agrupar por severidade
  const critical = violations.filter(v => v.severity === 'critical');
  const high = violations.filter(v => v.severity === 'high');
  const medium = violations.filter(v => v.severity === 'medium');

  console.log(`\n📊 RESUMO:`);
  console.log(`   🔴 Críticas: ${critical.length}`);
  console.log(`   🟡 Altas: ${high.length}`);
  console.log(`   🟢 Médias: ${medium.length}`);
  console.log(`   📝 Total: ${violations.length}\n`);

  // Agrupar por tipo
  const byType = violations.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📋 POR TIPO:');
  Object.entries(byType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  console.log('\n' + '═'.repeat(80));

  // Mostrar violações críticas
  if (critical.length > 0) {
    console.log('\n🔴 VIOLAÇÕES CRÍTICAS:\n');
    critical.slice(0, 10).forEach(v => {
      console.log(`   ${v.file}:${v.line}`);
      console.log(`   Tipo: ${v.type}`);
      console.log(`   Código: ${v.code}`);
      console.log('');
    });

    if (critical.length > 10) {
      console.log(`   ... e mais ${critical.length - 10} violações críticas\n`);
    }
  }

  // Mostrar violações de alta prioridade
  if (high.length > 0) {
    console.log('\n🟡 VIOLAÇÕES DE ALTA PRIORIDADE:\n');
    high.slice(0, 5).forEach(v => {
      console.log(`   ${v.file}:${v.line}`);
      console.log(`   Tipo: ${v.type}`);
      console.log(`   Código: ${v.code}`);
      console.log('');
    });

    if (high.length > 5) {
      console.log(`   ... e mais ${high.length - 5} violações de alta prioridade\n`);
    }
  }

  console.log('═'.repeat(80));
  console.log('\n📚 Consulte a documentação em docs/audits/ para correções\n');

  // Exit code baseado em violações críticas
  if (critical.length > 0) {
    process.exit(1);
  }
}

/**
 * Main
 */
function main(): void {
  console.log('🔍 Iniciando validação de hardcodes...\n');

  SCAN_DIRS.forEach(dir => {
    console.log(`📂 Escaneando ${dir}...`);
    scanDirectory(dir);
  });

  generateReport();
}

main();
