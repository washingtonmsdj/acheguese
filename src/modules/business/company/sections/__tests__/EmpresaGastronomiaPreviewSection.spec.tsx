import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EmpresaGastronomiaPreviewSection } from '../EmpresaGastronomiaPreviewSection';

describe('EmpresaGastronomiaPreviewSection', () => {
  it('renders a limited gastronomy preview with a crawlable canonical CTA and no cart controls', () => {
    render(
      <MemoryRouter>
        <EmpresaGastronomiaPreviewSection
          businessName="Cafe Central"
          canonicalUrl="/empresas/ba/salvador/rio-vermelho/cafe-central"
          items={[
            {
              id: 'item-1',
              name: 'Cafe coado',
              priceFrom: 8,
              priceLabel: 'A partir de R$ 8,00',
              menuUrl: '/gastronomia/ba/salvador/rio-vermelho/cafe-central',
            },
            {
              id: 'item-2',
              name: 'Bolo de milho',
              priceFrom: 12,
              priceLabel: 'A partir de R$ 12,00',
              menuUrl: '/gastronomia/ba/salvador/rio-vermelho/cafe-central',
            },
          ]}
        />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: /ver card.pio e pedir/i });
    expect(cta).toHaveAttribute(
      'href',
      '/empresas/ba/salvador/rio-vermelho/cafe-central',
    );
    expect(
      screen.getByRole('link', {
        name: /abrir cardapio de cafe central: cafe coado/i,
      }),
    ).toHaveAttribute(
      'href',
      '/gastronomia/ba/salvador/rio-vermelho/cafe-central',
    );
    expect(screen.getByText('A partir de R$ 8,00')).toBeInTheDocument();
    expect(screen.queryByText(/adicionar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/carrinho/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout/i)).not.toBeInTheDocument();
  });
});
