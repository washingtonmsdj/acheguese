/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 6
 * Regression tests without database I/O.
 */

import { describe, expect, it } from 'vitest';
import { PostAdapter } from '../src/core/posts/adapters/PostAdapter';
import type { UnifiedPost } from '../src/shared/types/posts';

type PostLocationLike = Extract<NonNullable<UnifiedPost['location']>, { name: string }>;

function getLocationName(location: UnifiedPost['location']): string | null {
  if (location && typeof location === 'object' && 'name' in location) {
    return location.name;
  }

  return null;
}

function formattedLocation(
  location?: { name: string } | string,
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

describe('FASE 6 - Regressao Posts SSOT', () => {
  describe('Fase 2 - PostAdapter.fromServicePost()', () => {
    it('includes location from the join', () => {
      const post = PostAdapter.fromServicePost({
        id: 'p1',
        author_profile_id: 'prof1',
        content: 'Test',
        type: 'text',
        location_id: 'loc1',
        location: { id: 'loc1', name: 'Barra', type: 'district' },
        author_profile: { name: 'User' },
        likes_count: 0,
        comments_count: 0,
        created_at: '2026-04-05T10:00:00Z',
      });

      expect(post.location_id).toBe('loc1');
      expect(getLocationName(post.location)).toBe('Barra');
    });

    it('includes reach from the database row', () => {
      const post = PostAdapter.fromServicePost({
        id: 'p1',
        author_profile_id: 'prof1',
        content: 'Test',
        type: 'text',
        location_id: 'loc1',
        reach: 'city',
        author_profile: { name: 'User' },
        likes_count: 0,
        comments_count: 0,
        created_at: '2026-04-05T10:00:00Z',
      });

      expect(post.reach).toBe('city');
    });
  });

  describe('Fase 5 - PostAdapter without text comparison', () => {
    it('same location_id gets top priority', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'p1',
          type: 'text',
          author_profile_id: 'a',
          author_name: 'A',
          content: 'X',
          location_id: 'loc-1',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'p2',
          type: 'text',
          author_profile_id: 'b',
          author_name: 'B',
          content: 'Y',
          location_id: 'loc-2',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', { location_id: 'loc-1' });
      expect(sorted[0].id).toBe('p1');
    });

    it('different location_id keeps priority at zero even with matching city and neighborhood', () => {
      const posts: UnifiedPost[] = [
        {
          id: 'p1',
          type: 'text',
          author_profile_id: 'a',
          author_name: 'A',
          content: 'X',
          location_id: 'loc-1',
          neighborhood: 'Barra',
          city: 'Salvador',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
        {
          id: 'p2',
          type: 'text',
          author_profile_id: 'b',
          author_name: 'B',
          content: 'Y',
          location_id: 'loc-2',
          neighborhood: 'Barra',
          city: 'Salvador',
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', { location_id: 'loc-1' });
      expect(sorted[0].id).toBe('p1');
    });
  });

  describe('Fase 5 - UnifiedPost supports object location and reach', () => {
    it('accepts location as an object with name', () => {
      const post: UnifiedPost = {
        id: 'p1',
        type: 'text',
        author_profile_id: 'a',
        author_name: 'A',
        content: 'X',
        location: { name: 'Barra', type: 'district' } as PostLocationLike,
        location_id: 'loc-1',
        likes_count: 0,
        comments_count: 0,
        created_at: '2026-04-05T10:00:00Z',
      };

      expect(typeof post.location).toBe('object');
      expect(getLocationName(post.location)).toBe('Barra');
    });

    it('accepts street, neighborhood and city reach', () => {
      const values: Array<UnifiedPost['reach']> = ['street', 'neighborhood', 'city'];

      values.forEach((reach) => {
        const post: UnifiedPost = {
          id: 'p1',
          type: 'text',
          author_profile_id: 'a',
          author_name: 'A',
          content: 'X',
          reach,
          likes_count: 0,
          comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        };

        expect(post.reach).toBe(reach);
      });
    });
  });

  describe('Fase 5 - formattedLocation prioritizes location.name', () => {
    it('location.name wins over city and neighborhood', () => {
      expect(formattedLocation({ name: 'Barra' }, undefined, 'Pelourinho', 'Salvador')).toBe(
        'Barra',
      );
    });

    it('uses the residual fallback when there is no location object', () => {
      expect(formattedLocation(undefined, undefined, 'Barra', 'Salvador')).toBe(
        'Barra, Salvador',
      );
    });

    it('returns Localizacao nao informada when there is no data', () => {
      expect(formattedLocation(undefined)).toBe('Localizacao nao informada');
    });
  });

  describe('Fase 4 - createPost requires location_id', () => {
    it('rejects null location_id', async () => {
      await expect(
        (await import('../src/core/posts/services')).postService.createPost({
          author_profile_id: '11111111-1111-4111-8111-111111111111',
          content: 'Test',
          type: 'post',
          location_id: null as unknown as string,
        }),
      ).rejects.toThrow(/location_id.*obrigat.rio/i);
    }, 5000);
  });

  describe('Zero regression - sortPosts', () => {
    const posts: UnifiedPost[] = [
      {
        id: 'p1',
        type: 'text',
        author_profile_id: 'a',
        author_name: 'A',
        content: 'X',
        likes_count: 5,
        comments_count: 0,
        created_at: '2026-04-05T10:00:00Z',
      },
      {
        id: 'p2',
        type: 'text',
        author_profile_id: 'b',
        author_name: 'B',
        content: 'Y',
        likes_count: 10,
        comments_count: 0,
        created_at: '2026-04-05T11:00:00Z',
      },
    ];

    it('sorts recent posts first', () => {
      const sorted = PostAdapter.sortPosts(posts, 'recent');
      expect(sorted[0].id).toBe('p2');
    });

    it('sorts popular posts first', () => {
      const sorted = PostAdapter.sortPosts(posts, 'popular');
      expect(sorted[0].id).toBe('p2');
    });
  });
});
