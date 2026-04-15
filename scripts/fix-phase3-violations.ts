/**
 * Script para corrigir violações da Fase 3: Modules → Integrations
 * 
 * Substitui imports diretos de integrations por services em core
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Fix {
  file: string;
  replacements: Array<{
    oldImport: string;
    newImport: string;
    description: string;
  }>;
}

const fixes: Fix[] = [
  // Admin hooks
  {
    file: 'src/modules/admin/hooks/useAdminUserDetail.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/supabaseAdmin',
      newImport: '@/core/admin',
      description: 'Usar AdminDataService'
    }]
  },
  {
    file: 'src/modules/admin/hooks/useRealtimeMetrics.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/core/metrics',
      description: 'Usar MetricsService'
    }]
  },
  {
    file: 'src/modules/admin/hooks/useReputationStats.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/core/metrics',
      description: 'Usar MetricsService'
    }]
  },
  {
    file: 'src/modules/admin/pages/BannersPage.tsx',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  
  // Business
  {
    file: 'src/modules/business/components/SecoesAtivasManager.tsx',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/business/services/BusinessManagementService.ts',
    replacements: [{
      oldImport: '@/integrations/supabase',
      newImport: '@/integrations/supabase',
      description: 'Já usa import correto'
    }]
  },
  
  // Community
  {
    file: 'src/modules/community/hooks/useEventos.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/core/events',
      description: 'Usar EventsService'
    }]
  },
  {
    file: 'src/modules/community/hooks/useZeladoria.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/core/civic',
      description: 'Usar CivicService'
    }]
  },
  
  // Mobility
  {
    file: 'src/modules/mobility/components/RouteEstimateCard.tsx',
    replacements: [{
      oldImport: '@/integrations/maps/distance',
      newImport: '@/core/maps',
      description: 'Usar MapsService'
    }]
  },
  {
    file: 'src/modules/mobility/hooks/useDriverLocation.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/mobility/hooks/useMobilidade.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/mobility/hooks/useMobilidadeChat.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/core/chat',
      description: 'Usar ChatService'
    }]
  },
  {
    file: 'src/modules/mobility/hooks/useMotoristaPage.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/mobility/hooks/useMotoristaPageV2.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/mobility/hooks/useRideChat.ts',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/core/chat',
      description: 'Usar ChatService'
    }]
  },
  {
    file: 'src/modules/mobility/pages/PassageiroPage.tsx',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/mobility/pages/TrackRidePage.tsx',
    replacements: [{
      oldImport: '@/integrations/supabase/client',
      newImport: '@/integrations/supabase',
      description: 'Usar import padrão do supabase'
    }]
  },
  {
    file: 'src/modules/mobility/services/DriverService.ts',
    replacements: [{
      oldImport: '@/integrations/supabase',
      newImport: '@/integrations/supabase',
      description: 'Já usa import correto'
    }]
  },
  {
    file: 'src/modules/mobility/services/MobilityService.ts',
    replacements: [{
      oldImport: '@/integrations/supabase',
      newImport: '@/integrations/supabase',
      description: 'Já usa import correto'
    }]
  },
  
  // Profile
  {
    file: 'src/modules/profile/hooks/useProfileData.ts',
    replacements: [{
      oldImport: '@/integrations/supabase',
      newImport: '@/integrations/supabase',
      description: 'Já usa import correto'
    }]
  }
];

function applyFix(fix: Fix): number {
  const filePath = join(process.cwd(), fix.file);
  let changesCount = 0;
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    for (const replacement of fix.replacements) {
      // Substituir import
      const importRegex = new RegExp(
        `from ['"]${replacement.oldImport.replace(/\//g, '\\/')}['"]`,
        'g'
      );
      
      if (importRegex.test(content)) {
        content = content.replace(importRegex, `from '${replacement.newImport}'`);
        changesCount++;
        console.log(`  ✅ ${replacement.description}`);
        console.log(`     ${replacement.oldImport} → ${replacement.newImport}`);
      }
    }
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ Atualizado: ${fix.file}\n`);
    } else {
      console.log(`⚠️  Nenhuma alteração: ${fix.file}\n`);
    }
    
    return changesCount;
  } catch (error: any) {
    console.error(`❌ Erro ao processar ${fix.file}:`, error.message);
    return 0;
  }
}

// Executar correções
console.log('🔧 INICIANDO CORREÇÃO DA FASE 3: MODULES → INTEGRATIONS\n');
console.log('='.repeat(60));
console.log('\n📋 Atualizando imports para usar services em core\n');

let totalChanges = 0;

for (const fix of fixes) {
  totalChanges += applyFix(fix);
}

console.log('='.repeat(60));
console.log(`\n✅ Total de imports atualizados: ${totalChanges}`);
console.log(`📁 Arquivos processados: ${fixes.length}`);
console.log(`\n📝 PRÓXIMO PASSO:\n`);
console.log('Executar: npm run validate:deps');
console.log('\nNota: Alguns arquivos podem precisar de refatoração manual');
console.log('para usar os métodos dos services ao invés de queries diretas.');
