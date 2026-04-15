import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface MigrationRule {
  pattern: RegExp;
  replacement: string | ((match: string, ...groups: string[]) => string);
  description: string;
  priority: number; // Ordem de aplicação
}

// Regras de migração P3 - Imports legados restantes
const MIGRATION_RULES: MigrationRule[] = [
  // PRIORIDADE 1: Services legados → Core services
  {
    pattern: /from ['"]@\/services\/posts['"]/g,
    replacement: "from '@/core/posts/services'",
    description: '@/services/posts → @/core/posts/services',
    priority: 1
  },
  {
    pattern: /from ['"]@\/services\/comments['"]/g,
    replacement: "from '@/core/comments/services'",
    description: '@/services/comments → @/core/comments/services',
    priority: 1
  },
  {
    pattern: /from ['"]@\/services\/lostfound['"]/g,
    replacement: "from '@/core/lostfound/services'",
    description: '@/services/lostfound → @/core/lostfound/services',
    priority: 1
  },
  {
    pattern: /from ['"]@\/services\/feed\/FeedService['"]/g,
    replacement: "from '@/core/feed/services/FeedService'",
    description: '@/services/feed/FeedService → @/core/feed/services/FeedService',
    priority: 1
  },
  {
    pattern: /from ['"]@\/services\/interaction\/InteractionService['"]/g,
    replacement: "from '@/core/interaction/services/InteractionService'",
    description: '@/services/interaction → @/core/interaction/services',
    priority: 1
  },
  
  // PRIORIDADE 2: Types específicos de módulos
  {
    pattern: /from ['"]@\/types\/mobilidade['"]/g,
    replacement: "from '@/modules/mobility/types'",
    description: '@/types/mobilidade → @/modules/mobility/types',
    priority: 2
  },
  {
    pattern: /from ['"]@\/types\/profile['"]/g,
    replacement: "from '@/modules/profile/types'",
    description: '@/types/profile → @/modules/profile/types',
    priority: 2
  },
  {
    pattern: /from ['"]@\/types\/profile-edit['"]/g,
    replacement: "from '@/modules/profile/types/profile-edit'",
    description: '@/types/profile-edit → @/modules/profile/types/profile-edit',
    priority: 2
  },
  {
    pattern: /from ['"]@\/types\/activity['"]/g,
    replacement: "from '@/modules/profile/types/activity'",
    description: '@/types/activity → @/modules/profile/types/activity',
    priority: 2
  },
  {
    pattern: /from ['"]@\/types\/community['"]/g,
    replacement: "from '@/modules/community/types'",
    description: '@/types/community → @/modules/community/types',
    priority: 2
  },
  {
    pattern: /from ['"]@\/types\/business['"]/g,
    replacement: "from '@/modules/business/types'",
    description: '@/types/business → @/modules/business/types',
    priority: 2
  },
  
  // PRIORIDADE 3: Types compartilhados → shared
  {
    pattern: /from ['"]@\/types\/reviews['"]/g,
    replacement: "from '@/shared/types/reviews'",
    description: '@/types/reviews → @/shared/types/reviews',
    priority: 3
  },
  {
    pattern: /from ['"]@\/types\/poll['"]/g,
    replacement: "from '@/shared/types/poll'",
    description: '@/types/poll → @/shared/types/poll',
    priority: 3
  },
  {
    pattern: /from ['"]@\/types\/notification['"]/g,
    replacement: "from '@/shared/types/notification'",
    description: '@/types/notification → @/shared/types/notification',
    priority: 3
  },
  {
    pattern: /from ['"]@\/types\/map['"]/g,
    replacement: "from '@/shared/types/map'",
    description: '@/types/map → @/shared/types/map',
    priority: 3
  },
  
  // PRIORIDADE 4: Validation → shared
  {
    pattern: /from ['"]@\/validation['"]/g,
    replacement: "from '@/shared/validation'",
    description: '@/validation → @/shared/validation',
    priority: 4
  },
  {
    pattern: /from ['"]@\/validation\//g,
    replacement: "from '@/shared/validation/",
    description: '@/validation/* → @/shared/validation/*',
    priority: 4
  },
  
  // PRIORIDADE 5: Stores → shared
  {
    pattern: /from ['"]@\/stores\//g,
    replacement: "from '@/shared/stores/",
    description: '@/stores/* → @/shared/stores/*',
    priority: 5
  },
  
  // PRIORIDADE 6: Hooks específicos de módulos (não genéricos)
  {
    pattern: /from ['"]@\/hooks\/profile\//g,
    replacement: "from '@/modules/profile/hooks/",
    description: '@/hooks/profile/* → @/modules/profile/hooks/*',
    priority: 6
  },
  {
    pattern: /from ['"]@\/hooks\/community\//g,
    replacement: "from '@/modules/community/hooks/",
    description: '@/hooks/community/* → @/modules/community/hooks/*',
    priority: 6
  },
  {
    pattern: /from ['"]@\/hooks\/mobilidade\//g,
    replacement: "from '@/modules/mobility/hooks/",
    description: '@/hooks/mobilidade/* → @/modules/mobility/hooks/*',
    priority: 6
  },
  {
    pattern: /from ['"]@\/hooks\/mobility\//g,
    replacement: "from '@/modules/mobility/hooks/",
    description: '@/hooks/mobility/* → @/modules/mobility/hooks/*',
    priority: 6
  },
  
  // PRIORIDADE 7: Components específicos de módulos
  {
    pattern: /from ['"]@\/components\/profile\//g,
    replacement: "from '@/modules/profile/components/",
    description: '@/components/profile/* → @/modules/profile/components/*',
    priority: 7
  },
  {
    pattern: /from ['"]@\/components\/community\//g,
    replacement: "from '@/modules/community/components/",
    description: '@/components/community/* → @/modules/community/components/*',
    priority: 7
  },
  {
    pattern: /from ['"]@\/components\/admin\//g,
    replacement: "from '@/modules/admin/components/",
    description: '@/components/admin/* → @/modules/admin/components/*',
    priority: 7
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
        if (typeof rule.replacement === 'function') {
          modifiedContent = modifiedContent.replace(rule.pattern, rule.replacement);
        } else {
          modifiedContent = modifiedContent.replace(rule.pattern, rule.replacement);
        }
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
        // Dry run: apenas contar sem modificar
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
        // Live: modificar arquivos
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

console.log('🚀 Legacy Import Migration Tool - P3');
console.log('====================================\n');

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
  console.log('   npx tsx scripts/migrate-legacy-imports-p3.ts\n');
} else {
  console.log('ℹ️  No files needed migration\n');
}

// Exit with error code if there were errors
if (stats.errors.length > 0) {
  process.exit(1);
}
