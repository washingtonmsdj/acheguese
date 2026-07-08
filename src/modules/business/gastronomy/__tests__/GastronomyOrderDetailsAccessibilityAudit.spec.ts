import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('gastronomy order detail accessibility audit', () => {
  it('keeps tracking states announced and long text wrapped on order detail surfaces', () => {
    const trackingSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderTrackingCard.tsx',
    );
    const detailSource = readProjectFile(
      'src/modules/business/gastronomy/pages/OrderDetailsPage.tsx',
    );
    const reviewSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderPublicReviewPanel.tsx',
    );

    expect(trackingSource).toContain('role="status"');
    expect(trackingSource).toContain('aria-live="polite"');
    expect(trackingSource).toContain('break-words');

    expect(detailSource).toContain('whitespace-pre-wrap break-words');
    expect(detailSource).toContain('break-words text-sm text-muted-foreground');

    expect(reviewSource).toContain('role="status"');
    expect(reviewSource).toContain('aria-live="polite"');
  });

  it('keeps delivery tracking copy neutral when no platform courier is linked', () => {
    const trackingSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderTrackingCard.tsx',
    );
    const orderCardSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderCard.tsx',
    );
    const orderDetailsSource = readProjectFile(
      'src/modules/business/gastronomy/pages/OrderDetailsPage.tsx',
    );
    const operationsPanelSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderOperationsPanel.tsx',
    );
    const planStatusSource = readProjectFile(
      'src/modules/business/gastronomy/components/PlanStatusWidget.tsx',
    );

    expect(trackingSource).toContain('Entrega manual pela loja');
    expect(trackingSource).toContain('sem rastreamento vinculado');
    expect(trackingSource).not.toContain('Entrega ainda sem motoboy vinculado');
    expect(trackingSource).not.toContain('Buscando entregador...');
    expect(orderCardSource).toContain('Custo logistico da entrega');
    expect(orderDetailsSource).toContain('Custo logistico da entrega');
    expect(operationsPanelSource).toContain('coleta da entrega');
    expect(planStatusSource).toContain('Operacao de frota propria/manual');
    expect(planStatusSource).not.toContain('Rede de motoboys');
    expect(planStatusSource).not.toContain('Rastreamento de entrega');
  });
});
