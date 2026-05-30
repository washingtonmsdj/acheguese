import { describe, expect, it } from 'vitest';

import { feedCache } from '../feedCache';

describe('feedCache', () => {
  it('invalidates keys by deterministic key fragment instead of regular expressions', () => {
    feedCache.invalidate();
    feedCache.set('post:abc.123', 'post-data');
    feedCache.set('feed:latest', 'feed-data');

    feedCache.invalidatePost('abc.123');

    expect(feedCache.get('post:abc.123')).toBeNull();
    expect(feedCache.get('feed:latest')).toBeNull();
  });

  it('does not treat invalidation fragments as regex syntax', () => {
    feedCache.invalidate();
    feedCache.set('post:a+b', 'literal');
    feedCache.set('post:aaab', 'other');

    feedCache.invalidatePost('a+b');

    expect(feedCache.get('post:a+b')).toBeNull();
    expect(feedCache.get('post:aaab')).toBe('other');
  });
});
