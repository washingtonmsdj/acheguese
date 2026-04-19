/**
 * Generate vercel.json from Security SSOT
 * 
 * This script generates vercel.json configuration from the security SSOT.
 * Ensures that deployment configuration is always in sync with security config.
 * 
 * CRITICAL: This is the ONLY way to update vercel.json security headers.
 * Manual edits to vercel.json security headers will be overwritten.
 * 
 * Usage:
 *   npm run generate:vercel
 * 
 * @security-critical
 */

import fs from 'fs';
import path from 'path';
import { SECURITY_HEADERS, CACHE_HEADERS, getSecurityConfigSummary } from '../src/config/security.config';

/**
 * Vercel configuration template
 * 
 * Non-security settings are defined here.
 * Security headers are injected from SSOT.
 */
const VERCEL_CONFIG_TEMPLATE = {
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  devCommand: 'npm run dev',
  installCommand: 'npm install',
  framework: 'vite',
  
  rewrites: [
    {
      source: '/(.*)',
      destination: '/index.html',
    },
  ],
  
  headers: [] as Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>, // Will be populated
};

/**
 * Generate vercel.json configuration
 */
function generateVercelConfig() {
  console.log('🔒 Generating vercel.json from security SSOT...\n');
  
  // Get security summary
  const summary = getSecurityConfigSummary();
  console.log('📊 Security Configuration Summary:');
  console.log(`   Version: ${summary.version}`);
  console.log(`   Last Modified: ${summary.lastModified}`);
  console.log(`   Total Domains: ${summary.totalDomains}`);
  console.log(`   CSP Directives: ${summary.cspDirectives}`);
  console.log(`   Security Headers: ${summary.securityHeaders}`);
  console.log(`   Last Audit: ${summary.lastAudit}`);
  console.log(`   Next Audit: ${summary.nextAudit}\n`);
  
  // Convert security headers to Vercel format
  const securityHeaders = Object.entries(SECURITY_HEADERS).map(([key, value]) => ({
    key,
    value,
  }));
  
  console.log('🔐 Security Headers:');
  securityHeaders.forEach(header => {
    const preview = header.value.length > 80 
      ? header.value.substring(0, 80) + '...' 
      : header.value;
    console.log(`   ${header.key}: ${preview}`);
  });
  console.log('');
  
  // Convert cache headers to Vercel format
  const cacheHeadersArray = Object.values(CACHE_HEADERS).map(config => ({
    source: config.pattern,
    headers: Object.entries(config.headers).map(([key, value]) => ({
      key,
      value,
    })),
  }));
  
  console.log('⚡ Cache Headers:');
  cacheHeadersArray.forEach(config => {
    console.log(`   ${config.source}:`);
    config.headers.forEach(header => {
      console.log(`      ${header.key}: ${header.value}`);
    });
  });
  console.log('');
  
  // Inject headers into template
  const config = { ...VERCEL_CONFIG_TEMPLATE };
  
  // Add security headers for all routes
  config.headers.push({
    source: '/(.*)',
    headers: securityHeaders,
  });
  
  // Add cache headers for specific patterns
  config.headers.push(...cacheHeadersArray);
  
  // Write to file (no comments - Vercel doesn't support them)
  const outputPath = path.join(process.cwd(), 'vercel.json');
  
  fs.writeFileSync(
    outputPath,
    JSON.stringify(config, null, 2) + '\n'
  );
  
  console.log('✅ vercel.json generated successfully');
  console.log(`   Output: ${outputPath}`);
  console.log(`   Size: ${fs.statSync(outputPath).size} bytes\n`);
  
  // Validation
  console.log('🔍 Validating generated configuration...');
  
  try {
    const generated = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
    
    // Check that security headers are present
    const hasSecurityHeaders = generated.headers[0].headers.length > 0;
    const hasCSP = generated.headers[0].headers.some(
      (h: { key: string }) => h.key === 'Content-Security-Policy'
    );
    
    if (!hasSecurityHeaders) {
      throw new Error('No security headers found in generated config');
    }
    
    if (!hasCSP) {
      throw new Error('Content-Security-Policy header missing');
    }
    
    console.log('   ✅ Security headers present');
    console.log('   ✅ CSP header present');
    console.log('   ✅ Configuration valid\n');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
  
  // Success
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║   ✅ VERCEL.JSON GENERATED SUCCESSFULLY                 ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Review the generated vercel.json');
  console.log('   2. Commit the changes');
  console.log('   3. Deploy to Vercel');
  console.log('');
}

// Run generation
try {
  generateVercelConfig();
} catch (error) {
  console.error('❌ Error generating vercel.json:', error);
  process.exit(1);
}
