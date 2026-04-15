import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

// Regras de migração de imports legados
const MIGRATION_RULES: MigrationRule[] = [
  // @/components/ui → @/shared/components/ui
  {
    pattern: /from ['"]@\/components\/ui\//g,
    replacement: "from '@/shared/components/ui/",
    description: '@/components/ui → @/shared/components/ui'
  },
  
  // @/lib/utils → @/shared/utils
  {
    pattern: /from ['"]@\/lib\/utils['"]/g,
    replacement: "from '@/shared/utils'",
    description: '@/lib/utils → @/shared/utils'
  },
  
  // @/lib/logger → @/shared/utils/logger (se existir)
  {
    pattern: /from ['"]@\/lib\/logger['"]/g,
    replacement: "from '@/shared/utils/logger'",
    description: '@/lib/logger → @/shared/utils/logger'
  },
  
  // @/hooks/use → @/shared/hooks/use (hooks genéricos)
  {
    pattern: /from ['"]@\/hooks\/(use[A-Z][a-zA-Z]*)['"]/g,
    replacement: "from '@/shared/hooks/$1'",
    description: '@/hooks/useX → @/shared/hooks/useX (genéricos)'
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

console.log('🚀 Legacy Import Migration Tool');
console.log('================================\n');

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
  console.log('   npx tsx scripts/migrate-legacy-imports.ts\n');
} else {
  console.log('ℹ️  No files needed migration\n');
}

// Exit with error code if there were errors
if (stats.errors.length > 0) {
  process.exit(1);
}
