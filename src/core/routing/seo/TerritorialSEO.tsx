/**
 * TerritorialSEO
 *
 * Componente React que aplica os metadados SEO territoriais via react-helmet-async.
 * Usa buildTerritorialMetadata() como única fonte de verdade.
 *
 * Melhorias v2:
 * - Structured Data (JSON-LD) para LocalBusiness e Place
 * - Meta tags adicionais (geo, author, etc)
 * - Breadcrumb structured data
 *
 * Uso: renderizar dentro de TerritorialLayout, após o território estar resolvido.
 */

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { buildTerritorialMetadata } from './buildTerritorialMetadata';
import type { ResolvedTerritory } from '../hooks/useResolveTerritoryFromUrl';
import type { ModuleSlug } from '../utils/territoryUrls';
import { MODULE_SLUGS } from '../utils/territoryUrls';

interface TerritorialSEOProps {
  resolved: ResolvedTerritory;
  /** URL base do território, ex: /ba/salvador/complexo-... */
  baseUrl: string;
}

/**
 * Extrai o módulo atual a partir do pathname.
 * /ba/salvador/complexo.../community → 'community'
 * /ba/salvador/complexo-...          → null (landing hub)
 */
function resolveCurrentModule(pathname: string, baseUrl: string): ModuleSlug | null {
  const suffix = pathname.replace(baseUrl, '').replace(/^\//, '');
  const segment = suffix.split('/')[0];
  if (!segment) return null; // index = landing hub

  const known = Object.values(MODULE_SLUGS) as string[];
  return known.includes(segment) ? (segment as ModuleSlug) : null;
}

/**
 * Gera structured data (JSON-LD) para o território
 */
function generateStructuredData(resolved: ResolvedTerritory, canonicalUrl: string, module: ModuleSlug | null) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://achegue-se.com';
  
  // Place schema para território
  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: resolved.kind === 'location' ? resolved.location.name : resolved.group.name,
    description: resolved.kind === 'location' 
      ? `Informações, serviços e comunidade de ${resolved.location.name}`
      : `Informações, serviços e comunidade do ${resolved.group.name}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: resolved.kind === 'location' 
        ? (resolved.location.metadata?.city_name as string ?? resolved.location.name)
        : (resolved.group.members[0]?.metadata?.city_name as string ?? resolved.group.members[0]?.name),
      addressRegion: resolved.kind === 'location'
        ? (resolved.location.metadata?.state_code as string)
        : (resolved.group.members[0]?.metadata?.state_code as string),
      addressCountry: 'BR',
    },
    geo: resolved.kind === 'location' && 
      (resolved.location.metadata?.latitude as number) && 
      (resolved.location.metadata?.longitude as number) ? {
      '@type': 'GeoCoordinates',
      latitude: resolved.location.metadata.latitude as number,
      longitude: resolved.location.metadata.longitude as number,
    } : undefined,
    url: `${baseUrl}${canonicalUrl}`,
  };

  // Breadcrumb schema
  const pathParts = canonicalUrl.split('/').filter(Boolean);
  const breadcrumbItems = pathParts.map((part, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: part.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    item: `${baseUrl}/${pathParts.slice(0, index + 1).join('/')}`,
  }));

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  // WebSite schema (apenas na landing)
  const websiteSchema = !module ? {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Achegue-se',
    description: 'Plataforma hiperlocal de serviços e comunidade',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/busca?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  } : null;

  return {
    place: placeSchema,
    breadcrumb: breadcrumbSchema,
    website: websiteSchema,
  };
}

export function TerritorialSEO({ resolved, baseUrl }: TerritorialSEOProps) {
  const { pathname } = useLocation();

  if (!resolved) return null;

  const module = resolveCurrentModule(pathname, baseUrl);
  const canonicalPath = pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;

  const meta = resolved.kind === 'location'
    ? buildTerritorialMetadata({
        kind: 'location',
        location: resolved.location,
        module,
        canonicalPath,
      })
    : buildTerritorialMetadata({
        kind: 'group',
        group: resolved.group,
        module,
        canonicalPath,
      });

  const structuredData = generateStructuredData(resolved, canonicalPath, module);

  // Geo tags para localização
  const geoTags = resolved.kind === 'location' && 
    (resolved.location.metadata?.latitude as number) && 
    (resolved.location.metadata?.longitude as number) ? {
    latitude: resolved.location.metadata.latitude as number,
    longitude: resolved.location.metadata.longitude as number,
    placename: resolved.location.name,
    region: resolved.location.geographic_path,
  } : null;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={meta.canonical} />
      <meta name="author" content="Achegue-se" />
      <meta name="generator" content="Achegue-se Platform" />

      {/* Geo Tags */}
      {geoTags && (
        <>
          <meta name="geo.position" content={`${geoTags.latitude};${geoTags.longitude}`} />
          <meta name="geo.placename" content={geoTags.placename} />
          <meta name="geo.region" content={geoTags.region} />
          <meta name="ICBM" content={`${geoTags.latitude}, ${geoTags.longitude}`} />
        </>
      )}

      {/* Open Graph */}
      <meta property="og:type"        content={meta.og.type} />
      <meta property="og:title"       content={meta.og.title} />
      <meta property="og:description" content={meta.og.description} />
      <meta property="og:url"         content={meta.og.url} />
      <meta property="og:image"       content={meta.og.image} />
      <meta property="og:site_name"   content={meta.og.siteName} />
      <meta property="og:locale"      content={meta.og.locale} />

      {/* Twitter Card */}
      <meta name="twitter:card"        content={meta.twitter.card} />
      <meta name="twitter:title"       content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
      <meta name="twitter:image"       content={meta.twitter.image} />

      {/* Robots: rotas territoriais são indexáveis */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData.place)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(structuredData.breadcrumb)}
      </script>
      {structuredData.website && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData.website)}
        </script>
      )}
    </Helmet>
  );
}
