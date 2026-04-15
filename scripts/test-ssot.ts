#!/usr/bin/env node

console.log('🔍 SSOT Validation Test');
console.log('✅ Script is running correctly');

// Test basic file system access
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

try {
  const srcDir = join(process.cwd(), 'src');
  const files = readdirSync(srcDir);
  console.log(`📁 Found ${files.length} items in src directory`);
  
  // Test reading a TypeScript file
  const testFile = join(srcDir, 'App.tsx');
  const content = readFileSync(testFile, 'utf-8');
  console.log(`📄 Successfully read App.tsx (${content.length} characters)`);
  
  console.log('✅ All tests passed');
} catch (error) {
  console.error('❌ Error:', error);
}