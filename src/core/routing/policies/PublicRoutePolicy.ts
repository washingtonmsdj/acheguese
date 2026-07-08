import {
  buildModuleTerritoryEntityUrl,
  normalizePublicTerritoryPath,
  type ModuleSlug,
} from "@/core/routing/utils/territoryUrls";

export type PublicUrlIntent =
  | "public_module"
  | "public_entity"
  | "community_portal"
  | "community_scoped_entity"
  | "private_operation";

export interface PublicEntityUrlInput {
  readonly module: ModuleSlug;
  readonly geographicPath: string;
  readonly slug: string;
}

export function buildPublicEntityUrl({
  module,
  geographicPath,
  slug,
}: PublicEntityUrlInput): string {
  return buildModuleTerritoryEntityUrl(
    module,
    normalizePublicTerritoryPath(geographicPath),
    slug,
  );
}
