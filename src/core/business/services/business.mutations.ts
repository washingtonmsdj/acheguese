/**
 * BUSINESS MUTATIONS - lifecycle owner de empresas.
 *
 * Escritas do agregado Business passam pelo profile-rpc. Address permanece um
 * agregado separado, protegido por owner_user_id/RLS. NetworkService continua
 * sendo a única autoridade para brand hubs e filiais.
 */
import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";
import { PublicViewTrackingService } from "@/core/analytics/services/PublicViewTrackingService";
import { PublicIdentityService } from "@/core/public-identity";
import {
  evaluateBusinessSlugSafety,
  isBusinessSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/businessSlugSafety";
import { AddressService } from "@/core/address/services/AddressService";
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
import { toBusinessData } from "./business.mappers";
import { BusinessUrlService } from "./BusinessUrlService";
import { getBusinessById } from "./business.queries";
import { normalizeMediaAssetReference } from "@/core/media/references/mediaAssetReference";
import { EntityContactService } from "@/core/contact";
import { SessionService } from "@/core/session/services/SessionService";
import { ProfileRpcService } from "@/core/profiles/services/ProfileRpcService";
import type {
  Business,
  CreateBusinessInput,
  CreateProductInput,
  Product,
  UpdateBusinessInput,
} from "../types";

interface BusinessBrokerResult {
  success: boolean;
  data?: {
    profile_id: string;
    business_data_id: string;
    slug?: string | null;
    status?: string | null;
  };
  error?: string;
}

const STRUCTURAL_FIELDS = [
  "business_role",
  "parent_business_id",
  "is_headquarters",
  "unit_name",
] as const;

function getDayIndex(day: string): number | undefined {
  switch (day) {
    case "domingo": return 0;
    case "segunda": return 1;
    case "terca": return 2;
    case "quarta": return 3;
    case "quinta": return 4;
    case "sexta": return 5;
    case "sabado": return 6;
    default: return undefined;
  }
}

function sanitizeOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
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
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => sanitizeString(typeof item === "string" ? item : ""))
    .filter(Boolean);
}

function sanitizeAndValidateInput(
  input: CreateBusinessInput | UpdateBusinessInput,
  isUpdate = false,
): CreateBusinessInput | UpdateBusinessInput {
  const foundedYearRaw = (input as Record<string, unknown>).founded_year;
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
    logo_url: normalizeMediaAssetReference(input.logo_url, "business_logo"),
    banner_url: normalizeMediaAssetReference(input.banner_url, "business_banner"),
    status: input.status,
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

function hasStructuredAddress(
  input: CreateBusinessInput | UpdateBusinessInput,
): boolean {
  return Boolean(
    input.address_street ||
      input.address_number ||
      input.address_complement ||
      input.postal_code,
  );
}

function assertGeneralLifecycleStructure(
  input: CreateBusinessInput | UpdateBusinessInput,
  isUpdate: boolean,
): void {
  if (isUpdate) {
    const structuralField = STRUCTURAL_FIELDS.find((field) =>
      Object.prototype.hasOwnProperty.call(input, field),
    );
    if (structuralField) {
      throw new Error(
        `Campo estrutural ${structuralField} pertence ao NetworkService`,
      );
    }
    return;
  }

  if (input.business_role !== undefined && input.business_role !== "standalone") {
    throw new Error("Brand hubs e filiais devem ser criados pelo NetworkService");
  }

  if (
    input.parent_business_id != null ||
    input.is_headquarters === true ||
    input.unit_name !== undefined
  ) {
    throw new Error("Estrutura de rede deve ser criada pelo NetworkService");
  }
}

async function syncAddress(
  input: CreateBusinessInput | UpdateBusinessInput,
  actorUserId: string,
  existingAddressId?: string | null,
): Promise<{ addressId?: string; created: boolean }> {
  if (input.address_id !== undefined) {
    return { addressId: input.address_id ?? undefined, created: false };
  }

  if (!hasStructuredAddress(input)) {
    return { addressId: existingAddressId ?? undefined, created: false };
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
    return { addressId: address.id, created: false };
  }

  const address = await addressService.createAddress({
    ...payload,
    owner_user_id: actorUserId,
  });
  return { addressId: address.id, created: true };
}

function toBusinessHoursRows(hours: unknown): Array<{
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  is_closed: boolean;
}> {
  if (!hours || typeof hours !== "object") return [];

  return Object.entries(
    hours as Record<string, { open?: string; close?: string; closed?: boolean }>,
  )
    .map(([day, value]) => {
      const dayOfWeek = getDayIndex(day.toLowerCase());
      if (dayOfWeek === undefined) return null;
      return {
        day_of_week: dayOfWeek,
        opens_at: value.closed ? "00:00" : value.open || "00:00",
        closes_at: value.closed ? "00:00" : value.close || "00:00",
        is_closed: Boolean(value.closed),
      };
    })
    .filter(
      (
        value,
      ): value is {
        day_of_week: number;
        opens_at: string;
        closes_at: string;
        is_closed: boolean;
      } => Boolean(value),
    );
}

function buildBusinessBrokerPatch(
  input: CreateBusinessInput | UpdateBusinessInput,
  addressId?: string,
  slug?: string,
  create = false,
): Record<string, unknown> {
  const mapped = toBusinessData({
    ...input,
    ...(addressId !== undefined ? { address_id: addressId } : {}),
    ...(slug !== undefined ? { slug } : {}),
  });

  const patch = { ...mapped } as Record<string, unknown>;
  delete patch.opening_hours;
  delete patch.business_hours;
  delete patch.business_role;
  delete patch.parent_business_id;
  delete patch.is_headquarters;
  delete patch.unit_name;

  if (create) {
    patch.business_name = input.name;
    patch.slug = slug;
    patch.status = input.status ?? "active";
  }

  return Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  );
}

