import React from "react";
/**
 * Component for add canonical URL no head
 * Previne problemas de conteúdo duplicado no SEO
 */

import { Helmet } from "react-helmet-async";
interface CanonicalUrlProps {
  url: string;
}

export default function CanonicalUrl({ url }: CanonicalUrlProps) {
  // Garante que a URL seja absoluta
  const canonicalUrl = url.startsWith("http")
    ? url
    : `${window.location.origin}${url}`;

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}
