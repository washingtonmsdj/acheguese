import { config } from 'dotenv';

function extractProjectRefFromUrl(url) {
  const match = /^https:\/\/([a-z0-9-]+)\.supabase\.co$/i.exec((url || '').trim());
  return match ? match[1] : null;
}

export function loadSupabaseEnvStrict(options = {}) {
  const {
    expectedProjectRef = 'xhdowzacfujckjelqhtd',
    requireServiceKey = false,
  } = options;

  // SSOT: local project env first. Do not allow implicit fallback to legacy .env values.
  config({ path: '.env.local' });

  const url = process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectId = process.env.VITE_SUPABASE_PROJECT_ID;
  const urlProjectRef = extractProjectRefFromUrl(url);

  if (!url || !publishableKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env.local');
  }
  if (!urlProjectRef) {
    throw new Error(`Invalid VITE_SUPABASE_URL format: ${url}`);
  }
  if (projectId && projectId !== urlProjectRef) {
    throw new Error(`Project ID mismatch: VITE_SUPABASE_PROJECT_ID=${projectId} but URL ref=${urlProjectRef}`);
  }
  if (urlProjectRef !== expectedProjectRef) {
    throw new Error(`Wrong Supabase project: expected ${expectedProjectRef}, got ${urlProjectRef}`);
  }
  if (requireServiceKey && !serviceKey) {
    throw new Error('Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }

  return {
    url,
    publishableKey,
    serviceKey,
    projectRef: urlProjectRef,
  };
}

