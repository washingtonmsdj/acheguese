import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('gastronomy landing public discovery audit', () => {
  it('keeps the public catalog available without forcing a delivery destination', () => {
    const source = readProjectFile('src/modules/business/gastronomy/pages/GastronomyLandingPage.tsx');

    expect(source).toContain("const shouldShowDestinationGate = !isCommunityScopedSurface && !hasDeliveryContext;");
    expect(source).toContain("const canShowCatalog = territoryFilter.scope !== 'none';");
    expect(source).toContain("const shouldLoadCatalog = canShowCatalog;");
  });

  it('uses advisory destination copy instead of blocking copy', () => {
    const source = readProjectFile('src/modules/business/gastronomy/pages/landing/components/DeliveryDestinationGate.tsx');

    expect(source).toContain('calcular entrega com mais precisão');
    expect(source).not.toContain('liberar o catálogo');
  });
});
