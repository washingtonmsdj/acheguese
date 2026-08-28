import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (path: string): string =>
  readFileSync(resolve(root, path), 'utf8');

const migration = read(
  'supabase/migrations/20260714122000_consolidate_business_favorites_owner.sql',
);
const legacyRemoval = read(
  'supabase/migrations/20260714123000_drop_empty_legacy_business_favorites.sql',
);
const store = read(
  'src/core/favorites/services/BusinessFavoriteStore.ts',
);
const businessAdapter = read(
  'src/core/business/services/BusinessFavoriteService.ts',
);
const gastronomyAdapter = read(
  'src/core/business/services/gastronomy.favorites.queries.ts',
);

describe('Business Favorites Core ownership', () => {
  it('derives identity inside bounded canonical commands', () => {
    expect(migration).toContain('current_user_id UUID := auth.uid()');
    expect(migration).not.toMatch(/CREATE OR REPLACE FUNCTION public\.[^(]+\([^)]*p_user_id/);
    expect(migration).toContain('p_limit NOT BETWEEN 1 AND 100');
    expect(migration).toContain('p_offset NOT BETWEEN 0 AND 10000');
    expect(migration).toContain("SET search_path = ''");
  });

  it('uses an idempotent serialized set command instead of a toggle', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain('ON CONFLICT ON CONSTRAINT unique_user_favorite DO NOTHING');
    expect(migration).toContain('RETURN p_favorited');
    expect(migration).toContain(
      'DROP FUNCTION IF EXISTS public.toggle_business_favorite(UUID, UUID)',
    );
    expect(store).toContain("'set_current_user_business_favorite'");
    expect(store).not.toContain('toggle_business_favorite');
  });

  it('uses a bounded batch read for visible business cards', () => {
    const batchMigration = read(
      'supabase/migrations/20260714124000_add_bounded_business_favorite_batch_read.sql',
    );
    expect(batchMigration).toContain('cardinality(p_business_ids) NOT BETWEEN 1 AND 100');
    expect(batchMigration).toContain('favorite.business_id = ANY(normalized_business_ids)');
    expect(batchMigration).toContain("SET search_path = ''");
  });

  it('blocks browser table access and audits only changed-field names', () => {
    expect(migration).toContain(
      'REVOKE SELECT, INSERT, UPDATE, DELETE ON public.user_favorite_businesses',
    );
    expect(migration).toContain('private.business_favorites_audit_log');
    expect(migration).toContain("changed := array_append(changed, 'notes')");
    expect(migration).toContain("changed := array_append(changed, 'tags')");
    expect(migration).not.toMatch(/old_(notes|tags)|new_(notes|tags)/);
  });

  it('keeps storage calls in core/favorites only', () => {
    expect(store).toContain(
      "Database['public']['Tables']['user_favorite_businesses']['Row']",
    );
    expect(businessAdapter).not.toContain("from('user_favorite_businesses')");
    expect(businessAdapter).not.toContain('.rpc(');
    expect(gastronomyAdapter).not.toContain("from('user_favorite_businesses')");
    expect(gastronomyAdapter).not.toContain('.rpc(');
    expect(gastronomyAdapter).toContain('BusinessFavoriteService');
  });

  it('removes legacy identity-bearing RPCs from generated schema', () => {
    const generated = read('src/integrations/supabase/types.generated.ts');
    expect(generated).not.toContain('toggle_business_favorite:');
    expect(generated).not.toContain('is_business_favorited:');
    expect(generated).not.toContain('get_user_favorite_businesses:');
    expect(generated).toContain('set_current_user_business_favorite:');
    expect(generated).toContain('patch_current_user_business_favorite:');
  });

  it('drops the empty legacy table without cascade or silent data loss', () => {
    expect(legacyRemoval).toContain('legacy_row_count <> 0');
    expect(legacyRemoval).toContain('DROP TABLE public.business_favorites');
    expect(legacyRemoval).toContain(
      'DROP FUNCTION IF EXISTS public.get_business_favorites_count(UUID)',
    );
    expect(legacyRemoval).not.toContain('CASCADE');
  });

  it('keeps a rollback proof for idempotency, isolation and non-clobbering patches', () => {
    const probe = read('tests/security/business-favorites-remote-probe.sql');
    expect(probe).toContain('business_favorite_idempotent_create_failed');
    expect(probe).toContain('business_favorite_partial_patch_clobbered_fields');
    expect(probe).toContain('direct_business_favorite_read_was_not_blocked');
    expect(probe).toContain('direct_business_favorite_write_was_not_blocked');
    expect(probe).toContain('ROLLBACK;');
  });
});
