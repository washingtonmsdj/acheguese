/**
 * Restore Supabase Storage
 * 
 * Uploads all files from backup directory to Supabase Storage.
 * 
 * Usage:
 *   npx tsx scripts/restore-storage.ts <backup-dir>
 * 
 * Example:
 *   npx tsx scripts/restore-storage.ts backups/storage-2026-04-19
 * 
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key (admin access)
 * 
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

async function restoreBucket(
  supabase: ReturnType<typeof createClient>,
  bucketName: string,
  backupDir: string
) {
  console.log(`📦 Restoring bucket: ${bucketName}`);
  
  const bucketDir = join(backupDir, bucketName);
  
  try {
    const files = readdirSync(bucketDir);
    
    if (files.length === 0) {
      console.log(`   ℹ️  No files to restore`);
      return 0;
    }
    
    let count = 0;
    let errors = 0;
    
    for (const file of files) {
      const filePath = join(bucketDir, file);
      
      // Skip directories
      const stat = statSync(filePath);
      if (stat.isDirectory()) {
        continue;
      }
      
      try {
        const fileBuffer = readFileSync(filePath);
        
        const { error } = await supabase
          .storage
          .from(bucketName)
          .upload(file, fileBuffer, {
            upsert: true,
            contentType: getContentType(file),
          });
        
        if (error) {
          console.error(`   ❌ Error uploading ${file}:`, error.message);
          errors++;
          continue;
        }
        
        count++;
        
        if (count % 10 === 0) {
          console.log(`   📤 Uploaded ${count} files...`);
        }
      } catch (err) {
        console.error(`   ❌ Exception uploading ${file}:`, err);
        errors++;
      }
    }
    
    console.log(`✅ Restored ${count} files to ${bucketName}${errors > 0 ? ` (${errors} errors)` : ''}`);
    return count;
  } catch (error) {
    console.error(`❌ Error restoring bucket ${bucketName}:`, error);
    return 0;
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  
  const contentTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    
    // Videos
    mp4: 'video/mp4',
    webm: 'video/webm',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    
    // Default
    default: 'application/octet-stream',
  };
  
  return contentTypes[ext || ''] || contentTypes.default;
}

async function main() {
  console.log('🚀 Starting Supabase Storage Restore\n');
  
  // Get backup directory from args
  const backupDir = process.argv[2];
  
  if (!backupDir) {
    console.error('❌ Usage: npx tsx scripts/restore-storage.ts <backup-dir>');
    console.error('\nExample:');
    console.error('  npx tsx scripts/restore-storage.ts backups/storage-2026-04-19');
    process.exit(1);
  }
  
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
  
  console.log(`📁 Backup directory: ${backupDir}\n`);
  
  // Get list of buckets from backup directory
  const buckets = readdirSync(backupDir);
  
  if (buckets.length === 0) {
    console.error('❌ No buckets found in backup directory');
    process.exit(1);
  }
  
  console.log(`📦 Found ${buckets.length} buckets to restore\n`);
  
  // Restore each bucket
  let totalFiles = 0;
  const startTime = Date.now();
  
  for (const bucket of buckets) {
    const count = await restoreBucket(supabase, bucket, backupDir);
    totalFiles += count;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n✅ Storage restore complete!');
  console.log(`📊 Total files: ${totalFiles}`);
  console.log(`⏱️  Duration: ${duration}s`);
}

main().catch((error) => {
  console.error('\n❌ Restore failed:', error);
  process.exit(1);
});
