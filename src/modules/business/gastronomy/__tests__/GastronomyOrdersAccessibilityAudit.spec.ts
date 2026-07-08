import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('gastronomy orders accessibility audit', () => {
  it('keeps labels on orders search, filters and cancellation controls', () => {
    const ordersPageSource = readProjectFile('src/modules/business/gastronomy/pages/OrdersPage.tsx');
    const operationsPanelSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderOperationsPanel.tsx',
    );

    expect(ordersPageSource).toContain('htmlFor="orders-customer-search"');
    expect(ordersPageSource).toContain('id="orders-customer-search"');
    expect(ordersPageSource).toContain('aria-label="Filtrar pedidos por status"');
    expect(ordersPageSource).toContain('aria-label="Filtrar pedidos por status de pagamento"');
    expect(ordersPageSource).toContain('aria-live="polite"');

    expect(operationsPanelSource).toContain('htmlFor="order-cancel-reason-code"');
    expect(operationsPanelSource).toContain('id="order-cancel-reason-code"');
    expect(operationsPanelSource).toContain('htmlFor="order-cancel-reason-text"');
    expect(operationsPanelSource).toContain('id="order-cancel-reason-text"');
  });
});
