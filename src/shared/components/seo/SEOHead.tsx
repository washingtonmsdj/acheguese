/**
 * SEO Head Component
 * 
 * Manages all SEO-related meta tags, Open Graph, Twitter Cards, and JSON-LD.
 * 
 * Features:
 * - Dynamic meta tags
 * - Open Graph protocol
 * - Twitter Cards
 * - JSON-LD structured data
 * - Canonical URLs
 * - Language tags
 * 
 * @module SEOHead
 * @version 1.0.0
 */

import { Helmet } from 'react-helmet-async';

export interface SEOProps {
  // Basic meta
  title?: string;
  description?: string;
  keywords?: string[];
  
  // URLs
  canonical?: string;
  
  // Open Graph
  ogType?: 'website' | 'article' | 'profile' | 'product';
  ogImage?: string;
  ogImageAlt?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  
  // Twitter
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  
  // Article specific
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleAuthor?: string;
  articleSection?: string;
  articleTags?: string[];
  
  // Product specific
  productPrice?: number;
  productCurrency?: string;
  productAvailability?: 'in stock' | 'out of stock' | 'preorder';
  
  // JSON-LD
  jsonLd?: object;
  
  // Language
  language?: string;
  
  // Robots
  noIndex?: boolean;
  noFollow?: boolean;
}

const DEFAULT_SEO = {
  title: 'Ordax — Plataforma Completa para Sua Cidade',
  description: 'Conecte-se com negócios locais, peça delivery, encontre serviços, participe da comunidade e muito mais. Tudo em um só lugar.',
  keywords: ['ordax', 'delivery', 'gastronomia', 'mobilidade', 'comunidade', 'classificados', 'eventos', 'cidade'],
  ogType: 'website' as const,
  ogImage: '/og-image.jpg',
  ogImageAlt: 'Ordax — Plataforma Completa para Sua Cidade',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image' as const,
  twitterSite: '@ordaxbr',
  language: 'pt-BR',
};

export function SEOHead({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  canonical,
  ogType = DEFAULT_SEO.ogType,
  ogImage = DEFAULT_SEO.ogImage,
  ogImageAlt = DEFAULT_SEO.ogImageAlt,
  ogImageWidth = DEFAULT_SEO.ogImageWidth,
  ogImageHeight = DEFAULT_SEO.ogImageHeight,
  twitterCard = DEFAULT_SEO.twitterCard,
  twitterSite = DEFAULT_SEO.twitterSite,
  twitterCreator,
  articlePublishedTime,
  articleModifiedTime,
  articleAuthor,
  articleSection,
  articleTags,
  productPrice,
  productCurrency = 'BRL',
  productAvailability,
  jsonLd,
  language = DEFAULT_SEO.language,
  noIndex = false,
  noFollow = false,
}: SEOProps) {
  // Build full title
  const fullTitle = title === DEFAULT_SEO.title ? title : `${title} | Ordax`;
  
  // Build canonical URL
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');
  
  // Build robots meta
  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow',
  ].join(', ');
  
  // Build keywords string
  const keywordsString = keywords.join(', ');
  
  // Build absolute image URL
  const absoluteOgImage = ogImage.startsWith('http') 
    ? ogImage 
    : `${typeof window !== 'undefined' ? window.location.origin : ''}${ogImage}`;
  
  return (
    <Helmet>
      {/* Basic meta tags */}
      <html lang={language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      <meta name="robots" content={robotsContent} />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:image:width" content={String(ogImageWidth)} />
      <meta property="og:image:height" content={String(ogImageHeight)} />
      <meta property="og:locale" content={language} />
      <meta property="og:site_name" content="Ordax" />
      
      {/* Article specific OG tags */}
      {ogType === 'article' && (
        <>
          {articlePublishedTime && (
            <meta property="article:published_time" content={articlePublishedTime} />
          )}
          {articleModifiedTime && (
            <meta property="article:modified_time" content={articleModifiedTime} />
          )}
          {articleAuthor && (
            <meta property="article:author" content={articleAuthor} />
          )}
          {articleSection && (
            <meta property="article:section" content={articleSection} />
          )}
          {articleTags?.map((tag) => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Product specific OG tags */}
      {ogType === 'product' && (
        <>
          {productPrice !== undefined && (
            <>
              <meta property="product:price:amount" content={String(productPrice)} />
              <meta property="product:price:currency" content={productCurrency} />
            </>
          )}
          {productAvailability && (
            <meta property="product:availability" content={productAvailability} />
          )}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />
      <meta name="twitter:image:alt" content={ogImageAlt} />
      {twitterSite && <meta name="twitter:site" content={twitterSite} />}
      {twitterCreator && <meta name="twitter:creator" content={twitterCreator} />}
      
      {/* JSON-LD structured data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
