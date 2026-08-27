/**
 * Backup Configuration Files
 * 
 * Creates a backup of all critical configuration files.
 * 
 * Usage:
 *   npx tsx tools/maintenance/backup-config.ts
 * 
 * @version 1.0.0
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';

const CONFIG_FILES = [
  '.env.production',
  '.env.example',
  'vercel.json',
  'supabase/config.toml',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
  'src/shared/config/security.config.ts',
  'src/shared/config/reactQuery.config.ts',
];

const CONFIG_DIRS = [
  'supabase/migrations',
  'supabase/functions',
  '.github/workflows',
];

function copyFile(source: string, dest: string): boolean {
  try {
    // Create destination directory if needed
    const destDir = dirname(dest);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    copyFileSync(source, dest);
    return true;
  } catch (error) {
    return false;
  }
}

function copyDirectory(source: string, dest: string): number {
  let count = 0;
  
  if (!existsSync(source)) {
    return 0;
  }
  
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const entries = readdirSync(source);
  
  for (const entry of entries) {
    const sourcePath = join(source, entry);
    const destPath = join(dest, entry);
    
    const stat = statSync(sourcePath);
    
    if (stat.isDirectory()) {
      count += copyDirectory(sourcePath, destPath);
    } else {
      if (copyFile(sourcePath, destPath)) {
        count++;
      }
    }
  }
  
  return count;
}

async function main() {
  console.log('🚀 Starting Configuration Backup\n');
  
  // Create backup directory
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = join(process.cwd(), 'backups', `config-${timestamp}`);
  
  console.log(`📁 Backup directory: ${backupDir}\n`);
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup config files
  console.log('📄 Backing up configuration files...');
  let filesCount = 0;
  let filesSkipped = 0;
  
  for (const file of CONFIG_FILES) {
    const source = join(process.cwd(), file);
    const dest = join(backupDir, file);
    
    if (copyFile(source, dest)) {
      console.log(`   ✅ ${file}`);
      filesCount++;
    } else {
      console.log(`   ⚠️  ${file} (not found)`);
      filesSkipped++;
    }
  }
  
  // Backup directories
  console.log('\n📁 Backing up directories...');
  let dirsCount = 0;
  
  for (const dir of CONFIG_DIRS) {
    const source = join(process.cwd(), dir);
    const dest = join(backupDir, dir);
    
    const count = copyDirectory(source, dest);
    
    if (count > 0) {
      console.log(`   ✅ ${dir} (${count} files)`);
      dirsCount += count;
    } else {
      console.log(`   ⚠️  ${dir} (not found or empty)`);
    }
  }
  
  console.log('\n✅ Configuration backup complete!');
  console.log(`📊 Files backed up: ${filesCount + dirsCount}`);
  console.log(`⚠️  Files skipped: ${filesSkipped}`);
  console.log(`📁 Location: ${backupDir}`);
}

main().catch((error) => {
  console.error('\n❌ Backup failed:', error);
  process.exit(1);
});
