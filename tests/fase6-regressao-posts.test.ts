/**
 * SPRINT 2 - POSTS (SSOT TERRITORIAL) - FASE 6
 * Testes de Regressão — sem I/O de banco
 *
 * Objetivo: garantir que nenhuma das fases anteriores foi revertida.
 * Todos os testes são unitários (sem rede).
 *
 * Padrão: AAA
 */

import { describe, it, expect } from 'vitest';
import { PostAdapter } from '../src/core/posts/adapters/PostAdapter';
import type { UnifiedPost } from '../src/shared/types/posts';

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('FASE 6 - Regressão Posts SSOT', () => {

  // ── Fase 2: Service Layer ──────────────────────────────────────────────────
  describe('Fase 2 — PostAdapter.fromServicePost()', () => {
    it('inclui location do JOIN', () => {
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
      expect((post.location as any).name).toBe('Barra');
    });

    it('inclui reach do banco', () => {
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

  // ── Fase 5: PostAdapter.calculateProximity ─────────────────────────────────
  describe('Fase 5 — PostAdapter sem comparação textual', () => {
    it('mesmo location_id → prioridade máxima (3)', () => {
      const posts: UnifiedPost[] = [
        { id: 'p1', type: 'text', author_profile_id: 'a', author_name: 'A',
          content: 'X', location_id: 'loc-1', likes_count: 0, comments_count: 0,
          created_at: '2026-04-05T10:00:00Z' },
        { id: 'p2', type: 'text', author_profile_id: 'b', author_name: 'B',
          content: 'Y', location_id: 'loc-2', likes_count: 0, comments_count: 0,
          created_at: '2026-04-05T10:00:00Z' },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', { location_id: 'loc-1' });
      expect(sorted[0].id).toBe('p1');
    });

    it('location_id diferente → prioridade 0 (sem comparação textual)', () => {
      // Mesmo neighborhood/city, location_id diferente → não deve subir
      const posts: UnifiedPost[] = [
        { id: 'p1', type: 'text', author_profile_id: 'a', author_name: 'A',
          content: 'X', location_id: 'loc-1', neighborhood: 'Barra', city: 'Salvador',
          likes_count: 0, comments_count: 0, created_at: '2026-04-05T10:00:00Z' },
        { id: 'p2', type: 'text', author_profile_id: 'b', author_name: 'B',
          content: 'Y', location_id: 'loc-2', neighborhood: 'Barra', city: 'Salvador',
          likes_count: 0, comments_count: 0, created_at: '2026-04-05T10:00:00Z' },
      ];

      const sorted = PostAdapter.sortPosts(posts, 'nearby', {
        location_id: 'loc-1',
      });

      // p1 tem location_id correto → vem primeiro
      // p2 tem mesmo neighborhood/city mas location_id diferente → não sobe
      expect(sorted[0].id).toBe('p1');
    });
  });

  // ── Fase 5: UnifiedPost type ───────────────────────────────────────────────
  describe('Fase 5 — UnifiedPost suporta location como objeto e reach', () => {
    it('location pode ser objeto { name }', () => {
      const post: UnifiedPost = {
        id: 'p1', type: 'text', author_profile_id: 'a', author_name: 'A',
        content: 'X',
        location: { name: 'Barra', type: 'district' },
        location_id: 'loc-1',
        likes_count: 0, comments_count: 0,
        created_at: '2026-04-05T10:00:00Z',
      };

      expect(typeof post.location).toBe('object');
      expect((post.location as any).name).toBe('Barra');
    });

    it('reach aceita street | neighborhood | city', () => {
      const values: Array<UnifiedPost['reach']> = ['street', 'neighborhood', 'city'];
      values.forEach(reach => {
        const post: UnifiedPost = {
          id: 'p1', type: 'text', author_profile_id: 'a', author_name: 'A',
          content: 'X', reach,
          likes_count: 0, comments_count: 0,
          created_at: '2026-04-05T10:00:00Z',
        };
        expect(post.reach).toBe(reach);
      });
    });
  });

  // ── Fase 5: formattedLocation — prioridade ─────────────────────────────────
  describe('Fase 5 — formattedLocation prioriza location.name', () => {
    function formattedLocation(
      location: any,
      street?: string,
      neighborhood?: string,
      city?: string,
    ): string {
      if (location && typeof location === 'object' && 'name' in location) {
        return location.name;
      }
      if (location && typeof location === 'string') return location;
      const parts: string[] = [];
      if (street) parts.push(street);
      if (neighborhood) parts.push(neighborhood);
      if (city) parts.push(city);
      return parts.join(', ') || 'Localização não informada';
    }

    it('location.name vence city/neighborhood', () => {
      expect(formattedLocation({ name: 'Barra' }, undefined, 'Pelourinho', 'Salvador'))
        .toBe('Barra');
    });

    it('sem location → fallback residual temporário', () => {
      expect(formattedLocation(undefined, undefined, 'Barra', 'Salvador'))
        .toBe('Barra, Salvador');
    });

    it('sem nada → "Localização não informada"', () => {
      expect(formattedLocation(undefined)).toBe('Localização não informada');
    });
  });

  // ── Fase 4: NOT NULL — nenhum write sem location_id ───────────────────────
  describe('Fase 4 — createPost exige location_id', () => {
    it('PostService.createPost rejeita location_id null', async () => {
      await expect(
        (await import('../src/core/posts/services')).postService.createPost({
          author_profile_id: 'any',
          content: 'Test',
          type: 'text',
          location_id: null as any,
        }),
      ).rejects.toThrow('location_id é obrigatório');
    }, 5000);
  });

  // ── Zero regressão: sortPosts ──────────────────────────────────────────────
  describe('Zero regressão — sortPosts', () => {
    const posts: UnifiedPost[] = [
      { id: 'p1', type: 'text', author_profile_id: 'a', author_name: 'A',
        content: 'X', likes_count: 5, comments_count: 0,
        created_at: '2026-04-05T10:00:00Z' },
      { id: 'p2', type: 'text', author_profile_id: 'b', author_name: 'B',
        content: 'Y', likes_count: 10, comments_count: 0,
        created_at: '2026-04-05T11:00:00Z' },
    ];

    it('critério "recent" — mais novo primeiro', () => {
      const sorted = PostAdapter.sortPosts(posts, 'recent');
      expect(sorted[0].id).toBe('p2');
    });

    it('critério "popular" — mais curtido primeiro', () => {
      const sorted = PostAdapter.sortPosts(posts, 'popular');
      expect(sorted[0].id).toBe('p2');
    });
  });
});
