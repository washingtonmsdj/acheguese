/**
 * JSON-LD Structured Data Generators
 * 
 * Generates schema.org structured data for better SEO.
 * 
 * Supported schemas:
 * - Organization
 * - LocalBusiness
 * - Restaurant
 * - Product
 * - Article
 * - BreadcrumbList
 * - WebSite
 * - SearchAction
 * 
 * @module JSONLDGenerators
 * @version 1.0.0
 */

import { buildPublicAssetUrl, getPublicSiteOrigin, PLATFORM_BRAND } from '@/shared/config/brand';

/**
 * Organization Schema
 *
 * Represents the platform organization.
 */
export function generateOrganizationSchema() {
  const origin = getPublicSiteOrigin();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: PLATFORM_BRAND.name,
    url: origin,
    logo: buildPublicAssetUrl('/logo.png'),
    description: 'Plataforma completa para conectar pessoas e negocios locais',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-11-0000-0000',
      contactType: 'customer service',
      areaServed: 'BR',
      availableLanguage: ['pt-BR'],
    },
  };
}

/**
 * Website Schema with Search Action
 * 
 * Enables Google search box in SERPs.
 */
export function generateWebSiteSchema() {
  const origin = getPublicSiteOrigin();

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: PLATFORM_BRAND.name,
    url: origin,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Local Business Schema
 * 
 * For business listings.
 */
export interface LocalBusinessData {
  name: string;
  description: string;
  image: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  telephone?: string;
  priceRange?: string;
  openingHours?: string[];
  rating?: {
    value: number;
    count: number;
  };
  url?: string;
}

export function generateLocalBusinessSchema(data: LocalBusinessData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.description,
    image: data.image,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.street,
      addressLocality: data.address.city,
      addressRegion: data.address.state,
      postalCode: data.address.postalCode,
      addressCountry: data.address.country,
    },
  };
  
  if (data.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    };
  }
  
  if (data.telephone) {
    schema.telephone = data.telephone;
  }
  
  if (data.priceRange) {
    schema.priceRange = data.priceRange;
  }
  
  if (data.openingHours) {
    schema.openingHoursSpecification = data.openingHours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.split(' ')[0],
      opens: hours.split(' ')[1],
      closes: hours.split(' ')[2],
    }));
  }
  
  if (data.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.value,
      reviewCount: data.rating.count,
    };
  }
  
  if (data.url) {
    schema.url = data.url;
  }
  
  return schema;
}

/**
 * Restaurant Schema
 * 
 * For restaurant listings (extends LocalBusiness).
 */
export interface RestaurantData extends LocalBusinessData {
  servesCuisine?: string[];
  menu?: string;
  acceptsReservations?: boolean;
}

export function generateRestaurantSchema(data: RestaurantData) {
  const baseSchema = generateLocalBusinessSchema(data);
  
  const restaurantSchema = {
    ...baseSchema,
    '@type': 'Restaurant',
  };
  
  if (data.servesCuisine) {
    restaurantSchema.servesCuisine = data.servesCuisine;
  }
  
  if (data.menu) {
    restaurantSchema.menu = data.menu;
  }
  
  if (data.acceptsReservations !== undefined) {
    restaurantSchema.acceptsReservations = data.acceptsReservations;
  }
  
  return restaurantSchema;
}

/**
 * Product Schema
 * 
 * For product listings.
 */
export interface ProductData {
  name: string;
  description: string;
  image: string;
  brand?: string;
  sku?: string;
  price: number;
  priceCurrency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: {
    value: number;
    count: number;
  };
  url?: string;
}

export function generateProductSchema(data: ProductData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    image: data.image,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.priceCurrency,
      availability: `https://schema.org/${data.availability}`,
    },
  };
  
  if (data.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: data.brand,
    };
  }
  
  if (data.sku) {
    schema.sku = data.sku;
  }
  
  if (data.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.value,
      reviewCount: data.rating.count,
    };
  }
  
  if (data.url) {
    schema.url = data.url;
  }
  
  return schema;
}

/**
 * Article Schema
 * 
 * For blog posts and articles.
 */
export interface ArticleData {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo: string;
  };
  url?: string;
}

export function generateArticleSchema(data: ArticleData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    image: data.image,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      '@type': 'Person',
      name: data.author.name,
      url: data.author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: data.publisher.logo,
      },
    },
    url: data.url,
  };
}

/**
 * Breadcrumb Schema
 * 
 * For navigation breadcrumbs.
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQ Schema
 * 
 * For FAQ pages.
 */
export interface FAQItem {
  question: string;
  answer: string;
}

export function generateFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Event Schema
 * 
 * For event listings.
 */
export interface EventData {
  name: string;
  description: string;
  image: string;
  startDate: string;
  endDate?: string;
  location: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  organizer?: {
    name: string;
    url?: string;
  };
  offers?: {
    price: number;
    priceCurrency: string;
    availability: 'InStock' | 'SoldOut';
    url?: string;
  };
  url?: string;
}

export function generateEventSchema(data: EventData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: data.name,
    description: data.description,
    image: data.image,
    startDate: data.startDate,
    location: {
      '@type': 'Place',
      name: data.location.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: data.location.address.street,
        addressLocality: data.location.address.city,
        addressRegion: data.location.address.state,
        postalCode: data.location.address.postalCode,
        addressCountry: data.location.address.country,
      },
    },
  };
  
  if (data.endDate) {
    schema.endDate = data.endDate;
  }
  
  if (data.organizer) {
    schema.organizer = {
      '@type': 'Organization',
      name: data.organizer.name,
      url: data.organizer.url,
    };
  }
  
  if (data.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: data.offers.price,
      priceCurrency: data.offers.priceCurrency,
      availability: `https://schema.org/${data.offers.availability}`,
      url: data.offers.url,
    };
  }
  
  if (data.url) {
    schema.url = data.url;
  }
  
  return schema;
}
