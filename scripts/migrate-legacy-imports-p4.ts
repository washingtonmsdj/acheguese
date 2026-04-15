import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
  priority: number;
}

// Regras de migração P4 - Imports legados finais
const MIGRATION_RULES: MigrationRule[] = [
  // PRIORIDADE 1: Constantes específicas (mais específico primeiro)
  {
    pattern: /from ['"]@\/types['"];\s*$/gm,
    replacement: "from '@/shared/types/constants';",
    description: "@/types (bare import) → @/shared/types/constants",
    priority: 1
  },
  
  // PRIORIDADE 2: Hooks legados → shared ou módulos
  {
    pattern: /from ['"]@\/hooks\/queries\//g,
    replacement: "from '@/shared/hooks/queries/",
    description: '@/hooks/queries/* → @/shared/hooks/queries/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/common\//g,
    replacement: "from '@/shared/hooks/common/",
    description: '@/hooks/common/* → @/shared/hooks/common/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/admin\//g,
    replacement: "from '@/modules/admin/hooks/",
    description: '@/hooks/admin/* → @/modules/admin/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/civic\//g,
    replacement: "from '@/core/civic/hooks/",
    description: '@/hooks/civic/* → @/core/civic/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/lostfound\//g,
    replacement: "from '@/core/lostfound/hooks/",
    description: '@/hooks/lostfound/* → @/core/lostfound/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/moderation\//g,
    replacement: "from '@/core/moderation/hooks/",
    description: '@/hooks/moderation/* → @/core/moderation/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/posts\//g,
    replacement: "from '@/core/posts/hooks/",
    description: '@/hooks/posts/* → @/core/posts/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/feed\//g,
    replacement: "from '@/core/feed/hooks/",
    description: '@/hooks/feed/* → @/core/feed/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/drawer\//g,
    replacement: "from '@/shared/hooks/drawer/",
    description: '@/hooks/drawer/* → @/shared/hooks/drawer/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/location\//g,
    replacement: "from '@/core/location/hooks/",
    description: '@/hooks/location/* → @/core/location/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/map\//g,
    replacement: "from '@/core/maps/hooks/",
    description: '@/hooks/map/* → @/core/maps/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/mapa\//g,
    replacement: "from '@/core/maps/hooks/",
    description: '@/hooks/mapa/* → @/core/maps/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/professional\//g,
    replacement: "from '@/core/professional/hooks/",
    description: '@/hooks/professional/* → @/core/professional/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/ranking\//g,
    replacement: "from '@/shared/hooks/ranking/",
    description: '@/hooks/ranking/* → @/shared/hooks/ranking/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/rotas\//g,
    replacement: "from '@/modules/mobility/hooks/",
    description: '@/hooks/rotas/* → @/modules/mobility/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/servicos\//g,
    replacement: "from '@/modules/services/hooks/",
    description: '@/hooks/servicos/* → @/modules/services/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/zeladoria\//g,
    replacement: "from '@/core/civic/hooks/",
    description: '@/hooks/zeladoria/* → @/core/civic/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/eventos\//g,
    replacement: "from '@/shared/hooks/eventos/",
    description: '@/hooks/eventos/* → @/shared/hooks/eventos/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/grupos\//g,
    replacement: "from '@/shared/hooks/grupos/",
    description: '@/hooks/grupos/* → @/shared/hooks/grupos/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/mensagens\//g,
    replacement: "from '@/core/messaging/hooks/",
    description: '@/hooks/mensagens/* → @/core/messaging/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/recomendacoes\//g,
    replacement: "from '@/shared/hooks/recomendacoes/",
    description: '@/hooks/recomendacoes/* → @/shared/hooks/recomendacoes/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/gamification\//g,
    replacement: "from '@/core/gamification/hooks/",
    description: '@/hooks/gamification/* → @/core/gamification/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/interaction\//g,
    replacement: "from '@/core/interaction/hooks/",
    description: '@/hooks/interaction/* → @/core/interaction/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/onboarding\//g,
    replacement: "from '@/shared/hooks/onboarding/",
    description: '@/hooks/onboarding/* → @/shared/hooks/onboarding/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/alert\//g,
    replacement: "from '@/core/alerts/hooks/",
    description: '@/hooks/alert/* → @/core/alerts/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/auth\//g,
    replacement: "from '@/core/auth/hooks/",
    description: '@/hooks/auth/* → @/core/auth/hooks/*',
    priority: 2
  },
  {
    pattern: /from ['"]@\/hooks\/company\//g,
    replacement: "from '@/core/company/hooks/",
    description: '@/hooks/company/* → @/core/company/hooks/*',
    priority: 2
  },
  
  // PRIORIDADE 3: Components legados → módulos ou shared
  {
    pattern: /from ['"]@\/components\/admin\//g,
    replacement: "from '@/modules/admin/components/",
    description: '@/components/admin/* → @/modules/admin/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/alert\//g,
    replacement: "from '@/core/alerts/components/",
    description: '@/components/alert/* → @/core/alerts/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/civic\//g,
    replacement: "from '@/core/civic/components/",
    description: '@/components/civic/* → @/core/civic/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/zeladoria\//g,
    replacement: "from '@/core/civic/components/",
    description: '@/components/zeladoria/* → @/core/civic/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/lostfound\//g,
    replacement: "from '@/core/lostfound/components/",
    description: '@/components/lostfound/* → @/core/lostfound/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/map\//g,
    replacement: "from '@/core/maps/components/",
    description: '@/components/map/* → @/core/maps/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/mapa\//g,
    replacement: "from '@/core/maps/components/",
    description: '@/components/mapa/* → @/core/maps/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/mensagens\//g,
    replacement: "from '@/core/messaging/components/",
    description: '@/components/mensagens/* → @/core/messaging/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/moderation\//g,
    replacement: "from '@/core/moderation/components/",
    description: '@/components/moderation/* → @/core/moderation/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/posts\//g,
    replacement: "from '@/core/posts/components/",
    description: '@/components/posts/* → @/core/posts/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/feed\//g,
    replacement: "from '@/core/feed/components/",
    description: '@/components/feed/* → @/core/feed/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/professional\//g,
    replacement: "from '@/core/professional/components/",
    description: '@/components/professional/* → @/core/professional/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/empresa\//g,
    replacement: "from '@/modules/business/components/",
    description: '@/components/empresa/* → @/modules/business/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/company\//g,
    replacement: "from '@/core/company/components/",
    description: '@/components/company/* → @/core/company/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/servicos\//g,
    replacement: "from '@/modules/services/components/",
    description: '@/components/servicos/* → @/modules/services/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/catalogo\//g,
    replacement: "from '@/shared/components/catalogo/",
    description: '@/components/catalogo/* → @/shared/components/catalogo/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/eventos\//g,
    replacement: "from '@/shared/components/eventos/",
    description: '@/components/eventos/* → @/shared/components/eventos/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/grupos\//g,
    replacement: "from '@/shared/components/grupos/",
    description: '@/components/grupos/* → @/shared/components/grupos/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/ranking\//g,
    replacement: "from '@/shared/components/ranking/",
    description: '@/components/ranking/* → @/shared/components/ranking/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/recomendacoes\//g,
    replacement: "from '@/shared/components/recomendacoes/",
    description: '@/components/recomendacoes/* → @/shared/components/recomendacoes/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/common\//g,
    replacement: "from '@/shared/components/common/",
    description: '@/components/common/* → @/shared/components/common/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/drawer\//g,
    replacement: "from '@/shared/components/drawer/",
    description: '@/components/drawer/* → @/shared/components/drawer/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/offline\//g,
    replacement: "from '@/shared/components/offline/",
    description: '@/components/offline/* → @/shared/components/offline/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/onboarding\//g,
    replacement: "from '@/shared/components/onboarding/",
    description: '@/components/onboarding/* → @/shared/components/onboarding/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/routing\//g,
    replacement: "from '@/shared/components/routing/",
    description: '@/components/routing/* → @/shared/components/routing/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/seo\//g,
    replacement: "from '@/shared/components/seo/",
    description: '@/components/seo/* → @/shared/components/seo/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/standalone\//g,
    replacement: "from '@/shared/components/standalone/",
    description: '@/components/standalone/* → @/shared/components/standalone/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/accessibility\//g,
    replacement: "from '@/shared/components/accessibility/",
    description: '@/components/accessibility/* → @/shared/components/accessibility/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/banners\//g,
    replacement: "from '@/core/banners/components/",
    description: '@/components/banners/* → @/core/banners/components/*',
    priority: 3
  },
  {
    pattern: /from ['"]@\/components\/dashboard\//g,
    replacement: "from '@/modules/dashboard/components/",
    description: '@/components/dashboard/* → @/modules/dashboard/components/*',
    priority: 3
  },
  
  // PRIORIDADE 4: Lib legados → shared
  {
    pattern: /from ['"]@\/lib\/geo\//g,
    replacement: "from '@/shared/utils/geo/",
    description: '@/lib/geo/* → @/shared/utils/geo/*',
    priority: 4
  },
  {
    pattern: /from ['"]@\/lib\/monitoring\//g,
    replacement: "from '@/shared/utils/monitoring/",
    description: '@/lib/monitoring/* → @/shared/utils/monitoring/*',
    priority: 4
  },
  {
    pattern: /from ['"]@\/lib\/validation\//g,
    replacement: "from '@/shared/validation/",
    description: '@/lib/validation/* → @/shared/validation/*',
    priority: 4
  },
  {
    pattern: /from ['"]@\/lib\/validations\//g,
    replacement: "from '@/shared/validation/",
    description: '@/lib/validations/* → @/shared/validation/*',
    priority: 4
  },
  {
    pattern: /from ['"]@\/lib\//g,
    replacement: "from '@/shared/utils/",
    description: '@/lib/* → @/shared/utils/*',
    priority: 4
  },
];

interface MigrationStats {
  filesProcessed: number;
  filesModified: number;
  totalReplacements: number;
  replacementsByRule: Map<string, number>;
  errors: string[];
}

function getAllTypeScriptFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      
      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === 'dist' || entry === '.git') {
          continue;
        }
        files.push(...getAllTypeScriptFiles(fullPath, baseDir));
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        const relativePath = relative(baseDir, fullPath).replace(/\\/g, '/');
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
  }
  
  return files;
}

function migrateFile(filePath: string, rules: MigrationRule[]): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let modifiedContent = content;
    let replacements = 0;
    
    // Aplicar regras em ordem de prioridade
    const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);
    
    for (const rule of sortedRules) {
      const matches = modifiedContent.match(rule.pattern);
      if (matches) {
        modifiedContent = modifiedContent.replace(rule.pattern, rule.replacement);
        replacements += matches.length;
      }
    }
    
    if (replacements > 0) {
      writeFileSync(filePath, modifiedContent, 'utf-8');
    }
    
    return replacements;
  } catch (error) {
    throw new Error(`Error processing ${filePath}: ${error}`);
  }
}

function migrateDirectory(srcDir: string, rules: MigrationRule[], dryRun: boolean = false): MigrationStats {
  const stats: MigrationStats = {
    filesProcessed: 0,
    filesModified: 0,
    totalReplacements: 0,
    replacementsByRule: new Map(),
    errors: []
  };
  
  console.log(`\n🔍 Scanning directory: ${srcDir}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify files)'}\n`);
  
  const files = getAllTypeScriptFiles(srcDir);
  console.log(`Found ${files.length} TypeScript files\n`);
  
  for (const file of files) {
    const fullPath = join(srcDir, file);
    stats.filesProcessed++;
    
    try {
      if (dryRun) {
        const content = readFileSync(fullPath, 'utf-8');
        let totalMatches = 0;
        
        for (const rule of rules) {
          const matches = content.match(rule.pattern);
          if (matches) {
            totalMatches += matches.length;
            const currentCount = stats.replacementsByRule.get(rule.description) || 0;
            stats.replacementsByRule.set(rule.description, currentCount + matches.length);
          }
        }
        
        if (totalMatches > 0) {
          stats.filesModified++;
          stats.totalReplacements += totalMatches;
          console.log(`  📝 ${file}: ${totalMatches} replacements`);
        }
      } else {
        const replacements = migrateFile(fullPath, rules);
        
        if (replacements > 0) {
          stats.filesModified++;
          stats.totalReplacements += replacements;
          console.log(`  ✅ ${file}: ${replacements} replacements`);
        }
      }
    } catch (error) {
      stats.errors.push(`${file}: ${error}`);
      console.error(`  ❌ ${file}: ${error}`);
    }
  }
  
  return stats;
}

function printStats(stats: MigrationStats, dryRun: boolean): void {
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Migration Statistics ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log('='.repeat(60));
  console.log(`Files processed: ${stats.filesProcessed}`);
  console.log(`Files modified: ${stats.filesModified}`);
  console.log(`Total replacements: ${stats.totalReplacements}`);
  
  if (stats.replacementsByRule.size > 0) {
    console.log('\nReplacements by rule:');
    for (const [rule, count] of stats.replacementsByRule.entries()) {
      console.log(`  ${rule}: ${count}`);
    }
  }
  
  if (stats.errors.length > 0) {
    console.log(`\n❌ Errors: ${stats.errors.length}`);
    for (const error of stats.errors.slice(0, 5)) {
      console.log(`  ${error}`);
    }
    if (stats.errors.length > 5) {
      console.log(`  ... and ${stats.errors.length - 5} more`);
    }
  }
  
  console.log('='.repeat(60) + '\n');
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run') || args.includes('-d');
const targetDir = args.find(arg => !arg.startsWith('-')) || 'src';

console.log('🚀 Legacy Import Migration Tool - P4 (Final)');
console.log('============================================\n');

if (dryRun) {
  console.log('⚠️  DRY RUN MODE - No files will be modified');
  console.log('   Remove --dry-run flag to apply changes\n');
}

const srcDir = join(process.cwd(), targetDir);
const stats = migrateDirectory(srcDir, MIGRATION_RULES, dryRun);
printStats(stats, dryRun);

if (!dryRun && stats.filesModified > 0) {
  console.log('✅ Migration completed successfully!');
  console.log('   Run "npm run typecheck" to verify changes\n');
} else if (dryRun && stats.filesModified > 0) {
  console.log('💡 To apply these changes, run:');
  console.log('   npx tsx scripts/migrate-legacy-imports-p4.ts\n');
} else {
  console.log('ℹ️  No files needed migration\n');
}

if (stats.errors.length > 0) {
  process.exit(1);
}
