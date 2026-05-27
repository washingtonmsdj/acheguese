import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { SafeHtml } from '@/shared/components/security/SafeHtml';
import { SafeLink } from '@/shared/components/security/SafeLink';

describe('xss prevention security components', () => {
  it('sanitizes executable markup before rendering user html', () => {
    const { container } = render(
      <SafeHtml
        content={`
          <article>
            <script>window.__xss = true</script>
            <img src="x" onerror="window.__xss = true">
            <p onclick="window.__xss = true">Conteudo seguro</p>
            <a href="javascript:alert(1)">link bloqueado</a>
          </article>
        `}
      />,
    );

    expect(screen.getByText('Conteudo seguro')).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('[onerror]')).not.toBeInTheDocument();
    expect(container.querySelector('[onclick]')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain('javascript:');
  });

  it('renders dangerous href values as plain text instead of links', () => {
    const { container } = render(<SafeLink href="javascript:alert(1)">Abrir</SafeLink>);

    expect(screen.queryByRole('link', { name: 'Abrir' })).not.toBeInTheDocument();
    expect(container.querySelector('span')?.textContent).toBe('Abrir');
  });

  it('adds rel protections to external links opened in a new tab', () => {
    render(
      <SafeLink href="https://acheguese.com.br" target="_blank" rel="author">
        Site oficial
      </SafeLink>,
    );

    const link = screen.getByRole('link', { name: 'Site oficial' });
    expect(link).toHaveAttribute('href', 'https://acheguese.com.br');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('author'));
  });
});
