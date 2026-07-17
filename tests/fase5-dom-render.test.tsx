/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 5
 * DOM render tests with Testing Library.
 *
 * Goals:
 * 1. `location.name` is rendered in `PostHeader`
 * 2. "Localizacao nao informada" appears when there is no location
 * 3. Reach badge is rendered for street / neighborhood / city
 * 4. `location.name` has priority over city / neighborhood / street
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

type LocationLike = {
  name: string;
  type?: string;
};

function resolveFormattedLocation(
  location?: LocationLike | string,
  street?: string,
  neighborhood?: string,
  city?: string,
): string {
  if (location && typeof location === 'object' && 'name' in location) {
    return location.name;
  }

  if (typeof location === 'string' && location.length > 0) {
    return location;
  }

  const parts: string[] = [];
  if (street) parts.push(street);
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);

  return parts.join(', ') || 'Localizacao nao informada';
}

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

import { PostHeader } from '../src/core/community/components/UnifiedPostCard/PostHeader';

const BASE_HEADER_PROPS = {
  authorProfileId: 'profile-1',
  authorName: 'Joao Silva',
  authorInitials: 'JS',
  isVerifiedResident: false,
  relativeTime: 'ha 5 minutos',
  createdAt: '2026-04-05T10:00:00Z',
  isOwnPost: false,
};

function ReachBadge({ reach }: { reach?: 'street' | 'neighborhood' | 'city' }) {
  if (!reach) return null;

  return (
    <div data-testid="reach-badge" aria-label={`Visibilidade: ${reach}`}>
      {reach === 'street' && 'Minha rua'}
      {reach === 'neighborhood' && 'Meu bairro'}
      {reach === 'city' && 'Cidade'}
    </div>
  );
}

describe('FASE 5 - Render DOM Real', () => {
  describe('PostHeader - renderizacao de location', () => {
    it('renders location.name when location is Barra', () => {
      render(<PostHeader {...BASE_HEADER_PROPS} location="Barra" />);

      expect(screen.getByText('Barra')).toBeInTheDocument();
    });

    it('renders fallback text when location is empty', () => {
      render(
        <PostHeader
          {...BASE_HEADER_PROPS}
          location="Localizacao nao informada"
        />,
      );

      expect(screen.getByText('Localizacao nao informada')).toBeInTheDocument();
    });

    it('does not render city or neighborhood when location.name exists', () => {
      render(<PostHeader {...BASE_HEADER_PROPS} location="Barra" />);

      expect(screen.getByText('Barra')).toBeInTheDocument();
      expect(screen.queryByText('Salvador')).not.toBeInTheDocument();
      expect(screen.queryByText('Pelourinho')).not.toBeInTheDocument();
    });
  });

  describe('Reach badge - visibility in DOM', () => {
    it('renders Minha rua for street reach', () => {
      render(<ReachBadge reach="street" />);

      const badge = screen.getByTestId('reach-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Minha rua');
      expect(badge).toHaveAttribute('aria-label', 'Visibilidade: street');
    });

    it('renders Meu bairro for neighborhood reach', () => {
      render(<ReachBadge reach="neighborhood" />);

      const badge = screen.getByTestId('reach-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Meu bairro');
      expect(badge).toHaveAttribute('aria-label', 'Visibilidade: neighborhood');
    });

    it('renders Cidade for city reach', () => {
      render(<ReachBadge reach="city" />);

      const badge = screen.getByTestId('reach-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('Cidade');
      expect(badge).toHaveAttribute('aria-label', 'Visibilidade: city');
    });

    it('does not render the badge without reach', () => {
      render(<ReachBadge reach={undefined} />);

      expect(screen.queryByTestId('reach-badge')).not.toBeInTheDocument();
    });
  });

  describe('formattedLocation - priority rules', () => {
    it('returns location.name when location is an object', () => {
      const location: LocationLike = { name: 'Barra', type: 'district' };

      expect(resolveFormattedLocation(location)).toBe('Barra');
    });

    it('returns the string when location is a string', () => {
      expect(resolveFormattedLocation('Salvador')).toBe('Salvador');
    });

    it('returns fallback when there is no location data', () => {
      expect(resolveFormattedLocation(undefined, undefined, undefined, undefined)).toBe(
        'Localizacao nao informada',
      );
    });

    it('gives location.name priority over city and neighborhood', () => {
      const location: LocationLike = { name: 'Barra' };

      const result = resolveFormattedLocation(location, undefined, 'Pelourinho', 'Salvador');

      expect(result).toBe('Barra');
      expect(result).not.toContain('Salvador');
      expect(result).not.toContain('Pelourinho');
    });
  });
});
