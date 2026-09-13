import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('post draft timestamp boundary', () => {
  const draftSource = readProjectFile(
    'src/core/community-feed/drafts/postDraft.ts',
  );
  const modalSource = readProjectFile(
    'src/core/community-feed/components/CreatePostModal.tsx',
  );

  it('exposes only updatedAt in the public snapshot contract', () => {
    const publicSnapshot = draftSource.slice(
      draftSource.indexOf('export interface PostDraftSnapshot'),
      draftSource.indexOf('export type PostDraftPayload'),
    );

    expect(publicSnapshot).toContain('updatedAt: number;');
    expect(publicSnapshot).not.toContain('savedAt');
    expect(draftSource).toContain('type PersistedPostDraftSnapshot');
    expect(draftSource).toContain('savedAt?: number;');
  });

  it('keeps savedAt isolated from the composer runtime', () => {
    expect(modalSource).not.toContain('.savedAt');
    expect(modalSource).toContain('setLastSavedAt(draft.updatedAt)');
    expect(modalSource).toContain('setLastSavedAt(candidate.updatedAt)');
  });

  it('migrates legacy storage into updatedAt before returning it', () => {
    expect(draftSource).toContain('typeof parsed.savedAt === "number"');
    expect(draftSource).toContain('await persistEncrypted(profileId, canonical)');
    expect(draftSource).toContain('const serialized = JSON.stringify(snapshot)');
  });
});
