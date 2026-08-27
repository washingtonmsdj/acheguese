import type { AppModuleSlug } from "@/shared/config/moduleSlugs";
import { APP_MODULE_SLUGS } from "@/shared/config/moduleSlugs";

function cleanPathSegment(value: string, label: string): string {
  const segment = value.trim().replace(/^\/+|\/+$/g, "");
  if (!segment || /[/?#]/.test(segment)) {
    throw new Error(`${label} deve ser um unico segmento de URL.`);
  }
  return segment;
}

function cleanSuffix(suffix: string): string {
  return suffix
    .split("/")
    .filter(Boolean)
    .map((segment) => cleanPathSegment(segment, "segmento de comunidade"))
    .join("/");
}

export interface CommunityScopedEntityUrlInput {
  readonly communityAlias: string;
  readonly module: AppModuleSlug;
  readonly slug: string;
}

export function buildCommunityPortalUrl(alias: string, suffix = ""): string {
  const base = `/${APP_MODULE_SLUGS.community}/${cleanPathSegment(
    alias,
    "alias da comunidade",
  )}`;
  const normalizedSuffix = cleanSuffix(suffix);
  return normalizedSuffix ? `${base}/${normalizedSuffix}` : base;
}

export function buildCommunityScopedEntityUrl({
  communityAlias,
  module,
  slug,
}: CommunityScopedEntityUrlInput): string {
  return buildCommunityPortalUrl(
    communityAlias,
    `${module}/${cleanPathSegment(slug, "slug da entidade")}`,
  );
}
