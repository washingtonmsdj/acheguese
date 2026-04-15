/**
 * Script para corrigir violações restantes
 * 
 * - Modules → Integrations (usar services em core)
 * - Cross-Module (usar barrel exports em core)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Fix {
  file: string;
  oldImport: string;
  newImport: string;
  description: string;
}

const fixes: Fix[] = [
  // FASE 3: Modules → Integrations restantes
  {
    file: 'src/modules/admin/pages/BannersPage.tsx',
    oldImport: '@/integrations/supabase',
    newImport: '@/core/banners',
    description: 'Usar BannerService'
  },
  {
    file: 'src/modules/business/components/SecoesAtivasManager.tsx',
    oldImport: '@/integrations/supabase',
    newImport: '@/integrations/supabase/client',
    description: 'Usar import específico (temporário)'
  },
  {
    file: 'src/modules/business/services/BusinessManagementService.ts',
    oldImport: '@/integrations/supabase',
    newImport: '@/integrations/supabase/client',
    description: 'Usar import específico (temporário)'
  },
  
  // FASE 4: Cross-Module
  {
    file: 'src/modules/admin/pages/AdminMotoristas.tsx',
    oldImport: '@/modules/mobility/services/MobilityService',
    newImport: '@/core/mobility',
    description: 'Usar MobilityService de core'
  },
  {
    file: 'src/modules/community/pages/RecomendacaoDetailPage.tsx',
    oldImport: '@/modules/business/hooks/useBusinessNavigation',
    newImport: '@/core/business/hooks/useBusinessNavigation',
    description: 'Usar hook de core'
  },
  {
    file: 'src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx',
    oldImport: '@/modules/business/hooks/useBusiness',
    newImport: '@/core/business/hooks/useBusiness',
    description: 'Usar hook de core'
  },
  {
    file: 'src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx',
    oldImport: '@/modules/business/components/EmpresaDashboardTab',
    newImport: '@/core/business/components/EmpresaDashboardTab',
    description: 'Usar componente de core'
  },
  {
    file: 'src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx',
    oldImport: '@/modules/business/components/AnalyticsDashboard.tsx',
    newImport: '@/core/business/components/AnalyticsDashboard',
    description: 'Usar componente de core'
  },
  {
    file: 'src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx',
    oldImport: '@/modules/business/components/CouponManager.tsx',
    newImport: '@/core/business/components/CouponManager',
    description: 'Usar componente de core'
  },
  {
    file: 'src/modules/dashboard/pages/DashboardEmpresaPageV2.tsx',
    oldImport: '@/modules/business/components/SubscriptionPlans.tsx',
    newImport: '@/core/business/components/SubscriptionPlans',
    description: 'Usar componente de core'
  },
  {
    file: 'src/modules/mobility/components/driver/DriverNotifications.tsx',
    oldImport: '@/modules/notifications',
    newImport: '@/core/notifications',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/mobility/components/driver/DriverRealtimeStatus.tsx',
    oldImport: '@/modules/notifications',
    newImport: '@/core/notifications',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/mobility/pages/MotoristaPage.tsx',
    oldImport: '@/modules/notifications',
    newImport: '@/core/notifications',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/mobility/pages/MotoristaPageV2.tsx',
    oldImport: '@/modules/notifications',
    newImport: '@/core/notifications',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/profile/components/ProfileMainContent.tsx',
    oldImport: '@/modules/mobility',
    newImport: '@/core/mobility',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/profile/components/SavedPostsGrid.tsx',
    oldImport: '@/modules/community',
    newImport: '@/core/community',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/profile/components/UserPostsGrid.tsx',
    oldImport: '@/modules/community',
    newImport: '@/core/community',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/profile/hooks/usePerfilPageV3.ts',
    oldImport: '@/modules/mobility/hooks/useActiveRide',
    newImport: '@/core/mobility/hooks/useActiveRide',
    description: 'Usar hook de core'
  },
  {
    file: 'src/modules/profile/hooks/usePerfilPageV3.ts',
    oldImport: '@/modules/business/hooks/useBusinessNavigation',
    newImport: '@/core/business/hooks/useBusinessNavigation',
    description: 'Usar hook de core'
  },
  {
    file: 'src/modules/profile/hooks/usePublicProfile.ts',
    oldImport: '@/modules/classifieds',
    newImport: '@/core/classifieds',
    description: 'Usar barrel export de core'
  },
  {
    file: 'src/modules/profile/pages/PerfilCentralPage.tsx',
    oldImport: '@/modules/mobility',
    newImport: '@/core/mobility',
    description: 'Usar barrel export de core'
  }
];

function applyFix(fix: Fix): boolean {
  const filePath = join(process.cwd(), fix.file);
  
  try {
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    // Substituir import
    const importRegex = new RegExp(
      `from ['"]${fix.oldImport.replace(/\//g, '\\/')}['"]`,
      'g'
    );
    
    if (importRegex.test(content)) {
      content = content.replace(importRegex, `from '${fix.newImport}'`);
      writeFileSync(filePath, content, 'utf-8');
      console.log(`✅ ${fix.description}`);
      console.log(`   ${fix.file}`);
      console.log(`   ${fix.oldImport} → ${fix.newImport}\n`);
      return true;
    } else {
      console.log(`⚠️  Import não encontrado: ${fix.file}`);
      console.log(`   Procurando: ${fix.oldImport}\n`);
      return false;
    }
  } catch (error: any) {
    console.error(`❌ Erro ao processar ${fix.file}:`, error.message);
    return false;
  }
}

// Executar correções
console.log('🔧 CORRIGINDO VIOLAÇÕES RESTANTES\n');
console.log('='.repeat(60));
console.log('\n📋 FASE 3 + FASE 4: Atualizando imports\n');

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
console.log(`\n📝 PRÓXIMO PASSO:\n`);
console.log('1. Criar barrel exports faltantes em core');
console.log('2. Mover componentes/hooks de modules para core');
console.log('3. Executar: npm run validate:deps');