function buildContactChannels(
  input: CreateBusinessInput | UpdateBusinessInput,
): Array<Record<string, unknown>> {
  return EntityContactService.buildPatch(input).map((channel) => ({
    channelType: channel.channelType,
    value: channel.value,
    visibility: channel.visibility,
  }));
}

async function cleanupUnattachedAddress(addressId?: string): Promise<void> {
  if (!addressId) return;
  try {
    await new AddressService().deleteAddress(addressId);
  } catch (error) {
    logger.error("[business.mutations] address compensation incomplete", {
      addressId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function createBusiness(
  input: CreateBusinessInput,
): Promise<Business> {
  let createdAddressId: string | undefined;
  let businessWriteCompleted = false;

  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("Autenticacao obrigatoria para criar empresa");
    }

    assertGeneralLifecycleStructure(input, false);
    const validatedInput = sanitizeAndValidateInput(
      input,
      false,
    ) as CreateBusinessInput;

    let slug = validatedInput.slug;
    if (slug) {
      if (!isBusinessSlugSafetyBypassAllowed({ isVerifiedOfficial: false })) {
        const slugSafety = evaluateBusinessSlugSafety({
          businessName: validatedInput.name,
          slug,
        });
        if (slugSafety.status === "review") {
          throw new Error(
            "O link publico esta muito diferente do nome do negocio. Ajuste para manter autenticidade.",
          );
        }
      }

      const availability = await PublicIdentityService.checkAvailability({
        identifier: slug,
        entityType: "business",
      });
      if (availability.status !== "available") {
        throw new Error(
          availability.message ||
            `Slug "${slug}" nao esta disponivel.` +
              (availability.suggestion
                ? ` Sugestao: ${availability.suggestion}`
                : ""),
        );
      }
    } else {
      slug = await BusinessUrlService.generateUniqueSlug(validatedInput.name);
    }

    const address = await syncAddress(validatedInput, user.id);
    if (address.created) createdAddressId = address.addressId;

    const businessPatch = buildBusinessBrokerPatch(
      validatedInput,
      address.addressId,
      slug,
      true,
    );
    const contactChannels = buildContactChannels(validatedInput);
    const businessHours =
      validatedInput.horario_funcionamento !== undefined
        ? toBusinessHoursRows(validatedInput.horario_funcionamento)
        : null;

    const result = await ProfileRpcService.createBusiness<BusinessBrokerResult>({
      businessPatch,
      contactChannels,
      businessHours,
    });
    if (!result.success || !result.data?.profile_id) {
      throw new Error(result.error || "Broker nao retornou a empresa criada");
    }

    businessWriteCompleted = true;
    return await getBusinessById(result.data.profile_id);
  } catch (error) {
    if (createdAddressId && !businessWriteCompleted) {
      await cleanupUnattachedAddress(createdAddressId);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao criar empresa: ${message}`);
  }
}

export async function updateBusiness(
  id: string,
  input: UpdateBusinessInput,
): Promise<Business> {
  let createdAddressId: string | undefined;
  let businessWriteCompleted = false;

  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      throw new Error("Autenticacao obrigatoria para atualizar empresa");
    }

    assertGeneralLifecycleStructure(input, true);
    const validatedInput = sanitizeAndValidateInput(
      input,
      true,
    ) as UpdateBusinessInput;

    const currentBusiness = await getBusinessById(id);
    const slugChanged =
      validatedInput.slug !== undefined &&
      currentBusiness.slug !== validatedInput.slug;

    if (slugChanged) {
      if (
        !isBusinessSlugSafetyBypassAllowed({
          isVerifiedOfficial: Boolean(currentBusiness.is_verified),
        })
      ) {
        const slugSafety = evaluateBusinessSlugSafety({
          businessName: validatedInput.name ?? currentBusiness.name,
          slug: validatedInput.slug,
        });
        if (slugSafety.status === "review") {
          throw new Error(
            "O link publico esta muito diferente do nome do negocio. Ajuste para manter autenticidade.",
          );
        }
      }

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
              (availability.suggestion
                ? ` Sugestao: ${availability.suggestion}`
                : ""),
        );
      }
    }

    const updateAddressInput: UpdateBusinessInput = {
      ...validatedInput,
      location_id:
        validatedInput.location_id ??
        currentBusiness.location_id ??
        undefined,
    };
    const address = await syncAddress(
      updateAddressInput,
      user.id,
      currentBusiness.address_id,
    );
    if (address.created) createdAddressId = address.addressId;

    const addressTouched =
      validatedInput.address_id !== undefined ||
      hasStructuredAddress(validatedInput);
    const businessPatch = buildBusinessBrokerPatch(
      validatedInput,
      addressTouched ? address.addressId : undefined,
      slugChanged ? validatedInput.slug : undefined,
      false,
    );
    if (
      validatedInput.location_id !== undefined &&
      businessPatch.location_id === undefined
    ) {
      businessPatch.location_id = validatedInput.location_id;
    }

    const contactPatch = buildContactChannels(validatedInput);
    const businessHours =
      validatedInput.horario_funcionamento !== undefined
        ? toBusinessHoursRows(validatedInput.horario_funcionamento)
        : null;

    const result = await ProfileRpcService.updateBusiness<BusinessBrokerResult>(
      id,
      {
        businessPatch,
        contactChannels: contactPatch.length > 0 ? contactPatch : null,
        businessHours,
      },
    );
    if (!result.success) {
      throw new Error(result.error || "Broker rejeitou atualizacao da empresa");
    }

    businessWriteCompleted = true;
    return await getBusinessById(id);
  } catch (error) {
    if (createdAddressId && !businessWriteCompleted) {
      await cleanupUnattachedAddress(createdAddressId);
    }
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao atualizar empresa: ${message}`);
  }
}

export async function deleteBusiness(id: string): Promise<void> {
  try {
    const result =
      await ProfileRpcService.deactivateBusiness<BusinessBrokerResult>(id);
    if (!result.success) {
      throw new Error(result.error || "Broker rejeitou exclusao da empresa");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Erro ao deletar empresa: ${message}`);
  }
}

export async function createProduct(
  businessId: string,
  productData: CreateProductInput,
): Promise<Product> {
  if (!isValidBusinessId(businessId)) {
    throw new Error("ID de empresa invalido");
  }

  try {
    const { data, error } = await supabase
      .from("business_products")
      .insert({
        profile_id: businessId,
        nome: productData.nome,
        descricao: productData.descricao || null,
        preco: productData.preco,
        preco_promocional: productData.preco_promocional ?? null,
        imagem: productData.imagem || null,
        categoria: productData.categoria || null,
        estoque: productData.estoque ?? 0,
        ativo: productData.ativo ?? true,
        destaque: productData.destaque ?? false,
        promocao: productData.promocao ?? false,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Erro ao carregar produto criado");

    return {
      id: data.id,
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

export async function incrementViews(businessId: string): Promise<void> {
  try {
    await PublicViewTrackingService.track("business", businessId);
  } catch (error) {
    logger.warn("Failed to increment views:", error);
  }
}
