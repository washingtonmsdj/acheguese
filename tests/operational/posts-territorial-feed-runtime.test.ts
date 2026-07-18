import { expect, it } from 'vitest';

import { postService } from '../../src/core/posts/services';
import { createOperationalAnonClient, describeOperational } from '../helpers/operational-env';

const CITY_ID = '00000000-0000-0000-0000-000000000001';
const DISTRICT_ID = '00000000-0000-0000-0000-000000000002';
const UNKNOWN_LOCATION_ID = '00000000-0000-0000-0000-999999999999';

describeOperational('Posts territorial feed runtime', {
  requireAnonKey: true,
}, () => {
  it.each([CITY_ID, DISTRICT_ID])('returns a bounded feed for territory %s', async (locationId) => {
    const result = await postService.getFeed({ location_id: locationId, limit: 20 });

    expect(Array.isArray(result.posts)).toBe(true);
    expect(typeof result.hasMore).toBe('boolean');
    expect(result.posts.length).toBeLessThanOrEqual(20);
    for (const post of result.posts) {
      expect(post.location_id).toBeTruthy();
      expect(post.location).toBeTruthy();
    }
  });

  it('returns an empty page for an unknown territory', async () => {
    const result = await postService.getFeed({ location_id: UNKNOWN_LOCATION_ID, limit: 20 });

    expect(result.posts).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it('rejects a legacy territorial group at the database boundary', async () => {
    const client = createOperationalAnonClient();
    const { error } = await client.from('locations').insert({
      id: UNKNOWN_LOCATION_ID,
      name: 'Operational invalid group fixture',
      full_name: 'Operational invalid group fixture',
      slug: 'operational-invalid-group-fixture',
      geographic_path: '/br/ba/salvador/operational-invalid-group-fixture',
      parent_id: CITY_ID,
      type: 'group',
      status: 'active',
    });

    expect(error).toBeTruthy();
    expect(error?.message).toMatch(/locations_type_check|invalid input value.*group|row-level security/i);
  });
});
