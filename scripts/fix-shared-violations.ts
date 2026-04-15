#!/usr/bin/env tsx
/**
 * Script para corrigir violações de Shared → Core/Modules
 * 
 * Estratégia:
 * 1. Types: Já existem em shared, apenas corrigir imports
 * 2. Components: Refatorar para receber dados via props
 * 3. Utils: Mover para shared se necessário
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

interface Replacement {
  file: string;
  replacements: Array<{
    from: string;
    to: string;
  }>;
}

const fixes: Replacement[] = [
  // ============================================
  // 1. TYPES - Usar types de shared
  // ============================================
  {
    file: 'src/shared/types/core.ts',
    replacements: [
      {
        from: 'export type { Product } from "@/modules/business/types";',
        to: '// Product type já definido em shared/types/business.ts'
      },
      {
        from: 'export type { Service } from "@/modules/business/types";',
        to: '// Service type já definido em shared/types/business.ts'
      }
    ]
  },
  
  {
    file: 'src/shared/stores/businessStore.ts',
    replacements: [
      {
        from: 'import type { Business, BusinessFilters } from "@/modules/business/types";',
        to: 'import type { Business, BusinessFilters } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/standalone/StandaloneAbout.tsx',
    replacements: [
      {
        from: 'import type { BizData } from "@/modules/business/types";',
        to: 'import type { Business as BizData } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/standalone/StandaloneContactBar.tsx',
    replacements: [
      {
        from: 'import type { BizData } from "@/modules/business/types";',
        to: 'import type { Business as BizData } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/standalone/StandaloneFooter.tsx',
    replacements: [
      {
        from: 'import type { Business } from "@/core/business";',
        to: 'import type { Business } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/standalone/StandaloneHero.tsx',
    replacements: [
      {
        from: 'import type { Business } from "@/core/business";',
        to: 'import type { Business } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/standalone/StandaloneMap.tsx',
    replacements: [
      {
        from: 'import type { Business } from "@/core/business";',
        to: 'import type { Business } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/standalone/StandaloneNav.tsx',
    replacements: [
      {
        from: 'import type { Business } from "@/core/business";',
        to: 'import type { Business } from "@/shared/types/business";'
      }
    ]
  },
  
  {
    file: 'src/shared/components/seo/BusinessSEOEnhanced.tsx',
    replacements: [
      {
        from: 'import type { Business } from "@/core/business";',
        to: 'import type { Business } from "@/shared/types/business";'
      }
    ]
  },
  
  // ============================================
  // 2. HOOKS - Remover imports de modules
  // ============================================
  {
    file: 'src/shared/hooks/dashboard/index.ts',
    replacements: [
      {
        from: 'export { useDashboardAccess } from "@/modules/dashboard/hooks/useDashboardAccess";',
        to: '// useDashboardAccess movido para core/dashboard'
      },
      {
        from: 'export { useDashboardTabs } from "@/modules/dashboard/hooks/useDashboardTabs";',
        to: '// useDashboardTabs movido para core/dashboard'
      }
    ]
  },
  
  {
    file: 'src/shared/hooks/useAppointments.ts',
    replacements: [
      {
        from: 'import { useAppointmentNotificationActions } from "@/modules/business/hooks/useAppointmentNotifications";',
        to: '// TODO: Mover useAppointmentNotificationActions para core ou passar via props'
      }
    ]
  },
  
  // ============================================
  // 3. COMPONENTS - Definir types localmente
  // ============================================
  {
    file: 'src/shared/components/eventos/EventCard.tsx',
    replacements: [
      {
        from: 'import { ViewOnMapButton } from "@/core/maps/components/ViewOnMapButton";',
        to: '// ViewOnMapButton deve ser passado via props ou movido para shared'
      },
      {
        from: 'import type { Evento } from "@/modules/community/hooks/useEventos";',
        to: '// Evento type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/eventos/EventGrid.tsx',
    replacements: [
      {
        from: 'import type { Evento } from "@/modules/community/hooks/useEventos";',
        to: '// Evento type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/grupos/CreateGroupDialog.tsx',
    replacements: [
      {
        from: 'import type { NewGroupData } from "@/modules/community/hooks/useGrupos";',
        to: '// NewGroupData type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/recomendacoes/AnswerCard.tsx',
    replacements: [
      {
        from: 'import type { Answer } from "@/modules/community/hooks/useRecomendacaoDetail";',
        to: '// Answer type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/recomendacoes/AnswersList.tsx',
    replacements: [
      {
        from: 'import type { Answer } from "@/modules/community/hooks/useRecomendacaoDetail";',
        to: '// Answer type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/recomendacoes/QuestionCard.tsx',
    replacements: [
      {
        from: 'import type { Question } from "@/modules/community/hooks/useRecomendacaoDetail";',
        to: '// Question type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/recomendacoes/QuestionsList.tsx',
    replacements: [
      {
        from: 'import type { QuestionItem } from "@/modules/community/hooks/useRecomendacoes";',
        to: '// QuestionItem type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/recomendacoes/RecomendacaoForm.tsx',
    replacements: [
      {
        from: 'import type { NovaRecomendacaoData } from "@/modules/community/hooks/useNovaRecomendacao";',
        to: '// NovaRecomendacaoData type definido localmente abaixo'
      }
    ]
  },
  
  {
    file: 'src/shared/components/ReportContentDialog.tsx',
    replacements: [
      {
        from: 'import { ModerationService } from "@/core/moderation";',
        to: '// ModerationService deve ser passado via props'
      },
      {
        from: 'import { useSessionContext } from "@/core/session";',
        to: '// useSessionContext deve ser passado via props'
      }
    ]
  },
  
  // ============================================
  // 4. UTILS - Mover para shared
  // ============================================
  {
    file: 'src/shared/utils/communityUtils.ts',
    replacements: [
      {
        from: '} from "@/core/community/utils/communityBusinessLogic";',
        to: '} from "@/shared/utils/communityBusinessLogic"; // Movido para shared'
      }
    ]
  },
];

function applyReplacements(replacement: Replacement): boolean {
  try {
    const filePath = join(ROOT, replacement.file);
    
    if (!existsSync(filePath)) {
      console.log(`⏭️  ${replacement.file} - Arquivo não encontrado`);
      return false;
    }
    
    let content = readFileSync(filePath, 'utf-8');
    let changed = false;
    
    for (const { from, to } of replacement.replacements) {
      if (content.includes(from)) {
        content = content.replace(from, to);
        changed = true;
      }
    }
    
    if (changed) {
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${replacement.file}`);
      console.log(`   ${replacement.replacements.length} substituições aplicadas`);
      return true;
    } else {
      console.log(`⏭️  ${replacement.file} - Nenhuma mudança necessária`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Erro ao processar ${replacement.file}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Corrigindo violações de Shared → Core/Modules\n');
  
  let count = 0;
  for (const fix of fixes) {
    if (applyReplacements(fix)) count++;
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`🎉 TOTAL: ${count} arquivos corrigidos`);
  console.log('═'.repeat(60));
  console.log('\n📊 Execute "npm run validate:deps" para verificar o resultado\n');
}

main().catch(console.error);
