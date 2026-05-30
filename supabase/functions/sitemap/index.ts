/**
 * Sitemap Edge Function
 * 
 * Generates dynamic sitemap.xml with static and dynamic URLs.
 * 
 * Features:
 * - Static pages
 * - Dynamic business listings
 * - Dynamic events
 * - Dynamic classifieds
 * - Caching (1 hour)
 * 
 * @version 1.0.0
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import {
  errorResponse,
  getAllSecurityHeaders,
  getRequiredEnv,
  rateLimitMiddleware,
  requireHttpMethod,
} from '../_shared/security.ts';
import {
  isSafePublicId,
  isSafePublicUrlSegment,
  trimTrailingSlashes,
} from '../_shared/url_validation.ts';

// Sitemap é um recurso público consumido por crawlers (sem credenciais).
// Usamos getAllSecurityHeaders() do SSOT, que já configura CORS corretamente
// a partir de ALLOWED_ORIGINS. Crawlers não enviam Origin, portanto não são
// afetados pela política de CORS — apenas requisições cross-origin de browsers.

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const STATIC_PAGES: SitemapURL[] = [
  { loc: '/', changefreq: 'daily', priority: 1.0 },
  { loc: '/gastronomia', changefreq: 'daily', priority: 0.9 },
  { loc: '/mobilidade', changefreq: 'hourly', priority: 0.9 },
  { loc: '/classificados', changefreq: 'hourly', priority: 0.8 },
  { loc: '/eventos', changefreq: 'daily', priority: 0.8 },
  { loc: '/comunidade', changefreq: 'hourly', priority: 0.8 },
  { loc: '/servicos', changefreq: 'daily', priority: 0.8 },
  { loc: '/sobre', changefreq: 'monthly', priority: 0.5 },
  { loc: '/contato', changefreq: 'monthly', priority: 0.5 },
  { loc: '/privacidade', changefreq: 'monthly', priority: 0.3 },
  { loc: '/termos', changefreq: 'monthly', priority: 0.3 },
  { loc: '/cookies', changefreq: 'monthly', priority: 0.3 },
];

type LocationRelation = { geographic_path?: string | null } | null;

interface BusinessSitemapRow {
  profile_id: string;
  slug: string | null;
  updated_at: string | null;
  location: LocationRelation;
}

interface EventSitemapRow {
  id: string;
  updated_at: string | null;
  location: LocationRelation;
}

interface ClassifiedSitemapRow {
  id: string;
  public_id: string | null;
  slug: string | null;
  updated_at: string | null;
  locations: LocationRelation;
  classified_categories: { slug?: string | null } | null;
  classified_subcategories: { slug?: string | null } | null;
}

function cleanUrlSegment(value: string | null | undefined): string | null {
  const segment = String(value ?? '').trim().toLowerCase();
  return isSafePublicUrlSegment(segment) ? segment : null;
}

function cleanPublicId(value: string | null | undefined): string | null {
  const publicId = String(value ?? '').trim();
  return isSafePublicId(publicId) ? publicId : null;
}

function getTerritoryParts(geographicPath: string | null | undefined): {
  state: string;
  city: string;
  district?: string;
} | null {
  const parts = String(geographicPath ?? '').split('/').filter(Boolean);
  const territoryParts = parts[0] === 'br' ? parts.slice(1) : parts;
  const [rawState, rawCity, rawDistrict] = territoryParts;
  const state = cleanUrlSegment(rawState);
  const city = cleanUrlSegment(rawCity);
  const district = cleanUrlSegment(rawDistrict);

  if (!state || !city) return null;
  return district ? { state, city, district } : { state, city };
}

function buildBusinessSitemapUrl(row: BusinessSitemapRow): string | null {
  const slug = cleanUrlSegment(row.slug);
  const territory = getTerritoryParts(row.location?.geographic_path);
  if (!slug || !territory?.district) return null;

  return `/empresas/${territory.state}/${territory.city}/${territory.district}/${slug}`;
}

function buildEventSitemapUrl(row: EventSitemapRow): string {
  const territory = getTerritoryParts(row.location?.geographic_path);
  if (!territory) return `/eventos/evento/${row.id}`;

  return `/eventos/${territory.state}/${territory.city}/evento/${row.id}`;
}

function buildClassifiedSitemapUrl(row: ClassifiedSitemapRow): string | null {
  const publicId = cleanPublicId(row.public_id);
  if (!publicId) return null;

  const slug = cleanUrlSegment(row.slug);
  const category = cleanUrlSegment(row.classified_categories?.slug);
  const subcategory = cleanUrlSegment(row.classified_subcategories?.slug);
  const territory = getTerritoryParts(row.locations?.geographic_path);

  if (slug && category && subcategory && territory?.district) {
    return `/classificados/${territory.state}/${territory.city}/${territory.district}/${category}/${subcategory}/${slug}/${publicId}`;
  }

  return `/c/${publicId}`;
}

function generateSitemapXML(urls: SitemapURL[], baseUrl: string): string {
  const urlEntries = urls.map((url) => {
    const loc = `${baseUrl}${url.loc}`;
    const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : '';
    const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : '';
    const priority = url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : '';
    
    return `  <url>
    <loc>${loc}</loc>${lastmod}${changefreq}${priority}
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: getAllSecurityHeaders('GET, OPTIONS', req) });
  }

  const methodError = requireHttpMethod(req, ['GET'], 'GET, OPTIONS');
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 120, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const baseUrl = trimTrailingSlashes(getRequiredEnv('BASE_URL'));
    new URL(baseUrl);
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Collect all URLs
    const urls: SitemapURL[] = [...STATIC_PAGES];
    
    // Fetch businesses (public only)
    try {
      const { data: businesses } = await supabase
        .from('business_data')
        .select(`
          profile_id,
          slug,
          updated_at,
          location:locations!location_id(geographic_path)
        `)
        .eq('status', 'active')
        .in('business_role', ['standalone', 'branch'])
        .not('slug', 'is', null)
        .not('location_id', 'is', null)
        .limit(1000);
      
      if (businesses) {
        (businesses as BusinessSitemapRow[]).forEach((business) => {
          const loc = buildBusinessSitemapUrl(business);
          if (!loc) return;
          urls.push({
            loc,
            lastmod: business.updated_at ?? undefined,
            changefreq: 'weekly',
            priority: 0.7,
          });
        });
      }
    } catch (error) {
      console.warn('Failed to fetch businesses for sitemap:', error);
    }
    
    // Fetch events (active only)
    try {
      const nowIso = new Date().toISOString();
      const { data: events } = await supabase
        .from('events')
        .select(`
          id,
          date,
          updated_at,
          location:locations(geographic_path)
        `)
        .in('status', ['upcoming', 'ongoing'])
        .or(`end_date.gte.${nowIso},and(end_date.is.null,date.gte.${nowIso})`)
        .limit(1000);
      
      if (events) {
        (events as EventSitemapRow[]).forEach((event) => {
          urls.push({
            loc: buildEventSitemapUrl(event),
            lastmod: event.updated_at ?? undefined,
            changefreq: 'daily',
            priority: 0.6,
          });
        });
      }
    } catch (error) {
      console.warn('Failed to fetch events for sitemap:', error);
    }
    
    // Fetch classifieds (active only)
    try {
      const { data: classifieds } = await supabase
        .from('classifieds')
        .select(`
          id,
          public_id,
          slug,
          updated_at,
          locations(geographic_path),
          classified_categories(slug),
          classified_subcategories(slug)
        `)
        .eq('is_active', true)
        .not('public_id', 'is', null)
        .limit(1000);
      
      if (classifieds) {
        (classifieds as ClassifiedSitemapRow[]).forEach((classified) => {
          const loc = buildClassifiedSitemapUrl(classified);
          if (!loc) return;
          urls.push({
            loc,
            lastmod: classified.updated_at ?? undefined,
            changefreq: 'daily',
            priority: 0.6,
          });
        });
      }
    } catch (error) {
      console.warn('Failed to fetch classifieds for sitemap:', error);
    }
    
    // Generate sitemap XML
    const sitemap = generateSitemapXML(urls, baseUrl);
    
    // Return with caching headers
    return new Response(sitemap, {
      headers: {
        ...getAllSecurityHeaders('GET, OPTIONS', req),
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return errorResponse('Failed to generate sitemap', 500, error);
  }
});

