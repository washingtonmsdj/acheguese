import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const TEST_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const FAKE_ASSERTION = ['expect(true)', 'toBe(true)'].join('.');

function collectFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);
    const stat = statSync(absolute);

    if (stat.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) continue;
      files.push(...collectFiles(absolute));
      continue;
    }

    if (TEST_EXTENSIONS.has(extname(entry))) files.push(absolute);
  }

  return files;
}

function activeTestFiles(): string[] {
  const roots = [join(ROOT, 'tests'), join(ROOT, 'src')];
  return roots
    .flatMap((root) => collectFiles(root))
    .filter((file) => /(?:\.test\.|\.spec\.|__tests__)/.test(file));
}

describe('active test integrity', () => {
  it('does not allow unconditional true assertions to certify behavior', () => {
    const offenders = activeTestFiles()
      .filter((file) => readFileSync(file, 'utf8').includes(FAKE_ASSERTION))
      .map((file) => relative(ROOT, file).replace(/\\/g, '/'));

    expect(offenders).toEqual([]);
  });
});
