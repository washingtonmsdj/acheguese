import { GastronomyFacade } from './GastronomyService';
import type {
  MenuItemWithRelations,
  PublicGastronomyFoodItem,
} from '../types';

export interface GastronomyPreviewItem {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly imageUrl?: string;
  readonly priceFrom: number;
  readonly category?: string;
  readonly isFeatured: boolean;
}

export interface GastronomyPreview {
  readonly businessId: string;
  readonly items: readonly GastronomyPreviewItem[];
  readonly totalVisibleItems: number;
}

const DEFAULT_PREVIEW_LIMIT = 3;

function getItemPreviewPrice(item: MenuItemWithRelations): number {
  const variantPrices =
    item.variants
      ?.filter((variant) => variant.is_available)
      .map((variant) => item.base_price + variant.price_adjustment) ?? [];

  return Math.min(item.base_price, ...variantPrices);
}

function mapPreviewItem(item: MenuItemWithRelations): GastronomyPreviewItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.image_url,
    priceFrom: getItemPreviewPrice(item),
    category: item.category?.name,
    isFeatured: item.is_featured,
  };
}

function mapPublicFoodPreviewItem(
  item: PublicGastronomyFoodItem,
): GastronomyPreviewItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.image_url,
    priceFrom: item.price,
    category: item.category,
    isFeatured: item.is_featured,
  };
}

export class GastronomyPublicPreviewService {
  static async getBusinessPreview(
    businessIdentifier: string,
    limit = DEFAULT_PREVIEW_LIMIT,
  ): Promise<GastronomyPreview> {
    const safeLimit = Math.max(1, Math.min(limit, DEFAULT_PREVIEW_LIMIT));
    const profile =
      await GastronomyFacade.queries.getGastronomyProfile(businessIdentifier);
    const businessId = profile?.business_id ?? businessIdentifier;

    if (!profile) {
      return {
        businessId,
        items: [],
        totalVisibleItems: 0,
      };
    }

    const featuredItems =
      await GastronomyFacade.queries.getFeaturedMenuItems(businessId);

    if (featuredItems.length > 0) {
      return {
        businessId,
        items: featuredItems.slice(0, safeLimit).map(mapPreviewItem),
        totalVisibleItems: Math.min(featuredItems.length, safeLimit),
      };
    }

    const publicItems = await GastronomyFacade.queries.getPublicFoodItems({
      businessId,
      featuredOnly: false,
    });

    return {
      businessId,
      items: publicItems.slice(0, safeLimit).map(mapPublicFoodPreviewItem),
      totalVisibleItems: Math.min(publicItems.length, safeLimit),
    };
  }
}
