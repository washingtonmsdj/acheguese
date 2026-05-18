/**
 * BUSINESS MUTATIONS - Operacoes de escrita
 *
 * Responsabilidade unica: criar, atualizar e deletar dados.
 */
import { logger } from '@/shared/utils/logger';
import { supabase } from "@/integrations/supabase";
import { PublicIdentityService } from "@/core/public-identity";
import { AddressService } from "@/core/address/services/AddressService";
import { BusinessHoursService } from "@/core/business/BusinessHoursService";
const supabaseTyped = supabase as any;
import { callRPC } from "@/integrations/supabase/services/supabaseHelpers";
import {
  createBusinessSchema,
  updateBusinessSchema,
} from "@/shared/schemas/business/businessSchemas";
import {
  sanitizeString,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
} from "@/shared/utils/sanitization";
import { isValidBusinessId } from "./validators";
import { toBusinessData, mapBusinessDataToBusiness } from "./business.mappers";
import { generateBusinessUsername } from "./business.helpers";
import { BusinessUrlService } from "./BusinessUrlService";
import { profileService } from "@/core/profiles/services/ProfileService";
import type {
  Business,
  BusinessDataWithProfiles,
  CreateBusinessInput,
  CreateProductInput,
  Product,
  UpdateBusinessInput,
} from "../types";
const BUSINESS_SELECT = `
  *,
  profiles(id, name, avatar_url, phone, whatsapp),
  address:addresses!address_id(*),
  location:locations!location_id(*)
`;

function getDayIndex(day: string): number | undefined {
  switch (day) {
    case "domingo":
      return 0;
    case "segunda":
      return 1;
    case "terca":
      return 2;
    case "quarta":
      return 3;
    case "quinta":
      return 4;
    case "sexta":
      return 5;
    case "sabado":
      return 6;
    default:
      return undefined;
  }
}

function sanitizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const sanitized = sanitizeString(value);
  return sanitized || undefined;
}

function sanitizeOptionalUrlValue(value: unknown): string | undefined {
  return typeof value === "string" ? sanitizeUrl(value) : undefined;
}

function sanitizeOptionalEmailValue(value: unknown): string | undefined {
  return typeof value === "string" ? sanitizeEmail(value) : undefined;
}

function sanitizeOptionalPhoneValue(value: unknown): string | undefined {
  return typeof value === "string" ? sanitizePhone(value) : undefined;
}

function sanitizeOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const sanitized = value
    .map((item) => sanitizeString(typeof item === "string" ? item : ""))
    .filter(Boolean);

  return sanitized;
}

