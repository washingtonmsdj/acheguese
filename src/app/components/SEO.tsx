/**
 * SEO — Componente global de metadados padrão
 *
 * Usado em rotas não-territoriais (perfil, admin, mensagens, etc.).
 * Rotas territoriais usam TerritorialSEO diretamente — não usar este aqui.
 *
 * IMPORTANTE: quando `url` não for passado, NÃO emite canonical.
 * Isso evita que o canonical global fixo sobrescreva o das rotas territoriais.
 */

import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  /** Canonical explícito. Só passar quando a rota tiver URL canônica própria. */
  url?: string;
  type?: "website" | "article" | "profile";
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  /** Impede indexação desta rota (ex: redirects legados, páginas de admin). */
  noIndex?: boolean;
}

const BRAND = "Achegue-se";
const SITE_URL = "https://acheguese.com.br";
const DEFAULT_OG_IMAGE = "/og-image.png";

const DEFAULT_SEO = {
  title: `${BRAND} — Comunidade hiperlocal`,
  description:
    "Conecte-se com sua comunidade local. Descubra empresas, serviços, mobilidade e muito mais no seu bairro.",
  keywords:
    "comunidade local, bairro, empresas locais, serviços, mobilidade urbana, hiperlocal",
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
  const resolvedUrl = url ? `${SITE_URL}${url.startsWith('/') ? url : `/${url}`}` : undefined;

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="keywords" content={keywords || DEFAULT_SEO.keywords} />

      {/* Canonical — só emite quando URL explícita for passada */}
      {resolvedUrl && <link rel="canonical" href={resolvedUrl} />}

      {/* Open Graph */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={resolvedTitle} />
      <meta property="og:description" content={resolvedDescription} />
      <meta property="og:image"       content={resolvedImage} />
      {resolvedUrl && <meta property="og:url" content={resolvedUrl} />}
      <meta property="og:site_name"   content={BRAND} />
      <meta property="og:locale"      content="pt_BR" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={resolvedTitle} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta name="twitter:image"       content={resolvedImage} />

      {/* Article specific */}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Robots */}
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
