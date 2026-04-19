/**
 * Backup Supabase Storage
 * 
 * Downloads all files from all buckets to local backup directory.
 * 
 * Usage:
 *   npx tsx scripts/backup-storage.ts
 * 
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (admin access)
 * 
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BUCKETS = [
  'avatars',
  'business-gallery',
  'classified-images',
  'verification-docs',
  'chat-attachments',
];

async function backupBucket(
  supabase: ReturnType<typeof createClient>,
  bucketName: string,
  backupDir: string
) {
  console.log(`📦 Backing up bucket: ${bucketName}`);
  
  const bucketDir = join(backupDir, bucketName);
  if (!existsSync(bucketDir)) {
    mkdirSync(bucketDir, { recursive: true });
  }
  
  // List all files
  const { data: files, error } = await supabase
    .storage
    .from(bucketName)
    .list('', {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });
  
  if (error) {
    console.error(`❌ Error listing files in ${bucketName}:`, error.message);
    return 0;
  }
  
  if (!files || files.length === 0) {
    console.log(`   ℹ️  No files in ${bucketName}`);
    return 0;
  }
  
  // Download each file
  let count = 0;
  let errors = 0;
  
  for (const file of files) {
    try {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .download(file.name);
      
      if (error) {
        console.error(`   ❌ Error downloading ${file.name}:`, error.message);
        errors++;
        continue;
      }
      
      if (!data) {
        console.error(`   ❌ No data for ${file.name}`);
        errors++;
        continue;
      }
      
      const filePath = join(bucketDir, file.name);
      const buffer = Buffer.from(await data.arrayBuffer());
      writeFileSync(filePath, buffer);
      count++;
      
      if (count % 10 === 0) {
        console.log(`   📥 Downloaded ${count} files...`);
      }
    } catch (err) {
      console.error(`   ❌ Exception downloading ${file.name}:`, err);
      errors++;
    }
  }
  
  console.log(`✅ Backed up ${count} files from ${bucketName}${errors > 0 ? ` (${errors} errors)` : ''}`);
  return count;
}

async function main() {
  console.log('🚀 Starting Supabase Storage Backup\n');
  
  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    console.error('   SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n💡 Load from .env file or set manually');
    process.exit(1);
  }
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Create backup directory
  const timestamp = new Date().toISOString().split('T')[0];
  const backupDir = join(process.cwd(), 'backups', `storage-${timestamp}`);
  
  console.log(`📁 Backup directory: ${backupDir}\n`);
  
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  
  // Backup each bucket
  let totalFiles = 0;
  const startTime = Date.now();
  
  for (const bucket of BUCKETS) {
    const count = await backupBucket(supabase, bucket, backupDir);
    totalFiles += count;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n✅ Storage backup complete!');
  console.log(`📊 Total files: ${totalFiles}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📁 Location: ${backupDir}`);
}

main().catch((error) => {
  console.error('\n❌ Backup failed:', error);
  process.exit(1);
});
