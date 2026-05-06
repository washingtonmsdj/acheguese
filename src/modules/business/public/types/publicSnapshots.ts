import type { Business } from "@/core/business/types";
import type { VerticalKey } from "@/core/verticals";
import type {
  GastronomyBusiness,
  GastronomyProfile,
  MenuPromotion,
  MenuWithCategories,
} from "@/modules/business/gastronomy/types";

export interface PublicSnapshotIdentity {
  readonly profileId: string;
  readonly businessId: string | null;
  readonly slug: string;
  readonly displayName: string;
  readonly canonicalBusinessUrl: string;
}

export interface PublicSnapshotInstitutional {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly subcategory?: string;
  readonly logoUrl?: string;
  readonly bannerUrl?: string;
  readonly photos: readonly string[];
  readonly addressText: string | null;
  readonly locationText: string | null;
  readonly phone?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  readonly website?: string;
  readonly openStatus: {
    readonly open: boolean | null;
    readonly todayHours: string | null;
  };
  readonly openingHours?: Business["horario_funcionamento"];
  readonly rating: number;
  readonly reviewCount: number;
  readonly business: Business;
}

export interface PublicSnapshotVerticals {
  readonly activeVerticals: readonly VerticalKey[];
  readonly primaryVertical: VerticalKey | null;
  readonly canonicalVerticalUrl: string | null;
  readonly verticalPublicUrls: Partial<Record<VerticalKey, string>>;
}

export interface PublicGastronomyPreviewItem {
  readonly id: string;
  readonly name: string;
  readonly imageUrl?: string;
  readonly priceFrom?: number;
  readonly priceLabel: string;
  readonly menuUrl: string;
}

export interface PublicSnapshotSeo {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly robots: string;
  readonly schemaType: "LocalBusiness" | "Restaurant";
  readonly hasLocalBusinessSchema: boolean;
  readonly hasRestaurantSchema: boolean;
}

export interface PublicBusinessSnapshot {
  readonly identity: PublicSnapshotIdentity;
  readonly institutional: PublicSnapshotInstitutional;
  readonly verticals: PublicSnapshotVerticals;
  readonly gastronomyPreview: readonly PublicGastronomyPreviewItem[];
  readonly seo: PublicSnapshotSeo;
  readonly routing: {
    readonly redirectToCanonical?: string;
  };
}

export interface PublicGastronomySnapshot {
  readonly identity: PublicSnapshotIdentity;
  readonly institutional: PublicSnapshotInstitutional;
  readonly verticals: PublicSnapshotVerticals;
  readonly gastronomy: {
    readonly profile: GastronomyProfile;
    readonly business: GastronomyBusiness;
    readonly menu: MenuWithCategories | null;
    readonly promotions: readonly MenuPromotion[];
    readonly hasUsefulMenuContent: boolean;
    readonly commerce: {
      readonly businessDataId: string;
      readonly deliveryEnabled: boolean;
      readonly takeoutEnabled: boolean;
      readonly dineInEnabled: boolean;
      readonly minimumOrder?: number | null;
      readonly deliveryFee?: number | null;
      readonly currency: "BRL";
    };
  };
  readonly seo: PublicSnapshotSeo & {
    readonly canonicalGastronomyUrl: string;
    readonly canonicalBusinessUrl: string;
    readonly shouldNoIndex: boolean;
  };
  readonly routing: {
    readonly redirectToCanonical?: string;
  };
}

export interface PublicSlugRouteParams {
  readonly state: string;
  readonly city: string;
  readonly district: string | undefined;
  readonly slug: string;
}
