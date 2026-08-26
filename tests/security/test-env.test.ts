import { describe, it, expect } from 'vitest';

describe('Test Environment Variables', () => {
  it('should have VITE_SUPABASE_URL', () => {
    expect(process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL).toBeDefined();
  });

  it('should not expose SUPABASE_SERVICE_ROLE_KEY to the frontend bundle', () => {
    expect(import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
    expect(import.meta.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });
});
