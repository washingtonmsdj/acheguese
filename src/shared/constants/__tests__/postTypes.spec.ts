import { describe, expect, it } from 'vitest';

import { POST_CONTENT_PREFIXES, getPostContentPrefix } from '../postTypes';

describe('postTypes', () => {
  it('detects configured content prefixes without dynamic regular expressions', () => {
    expect(getPostContentPrefix(`${POST_CONTENT_PREFIXES.ENQUETE}: escolha uma opcao`)).toBe(
      POST_CONTENT_PREFIXES.ENQUETE,
    );
    expect(getPostContentPrefix(`  ${POST_CONTENT_PREFIXES.PET_PERDIDO}: cachorro visto`)).toBe(
      POST_CONTENT_PREFIXES.PET_PERDIDO,
    );
  });

  it('returns null when the content has no registered prefix', () => {
    expect(getPostContentPrefix('Discussao livre sem marcador')).toBeNull();
  });
});
