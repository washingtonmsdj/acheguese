/**
 * Public compatibility endpoint for the canonical production sitemap.
 *
 * The canonical sitemap is generated and validated by the web release pipeline
 * at BASE_URL/sitemap.xml. This Edge Function intentionally owns no product
 * inventory and performs no domain/database reads, preventing a second launch
 * scope from drifting away from productModuleRegistry.
 */

import {
  getAllSecurityHeaders,
  getRequiredEnv,
  rateLimitMiddleware,
  requireHttpMethod,
} from '../_shared/security.ts';
import { trimTrailingSlashes } from '../_shared/url_validation.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: getAllSecurityHeaders('GET, OPTIONS', req),
    });
  }

  const methodError = requireHttpMethod(req, ['GET'], 'GET, OPTIONS');
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const baseUrl = trimTrailingSlashes(getRequiredEnv('BASE_URL'));
  const canonicalSitemapUrl = new URL('/sitemap.xml', `${baseUrl}/`).toString();

  return new Response(null, {
    status: 308,
    headers: {
      ...getAllSecurityHeaders('GET, OPTIONS', req),
      Location: canonicalSitemapUrl,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
});
