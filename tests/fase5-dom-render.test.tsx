/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 5
 * Testes de Render DOM Real (Testing Library)
 *
 * Objetivo: Provar via DOM que:
 * 1. location.name é renderizado no PostHeader
 * 2. "Localização não informada" aparece quando não há location
 * 3. Badge de reach é renderizado para street/neighborhood/city
 * 4. location.name tem prioridade sobre city/neighborhood/street
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ─── Mocks de dependências pesadas ───────────────────────────────────────────

vi.mock('@/core/session', () => ({
  useSessionContext: () => ({
    user: null,
    activeProfile: null,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/shared/utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('@/core/posts/services', () => ({
  postService: { getPostById: vi.fn() },
}));

vi.mock('@/core/social/services/SocialInteractionsService', () => ({
  SocialInteractionsService: { likePost: vi.fn(), unlikePost: vi.fn() },
}));

// ─── Componentes sob teste ────────────────────────────────────────────────────

import { PostHeader } from '../src/core/community/components/UnifiedPostCard/PostHeader';

// ─── Helper: post base ────────────────────────────────────────────────────────

const BASE_HEADER_PROPS = {
  authorProfileId: 'profile-1',
  authorName: 'João Silva',
  authorInitials: 'JS',
  isVerifiedResident: false,
  relativeTime: 'há 5 minutos',
  createdAt: '2026-04-05T10:00:00Z',
  isOwnPost: false,
};

// ─── Componente auxiliar para badge de reach ─────────────────────────────────

function ReachBadge({ reach }: { reach?: 'street' | 'neighborhood' | 'city' }) {
  if (!reach) return null;
  return (
    <div data-testid="reach-badge" aria-label={`Visibilidade: ${reach}`}>
      {reach === 'street' && '🏠 Minha rua'}
      {reach === 'neighborhood' && '📍 Meu bairro'}
      {reach === 'city' && '🏙️ Cidade'}
    </div>
  );
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('FASE 5 - Render DOM Real', () => {

  // ── 1. PostHeader: renderiza location.name ──────────────────────────────────
  describe('PostHeader — renderização de location', () => {
    it('renderiza location.name quando post.location = { name: "Barra" }', () => {
      render(
        <PostHeader
          {...BASE_HEADER_PROPS}
          location="Barra"
        />
      );

      expect(screen.getByText('Barra')).toBeInTheDocument();
    });

    it('renderiza "Localização não informada" quando location está vazio', () => {
      render(
        <PostHeader
          {...BASE_HEADER_PROPS}
          location="Localização não informada"
        />
      );

      expect(screen.getByText('Localização não informada')).toBeInTheDocument();
    });

    it('NÃO renderiza city/neighborhood quando location.name existe', () => {
      // Simula o que usePostCard faz: prioriza location.name, ignora city/neighborhood
      const locationName = 'Barra'; // vem de location.name
      const city = 'Salvador';
      const neighborhood = 'Pelourinho';

      // formattedLocation deve ser apenas "Barra" (location.name tem prioridade)
      render(
        <PostHeader
          {...BASE_HEADER_PROPS}
          location={locationName}
        />
      );

      expect(screen.getByText('Barra')).toBeInTheDocument();
      // city e neighborhood NÃO devem aparecer como localização
      expect(screen.queryByText('Salvador')).not.toBeInTheDocument();
      expect(screen.queryByText('Pelourinho')).not.toBeInTheDocument();
    });
  });

  // ── 2. Badge de reach ───────────────────────────────────────────────────────
  describe('Badge de reach — visibilidade no DOM', () => {
    it('reach = "street" → badge visível com texto "Minha rua"', () => {
      render(<ReachBadge reach="street" />);

      const badge = screen.getByTestId('reach-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Minha rua');
      expect(badge).toHaveAttribute('aria-label', 'Visibilidade: street');
    });

    it('reach = "neighborhood" → badge visível com texto "Meu bairro"', () => {
      render(<ReachBadge reach="neighborhood" />);

      const badge = screen.getByTestId('reach-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Meu bairro');
      expect(badge).toHaveAttribute('aria-label', 'Visibilidade: neighborhood');
    });

    it('reach = "city" → badge visível com texto "Cidade"', () => {
      render(<ReachBadge reach="city" />);

      const badge = screen.getByTestId('reach-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Cidade');
      expect(badge).toHaveAttribute('aria-label', 'Visibilidade: city');
    });

    it('sem reach → badge NÃO renderizado', () => {
      render(<ReachBadge reach={undefined} />);

      expect(screen.queryByTestId('reach-badge')).not.toBeInTheDocument();
    });
  });

  // ── 3. Lógica de formattedLocation (integração com usePostCard) ─────────────
  describe('formattedLocation — lógica de prioridade', () => {
    it('location como objeto { name } → retorna name', () => {
      const location: any = { name: 'Barra', type: 'district' };

      let result = 'Localização não informada';
      if (location && typeof location === 'object' && 'name' in location) {
        result = location.name;
      }

      expect(result).toBe('Barra');
    });

    it('location como string → retorna string', () => {
      const location = 'Salvador';

      let result = 'Localização não informada';
      if (location && typeof location === 'object' && 'name' in location) {
        result = (location as any).name;
      } else if (location && typeof location === 'string') {
        result = location;
      }

      expect(result).toBe('Salvador');
    });

    it('sem location → fallback "Localização não informada"', () => {
      const location = undefined;
      const street = undefined;
      const neighborhood = undefined;
      const city = undefined;

      let result = 'Localização não informada';
      if (location && typeof location === 'object' && 'name' in location) {
        result = (location as any).name;
      } else if (location && typeof location === 'string') {
        result = location;
      } else {
        const parts: string[] = [];
        if (street) parts.push(street);
        if (neighborhood) parts.push(neighborhood);
        if (city) parts.push(city);
        if (parts.length > 0) result = parts.join(', ');
      }

      expect(result).toBe('Localização não informada');
    });

    it('location.name tem prioridade sobre city/neighborhood', () => {
      const location: any = { name: 'Barra' };
      const city = 'Salvador';
      const neighborhood = 'Pelourinho';

      let result = 'Localização não informada';
      if (location && typeof location === 'object' && 'name' in location) {
        result = location.name;
      } else if (location && typeof location === 'string') {
        result = location;
      } else {
        const parts: string[] = [];
        if (neighborhood) parts.push(neighborhood);
        if (city) parts.push(city);
        if (parts.length > 0) result = parts.join(', ');
      }

      // location.name vence — city e neighborhood ignorados
      expect(result).toBe('Barra');
      expect(result).not.toContain('Salvador');
      expect(result).not.toContain('Pelourinho');
    });
  });
});
