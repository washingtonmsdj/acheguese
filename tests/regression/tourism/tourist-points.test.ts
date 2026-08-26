/**
 * Regression Tests - Tourist Points
 * 
 * Blindagem contra regressões comuns:
 * 1. URL manual construction (deve usar buildTouristPointDetailUrl)
 * 2. Leitura de campos legados (deve usar location.name)
 * 3. Filtros territoriais indevidos (deve usar location_id)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const GUIDE_MODULE_PATH = join(process.cwd(), 'src/modules/guide');
const APP_ROUTES_PATH = join(process.cwd(), 'src/app/routes/AppRoutes.tsx');

function readTsFiles(dir: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === '__mocks__' || entry.name === 'node_modules') continue;
      files.push(...readTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
      
      const content = readFileSync(fullPath, 'utf-8');
      files.push({ path: fullPath, content });
    }
  }
  
  return files;
}

describe('Regression: URL Construction', () => {
  it('should not expose public tourist point detail by raw ID', () => {
    const appRoutes = readFileSync(APP_ROUTES_PATH, 'utf-8');

    expect(appRoutes).not.toMatch(/<Route\s+path=["']\/pontos-turisticos\/:id["']/);
  });

  it('should not have manual URL construction for tourist points', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      const manualUrlPattern = /['"`]\/pontos-turisticos\/\$\{|['"`]\/pontos-turisticos\/${/g;
      const matches = file.content.match(manualUrlPattern);
      
      if (matches) {
        violations.push(`${file.path}: Found ${matches.length} manual URL construction(s)`);
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Manual URL construction found!\n\n` +
        `Use buildTouristPointDetailUrl() instead:\n\n` +
        violations.join('\n')
      );
    }
  });
  
  it('should use buildTouristPointDetailUrl for all detail URLs', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    let hasBuildFunction = false;
    let usesFunction = false;
    
    for (const file of files) {
      if (file.content.includes('buildTouristPointDetailUrl')) {
        hasBuildFunction = true;
        if (file.content.includes('buildTouristPointDetailUrl(')) {
          usesFunction = true;
        }
      }
    }
    
    expect(hasBuildFunction).toBe(true);
    expect(usesFunction).toBe(true);
  });
});

describe('Regression: Legacy Fields', () => {
  it('should not use legacy city/neighborhood fields in tourist point display logic', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        if (/point\.(city|neighborhood)\b/.test(line) && !line.trim().startsWith('//')) {
          violations.push(`${file.path}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });

  it('should keep location.name as the territorial display source', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const source = files.map((file) => file.content).join('\n');

    expect(source).toMatch(/location\??\.name|location\.name/);
  });
});

describe('Regression: Territorial Filters', () => {
  it('should use location_id in guide runtime sources', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const source = files.map((file) => file.content).join('\n');

    expect(source).toContain('location_id');
  });

  it('should not construct territory filters from raw city or neighborhood labels', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];

    for (const file of files) {
      const lines = file.content.split('\n');
      lines.forEach((line, index) => {
        if (/\.eq\(['"](?:city|neighborhood)['"]/.test(line)) {
          violations.push(`${file.path}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations, violations.join('\n')).toEqual([]);
  });
});
