import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const SOURCE_ROOT = join(ROOT, 'src');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const LOCATION_IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]@\/core\/location\/types['"]/g;

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
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(LOCATION_IMPORT)) {
        if (/\bTerritorialGroup(?:Status|Member|WithMembers)?\b/.test(match[1])) {
          offenders.push(relative(ROOT, file).replace(/\\/g, '/'));
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
