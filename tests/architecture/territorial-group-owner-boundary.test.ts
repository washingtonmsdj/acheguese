import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SOURCE_ROOT = join(ROOT, 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const NAMED_BOUNDARY = /(import|export)\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g;
const TERRITORIAL_GROUP_CONTRACT = /\bTerritorialGroup(?:Status|Member|WithMembers)?\b/;

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (SOURCE_EXTENSIONS.has(extname(entry))) files.push(absolute);
  }
  return files;
}

describe('territorial group ownership boundary', () => {
  it('keeps TerritorialGroup contracts owned by core/territorial', () => {
    const offenders: string[] = [];

    for (const file of collectSourceFiles(SOURCE_ROOT)) {
      const projectPath = relative(ROOT, file).replace(/\\/g, '/');
      if (projectPath.startsWith('src/core/territorial/')) continue;

      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(NAMED_BOUNDARY)) {
        const names = match[2];
        const modulePath = match[3];
        if (!TERRITORIAL_GROUP_CONTRACT.test(names)) continue;
        if (modulePath === '@/core/territorial') continue;

        offenders.push(`${projectPath} -> ${modulePath}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('does not re-export TerritorialGroup contracts from the Location barrel', () => {
    const locationIndex = readFileSync(
      join(ROOT, 'src/core/location/index.ts'),
      'utf8',
    );

    for (const match of locationIndex.matchAll(NAMED_BOUNDARY)) {
      if (match[1] !== 'export') continue;
      expect(match[2]).not.toMatch(TERRITORIAL_GROUP_CONTRACT);
    }
  });
});
