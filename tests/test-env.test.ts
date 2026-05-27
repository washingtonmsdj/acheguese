import { describe, it, expect } from 'vitest';

describe('Test Environment Variables', () => {
  it('should have VITE_SUPABASE_URL', () => {
    console.log('process.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
    console.log('import.meta.env.VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    expect(process.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL).toBeDefined();
  });

  it('should not expose SUPABASE_SERVICE_ROLE_KEY to the frontend bundle', () => {
    console.log('process.env.SUPABASE_SERVICE_ROLE_KEY defined:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('import.meta.env.SUPABASE_SERVICE_ROLE_KEY:', import.meta.env.SUPABASE_SERVICE_ROLE_KEY);
    expect(import.meta.env.SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });
});
