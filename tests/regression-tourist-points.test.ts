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

/**
 * Lê todos os arquivos TypeScript/TSX de um diretório recursivamente
 */
function readTsFiles(dir: string): { path: string; content: string }[] {
  const files: { path: string; content: string }[] = [];
  
  const entries = readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Ignorar __mocks__ e node_modules
      if (entry.name === '__mocks__' || entry.name === 'node_modules') continue;
      files.push(...readTsFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Ignorar arquivos de teste
      if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.spec.ts')) continue;
      
      const content = readFileSync(fullPath, 'utf-8');
      files.push({ path: fullPath, content });
    }
  }
  
  return files;
}

describe('Regression: URL Construction', () => {
  it('should not have manual URL construction for tourist points', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      // Procurar por construção manual de URL
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
      }
      if (file.content.includes('buildTouristPointDetailUrl(')) {
        usesFunction = true;
      }
    }
    
    expect(hasBuildFunction, 'buildTouristPointDetailUrl should be defined').toBe(true);
    expect(usesFunction, 'buildTouristPointDetailUrl should be used').toBe(true);
  });
});

describe('Regression: Legacy Field Usage', () => {
  it('should not read neighborhood field directly', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      // Procurar por uso direto de point.neighborhood sem fallback
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Ignorar comentários
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;
        
        // Procurar por point.neighborhood sem o fallback correto
        if (line.includes('point.neighborhood') || line.includes('point?.neighborhood')) {
          // Verificar se tem o fallback correto
          if (!line.includes('point.location?.name') && !line.includes('point?.location?.name')) {
            violations.push(`${file.path}:${i + 1}: Direct usage of 'neighborhood' field`);
          }
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Direct usage of legacy field 'neighborhood' found!\n\n` +
        `Use point.location?.name ?? point.neighborhood instead:\n\n` +
        violations.join('\n')
      );
    }
  });
  
  it('should use location.name from SSOT', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    let usesLocationName = false;
    
    for (const file of files) {
      if (file.content.includes('location?.name') || file.content.includes('location.name')) {
        usesLocationName = true;
        break;
      }
    }
    
    expect(usesLocationName, 'Should use location.name from SSOT').toBe(true);
  });
});

describe('Regression: Territorial Filters', () => {
  it('should not use state/city filters directly', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      // Procurar por filtros territoriais indevidos
      const invalidFilters = [
        /\.eq\(['"`]state['"`]/g,
        /\.eq\(['"`]city['"`]/g,
        /\.eq\(['"`]district['"`]/g,
      ];
      
      for (const pattern of invalidFilters) {
        const matches = file.content.match(pattern);
        if (matches) {
          violations.push(`${file.path}: Found ${matches.length} invalid territorial filter(s)`);
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Invalid territorial filters found!\n\n` +
        `Use location_id with TerritoryFilter instead:\n\n` +
        violations.join('\n')
      );
    }
  });
  
  it('should use location_id for territorial filtering', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    let usesLocationId = false;
    
    for (const file of files) {
      const hasDirectLocationFilter =
        file.content.includes('.in(\'location_id\'') ||
        file.content.includes('.eq(\'location_id\'') ||
        file.content.includes('.in(\"location_id\"') ||
        file.content.includes('.eq(\"location_id\"');

      const hasTerritoryResolutionPattern =
        file.content.includes('resolveLocationIdsFromFilter') &&
        file.content.includes('location_ids');

      if (hasDirectLocationFilter || hasTerritoryResolutionPattern) {
        usesLocationId = true;
        break;
      }
    }
    
    expect(usesLocationId, 'Should use location_id for territorial filtering').toBe(true);
  });
});

describe('Regression: Service Layer', () => {
  it('should use TouristPointQueryService for all queries', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      // Ignorar o próprio service
      if (file.path.includes('TouristPointQueryService.ts')) continue;
      if (file.path.includes('TouristPointService.ts')) continue;
      
      // Procurar por queries diretas ao Supabase
      if (file.content.includes('supabase.from(\'tourist_points\')')) {
        violations.push(`${file.path}: Direct Supabase query found`);
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Direct Supabase queries found!\n\n` +
        `Use TouristPointQueryService instead:\n\n` +
        violations.join('\n')
      );
    }
  });
});

describe('Regression: Type Safety', () => {
  it('should not use any type for tourist points', () => {
    const files = readTsFiles(GUIDE_MODULE_PATH);
    const violations: string[] = [];
    
    for (const file of files) {
      const lines = file.content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Procurar por any type em contexto de tourist points
        if (line.includes(': any') && (
          line.includes('point') ||
          line.includes('tourist') ||
          line.includes('TouristPoint')
        )) {
          violations.push(`${file.path}:${i + 1}: Usage of 'any' type`);
        }
      }
    }
    
    if (violations.length > 0) {
      throw new Error(
        `❌ Usage of 'any' type found!\n\n` +
        `Use proper TypeScript types (TouristPoint, etc):\n\n` +
        violations.join('\n')
      );
    }
  });
});
