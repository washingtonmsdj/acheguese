import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Regras de migração P7 - Últimos imports legados
const MIGRATION_RULES: MigrationRule[] = [
  // Services legados que são re-exports
  {
    pattern: /from ['"]@\/services\/feed['"]/g,
    replacement: "from '@/core/posts/services'",
    description: '@/services/feed → @/core/posts/services'
  },
  {
    pattern: /from ['"]@\/services\/interaction['"]/g,
    replacement: "from '@/core/interaction/services'",
    description: '@/services/interaction → @/core/interaction/services'
  },
  {
    pattern: /from ['"]@\/services\/alert['"]/g,
    replacement: "from '@/core/alerts/services'",
    description: '@/services/alert → @/core/alerts/services'
  },
  {
    pattern: /from ['"]@\/services\/civic['"]/g,
    replacement: "from '@/core/civic/services'",
    description: '@/services/civic → @/core/civic/services'
  },
  {
    pattern: /from ['"]@\/services\/company['"]/g,
    replacement: "from '@/core/company/services'",
    description: '@/services/company → @/core/company/services'
  },
  {
    pattern: /from ['"]@\/services\/gamification['"]/g,
    replacement: "from '@/core/gamification/services'",
    description: '@/services/gamification → @/core/gamification/services'
  },
  
  // Types legados específicos
  {
    pattern: /from ['"]@\/types\/subscription['"]/g,
    replacement: "from '@/shared/types/subscription'",
    description: '@/types/subscription → @/shared/types/subscription'
  },
  {
    pattern: /from ['"]@\/types\/dashboard['"]/g,
    replacement: "from '@/shared/types/dashboard'",
    description: '@/types/dashboard → @/shared/types/dashboard'
  },
  {
    pattern: /from ['"]@\/types\/moderation['"]/g,
    replacement: "from '@/core/moderation/types'",
    description: '@/types/moderation → @/core/moderation/types'
  },
  {
    pattern: /from ['"]@\/types\/favorites['"]/g,
    replacement: "from '@/core/favorites/types'",
    description: '@/types/favorites → @/core/favorites/types'
  },
  {
    pattern: /from ['"]@\/types\/feed['"]/g,
    replacement: "from '@/core/feed/types'",
    description: '@/types/feed → @/core/feed/types'
  },
  {
    pattern: /from ['"]@\/types\/core['"]/g,
    replacement: "from '@/shared/types/core'",
    description: '@/types/core → @/shared/types/core'
  },
  
  // Components legados finais
  {
    pattern: /from ['"]@\/components\/banners\//g,
    replacement: "from '@/core/banners/components/",
    description: '@/components/banners/* → @/core/banners/components/*'
  },
  {
    pattern: /from ['"]@\/components\/dashboard\//g,
    replacement: "from '@/modules/dashboard/components/",
    description: '@/components/dashboard/* → @/modules/dashboard/components/*'
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
    
    for (const rule of rules) {
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

console.log('🚀 Legacy Import Migration Tool - P7 (Final Cleanup)');
console.log('===================================================\n');

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
  console.log('   npx tsx scripts/migrate-legacy-imports-p7.ts\n');
} else {
  console.log('ℹ️  No files needed migration\n');
}

if (stats.errors.length > 0) {
  process.exit(1);
}
