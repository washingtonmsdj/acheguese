import { resolveMediaAssetSource } from "@/core/media/references/mediaAssetReference";
import type { Database } from "@/integrations/supabase/types.generated";
import {
  CLASSIFIED_STATUS,
  CLASSIFIED_STATUS_VALUES,
  type ClassifiedStatusValue,
} from "../constants/statuses";
import type { ClassifiedData, ClassifiedTerritory } from "./types";

type ClassifiedRow = Database["public"]["Tables"]["classifieds"]["Row"];
type LocationRow = Database["public"]["Tables"]["locations"]["Row"];

type ClassifiedSellerRow = {
  name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
};

type ClassifiedCategoryRow = { slug?: string | null };

export type ClassifiedReadRow = ClassifiedRow & {
  seller?: ClassifiedSellerRow | null;
  territory?: Pick<
    LocationRow,
    "id" | "name" | "slug" | "type" | "parent_id" | "geographic_path"
  > | null;
  classified_categories?: ClassifiedCategoryRow | null;
  classified_subcategories?: ClassifiedCategoryRow | null;
};

export const CLASSIFIED_READ_SELECT = `
  *,
  seller:profiles!seller_id (
    name,
    avatar_url,
    phone,
    whatsapp
  ),
  territory:locations!fk_classifieds_location_id (
    id,
    name,
    slug,
    type,
    parent_id,
    geographic_path
  ),
  classified_categories(slug),
  classified_subcategories(slug)
`;

function ensureStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => typeof item === "string" ? resolveMediaAssetSource(item) : null)
    .filter((item): item is string => item !== null);
}

function mapTerritory(row: ClassifiedReadRow): ClassifiedTerritory {
  if (!row.location_id || !row.territory || row.territory.id !== row.location_id) {
    throw new Error(`Classified ${row.id} has no canonical territory`);
  }

  return {
    id: row.territory.id,
    name: row.territory.name,
    slug: row.territory.slug,
    type: row.territory.type,
    parent_id: row.territory.parent_id,
    geographic_path: row.territory.geographic_path,
  };
}

function mapStatus(value: string): ClassifiedStatusValue {
  if (!CLASSIFIED_STATUS_VALUES.includes(value as ClassifiedStatusValue)) {
    throw new Error(`Classified status is invalid: ${value}`);
  }

  return value as ClassifiedStatusValue;
}

export function mapClassifiedReadModel(row: ClassifiedReadRow): ClassifiedData {
  const territory = mapTerritory(row);
  const status = mapStatus(row.status);

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: row.price ?? 0,
    category: row.category ?? "",
    condition: row.condition ?? "",
    photos: ensureStringArray(row.photos),
    seller_id: row.seller_id,
    seller_name: row.seller?.name ?? undefined,
    seller_avatar: row.seller?.avatar_url ?? undefined,
    seller_phone: row.seller?.phone ?? undefined,
    seller_whatsapp: row.seller?.whatsapp ?? undefined,
    slug: row.slug ?? undefined,
    public_id: row.public_id ?? undefined,
    category_id: row.category_id ?? undefined,
    subcategory_id: row.subcategory_id ?? undefined,
    location_id: row.location_id,
    territory,
    category_slug: row.classified_categories?.slug ?? undefined,
    subcategory_slug: row.classified_subcategories?.slug ?? undefined,
    status,
    is_active: row.is_active ?? status === CLASSIFIED_STATUS.ACTIVE,
    is_featured: row.is_featured ?? false,
    latitude: row.latitude,
    longitude: row.longitude,
    reach: row.reach ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
