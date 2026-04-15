#!/usr/bin/env node
/**
 * Legacy Import Migration Tool - P9 (Final 3 Type Imports)
 * 
 * Migra os últimos 3 imports legados de tipos:
 * - @/types/mobility.generated → @/modules/mobility/types/mobility.generated
 * - @/types/mobility.constants → @/modules/mobility/types/mobility.constants
 * - @/types/supabase.types → @/shared/types/supabase.types
 */

import * as fs from 'fs';
import * as path from 'path';

const DRY_RUN = process.argv.includes('--dry-run');

interface MigrationRule {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const migrationRules: MigrationRule[] = [
  // Mobility types
  {
    pattern: /from ['"]@\/types\/mobility\.generated['"]/g,
    replacement: "from '@/modules/mobility/types/mobility.generated'",
    description: "@/types/mobility.generated → @/modules/mobility/types/mobility.generated"
  },
  {
    pattern: /from ['"]@\/types\/mobility\.constants['"]/g,
    replacement: "from '@/modules/mobility/types/mobility.constants'",
    description: "@/types/mobility.constants → @/modules/mobility/types/mobility.constants"
  },
  
  // Supabase types
  {
    pattern: /from ['"]@\/types\/supabase\.types['"]/g,
    replacement: "from '@/shared/types/supabase.types'",
    description: "@/types/supabase.types → @/shared/types/supabase.types"
  }
];

function getAllTsFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

function migrateFile(filePath: string): number {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let totalReplacements = 0;
  
  for (const rule of migrationRules) {
    const matches = content.match(rule.pattern);
    if (matches) {
      content = content.replace(rule.pattern, rule.replacement);
      totalReplacements += matches.length;
    }
  }
  
  if (content !== originalContent) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf-8');
    }
    return totalReplacements;
  }
  
  return 0;
}

function main() {
  console.log('🚀 Legacy Import Migration Tool - P9 (Final 3 Type Imports)');
  console.log('='.repeat(60));
  console.log();
  
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No files will be modified');
    console.log('   Remove --dry-run flag to apply changes');
    console.log();
  }
  
  const srcDir = path.resolve(process.cwd(), 'src');
  console.log(`🔍 Scanning directory: ${srcDir}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no changes)' : 'LIVE (will modify files)'}`);
  console.log();
  
  const files = getAllTsFiles(srcDir);
  console.log(`Found ${files.length} TypeScript files`);
  console.log();
  
  let totalFilesModified = 0;
  let totalReplacements = 0;
  const replacementsByRule: Record<string, number> = {};
  
  for (const rule of migrationRules) {
    replacementsByRule[rule.description] = 0;
  }
  
  for (const file of files) {
    const replacements = migrateFile(file);
    if (replacements > 0) {
      totalFilesModified++;
      totalReplacements += replacements;
      const relativePath = path.relative(srcDir, file).replace(/\\/g, '/');
      console.log(`  ${DRY_RUN ? '📝' : '✅'} ${relativePath}: ${replacements} replacement${replacements > 1 ? 's' : ''}`);
      
      // Count by rule
      const content = fs.readFileSync(file, 'utf-8');
      for (const rule of migrationRules) {
        const matches = content.match(rule.pattern);
        if (matches) {
          replacementsByRule[rule.description] += matches.length;
        }
      }
    }
  }
  
  console.log();
  console.log('='.repeat(60));
  console.log(`📊 Migration Statistics (${DRY_RUN ? 'DRY RUN' : 'LIVE'})`);
  console.log('='.repeat(60));
  console.log(`Files processed: ${files.length}`);
  console.log(`Files modified: ${totalFilesModified}`);
  console.log(`Total replacements: ${totalReplacements}`);
  
  if (totalReplacements > 0) {
    console.log();
    console.log('Replacements by rule:');
    for (const [desc, count] of Object.entries(replacementsByRule)) {
      if (count > 0) {
        console.log(`  ${desc}: ${count}`);
      }
    }
  }
  
  console.log('='.repeat(60));
  console.log();
  
  if (DRY_RUN) {
    console.log('💡 To apply these changes, run:');
    console.log('   npx tsx scripts/migrate-legacy-imports-p9.ts');
  } else {
    console.log('✅ Migration completed successfully!');
    console.log('   Run "npm run typecheck" to verify changes');
  }
  
  console.log();
}

main();
