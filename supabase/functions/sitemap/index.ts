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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  { loc: '/profissionais', changefreq: 'daily', priority: 0.8 },
  { loc: '/sobre', changefreq: 'monthly', priority: 0.5 },
  { loc: '/contato', changefreq: 'monthly', priority: 0.5 },
  { loc: '/privacidade', changefreq: 'monthly', priority: 0.3 },
  { loc: '/termos', changefreq: 'monthly', priority: 0.3 },
  { loc: '/cookies', changefreq: 'monthly', priority: 0.3 },
];

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get base URL from request
    const url = new URL(req.url);
    const baseUrl = Deno.env.get('BASE_URL') || 'https://ordax.com.br';
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Collect all URLs
    const urls: SitemapURL[] = [...STATIC_PAGES];
    
    // Fetch businesses (public only)
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('slug, updated_at')
        .eq('status', 'active')
        .not('slug', 'is', null)
        .limit(1000);
      
      if (businesses) {
        businesses.forEach((business) => {
          urls.push({
            loc: `/negocios/${business.slug}`,
            lastmod: business.updated_at,
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
      const { data: events } = await supabase
        .from('events')
        .select('id, updated_at')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .limit(1000);
      
      if (events) {
        events.forEach((event) => {
          urls.push({
            loc: `/eventos/${event.id}`,
            lastmod: event.updated_at,
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
        .select('id, updated_at')
        .eq('status', 'active')
        .limit(1000);
      
      if (classifieds) {
        classifieds.forEach((classified) => {
          urls.push({
            loc: `/classificados/${classified.id}`,
            lastmod: classified.updated_at,
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
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1 hour
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
