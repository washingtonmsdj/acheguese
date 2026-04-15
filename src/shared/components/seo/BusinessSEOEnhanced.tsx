 
import React from "react";

/**
 * Componente SEO aprimorado para páginas de business
 * Inclui canonical URL, breadcrumbs, e structured data
 */

import { Helmet } from "react-helmet-async";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";
import type { Business } from "@/shared/types/business";

interface BusinessSEOEnhancedProps {
  business: Business;
}

export default function BusinessSEOEnhanced({
  business,
}: BusinessSEOEnhancedProps) {
  // Gerar URL canônica apenas se houver dados territoriais reais
  const canonicalUrl = (business.slug && business.uf && business.city)
    ? `${window.location.origin}${BusinessUrlService.getCanonicalUrl({
        slug: business.slug,
        uf: business.uf,
        city: business.city,
      })}`
    : null; // Não gerar canonical se faltarem dados
  
  const imageUrl = business.banner_url || business.logo_url || "";

  // Structured Data - Local Business
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    image: imageUrl,
    url: canonicalUrl || window.location.href, // Usar URL atual se não houver canonical
    telephone: business.phone,
    address: business.address
      ? {
          "@type": "PostalAddress",
          streetAddress: business.address,
          addressLocality: business.city,
          addressRegion: business.neighborhood,
          addressCountry: "BR",
        }
      : undefined,
    geo:
      business.latitude && business.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: business.latitude,
            longitude: business.longitude,
          }
        : undefined,
    aggregateRating:
      business.rating && business.total_reviews
        ? {
            "@type": "AggregateRating",
            ratingValue: business.rating,
            reviewCount: business.total_reviews,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    openingHours: business.schedule,
  };

  // Breadcrumb Structured Data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: window.location.origin,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Empresas",
        item: `${window.location.origin}/businesss`,
      },
      business.subcategoria && !business.is_premium
        ? {
            "@type": "ListItem",
            position: 3,
            name:
              business.subcategoria.charAt(0).toUpperCase() +
              business.subcategoria.slice(1),
            item: `${window.location.origin}/${business.subcategoria}`,
          }
        : null,
      business.neighborhood && !business.is_premium
        ? {
            "@type": "ListItem",
            position: 4,
            name: business.neighborhood,
            item: `${window.location.origin}/${business.subcategoria}/${business.neighborhood}`,
          }
        : null,
      {
        "@type": "ListItem",
        position: business.is_premium ? 3 : 5,
        name: business.name,
        item: canonicalUrl || window.location.href, // Usar URL atual se não houver canonical
      },
    ].filter(Boolean),
  };

  // Meta title e description otimizados
  const metaTitle = business.is_premium
    ? `${business.name} | Melhor ${business.category}`
    : `${business.name} em ${business.neighborhood} | ${business.category}`;

  const metaDescription =
    business.description.length > 155
      ? `${business.description.substring(0, 152)}...`
      : business.description;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{metaTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content="business.business" />
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl || window.location.href} />
      {imageUrl && <meta property="og:image" content={imageUrl} />}
      <meta property="og:webwebsite_name" content="Meu Site" />
      <meta property="og:locale" content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={metaTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {imageUrl && <meta name="twitter:image" content={imageUrl} />}

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />

      {/* Geo Tags */}
      {business.neighborhood && (
        <>
          <meta name="geo.region" content="BR-BA" />
          <meta name="geo.placename" content={business.neighborhood} />
          {business.latitude && business.longitude && (
            <meta
              name="geo.position"
              content={`${business.latitude};${business.longitude}`}
            />
          )}
        </>
      )}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbData)}
      </script>
    </Helmet>
  );
}