function sanitizeAndValidateInput(
  input: CreateBusinessInput | UpdateBusinessInput,
  isUpdate = false,
): CreateBusinessInput | UpdateBusinessInput {
  const foundedYearRaw = (input as any).founded_year as string | number | undefined;
  const foundedYear =
    typeof foundedYearRaw === "number"
      ? foundedYearRaw
      : typeof foundedYearRaw === "string" && foundedYearRaw.trim()
        ? Number(foundedYearRaw)
        : undefined;

  const sanitized: Record<string, unknown> = {
    name: sanitizeOptionalText(input.name),
    legal_name: sanitizeOptionalText(input.legal_name),
    cnpj: sanitizeOptionalText(input.cnpj),
    company_type: input.company_type,
    industry: sanitizeOptionalText(input.industry),
    employee_count: input.employee_count,
    founded_year: foundedYear,
    description: sanitizeOptionalText(input.description),
    category: sanitizeOptionalText(input.category),
    subcategoria: sanitizeOptionalText(input.subcategoria),
    slug: sanitizeOptionalText(input.slug),
    phone: sanitizeOptionalPhoneValue(input.phone),
    whatsapp: sanitizeOptionalPhoneValue(input.whatsapp),
    email: sanitizeOptionalEmailValue(input.email),
    website: sanitizeOptionalUrlValue(input.website),
    instagram: sanitizeOptionalText(input.instagram),
    facebook: sanitizeOptionalText(input.facebook),
    address_id: sanitizeOptionalText(input.address_id),
    location_id: sanitizeOptionalText(input.location_id),
    city: sanitizeOptionalText(input.city),
    state: sanitizeOptionalText(input.state),
    postal_code: sanitizeOptionalText(input.postal_code),
    address_street: sanitizeOptionalText(input.address_street),
    address_number: sanitizeOptionalText(input.address_number),
    address_complement: sanitizeOptionalText(input.address_complement),
    address: sanitizeOptionalText(input.address),
    neighborhood: sanitizeOptionalText(input.neighborhood),
    cep: sanitizeOptionalText(input.cep),
    latitude: input.latitude,
    longitude: input.longitude,
    business_role: input.business_role,
    parent_business_id: sanitizeOptionalText(input.parent_business_id),
    is_headquarters: input.is_headquarters,
    unit_name: sanitizeOptionalText(input.unit_name),
    horario_funcionamento: input.horario_funcionamento,
    formas_pagamento: sanitizeOptionalStringArray(input.formas_pagamento),
    especialidades: sanitizeOptionalStringArray(input.especialidades),
    facilidades: sanitizeOptionalStringArray(input.facilidades),
    modos_atendimento: sanitizeOptionalStringArray(input.modos_atendimento),
    tem_delivery: input.tem_delivery,
    aceita_cartao: input.aceita_cartao,
    aceita_pix: input.aceita_pix,
    can_post_vagas: input.can_post_vagas,
    logo_url: sanitizeOptionalUrlValue(input.logo_url),
    banner_url: sanitizeOptionalUrlValue(input.banner_url),
    fotos: sanitizeOptionalStringArray(input.fotos),
    status: input.status,
    is_verified: input.is_verified,
    is_premium: input.is_premium,
  };

  const schema = isUpdate ? updateBusinessSchema : createBusinessSchema;
  const validation = schema.safeParse(sanitized);

  if (!validation.success) {
    const errors = validation.error.errors
      .map((error) => `${error.path.join(".")}: ${error.message}`)
      .join(", ");
    throw new Error(`Dados invalidos: ${errors}`);
  }

  return validation.data;
}

function hasStructuredAddress(input: CreateBusinessInput | UpdateBusinessInput): boolean {
  return Boolean(
    input.address_street || input.address_number || input.address_complement || input.postal_code,
  );
}

async function syncAddress(
  input: CreateBusinessInput | UpdateBusinessInput,
  existingAddressId?: string | null,
): Promise<string | undefined> {
  if (input.address_id !== undefined) {
    return input.address_id ?? undefined;
  }

  if (!hasStructuredAddress(input)) {
    return existingAddressId ?? undefined;
  }

  if (!input.location_id) {
    throw new Error("Selecione o territorio antes de salvar o endereco fisico");
  }

  const addressService = new AddressService();
  const payload = {
    location_id: input.location_id,
    postal_code: input.postal_code ?? input.cep ?? null,
    street: input.address_street ?? null,
    number: input.address_number ?? null,
    complement: input.address_complement ?? null,
    address_type: "exact" as const,
    precision: "exact" as const,
  };

  if (existingAddressId) {
    const address = await addressService.updateAddress(existingAddressId, payload);
    return address.id;
  }

  const address = await addressService.createAddress(payload);
  return address.id;
}

function toBusinessHoursRows(hours: unknown): Array<{
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}> {
  if (!hours || typeof hours !== "object") {
    return [];
  }

  return Object.entries(hours as Record<string, { open?: string; close?: string; closed?: boolean }>)
    .map(([day, value]) => {
      const dayKey = day.toLowerCase();
      const dayOfWeek = getDayIndex(dayKey);
      if (dayOfWeek === undefined) {
        return null;
      }

      return {
        day_of_week: dayOfWeek,
        opens_at: value.closed ? "00:00" : value.open || "00:00",
        closes_at: value.closed ? "00:00" : value.close || "00:00",
        is_closed: Boolean(value.closed),
      };
    })
    .filter((value): value is {
      day_of_week: number;
      opens_at: string;
      closes_at: string;
      is_closed: boolean;
    } => Boolean(value));
}

async function syncBusinessHoursTable(businessId: string, hours: unknown): Promise<void> {
  const rows = toBusinessHoursRows(hours);
  if (rows.length === 0) {
    return;
  }

  const result = await BusinessHoursService.setBulkHours(businessId, rows);
  if (result.error) {
    throw new Error(result.error);
  }
}

