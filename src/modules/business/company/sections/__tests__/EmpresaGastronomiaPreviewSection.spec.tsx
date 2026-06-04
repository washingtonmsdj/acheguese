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
              isFeatured: true,
            },
            {
              id: 'item-2',
              name: 'Bolo de milho',
              priceFrom: 12,
              isFeatured: true,
            },
          ]}
        />
      </MemoryRouter>,
    );

    const cta = screen.getByRole('link', { name: /ver cardápio e pedir/i });
    expect(cta).toHaveAttribute(
      'href',
      '/empresas/ba/salvador/rio-vermelho/cafe-central',
    );
    expect(screen.getByText('Cafe coado')).toBeInTheDocument();
    expect(screen.queryByText(/adicionar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/carrinho/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/checkout/i)).not.toBeInTheDocument();
  });
});
