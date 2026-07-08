import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const currentDir = resolve(fileURLToPath(import.meta.url), '..');
const repoRoot = resolve(currentDir, '../../../../..');

function readProjectFile(path: string): string {
  return readFileSync(resolve(repoRoot, path), 'utf8');
}

describe('gastronomy premium detail accessibility audit', () => {
  it('keeps premium detail controls labeled and order card text wrapped', () => {
    const premiumDetailSource = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyPremiumDetailPage.tsx',
    );
    const detailHeroSource = readProjectFile(
      'src/modules/business/gastronomy/pages/GastronomyDetailHeroSection.tsx',
    );
    const orderCardSource = readProjectFile(
      'src/modules/business/gastronomy/components/orders/OrderCard.tsx',
    );

    expect(detailHeroSource).toContain('aria-label="Voltar"');
    expect(detailHeroSource).toContain(
      "aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}",
    );
    expect(detailHeroSource).toContain('aria-label="Compartilhar estabelecimento"');

    expect(premiumDetailSource).toContain('aria-label={`Filtrar por ${category.name}`}');
    expect(premiumDetailSource).toContain('aria-label={`Abrir detalhes de ${item.name}`}');
    expect(premiumDetailSource).toContain('aria-label={`Diminuir quantidade de ${item.name}`}');
    expect(premiumDetailSource).toContain('aria-label={`Aumentar quantidade de ${item.name}`}');
    expect(premiumDetailSource).toContain('aria-label={`Remover ${line.name} do carrinho`}');
    expect(premiumDetailSource).toContain('aria-label="Cupom"');
    expect(premiumDetailSource).toContain('aria-label="Observações do pedido"');

    expect(orderCardSource).toContain('break-words');
    expect(orderCardSource).toContain('whitespace-pre-wrap break-words');
  });
});
