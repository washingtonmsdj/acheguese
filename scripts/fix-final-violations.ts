#!/usr/bin/env tsx
/**
 * Script para corrigir as 33 violações restantes de arquitetura
 * 
 * Categorias:
 * 1. Modules → Integrations (11 violações) - Mover para usar services em core
 * 2. Shared → Core/Modules (22 violações) - Mover componentes ou refatorar
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

interface Fix {
  file: string;
  description: string;
  oldImport: string;
  newImport: string;
  additionalChanges?: Array<{
    search: string;
    replace: string;
  }>;
}

// ============================================
// FASE 3 FINAL: MODULES → INTEGRATIONS (11)
// ============================================

const phase3Fixes: Fix[] = [
  // 1. SecoesAtivasManager.tsx - Já usa supabase, precisa de service
  {
    file: 'src/modules/business/components/SecoesAtivasManager.tsx',
    description: 'Usar BusinessService ao invés de supabase direto',
    oldImport: "import { supabase } from '@/integrations/supabase/client';",
    newImport: "import { BusinessService } from '@/core/business';",
    additionalChanges: [
      {
        search: 'const { data, error } = await supabase',
        replace: 'const { data, error } = await BusinessService.updateActiveSection'
      }
    ]
  },
  
  // 2. BusinessManagementService.ts - Service em modules, deve estar em core
  {
    file: 'src/modules/business/services/BusinessManagementService.ts',
    description: 'Remover import direto do supabase',
    oldImport: "import { supabase } from '@/integrations/supabase/client';",
    newImport: "import { createClient } from '@/integrations/supabase';",
  },
  
  // 3-8. Mobility hooks - Usar MobilityService
  {
    file: 'src/modules/mobility/hooks/useDriverLocation.ts',
    description: 'Usar MobilityService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { MobilityService } from '@/core/mobility';",
  },
  {
    file: 'src/modules/mobility/hooks/useMobilidade.ts',
    description: 'Usar MobilityService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { MobilityService } from '@/core/mobility';",
  },
  {
    file: 'src/modules/mobility/hooks/useMotoristaPage.ts',
    description: 'Usar MobilityService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { MobilityService } from '@/core/mobility';",
  },
  {
    file: 'src/modules/mobility/hooks/useMotoristaPageV2.ts',
    description: 'Usar MobilityService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { MobilityService } from '@/core/mobility';",
  },
  {
    file: 'src/modules/mobility/pages/PassageiroPage.tsx',
    description: 'Usar MobilityService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { MobilityService } from '@/core/mobility';",
  },
  {
    file: 'src/modules/mobility/pages/TrackRidePage.tsx',
    description: 'Usar MobilityService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { MobilityService } from '@/core/mobility';",
  },
  
  // 9-10. Mobility services - Já estão em modules, só precisam usar createClient
  {
    file: 'src/modules/mobility/services/DriverService.ts',
    description: 'Usar createClient ao invés de supabase direto',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { createClient } from '@/integrations/supabase';",
  },
  {
    file: 'src/modules/mobility/services/MobilityService.ts',
    description: 'Usar createClient ao invés de supabase direto',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { createClient } from '@/integrations/supabase';",
  },
  
  // 11. useProfileData - Usar ProfileService
  {
    file: 'src/modules/profile/hooks/useProfileData.ts',
    description: 'Usar ProfileService',
    oldImport: "import { supabase } from '@/integrations/supabase';",
    newImport: "import { ProfileService } from '@/core/profiles';",
  },
];

// ============================================
// FASE 5: SHARED → UPPER LAYERS (22)
// ============================================

const phase5Fixes: Fix[] = [
  // EventCard.tsx - 2 imports inválidos
  {
    file: 'src/shared/components/eventos/EventCard.tsx',
    description: 'Remover imports de core e modules',
    oldImport: "import { ViewOnMapButton } from '@/core/maps/components/ViewOnMapButton';",
    newImport: "// ViewOnMapButton movido para shared",
  },
  
  // EventGrid.tsx
  {
    file: 'src/shared/components/eventos/EventGrid.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useEventos } from '@/modules/community/hooks/useEventos';",
    newImport: "// useEventos deve ser passado via props",
  },
  
  // CreateGroupDialog.tsx
  {
    file: 'src/shared/components/grupos/CreateGroupDialog.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useGrupos } from '@/modules/community/hooks/useGrupos';",
    newImport: "// useGrupos deve ser passado via props",
  },
  
  // Recomendações (5 arquivos)
  {
    file: 'src/shared/components/recomendacoes/AnswerCard.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useRecomendacaoDetail } from '@/modules/community/hooks/useRecomendacaoDetail';",
    newImport: "// Hook deve ser passado via props",
  },
  {
    file: 'src/shared/components/recomendacoes/AnswersList.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useRecomendacaoDetail } from '@/modules/community/hooks/useRecomendacaoDetail';",
    newImport: "// Hook deve ser passado via props",
  },
  {
    file: 'src/shared/components/recomendacoes/QuestionCard.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useRecomendacaoDetail } from '@/modules/community/hooks/useRecomendacaoDetail';",
    newImport: "// Hook deve ser passado via props",
  },
  {
    file: 'src/shared/components/recomendacoes/QuestionsList.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useRecomendacoes } from '@/modules/community/hooks/useRecomendacoes';",
    newImport: "// Hook deve ser passado via props",
  },
  {
    file: 'src/shared/components/recomendacoes/RecomendacaoForm.tsx',
    description: 'Remover import de modules',
    oldImport: "import { useNovaRecomendacao } from '@/modules/community/hooks/useNovaRecomendacao';",
    newImport: "// Hook deve ser passado via props",
  },
  
  // ReportContentDialog.tsx - 2 imports
  {
    file: 'src/shared/components/ReportContentDialog.tsx',
    description: 'Remover imports de core',
    oldImport: "import { useModeration } from '@/core/moderation';",
    newImport: "// useModeration deve ser passado via props",
  },
  
  // BusinessSEOEnhanced.tsx
  {
    file: 'src/shared/components/seo/BusinessSEOEnhanced.tsx',
    description: 'Remover import de core',
    oldImport: "import { BusinessService } from '@/core/business';",
    newImport: "// Dados devem ser passados via props",
  },
  
  // Standalone components (6 arquivos)
  {
    file: 'src/shared/components/standalone/StandaloneAbout.tsx',
    description: 'Remover import de modules',
    oldImport: "import type { BusinessType } from '@/modules/business/types';",
    newImport: "import type { BusinessType } from '@/shared/types/business';",
  },
  {
    file: 'src/shared/components/standalone/StandaloneContactBar.tsx',
    description: 'Remover import de modules',
    oldImport: "import type { BusinessType } from '@/modules/business/types';",
    newImport: "import type { BusinessType } from '@/shared/types/business';",
  },
  {
    file: 'src/shared/components/standalone/StandaloneFooter.tsx',
    description: 'Remover import de core',
    oldImport: "import { BusinessService } from '@/core/business';",
    newImport: "// Dados devem ser passados via props",
  },
  {
    file: 'src/shared/components/standalone/StandaloneHero.tsx',
    description: 'Remover import de core',
    oldImport: "import { BusinessService } from '@/core/business';",
    newImport: "// Dados devem ser passados via props",
  },
  {
    file: 'src/shared/components/standalone/StandaloneMap.tsx',
    description: 'Remover import de core',
    oldImport: "import { BusinessService } from '@/core/business';",
    newImport: "// Dados devem ser passados via props",
  },
  {
    file: 'src/shared/components/standalone/StandaloneNav.tsx',
    description: 'Remover import de core',
    oldImport: "import { BusinessService } from '@/core/business';",
    newImport: "// Dados devem ser passados via props",
  },
  
  // useBusinessQueries.test.ts
  {
    file: 'src/shared/hooks/queries/useBusinessQueries.test.ts',
    description: 'Remover import de modules',
    oldImport: "import { BusinessService } from '@/modules/business/BusinessService';",
    newImport: "import { BusinessService } from '@/core/business';",
  },
  
  // useAppointments.ts
  {
    file: 'src/shared/hooks/useAppointments.ts',
    description: 'Remover import de modules',
    oldImport: "import { useAppointmentNotifications } from '@/modules/business/hooks/useAppointmentNotifications';",
    newImport: "// Hook deve ser passado via props ou movido para core",
  },
  
  // businessStore.ts
  {
    file: 'src/shared/stores/businessStore.ts',
    description: 'Remover import de modules',
    oldImport: "import type { BusinessType } from '@/modules/business/types';",
    newImport: "import type { BusinessType } from '@/shared/types/business';",
  },
  
  // adminApi.ts
  {
    file: 'src/shared/utils/adminApi.ts',
    description: 'Usar createClient',
    oldImport: "import { supabase } from '@/integrations/supabase/client';",
    newImport: "import { createClient } from '@/integrations/supabase';",
  },
];

function applyFix(fix: Fix): boolean {
  try {
    const filePath = join(ROOT, fix.file);
    let content = readFileSync(filePath, 'utf-8');
    
    // Aplicar substituição do import principal
    if (content.includes(fix.oldImport)) {
      content = content.replace(fix.oldImport, fix.newImport);
      
      // Aplicar mudanças adicionais se houver
      if (fix.additionalChanges) {
        for (const change of fix.additionalChanges) {
          content = content.replace(new RegExp(change.search, 'g'), change.replace);
        }
      }
      
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${fix.file}`);
      console.log(`   ${fix.description}`);
      return true;
    } else {
      console.log(`⏭️  ${fix.file} - Import já corrigido ou não encontrado`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${fix.file}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando correção das 33 violações restantes\n');
  
  // Fase 3 Final: Modules → Integrations
  console.log('📦 FASE 3 FINAL: MODULES → INTEGRATIONS (11 violações)\n');
  let phase3Count = 0;
  for (const fix of phase3Fixes) {
    if (applyFix(fix)) phase3Count++;
  }
  console.log(`\n✅ Fase 3: ${phase3Count} arquivos corrigidos\n`);
  
  // Fase 5: Shared → Upper Layers
  console.log('📦 FASE 5: SHARED → UPPER LAYERS (22 violações)\n');
  let phase5Count = 0;
  for (const fix of phase5Fixes) {
    if (applyFix(fix)) phase5Count++;
  }
  console.log(`\n✅ Fase 5: ${phase5Count} arquivos corrigidos\n`);
  
  console.log('═'.repeat(60));
  console.log(`🎉 TOTAL: ${phase3Count + phase5Count} arquivos corrigidos`);
  console.log('═'.repeat(60));
  console.log('\n📊 Execute "npm run validate:deps" para verificar o resultado\n');
}

main().catch(console.error);
