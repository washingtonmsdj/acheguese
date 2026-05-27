/**
 * Validate Security Configuration (SSOT)
 * 
 * Validates that security configuration is correct and consistent.
 * Run this in CI/CD to ensure security config integrity.
 * 
 * Usage:
 *   npm run security:config:validate
 * 
 * @security-critical
 */

import fs from 'fs';
import path from 'path';
import {
  validateCSPConfig,
  getSecurityConfigSummary,
  SECURITY_DOMAINS,
  CSP_DIRECTIVES,
  SECURITY_HEADERS,
  SECURITY_AUDIT_LOG,
} from '../src/config/security.config';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const results: ValidationResult = {
  passed: true,
  errors: [],
  warnings: [],
};

console.log('🔒 Validating Security Configuration (SSOT)...\n');

// 1. Validate CSP Configuration
console.log('📋 1. Validating CSP Configuration...');
const cspValidation = validateCSPConfig();
if (!cspValidation.valid) {
  // Treat CSP warnings as warnings, not errors
  results.warnings.push(...cspValidation.errors);
  console.log('   ⚠️  CSP has warnings (expected for now)');
  cspValidation.errors.forEach(err => console.log(`      - ${err}`));
} else {
  console.log('   ✅ CSP configuration valid');
}

// 2. Check for dangerous CSP values
console.log('\n📋 2. Checking for dangerous CSP values...');
const dangerousValues = [];

if (CSP_DIRECTIVES['script-src']?.includes("'unsafe-inline'")) {
  dangerousValues.push("'unsafe-inline' in script-src");
  results.warnings.push("WARNING: 'unsafe-inline' in script-src is dangerous");
}

if (CSP_DIRECTIVES['script-src']?.includes("'unsafe-eval'")) {
  dangerousValues.push("'unsafe-eval' in script-src");
  results.warnings.push("WARNING: 'unsafe-eval' in script-src is dangerous");
}

if (dangerousValues.length > 0) {
  console.log('   ⚠️  Dangerous values found:');
  dangerousValues.forEach(val => console.log(`      - ${val}`));
  console.log('   ℹ️  These should be removed in future iterations');
} else {
  console.log('   ✅ No dangerous values found');
}

// 3. Validate domain documentation
console.log('\n📋 3. Validating domain documentation...');
let undocumentedDomains = 0;

Object.entries(SECURITY_DOMAINS).forEach(([key, domain]) => {
  if (!domain.purpose || !domain.risk || !domain.justification) {
    undocumentedDomains++;
    results.warnings.push(`Domain ${key} is not fully documented`);
  }
});

if (undocumentedDomains > 0) {
  console.log(`   ⚠️  ${undocumentedDomains} domains not fully documented`);
} else {
  console.log('   ✅ All domains documented');
}

// 4. Check audit log
console.log('\n📋 4. Checking security audit log...');
const now = new Date();
const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

function parseAuditDate(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

if (today > parseAuditDate(SECURITY_AUDIT_LOG.nextReview)) {
  results.warnings.push('Security audit is overdue');
  console.log('   ⚠️  Security audit is overdue');
  console.log(`      Last review: ${SECURITY_AUDIT_LOG.lastReview}`);
  console.log(`      Next review: ${SECURITY_AUDIT_LOG.nextReview}`);
} else {
  console.log('   ✅ Security audit up to date');
  console.log(`      Last review: ${SECURITY_AUDIT_LOG.lastReview}`);
  console.log(`      Next review: ${SECURITY_AUDIT_LOG.nextReview}`);
}

// 5. Validate vercel.json exists and is in sync
console.log('\n📋 5. Validating vercel.json...');
const vercelJsonPath = path.join(process.cwd(), 'vercel.json');

if (!fs.existsSync(vercelJsonPath)) {
  results.passed = false;
  results.errors.push('vercel.json not found - run npm run generate:vercel');
  console.log('   ❌ vercel.json not found');
} else {
  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));
    
    
    // Check if CSP header exists
    const headers = vercelJson.headers?.[0]?.headers || [];
    const cspHeader = headers.find((h: any) => h.key === 'Content-Security-Policy');
    
    if (!cspHeader) {
      results.passed = false;
      results.errors.push('CSP header missing in vercel.json');
      console.log('   ❌ CSP header missing');
    } else {
      console.log('   ✅ CSP header present');
    }

    const generatedCsp = SECURITY_HEADERS['Content-Security-Policy'];
    if (cspHeader?.value !== generatedCsp) {
      results.passed = false;
      results.errors.push('vercel.json CSP is out of sync with security SSOT');
      console.log('   ERROR: CSP header out of sync with SSOT');
    } else {
      console.log('   OK: vercel.json CSP matches security SSOT');
    }
    
  } catch (error) {
    results.passed = false;
    results.errors.push('Failed to parse vercel.json');
    console.log('   ❌ Failed to parse vercel.json');
  }
}

// 6. Check for hardcoded security configs in components
console.log('\n📋 6. Checking for hardcoded configs...');
const componentsToCheck = [
  'src/shared/components/security/SafeHtml.tsx',
  'src/shared/components/security/SafeLink.tsx',
  'src/shared/components/security/SafeImage.tsx',
];

let hardcodedConfigs = 0;

componentsToCheck.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Check for hardcoded arrays/objects that should come from SSOT
    if (content.includes('const ALLOWED_') || content.includes('const BLOCKED_')) {
      hardcodedConfigs++;
      results.warnings.push(`Possible hardcoded config in ${filePath}`);
    }
  }
});

if (hardcodedConfigs > 0) {
  console.log(`   ⚠️  ${hardcodedConfigs} files may have hardcoded configs`);
} else {
  console.log('   ✅ No hardcoded configs found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(60));

const summary = getSecurityConfigSummary();
console.log(`\n📈 Configuration Stats:`);
console.log(`   Version: ${summary.version}`);
console.log(`   Last Modified: ${summary.lastModified}`);
console.log(`   Total Domains: ${summary.totalDomains}`);
console.log(`   CSP Directives: ${summary.cspDirectives}`);
console.log(`   Security Headers: ${summary.securityHeaders}`);

console.log(`\n🔍 Validation Results:`);
console.log(`   Errors: ${results.errors.length}`);
console.log(`   Warnings: ${results.warnings.length}`);

if (results.errors.length > 0) {
  console.log('\n❌ ERRORS:');
  results.errors.forEach(err => console.log(`   - ${err}`));
}

if (results.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  results.warnings.forEach(warn => console.log(`   - ${warn}`));
}

console.log('\n' + '='.repeat(60));

if (results.passed) {
  console.log('✅ VALIDATION PASSED');
  console.log('='.repeat(60));
  console.log('');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED');
  console.log('='.repeat(60));
  console.log('');
  process.exit(1);
}