function mergeMetadata(
  currentMetadata: unknown,
  nextMetadata: unknown,
): Record<string, unknown> | undefined {
  const current =
    currentMetadata && typeof currentMetadata === "object"
      ? (currentMetadata as Record<string, unknown>)
      : {};
  const next =
    nextMetadata && typeof nextMetadata === "object"
      ? (nextMetadata as Record<string, unknown>)
      : {};

  const merged = { ...current, ...next };
  return Object.keys(merged).length > 0 ? merged : undefined;
}

/**
 * Criar empresa
 */
export async function createBusiness(
  input: CreateBusinessInput,
  userId: string,
): Promise<Business> {
  try {
    const validatedInput = sanitizeAndValidateInput(input, false) as CreateBusinessInput;
    let slug = validatedInput.slug;
    if (slug) {
      const availability = await PublicIdentityService.checkAvailability({
        identifier: slug,
        entityType: "business",
      });

      if (availability.status !== "available") {
        throw new Error(
          availability.message ||
            `Slug "${slug}" nao esta disponivel.` +
              (availability.suggestion ? ` Sugestao: ${availability.suggestion}` : ""),
        );
      }
    } else {
      slug = await BusinessUrlService.generateUniqueSlug(validatedInput.name);
    }

    const addressId = await syncAddress(validatedInput);
    const profile = await profileService.createProfile({
      profile_type: "business",
      name: validatedInput.name,
      username: generateBusinessUsername(validatedInput.name),
      city: validatedInput.city || validatedInput.neighborhood || "Nao informado",
      bio: validatedInput.description,
      avatar_url: validatedInput.logo_url,
    });

    if (!profile) {
      throw new Error("Erro ao criar perfil da empresa");
    }

    const { error: memberError } = await supabaseTyped.from("profile_members").insert({
      profile_id: profile.id,
      user_id: userId,
      role: "owner",
    });

    if (memberError) {
      throw memberError;
    }

    const businessData = toBusinessData({
      ...validatedInput,
      address_id: addressId,
      slug,
    });

    const { data: business, error } = await supabaseTyped
      .from("business_data")
      .insert({
        profile_id: profile.id,
        business_name: validatedInput.name,
        ...businessData,
        status: validatedInput.status ?? "active",
        rating: 0,
        total_reviews: 0,
        total_products: 0,
        slug,
      })
      .select(BUSINESS_SELECT)
      .single();

    if (error) {
      throw error;
    }

    await supabaseTyped.from("business_stats").insert({
      profile_id: profile.id,
      views_count: 0,
      favorites_count: 0,
      shares_count: 0,
    });

    if (validatedInput.horario_funcionamento) {
      await syncBusinessHoursTable((business as { id: string }).id, validatedInput.horario_funcionamento);
    }

    return mapBusinessDataToBusiness(business as BusinessDataWithProfiles);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao criar empresa: ${message}`);
  }
}

/**
 * Atualizar empresa
 */
export async function updateBusiness(
  id: string,
  input: UpdateBusinessInput,
): Promise<Business> {
  try {
    const validatedInput = sanitizeAndValidateInput(input, true) as UpdateBusinessInput;

    const { data: currentBusiness, error: currentError } = await supabaseTyped
      .from("business_data")
      .select("id, slug, metadata, address_id, location_id")
      .eq("profile_id", id)
      .maybeSingle();

    if (currentError) {
      throw currentError;
    }

    if (!currentBusiness) {
      throw new Error("Empresa nao encontrada");
    }

    const currentTyped = currentBusiness as {
      id: string;
      slug?: string | null;
      metadata?: Record<string, unknown>;
      address_id?: string | null;
      location_id?: string | null;
    };

    const addressId = await syncAddress(
      {
        ...validatedInput,
        location_id: validatedInput.location_id ?? currentTyped.location_id ?? undefined,
      },
      currentTyped.address_id,
    );

    const businessData = toBusinessData({
      ...validatedInput,
      ...(addressId ? { address_id: addressId } : {}),
    });

    const updatePayload: Record<string, unknown> = {
      ...businessData,
      updated_at: new Date().toISOString(),
    };

    if (businessData.metadata !== undefined) {
      updatePayload.metadata = mergeMetadata(currentTyped.metadata, businessData.metadata);
    }

    if (validatedInput.name || validatedInput.description || validatedInput.logo_url || validatedInput.city) {
      await profileService.updateProfile(id, {
        ...(validatedInput.name !== undefined ? { name: validatedInput.name } : {}),
        ...(validatedInput.description !== undefined ? { bio: validatedInput.description } : {}),
        ...(validatedInput.logo_url !== undefined ? { avatar_url: validatedInput.logo_url } : {}),
        ...(validatedInput.city !== undefined ? { city: validatedInput.city } : {}),
      });
    }

    if (validatedInput.slug !== undefined && currentTyped.slug !== validatedInput.slug) {
      const cooldown = await PublicIdentityService.canChangeIdentifier({
        entityType: "business",
        entityId: id,
      });

      if (!cooldown.canChange) {
        throw new Error(
          `Nao e possivel alterar o slug da empresa agora. Aguarde ${cooldown.daysRemaining || 0} dia(s).`,
        );
      }

      const availability = await PublicIdentityService.checkAvailability({
        identifier: validatedInput.slug,
        entityType: "business",
        excludeEntityId: id,
      });

      if (availability.status !== "available") {
        throw new Error(
          availability.message ||
            `Slug "${validatedInput.slug}" nao esta disponivel.` +
              (availability.suggestion ? ` Sugestao: ${availability.suggestion}` : ""),
        );
      }

      updatePayload.slug = validatedInput.slug;
    }

    const { data: business, error } = await supabaseTyped
      .from("business_data")
      .update(updatePayload)
      .eq("profile_id", id)
      .select(BUSINESS_SELECT)
      .single();

    if (error) {
      throw error;
    }

    if (validatedInput.horario_funcionamento !== undefined) {
      await syncBusinessHoursTable((business as { id: string }).id, validatedInput.horario_funcionamento);
    }

    return mapBusinessDataToBusiness(business as BusinessDataWithProfiles);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar empresa: ${message}`);
  }
}

