import { BusinessSettingsService } from "@/core/business/services/BusinessSettingsService";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
import {
  getBusinessById,
  updateActiveSections,
  updateBusiness,
} from "./BusinessService";
import { isValidBusinessId, isValidBusinessStatus } from "./validators";
import type { Business, UpdateBusinessInput } from "../types";

export interface BusinessSection {
  id: string;
  title: string;
  type: string;
  enabled?: boolean;
}

export interface BusinessSectionConfig {
  sections: BusinessSection[];
}

export interface BusinessEditData {
  name?: string;
  description?: string;
  category?: string;
  [key: string]: unknown;
}

type SectionKey = "services" | "products" | "cardapio" | "portfolio" | "promocoes";

type BusinessDataRecord = {
  id: string;
  profile_id: string;
  business_name?: string | null;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  favorites_count?: number | null;
  total_products?: number | null;
  secoes_ativas?: Partial<Record<SectionKey, boolean>> | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
  count?: number | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
  count?: number | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (
    columns?: string,
    options?: { count?: "exact"; head?: boolean },
  ) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
  limit: (value: number) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
}

interface BusinessManagementDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}

const businessManagementDb = supabase as unknown as BusinessManagementDbClient;

const SECTION_DEFINITIONS: Array<Omit<BusinessSection, "enabled"> & { id: SectionKey }> = [
  { id: "services", title: "Servicos", type: "services" },
  { id: "products", title: "Produtos", type: "products" },
  { id: "cardapio", title: "Cardapio", type: "menu" },
  { id: "portfolio", title: "Portfolio", type: "portfolio" },
  { id: "promocoes", title: "Promocoes", type: "promotions" },
];

const EMPTY_SECTIONS: Record<SectionKey, boolean> = {
  services: false,
  products: false,
  cardapio: false,
  portfolio: false,
  promocoes: false,
};

function assertValidBusinessId(businessId: string): void {
  if (!isValidBusinessId(businessId)) {
    throw new Error("ID de empresa invalido");
  }
}

function normalizeSections(
  sections?: Partial<Record<SectionKey, boolean>> | null,
): Record<SectionKey, boolean> {
  return {
    services: Boolean(sections?.services),
    products: Boolean(sections?.products),
    cardapio: Boolean(sections?.cardapio),
    portfolio: Boolean(sections?.portfolio),
    promocoes: Boolean(sections?.promocoes),
  };
}

