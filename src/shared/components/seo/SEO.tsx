/**
 * SEO - Componente global de metadados padrão.
 *
 * Usado em rotas não-territoriais. Rotas territoriais usam TerritorialSEO.
 * Quando `url` não for passado, não emite canonical.
 */

import { Helmet } from "react-helmet-async";
import { buildPublicAbsoluteUrl } from "@/shared/config/publicAppOrigin";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
}

const BRAND = "Achegue-se";
const DEFAULT_OG_IMAGE = "/og-image.png";

const DEFAULT_SEO = {
  title: `${BRAND} - Comunidade hiperlocal`,
  description:
    "Conecte-se com sua comunidade local. Descubra empresas, serviços, mobilidade e muito mais no seu bairro.",
  keywords:
    "comunidade local, bairro, empresas locais, serviços, mobilidade urbana, hiperlocal",
  type: "website" as const,
};

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function toAbsoluteUrl(value: string): string {
  return isAbsoluteUrl(value) ? value : buildPublicAbsoluteUrl(value);
}

export function SEO({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  author,
  publishedTime,
  modifiedTime,
  noIndex = false,
}: SEOProps) {
  const resolvedTitle = title ? `${title} | ${BRAND}` : DEFAULT_SEO.title;
  const resolvedDescription = description || DEFAULT_SEO.description;
  const resolvedImage = image ? toAbsoluteUrl(image) : buildPublicAbsoluteUrl(DEFAULT_OG_IMAGE);
  const resolvedUrl = url ? toAbsoluteUrl(url) : undefined;

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={keywords || DEFAULT_SEO.keywords} />
      {resolvedUrl && <link rel="canonical" href={resolvedUrl} />}

      <meta property="og:type" content={type} />
      <meta property="og:title" content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image" content={resolvedImage} />
      {resolvedUrl && <meta property="og:url" content={resolvedUrl} />}
      <meta property="og:site_name" content={BRAND} />
      <meta property="og:locale" content="pt_BR" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image" content={resolvedImage} />

      {type === "article" && author && <meta property="article:author" content={author} />}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Portuguese" />
    </Helmet>
  );
}
