/**
 * Generate Static Sitemap
 * 
 * Generates sitemap.xml for static pages.
 * Dynamic pages are served via edge function.
 * 
 * Usage:
 *   tsx scripts/generate-sitemap.ts
 * 
 * @version 1.0.0
 */

import { writeFileSync } from 'fs';
import { join } from 'path';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const BASE_URL = 'https://ordax.com.br';

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
  const now = new Date().toISOString().split('T')[0];
  
  const urlEntries = urls.map((url) => {
    const loc = `${baseUrl}${url.loc}`;
    const lastmod = url.lastmod || now;
    const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : '';
    const priority = url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : '';
    
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>${changefreq}${priority}
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

async function main() {
  console.log('🗺️  Generating sitemap.xml...\n');
  
  // Generate sitemap
  const sitemap = generateSitemapXML(STATIC_PAGES, BASE_URL);
  
  // Write to public directory
  const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemap, 'utf-8');
  
  console.log(`✅ Sitemap generated successfully!`);
  console.log(`📍 Location: ${outputPath}`);
  console.log(`📊 URLs: ${STATIC_PAGES.length} static pages`);
  console.log(`\n💡 Note: Dynamic URLs (businesses, events, classifieds) are served via edge function`);
  console.log(`   Deploy: npx supabase functions deploy sitemap\n`);
}

main().catch((error) => {
  console.error('❌ Failed to generate sitemap:', error);
  process.exit(1);
});