function toSectionRecord(config: BusinessSectionConfig): Record<SectionKey, boolean> {
  const next = { ...EMPTY_SECTIONS };

  for (const section of config.sections) {
    if (section.id in next) {
      next[section.id as SectionKey] = section.enabled ?? true;
    }
  }

  return next;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function toBusinessUpdateInput(data: BusinessEditData): UpdateBusinessInput {
  return {
    ...(optionalString(data.name) !== undefined ? { name: optionalString(data.name) } : {}),
    ...(optionalString(data.description) !== undefined
      ? { description: optionalString(data.description) }
      : {}),
    ...(optionalString(data.category) !== undefined
      ? { category: optionalString(data.category) as UpdateBusinessInput["category"] }
      : {}),
    ...(data.status !== undefined ? { status: data.status as UpdateBusinessInput["status"] } : {}),
    ...(optionalString(data.logo_url) !== undefined ? { logo_url: optionalString(data.logo_url) } : {}),
    ...(optionalString(data.banner_url) !== undefined
      ? { banner_url: optionalString(data.banner_url) }
      : {}),
    ...(Array.isArray(data.fotos)
      ? { fotos: data.fotos.filter((item): item is string => typeof item === "string") }
      : {}),
  };
}

class BusinessManagementServiceClass {
  private async getBusinessRecord(businessId: string): Promise<BusinessDataRecord> {
    assertValidBusinessId(businessId);

    const { data, error } = await businessManagementDb
      .from<BusinessDataRecord>("business_data")
      .select(
        "id, profile_id, business_name, description, category, status, rating, total_reviews, favorites_count, total_products, secoes_ativas, metadata, created_at, updated_at",
      )
      .or(`id.eq.${businessId},profile_id.eq.${businessId}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.error("BusinessManagementService.getBusinessRecord", error, { businessId });
      throw error;
    }

    if (!data) {
      throw new Error("Empresa nao encontrada");
    }

    return data;
  }

  async getBusinessSections(businessId: string): Promise<BusinessSection[]> {
    const business = await this.getBusinessRecord(businessId);
    const activeSections = normalizeSections(business.secoes_ativas);

    return SECTION_DEFINITIONS.map((section) => ({
      ...section,
      enabled: activeSections[section.id],
    }));
  }

  async updateBusinessSections(
    businessId: string,
    config: BusinessSectionConfig,
  ): Promise<boolean> {
    const business = await this.getBusinessRecord(businessId);
    await updateActiveSections(business.id, toSectionRecord(config));
    return true;
  }

  async updateBusinessSection(
    businessId: string,
    sectionId: string,
    data: { enabled?: boolean; active?: boolean; visible?: boolean } | boolean,
  ): Promise<boolean> {
    if (!SECTION_DEFINITIONS.some((section) => section.id === sectionId)) {
      throw new Error("Secao de empresa invalida");
    }

    const business = await this.getBusinessRecord(businessId);
    const sections = normalizeSections(business.secoes_ativas);
    const enabled =
      typeof data === "boolean"
        ? data
        : Boolean(data.enabled ?? data.active ?? data.visible);

    await updateActiveSections(business.id, {
      ...sections,
      [sectionId]: enabled,
    });

    return true;
  }

  async getBusinessInfo(businessId: string): Promise<Record<string, unknown> | null> {
    const business = await this.getBusinessRecord(businessId);

    return {
      ...business,
      name: business.business_name,
      logo_url: business.metadata?.logo_url,
      banner_url: business.metadata?.banner_url,
      fotos: business.metadata?.fotos,
    };
  }

  async updateBusinessInfo(
    businessId: string,
    data: BusinessEditData,
  ): Promise<boolean> {
    const business = await this.getBusinessRecord(businessId);
    await updateBusiness(business.profile_id, toBusinessUpdateInput(data));
    return true;
  }

  async getBusinessStats(businessId: string): Promise<Record<string, unknown>> {
    const business = await this.getBusinessRecord(businessId);
    const fullBusiness: Business = await getBusinessById(business.profile_id);

    return {
      rating: fullBusiness.rating,
      total_reviews: fullBusiness.total_reviews,
      favorites_count: fullBusiness.favorites_count ?? business.favorites_count ?? 0,
      total_products: fullBusiness.total_products,
      status: fullBusiness.status,
      updated_at: business.updated_at,
    };
  }

  async updateBusinessStatus(
    businessId: string,
    status: string,
  ): Promise<boolean> {
    if (!isValidBusinessStatus(status) || status === "deleted") {
      throw new Error("Status de empresa invalido");
    }

    const business = await this.getBusinessRecord(businessId);
    await updateBusiness(business.profile_id, { status: status as UpdateBusinessInput["status"] });
    return true;
  }

  async uploadBusinessImage(
    businessId: string,
    file: File,
    imageType: "logo" | "banner" | "gallery",
  ): Promise<string> {
    const business = await this.getBusinessRecord(businessId);
    const reference = await BusinessSettingsService.uploadBusinessImage({
      ownerProfileId: business.profile_id,
      file,
      type: imageType,
    });

    if (imageType === "gallery") {
      await BusinessSettingsService.addGalleryItem({
        businessDataId: business.id,
        reference,
      });
    } else {
      await updateBusiness(
        business.profile_id,
        imageType === "logo"
          ? { logo_url: reference }
          : { banner_url: reference },
      );
    }

    return reference;
  }
}

export const businessManagementService = new BusinessManagementServiceClass();
