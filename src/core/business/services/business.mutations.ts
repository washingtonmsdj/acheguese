// @ts-nocheck
﻿/**
 * BUSINESS MUTATIONS - Operacoes de escrita
 *
 * Responsabilidade unica: criar, atualizar e deletar dados.
 */

import { supabase } from "@/integrations/supabase";
import { PublicIdentityService } from "@/core/public-identity";
import { AddressService } from "@/core/address/services/AddressService";
import { BusinessHoursService } from "@/core/business/BusinessHoursService";
const supabaseAny = supabase as any;
import { callRPC } from "@/core/supabase/services/supabaseHelpers";
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

const DAY_INDEX_MAP: Record<string, number> = {
  domingo: 0,
  segunda: 1,
  terca: 2,
  quarta: 3,
  quinta: 4,
  sexta: 5,
  sabado: 6,
};

function hasOwn(source: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(source, key);
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
  const source = input as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  const copy = (key: string, sanitizer?: (value: unknown) => unknown) => {
    if (!hasOwn(source, key)) {
      return;
    }

    sanitized[key] = sanitizer ? sanitizer(source[key]) : source[key];
  };

  copy("name", sanitizeOptionalText);
  copy("legal_name", sanitizeOptionalText);
  copy("cnpj", sanitizeOptionalText);
  copy("company_type");
  copy("industry", sanitizeOptionalText);
  copy("employee_count");
  copy("founded_year", (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) return Number(value);
    return undefined;
  });
  copy("description", sanitizeOptionalText);
  copy("category", sanitizeOptionalText);
  copy("subcategoria", sanitizeOptionalText);
  copy("slug", sanitizeOptionalText);
  copy("phone", sanitizeOptionalPhoneValue);
  copy("whatsapp", sanitizeOptionalPhoneValue);
  copy("email", sanitizeOptionalEmailValue);
  copy("website", sanitizeOptionalUrlValue);
  copy("instagram", sanitizeOptionalText);
  copy("facebook", sanitizeOptionalText);
  copy("address_id", sanitizeOptionalText);
  copy("location_id", sanitizeOptionalText);
  copy("city", sanitizeOptionalText);
  copy("state", sanitizeOptionalText);
  copy("postal_code", sanitizeOptionalText);
  copy("address_street", sanitizeOptionalText);
  copy("address_number", sanitizeOptionalText);
  copy("address_complement", sanitizeOptionalText);
  copy("address", sanitizeOptionalText);
  copy("neighborhood", sanitizeOptionalText);
  copy("cep", sanitizeOptionalText);
  copy("latitude");
  copy("longitude");
  copy("business_role");
  copy("parent_business_id", sanitizeOptionalText);
  copy("is_headquarters");
  copy("unit_name", sanitizeOptionalText);
  copy("horario_funcionamento");
  copy("formas_pagamento", sanitizeOptionalStringArray);
  copy("especialidades", sanitizeOptionalStringArray);
  copy("facilidades", sanitizeOptionalStringArray);
  copy("modos_atendimento", sanitizeOptionalStringArray);
  copy("tem_delivery");
  copy("aceita_cartao");
  copy("aceita_pix");
  copy("logo_url", sanitizeOptionalUrlValue);
  copy("banner_url", sanitizeOptionalUrlValue);
  copy("fotos", sanitizeOptionalStringArray);
  copy("status");

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
      const dayOfWeek = DAY_INDEX_MAP[dayKey];
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
    const { BusinessUrlService } = await import("./BusinessUrlService");

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

    const { profileService } = await import("@/core/profiles");
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

    const { error: memberError } = await supabaseAny.from("profile_members").insert({
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

    const { data: business, error } = await supabaseAny
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

    await supabaseAny.from("business_stats").insert({
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

    const { data: currentBusiness, error: currentError } = await supabaseAny
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
      const { profileService } = await import("@/core/profiles");
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

    const { data: business, error } = await supabaseAny
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
  const { error } = await supabaseAny.from("business_data")
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
    const { error } = await supabaseAny.from("business_data")
      .update({
        status: "deleted",
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", id);

    if (error) throw error;

    const { profileService } = await import("@/core/profiles");
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
    const { data, error } = await supabaseAny.from("business_products")
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
    console.warn("Failed to increment views:", error);
  }
}
