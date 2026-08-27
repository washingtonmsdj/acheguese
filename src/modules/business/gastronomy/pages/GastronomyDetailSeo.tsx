import { Helmet } from "react-helmet-async";

import type { PublicGastronomySnapshot } from "@/core/business/types/publicSnapshots";

type GastronomyDetailSeoProps = {
  snapshot: PublicGastronomySnapshot | undefined;
  business: PublicGastronomySnapshot["gastronomy"]["business"];
  profile: PublicGastronomySnapshot["gastronomy"]["profile"];
  menu: PublicGastronomySnapshot["gastronomy"]["menu"];
  communityScoped?: boolean;
  canonicalPathOverride?: string;
  gastronomyCanonicalUrl: string | null;
  gastronomyHomeUrl: string;
};

export function GastronomyDetailSeo({
  snapshot,
  business,
  profile,
  menu,
  communityScoped = false,
  canonicalPathOverride,
  gastronomyCanonicalUrl,
  gastronomyHomeUrl,
}: GastronomyDetailSeoProps) {
  const seoTitle =
    snapshot?.seo.title ??
    `${business.name ?? "Gastronomia"} - Cardapio | Achegue-se`;
  const seoDescription =
    snapshot?.seo.description ??
    `${business.description ?? ""} - cardapio, precos e pedidos online.`;
  const canonicalHref = canonicalPathOverride
    ? `${window.location.origin}${canonicalPathOverride}`
    : gastronomyCanonicalUrl?.startsWith("/")
      ? `${window.location.origin}${gastronomyCanonicalUrl}`
      : window.location.href;
  const robotsContent = communityScoped
    ? "noindex, follow"
    : snapshot?.seo.shouldNoIndex
    ? "noindex, nofollow"
    : (snapshot?.seo.robots ?? "index, follow, max-image-preview:large");

  const imageCandidates = [
    business.banner_url,
    business.logo_url,
    snapshot?.institutional.bannerUrl,
    snapshot?.institutional.logoUrl,
    ...(snapshot?.institutional.photos ?? []),
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  const cuisineValues = [
    profile.cuisine_type,
    ...(profile.cuisine_subtypes ?? []),
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
  const menuSections =
    menu?.categories
      .filter(
        (category) =>
          category.is_available &&
          category.items.some((item) => item.is_available),
      )
      .map((category) => ({
        "@type": "MenuSection",
        name: category.name,
        description: category.description,
        hasMenuItem: category.items
          .filter((item) => item.is_available)
          .map((item) => ({
            "@type": "MenuItem",
            name: item.name,
            description: item.description,
            image: item.image_url,
            offers: {
              "@type": "Offer",
              priceCurrency: "BRL",
              price: item.base_price,
              availability: "https://schema.org/InStock",
            },
          })),
      })) ?? [];
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: business.name ?? snapshot?.institutional.name ?? "Restaurante",
    description:
      business.description || snapshot?.institutional.description || undefined,
    url: canonicalHref,
    image: imageCandidates.length > 0 ? imageCandidates : undefined,
    telephone:
      business.whatsapp ||
      business.phone ||
      snapshot?.institutional.whatsapp ||
      snapshot?.institutional.phone ||
      undefined,
    servesCuisine: cuisineValues.length > 0 ? cuisineValues : undefined,
    priceRange: profile.price_range,
    acceptsReservations: profile.accepts_reservations || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress:
        [business.address?.street, business.address?.number]
          .filter(Boolean)
          .join(", ") ||
        business.business_address ||
        undefined,
      addressLocality: business.business_city || undefined,
      addressRegion: business.business_state || undefined,
      postalCode:
        business.address?.postal_code || business.business_zip || undefined,
      addressCountry: "BR",
    },
    geo:
      typeof business.address?.latitude === "number" &&
      typeof business.address?.longitude === "number"
        ? {
            "@type": "GeoCoordinates",
            latitude: business.address.latitude,
            longitude: business.address.longitude,
          }
        : undefined,
    aggregateRating:
      snapshot?.institutional.reviewCount &&
      snapshot.institutional.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: snapshot.institutional.rating || business.rating || 0,
            reviewCount: snapshot.institutional.reviewCount,
          }
        : undefined,
    hasMenu:
      menuSections.length > 0
        ? {
            "@type": "Menu",
            name: `Cardapio ${business.name ?? "Restaurante"}`,
            url: canonicalHref,
            hasMenuSection: menuSections,
          }
        : undefined,
  };
  const menuSchema =
    menuSections.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "Menu",
          name: `Cardapio ${business.name ?? "Restaurante"}`,
          url: canonicalHref,
          hasMenuSection: menuSections,
        }
      : null;
  const breadcrumbsSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Inicio",
        item: window.location.origin,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Gastronomia",
        item: `${window.location.origin}${gastronomyHomeUrl}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: business.name ?? "Restaurante",
        item: canonicalHref,
      },
    ],
  };

  return (
    <Helmet>
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={canonicalHref} />
      <script type="application/ld+json">
        {JSON.stringify(restaurantSchema)}
      </script>
      {menuSchema ? (
        <script type="application/ld+json">{JSON.stringify(menuSchema)}</script>
      ) : null}
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbsSchema)}
      </script>
    </Helmet>
  );
}
