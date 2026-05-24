import React from "react";
import { Helmet } from "react-helmet-async";
import { buildPublicAbsoluteUrl, getPublicAppOrigin } from "@/shared/config/publicAppOrigin";

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
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  priceRange?: string;
  openingHours?: Record<string, { open: string; close: string } | { closed: true }>;
  paymentMethods?: string[];
  schemaType?: "LocalBusiness" | "Restaurant";
  robots?: string;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function slugToLabel(value?: string): string | undefined {
  if (!value) return undefined;
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseBusinessTerritoryFromUrl(url: string): { state?: string; city?: string } {
  try {
    const parsed = new URL(url, getPublicAppOrigin() || "http://localhost");
    const parts = parsed.pathname.split("/").filter(Boolean);
    const moduleIndex = parts.indexOf("empresas");
    if (moduleIndex === -1) return {};

    return {
      state: parts[moduleIndex + 1],
      city: parts[moduleIndex + 2],
    };
  } catch {
    return {};
  }
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
  city,
  state,
  country = "BR",
  latitude,
  longitude,
  priceRange,
  openingHours,
  paymentMethods,
  schemaType = "LocalBusiness",
  robots = "index, follow, max-image-preview:large",
}: BusinessSEOProps) {
  const absoluteUrl = isAbsoluteUrl(url) ? url : buildPublicAbsoluteUrl(url);
  const parsedTerritory = parseBusinessTerritoryFromUrl(absoluteUrl);
  const seoState = (state || parsedTerritory.state || "").toUpperCase() || undefined;
  const seoCity = slugToLabel(city || parsedTerritory.city);
  const companiesListingPath =
    parsedTerritory.state && parsedTerritory.city
      ? `/empresas/${parsedTerritory.state}/${parsedTerritory.city}`
      : "/empresas";

  const title = `${name} | Achegue-se`;
  const fullDescription = description || `Conheca ${name} - ${category || "Empresa local"}`;
  const imageUrl = image
    ? isAbsoluteUrl(image)
      ? image
      : buildPublicAbsoluteUrl(image)
    : "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=1200";

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
      if (typeof schedule !== "object" || schedule === null) return;
      if ("closed" in schedule && schedule.closed) return;
      if ("open" in schedule && "close" in schedule) {
        hours.push(`${dayMap[day]} ${schedule.open}-${schedule.close}`);
      }
    });

    return hours.length > 0 ? hours : undefined;
  };

  const businessSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name,
    description: fullDescription,
    image: imageUrl,
    url: absoluteUrl,
    ...(category && { "@id": absoluteUrl, category }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        ...(seoCity ? { addressLocality: seoCity } : {}),
        ...(seoState ? { addressRegion: seoState } : {}),
        addressCountry: country,
      },
    }),
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(website && { sameAs: [website] }),
    ...(latitude && longitude && {
      geo: {
        "@type": "GeoCoordinates",
        latitude,
        longitude,
      },
    }),
    ...(priceRange && { priceRange }),
    ...(formatOpeningHours() && { openingHours: formatOpeningHours() }),
    ...(paymentMethods && paymentMethods.length > 0 && {
      paymentAccepted: paymentMethods.join(", "),
    }),
    ...(rating &&
      reviewCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: rating,
          reviewCount,
          bestRating: 5,
          worstRating: 1,
        },
      }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: buildPublicAbsoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Empresas",
        item: buildPublicAbsoluteUrl(companiesListingPath),
      },
      {
        "@type": "ListItem",
        position: 3,
        name,
        item: absoluteUrl,
      },
    ],
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={fullDescription} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content="index, follow" />

      <meta property="og:type" content="business.business" />
      <meta property="og:url" content={absoluteUrl} />
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

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={absoluteUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={`Foto de ${name}`} />

      <meta property="og:image:type" content="image/jpeg" />
      <link rel="canonical" href={absoluteUrl} />

      <script type="application/ld+json">{JSON.stringify(businessSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
    </Helmet>
  );
}
