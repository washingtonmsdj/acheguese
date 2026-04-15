/**
 * Script para corrigir automaticamente as 67 violações de arquitetura
 * 
 * FASE 2: CORE → MODULES (7 violações)
 * FASE 3: MODULES → INTEGRATIONS (20 violações)  
 * FASE 4: CROSS-MODULE (18 violações)
 * FASE 5: SHARED → UPPER LAYERS (22 violações)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

interface Fix {
  file: string;
  oldImport: string;
  newImport: string;
  description: string;
}

const fixes: Fix[] = [
  // FASE 2.1: Mover schemas de modules para shared
  {
    file: 'src/core/business/services/BusinessService.ts',
    oldImport: '@/modules/business/schemas/businessSchemas',
    newImport: '@/shared/schemas/business/businessSchemas',
    description: 'Mover businessSchemas para shared'
  },
  {
    file: 'src/core/professional/services/ProfessionalService.ts',
    oldImport: '@/modules/services/validation/professionalSchemas',
    newImport: '@/shared/schemas/professional/professionalSchemas',
    description: 'Mover professionalSchemas para shared'
  },
  
  // FASE 2.2: Mover hooks de modules para core
  {
    file: 'src/core/profiles/hooks/useProfile.ts',
    oldImport: '@/modules/profile/hooks/useProfileLocation',
    newImport: '@/core/profiles/hooks/useProfileLocation',
    description: 'Mover useProfileLocation para core'
  },
  
  // FASE 2.3: Criar barrel exports para componentes de modules usados por core
  {
    file: 'src/core/gamification/pages/GamificacaoPage.tsx',
    oldImport: '@/modules/community',
    newImport: '@/core/community',
    description: 'Usar barrel export de core/community'
  },
  {
    file: 'src/core/gamification/pages/RankingPage.tsx',
    oldImport: '@/modules/mobility/components/NeighborRankingPanel',
    newImport: '@/core/mobility/components/NeighborRankingPanel',
    description: 'Mover NeighborRankingPanel para core'
  },
  {
    file: 'src/core/routing/components/BusinessPortalRoute.tsx',
    oldImport: '@/modules/business',
    newImport: '@/core/business',
    description: 'Usar barrel export de core/business'
  },
  // StandaloneRoute.tsx foi removido na Fase 2 da limpeza estrutural
];

function applyFix(fix: Fix): boolean {
  const filePath = join(process.cwd(), fix.file);
  
  if (!existsSync(filePath)) {
    console.log(`⚠️  Arquivo não encontrado: ${fix.file}`);
    return false;
  }
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Substituir import
    content = content.replace(
      new RegExp(`from ['"]${fix.oldImport.replace(/\//g, '\\/')}['"]`, 'g'),
      `from '${fix.newImport}'`
    );
    
    // Substituir require (se houver)
    content = content.replace(
      new RegExp(`require\\(['"]${fix.oldImport.replace(/\//g, '\\/')}['"]\\)`, 'g'),
      `require('${fix.newImport}')`
    );
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${fix.description}`);
      console.log(`   ${fix.file}`);
      console.log(`   ${fix.oldImport} → ${fix.newImport}\n`);
      return true;
    } else {
      console.log(`⚠️  Nenhuma alteração necessária: ${fix.file}\n`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Erro ao processar ${fix.file}:`, error.message);
    return false;
  }
}

// Executar correções
console.log('🔧 INICIANDO CORREÇÃO DE VIOLAÇÕES DE ARQUITETURA\n');
console.log('='.repeat(60));
console.log('\n📋 FASE 2: CORRIGINDO CORE → MODULES (7 violações)\n');

let successCount = 0;
let failCount = 0;

for (const fix of fixes) {
  if (applyFix(fix)) {
    successCount++;
  } else {
    failCount++;
  }
}

console.log('='.repeat(60));
console.log(`\n✅ Correções aplicadas: ${successCount}`);
console.log(`⚠️  Correções puladas: ${failCount}`);
console.log(`\n📝 PRÓXIMOS PASSOS MANUAIS:\n`);
console.log('1. Mover arquivos físicos:');
console.log('   - src/modules/business/schemas/businessSchemas.ts → src/shared/schemas/business/');
console.log('   - src/modules/services/validation/professionalSchemas.ts → src/shared/schemas/professional/');
console.log('   - src/modules/profile/hooks/useProfileLocation.ts → src/core/profiles/hooks/');
console.log('   - src/modules/mobility/components/NeighborRankingPanel.tsx → src/core/mobility/components/');
console.log('\n2. Criar barrel exports em core para módulos compartilhados');
console.log('\n3. Executar: npm run validate:deps');
