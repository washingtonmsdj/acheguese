/**
 * BUSINESS MAPPERS - Transformacao de dados puros
 *
 * Responsabilidade unica: converter dados entre camadas
 * - DB Record -> Domain Model
 * - Input -> DB Record
 * - Sem logica de negocio complexa, sem side effects
 */

import type {
  Business,
  BusinessCategory,
  BusinessDataRecord,
  BusinessDataWithProfiles,
  BusinessMetadata,
  CreateBusinessInput,
  Product,
  ProductRecord,
  Review,
  ReviewWithUser,
  UpdateBusinessInput,
} from "../types";

function setIfDefined<T extends object, K extends keyof T>(
  target: T,
  key: K,
  value: T[K] | undefined,
): void {
  if (value !== undefined) {
    Object.assign(target, Object.fromEntries([[key, value]]) as unknown as Partial<T>);
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function resolveMetadataPhotos(metadata: BusinessMetadata): string[] {
  const candidates: unknown[] = [
    metadata.fotos,
    (metadata as Record<string, unknown>).photos,
    (metadata as Record<string, unknown>).gallery,
    (metadata as Record<string, unknown>).gallery_images,
  ];

  for (const candidate of candidates) {
    const parsed = toStringArray(candidate);
    if (parsed.length > 0) {
      return parsed;
    }
  }

  return [];
}

function buildBusinessAddressSummary(
  input: CreateBusinessInput | UpdateBusinessInput,
): string | undefined {
  if (input.address) {
    return input.address;
  }

  const parts = [input.address_street, input.address_number, input.address_complement]
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

function normalizePaymentFlags(paymentMethods: string[]) {
  const normalized = paymentMethods.map((item) => item.toLowerCase());

  return {
    acceptsCard: normalized.some(
      (item) => item.includes("cartao") || item.includes("credito") || item.includes("debito"),
    ),
    acceptsPix: normalized.some((item) => item.includes("pix")),
  };
}

function buildMetadata(
  input: CreateBusinessInput | UpdateBusinessInput,
): BusinessMetadata | undefined {
  const paymentMethods = input.formas_pagamento ?? [];
  const serviceModes = input.modos_atendimento ?? [];
  const flags = normalizePaymentFlags(paymentMethods);

  const metadata: BusinessMetadata = {};

  if (input.logo_url !== undefined) metadata.logo_url = input.logo_url;
  if (input.banner_url !== undefined) metadata.banner_url = input.banner_url;
  if (input.fotos !== undefined) metadata.fotos = input.fotos;
  if (input.modos_atendimento !== undefined) metadata.modos_atendimento = serviceModes;
  if (input.tem_delivery !== undefined || input.modos_atendimento !== undefined) {
    metadata.tem_delivery = input.tem_delivery ?? serviceModes.includes("delivery");
  }
  if (input.aceita_cartao !== undefined || input.formas_pagamento !== undefined) {
    metadata.aceita_cartao = input.aceita_cartao ?? flags.acceptsCard;
  }
  if (input.aceita_pix !== undefined || input.formas_pagamento !== undefined) {
    metadata.aceita_pix = input.aceita_pix ?? flags.acceptsPix;
  }
  if (input.neighborhood !== undefined) metadata.neighborhood = input.neighborhood;
  if (input.cep !== undefined || input.postal_code !== undefined) {
    metadata.cep = input.postal_code ?? input.cep;
  }
  if (input.phone !== undefined) metadata.phone = input.phone;
  if (input.whatsapp !== undefined) metadata.whatsapp = input.whatsapp;
  if (input.city !== undefined) metadata.city = input.city;
  if (input.state !== undefined) metadata.state = input.state;

  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

/**
 * Mapper: Input -> BusinessDataRecord (para insercao/atualizacao)
 */
export function toBusinessData(
  input: CreateBusinessInput | UpdateBusinessInput,
): Partial<BusinessDataRecord> {
  const paymentMethods = input.formas_pagamento ?? [];
  const serviceModes = input.modos_atendimento ?? [];
  const metadata = buildMetadata(input);
  const result: Partial<BusinessDataRecord> = {};

  setIfDefined(result, "legal_name", input.legal_name);
  setIfDefined(result, "cnpj", input.cnpj);
  setIfDefined(result, "company_type", input.company_type);
  setIfDefined(result, "industry", input.industry);
  setIfDefined(result, "employee_count", input.employee_count);
  setIfDefined(result, "founded_year", input.founded_year);
  setIfDefined(result, "description", input.description);
  setIfDefined(result, "category", input.category);
  setIfDefined(result, "subcategory", input.subcategoria);
  setIfDefined(result, "email", input.email);
  setIfDefined(result, "website", input.website);
  setIfDefined(result, "instagram", input.instagram);
  setIfDefined(result, "facebook", input.facebook);
  setIfDefined(result, "opening_hours", input.horario_funcionamento);
  setIfDefined(result, "business_hours", input.horario_funcionamento);
  setIfDefined(result, "payment_methods", input.formas_pagamento ? paymentMethods : undefined);
  setIfDefined(result, "specialties", input.especialidades ? input.especialidades : undefined);
  setIfDefined(result, "facilities", input.facilidades ? input.facilidades : undefined);
  setIfDefined(result, "metadata", (metadata as any) ?? undefined);
  setIfDefined(result, "status", input.status);
  setIfDefined(result, "slug", input.slug);

  setIfDefined(result, "location_id", input.location_id);
  setIfDefined(result, "address_id", input.address_id);
  setIfDefined(result, "business_address", buildBusinessAddressSummary(input));
  setIfDefined(result, "business_city", input.city);
  setIfDefined(result, "business_state", input.state);
  setIfDefined(result, "business_zip", input.postal_code ?? input.cep);

  setIfDefined(result, "business_role", input.business_role);
  setIfDefined(result, "parent_business_id", input.parent_business_id);
  setIfDefined(result, "is_headquarters", input.is_headquarters);
  setIfDefined(result, "unit_name", input.unit_name);
  setIfDefined(result, "can_post_vagas", input.can_post_vagas);
  setIfDefined(result, "is_verified", input.is_verified);
  setIfDefined(result, "is_premium", input.is_premium);

  // Compatibilidade: se os modos vierem definidos, garante coerencia minima de metadata.
  if (serviceModes.length > 0 && !metadata?.modos_atendimento) {
    result.metadata = {
      ...((result.metadata ?? {}) as Record<string, unknown>),
      modos_atendimento: serviceModes,
      tem_delivery: serviceModes.includes("delivery"),
    };
  }

  return result;
}

/**
 * Mapper: BusinessDataWithProfiles -> Business
 */
export function mapBusinessDataToBusiness(
  data: BusinessDataWithProfiles,
): Business {
  const metadata =
    data.metadata && typeof data.metadata === "object"
      ? (data.metadata as BusinessMetadata)
      : {};

  const canonicalAddress =
    data.address && typeof data.address === "object"
      ? {
          street: data.address.street ?? undefined,
          number: data.address.number ?? undefined,
          complement: data.address.complement ?? undefined,
          postal_code: data.address.postal_code ?? undefined,
          latitude: data.address.latitude ?? undefined,
          longitude: data.address.longitude ?? undefined,
        }
      : undefined;

  const canonicalLocation =
    data.location && typeof data.location === "object"
      ? {
          name: data.location.name,
          full_name: data.location.full_name,
          geographic_path: data.location.geographic_path ?? undefined,
          canonical_lat: data.location.canonical_lat ?? undefined,
          canonical_lng: data.location.canonical_lng ?? undefined,
        }
      : undefined;

  const profileData = data.profiles;
  const paymentMethods = toStringArray(data.payment_methods);
  const specialties = toStringArray(data.specialties);
  const facilities = toStringArray(data.facilities);
  const serviceModes = toStringArray(metadata.modos_atendimento);
  const paymentFlags = normalizePaymentFlags(paymentMethods);
  const metadataPhotos = resolveMetadataPhotos(metadata);

  const resolvedServiceModes =
    serviceModes.length > 0
      ? serviceModes
      : metadata.tem_delivery
        ? ["presencial", "delivery"]
        : ["presencial"];

  return {
    id: data.profile_id || data.id || "",
    profile_id: data.profile_id,
    name: data.business_name || profileData?.name || "",
    legal_name: data.legal_name ?? undefined,
    cnpj: data.cnpj ?? undefined,
    company_type: (data.company_type as Business["company_type"]) ?? undefined,
    industry: data.industry ?? undefined,
    employee_count: (data.employee_count as Business["employee_count"]) ?? undefined,
    founded_year: data.founded_year ?? undefined,
    description: data.description || profileData?.bio || "",
    category: (data.category as BusinessCategory) || "outros",
    subcategoria: data.subcategory ?? undefined,
    phone: profileData?.phone || metadata.phone,
    whatsapp: profileData?.whatsapp || metadata.whatsapp,
    email: data.email || undefined,
    website: data.website || undefined,

    location_id: data.location_id || null,
    address_id: data.address_id ?? null,
    business_address: data.business_address ?? undefined,
    business_city: data.business_city ?? metadata.city,
    business_state: data.business_state ?? metadata.state,
    business_zip: data.business_zip ?? metadata.cep,

    business_role: data.business_role || "standalone",
    parent_business_id: data.parent_business_id || null,
    is_headquarters: data.is_headquarters,
    unit_name: data.unit_name || null,

    address: canonicalAddress,
    location: canonicalLocation,
    geographic_path: canonicalLocation?.geographic_path || undefined,

    horario_funcionamento: (data.opening_hours || data.business_hours || undefined) as Business["horario_funcionamento"],
    tem_delivery: metadata.tem_delivery ?? resolvedServiceModes.includes("delivery"),
    aceita_cartao: metadata.aceita_cartao ?? paymentFlags.acceptsCard,
    aceita_pix: metadata.aceita_pix ?? paymentFlags.acceptsPix,
    logo_url: metadata.logo_url || profileData?.avatar_url,
    banner_url: metadata.banner_url,
    fotos: metadataPhotos,
    status: (data.status as Business["status"]) || "active",
    rating: data.rating || 0,
    total_reviews: data.total_reviews || 0,
    favorites_count: data.favorites_count || 0,
    recommendations_count: data.recommendations_count || 0,
    total_products: data.total_products || 0,
    is_premium: data.is_premium || false,
    is_verified: data.is_verified || false,
    can_post_vagas: data.can_post_vagas ?? true,
    slug: data.slug || undefined,
    formas_pagamento: paymentMethods,
    especialidades: specialties,
    facilidades: facilities,
    modos_atendimento: resolvedServiceModes,
    instagram: data.instagram || undefined,
    facebook: data.facebook || undefined,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
  };
}

/**
 * Boundary publico para adaptacao do registro canonico.
 */
export function toBusinessReadModel(data: BusinessDataWithProfiles): Business {
  return mapBusinessDataToBusiness(data);
}

/**
 * Mapper: ProductRecord -> Product
 */
export function mapProductRecordToProduct(record: ProductRecord): Product {
  return {
    id: record.id,
    profile_id: record.profile_id,
    name: record.nome,
    description: record.descricao || "",
    price: record.preco || 0,
    promotional_price: record.preco_promocional || undefined,
    image_url: record.imagem || undefined,
    category: record.categoria || "",
    stock: record.estoque,
    active: record.ativo,
    featured: record.destaque,
    promotion: record.promocao,
    created_at: record.created_at,
  };
}

/**
 * Mapper: ReviewWithUser -> Review
 */
export function mapReviewRecordToReview(record: ReviewWithUser): Review {
  const profileData = record.profiles as
    | { name: string; avatar_url?: string }
    | undefined;

  return {
    id: record.id,
    profile_id: record.profile_id,
    user_id: record.user_id,
    rating: record.rating,
    comment: record.comment || "",
    created_at: record.created_at,
    user_name: profileData?.name || "Usuario",
    user_avatar: profileData?.avatar_url || undefined,
  };
}
