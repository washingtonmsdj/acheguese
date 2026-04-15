import { readFileSync } from 'fs';

const report = JSON.parse(readFileSync('violations-report.json', 'utf-8'));

console.log('=== ANÁLISE DE VIOLAÇÕES DE ARQUITETURA ===\n');
console.log(`Total: ${report.summary.total} violações\n`);

// Agrupar por tipo de problema
const problemTypes = {
  'core-imports-modules': [] as any[],
  'modules-imports-integrations': [] as any[],
  'cross-module': [] as any[],
  'shared-self-import': [] as any[],
  'shared-imports-upper-layers': [] as any[]
};

for (const v of report.violations) {
  if (v.layer === 'core' && v.importLayer === 'modules') {
    problemTypes['core-imports-modules'].push(v);
  } else if (v.layer === 'modules' && v.importLayer === 'integrations') {
    problemTypes['modules-imports-integrations'].push(v);
  } else if (v.type === 'cross-module') {
    problemTypes['cross-module'].push(v);
  } else if (v.layer === 'shared' && v.importLayer === 'shared') {
    problemTypes['shared-self-import'].push(v);
  } else if (v.layer === 'shared' && ['core', 'modules'].includes(v.importLayer)) {
    problemTypes['shared-imports-upper-layers'].push(v);
  }
}

console.log('📊 VIOLAÇÕES POR CATEGORIA:\n');
console.log(`1. Core importando de Modules: ${problemTypes['core-imports-modules'].length}`);
console.log(`2. Modules importando de Integrations: ${problemTypes['modules-imports-integrations'].length}`);
console.log(`3. Cross-module imports: ${problemTypes['cross-module'].length}`);
console.log(`4. Shared auto-importando: ${problemTypes['shared-self-import'].length}`);
console.log(`5. Shared importando camadas superiores: ${problemTypes['shared-imports-upper-layers'].length}`);

console.log('\n\n=== CATEGORIA 1: CORE IMPORTANDO DE MODULES (7 violações) ===\n');
problemTypes['core-imports-modules'].forEach((v, i) => {
  console.log(`${i + 1}. ${v.file}`);
  console.log(`   Import: ${v.import}`);
  console.log('');
});

console.log('\n=== CATEGORIA 2: MODULES IMPORTANDO DE INTEGRATIONS (20 violações) ===\n');
const moduleIntegrationsByFile = problemTypes['modules-imports-integrations'].reduce((acc, v) => {
  if (!acc[v.file]) acc[v.file] = [];
  acc[v.file].push(v.import);
  return acc;
}, {} as Record<string, string[]>);

Object.entries(moduleIntegrationsByFile).forEach(([file, imports], i) => {
  console.log(`${i + 1}. ${file}`);
  imports.forEach(imp => console.log(`   - ${imp}`));
  console.log('');
});

console.log('\n=== CATEGORIA 3: CROSS-MODULE IMPORTS (18 violações) ===\n');
const crossModuleBySource = problemTypes['cross-module'].reduce((acc, v) => {
  const match = v.file.match(/modules\/([^/]+)/);
  const source = match ? match[1] : 'unknown';
  if (!acc[source]) acc[source] = [];
  acc[source].push(v);
  return acc;
}, {} as Record<string, any[]>);

Object.entries(crossModuleBySource).forEach(([source, violations]) => {
  console.log(`Módulo "${source}" (${violations.length} violações):`);
  violations.forEach(v => {
    const targetMatch = v.import.match(/@\/modules\/([^/]+)/);
    const target = targetMatch ? targetMatch[1] : 'unknown';
    console.log(`  - ${v.file.split('/').pop()} → ${target}`);
  });
  console.log('');
});

console.log('\n=== CATEGORIA 4: SHARED AUTO-IMPORTANDO (187 violações) ===\n');
console.log('PROBLEMA: A regra atual proíbe shared de importar de shared.');
console.log('SOLUÇÃO: Isso é um erro na configuração. Shared DEVE poder importar de shared.');
console.log('Arquivos afetados: componentes UI, utils, types dentro de shared/\n');

console.log('\n=== PLANO DE CORREÇÃO ===\n');
console.log('1. CORREÇÃO IMEDIATA: Ajustar regra de dependências para permitir shared → shared');
console.log('   Impacto: Resolve 187 violações (80% do total)');
console.log('');
console.log('2. CORE → MODULES (7 arquivos):');
console.log('   - Mover schemas de modules para shared');
console.log('   - Mover componentes de modules para core ou criar barrel exports');
console.log('   - Mover hooks de modules para core');
console.log('');
console.log('3. MODULES → INTEGRATIONS (20 violações em ~15 arquivos):');
console.log('   - Criar services em core para encapsular acesso ao Supabase');
console.log('   - Substituir imports diretos por services');
console.log('');
console.log('4. CROSS-MODULE (18 violações):');
console.log('   - Mover lógica compartilhada para core');
console.log('   - Usar eventos/pub-sub para comunicação entre módulos');
console.log('   - Criar barrel exports em core para funcionalidades compartilhadas');
