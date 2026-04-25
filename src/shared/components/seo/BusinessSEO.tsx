import React from "react";
import { Helmet } from "react-helmet-async";

interface BusinessSEOProps {
  name: string;
  description: string;
  image?: string;
  url: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  priceRange?: string;
  openingHours?: Record<string, { open: string; close: string } | { closed: true }>;
  paymentMethods?: string[];
  schemaType?: "LocalBusiness" | "Restaurant";
  robots?: string;
}

export default function BusinessSEO({
  name,
  description,
  image,
  url,
  category,
  rating,
  reviewCount,
  address,
  phone,
  email,
  website,
  latitude,
  longitude,
  priceRange,
  openingHours,
  paymentMethods,
  schemaType = "LocalBusiness",
  robots = "index, follow, max-image-preview:large",
}: BusinessSEOProps) {
  const title = `${name} | Achegue-se`;
  const fullDescription =
    description || `Conheça ${name} - ${category || "Empresa local"}`;
  const imageUrl =
    image || "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1200";

  // Converter horário de funcionamento para formato Schema.org
  const formatOpeningHours = () => {
    if (!openingHours) return undefined;
    
    const dayMap: Record<string, string> = {
      segunda: "Monday",
      terca: "Tuesday",
      quarta: "Wednesday",
      quinta: "Thursday",
      sexta: "Friday",
      sabado: "Saturday",
      domingo: "Sunday",
    };

    const hours: string[] = [];
    Object.entries(openingHours).forEach(([day, schedule]) => {
      // Validar se schedule é um objeto antes de usar 'in'
      if (typeof schedule !== 'object' || schedule === null) {
        // Se for string ou outro tipo, ignorar
        return;
      }
      
      if ('closed' in schedule && schedule.closed) return;
      if ('open' in schedule && 'close' in schedule) {
        hours.push(`${dayMap[day]} ${schedule.open}-${schedule.close}`);
      }
    });

    return hours.length > 0 ? hours : undefined;
  };

  // Schema.org LocalBusiness/Restaurant
  const businessSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: name,
    description: fullDescription,
    image: imageUrl,
    url: url,
    ...(category && { "@id": url, category: category }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        addressLocality: "Salvador",
        addressRegion: "BA",
        addressCountry: "BR",
      },
    }),
    ...(phone && { telephone: phone }),
    ...(email && { email: email }),
    ...(website && { sameAs: [website] }),
    ...(latitude && longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: latitude,
        longitude: longitude,
      },
    }),
    ...(priceRange && { priceRange: priceRange }),
    ...(formatOpeningHours() && { openingHours: formatOpeningHours() }),
    ...(paymentMethods && paymentMethods.length > 0 && {
      paymentAccepted: paymentMethods.join(", "),
    }),
    ...(rating &&
      reviewCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating,
          reviewCount: reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: "https://acheguese.com.br",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Empresas",
        item: "https://acheguese.com.br/empresas/ba/salvador",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: name,
        item: url,
      },
    ],
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={fullDescription} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content="index, follow" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="business.business" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={`Foto de ${name}`} />
      <meta property="og:site_name" content="Achegue-se" />
      <meta property="og:locale" content="pt_BR" />
      {phone && <meta property="business:contact_data:phone_number" content={phone} />}
      {address && <meta property="business:contact_data:street_address" content={address} />}
      {latitude && <meta property="place:location:latitude" content={latitude.toString()} />}
      {longitude && <meta property="place:location:longitude" content={longitude.toString()} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`Foto de ${name}`} />

      {/* WhatsApp */}
      <meta property="og:image:type" content="image/jpeg" />

      {/* Additional SEO */}
      <link rel="canonical" href={url} />

      {/* Schema.org Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(businessSchema)}
      </script>
      
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}
