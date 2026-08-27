/**
 * Compatibility bridge.
 *
 * Canonical owner: tools/supabase/validate-supabase-advisor-residuals.ts
 */

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../tools/supabase/validate-supabase-advisor-residuals';

export * from '../tools/supabase/validate-supabase-advisor-residuals';

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
) {
  main();
}