/**
 * Atualizar secoes ativas
 */
export async function updateActiveSections(
  businessId: string,
  sections: {
    services: boolean;
    products: boolean;
    cardapio: boolean;
    portfolio: boolean;
    promocoes: boolean;
  },
): Promise<void> {
  const { error } = await supabaseTyped.from("business_data")
    .update({
      secoes_ativas: sections,
      updated_at: new Date().toISOString(),
    })
    .or(`id.eq.${businessId},profile_id.eq.${businessId}`);

  if (error) {
    throw new Error(`Erro ao atualizar secoes ativas: ${(error as { message?: string }).message}`);
  }
}

/**
 * Soft delete empresa
 */
export async function deleteBusiness(id: string): Promise<void> {
  try {
    const { error } = await supabaseTyped.from("business_data")
      .update({
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", id);

    if (error) throw error;
    await profileService.updateProfile(id, {
      is_active: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao deletar empresa: ${message}`);
  }
}

/**
 * Criar produto
 */
export async function createProduct(
  businessId: string,
  productData: CreateProductInput,
): Promise<Product> {
  if (!isValidBusinessId(businessId)) {
    throw new Error("ID de empresa invalido");
  }

  try {
    const { data, error } = await supabaseTyped.from("business_products")
      .insert({
        profile_id: businessId,
        name: productData.nome,
        description: productData.descricao || null,
        price: productData.preco || null,
        promotional_price: productData.preco_promocional || null,
        image_url: productData.imagem || null,
        category: productData.categoria || null,
        stock: productData.estoque || 0,
        active: productData.ativo ?? true,
        featured: productData.destaque ?? false,
        promotion: productData.promocao ?? false,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: (data as { id: string }).id,
      profile_id: businessId,
      name: productData.nome,
      description: productData.descricao || "",
      price: productData.preco || 0,
      promotional_price: productData.preco_promocional || undefined,
      image_url: productData.imagem || undefined,
      category: productData.categoria || "",
      stock: productData.estoque || 0,
      active: productData.ativo ?? true,
      featured: productData.destaque ?? false,
      promotion: productData.promocao ?? false,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao criar produto: ${message}`);
  }
}

/**
 * Incrementar visualizacoes
 */
export async function incrementViews(businessId: string): Promise<void> {
  try {
    await callRPC("increment_business_views", {
      business_id: businessId,
    });
  } catch (error) {
    logger.warn("Failed to increment views:", error);
  }
}
