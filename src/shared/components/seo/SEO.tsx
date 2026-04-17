/**
 * SEO - Componente global de metadados padrao.
 *
 * Usado em rotas nao-territoriais. Rotas territoriais usam TerritorialSEO.
 * Quando `url` nao for passado, nao emite canonical.
 */

import { Helmet } from "react-helmet-async";

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
const SITE_URL = "https://acheguese.com.br";
const DEFAULT_OG_IMAGE = "/og-image.png";

const DEFAULT_SEO = {
  title: `${BRAND} - Comunidade hiperlocal`,
  description:
    "Conecte-se com sua comunidade local. Descubra empresas, servicos, mobilidade e muito mais no seu bairro.",
  keywords:
    "comunidade local, bairro, empresas locais, servicos, mobilidade urbana, hiperlocal",
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  type: "website" as const,
};

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
  const resolvedImage = image || DEFAULT_SEO.image;
  const resolvedUrl = url ? `${SITE_URL}${url.startsWith("/") ? url : `/${url}`}` : undefined;

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

      <meta
        name="robots"
        content={noIndex ? "noindex, nofollow" : "index, follow"}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="Portuguese" />
    </Helmet>
  );
}
