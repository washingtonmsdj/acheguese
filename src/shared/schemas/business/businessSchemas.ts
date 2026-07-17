/**
 * BUSINESS VALIDATION SCHEMAS - Validacao Centralizada SSOT
 *
 * Schema canonico compartilhado para formulario, hooks e services.
 */

import { z } from "zod";
import { BUSINESS_CATEGORIES } from "@/shared/taxonomy/businessCategories";
import { normalizeMediaAssetReference } from "@/shared/media/mediaAssetReference";

export { BUSINESS_CATEGORIES } from "@/shared/taxonomy/businessCategories";

export const BUSINESS_COMPANY_TYPES = [
  "mei",
  "ltda",
  "sa",
  "eireli",
  "other",
] as const;

export const BUSINESS_EMPLOYEE_COUNTS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
] as const;

export const BUSINESS_ROLES = ["standalone", "brand_hub", "branch"] as const;

const currentYear = new Date().getFullYear();
const phoneRegex = /^[+()\d\s-]{10,20}$/;
const cepRegex = /^\d{5}-?\d{3}$/;
const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;

const isSafeSlug = (value: string): boolean => {
  if (!value || value.startsWith("-") || value.endsWith("-") || value.includes("--")) {
    return false;
  }

  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    const isLowerAlpha = code >= 97 && code <= 122;
    const isHyphen = code === 45;

    if (!isDigit && !isLowerAlpha && !isHyphen) {
      return false;
    }
  }

  return true;
};

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const optionalTrimmedString = (max: number, message?: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().max(max, message ?? `Maximo de ${max} caracteres`).trim().optional(),
  );

const optionalMediaAssetReference = (
  preset: "business_logo" | "business_banner",
) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .string()
      .refine(
        (value) => normalizeMediaAssetReference(value, preset) !== undefined,
        "Referencia de midia invalida",
      )
      .optional(),
  );

const optionalPhone = z.preprocess(
  emptyStringToUndefined,
  z.string().regex(phoneRegex, "Telefone invalido").optional(),
);

const optionalEmail = z.preprocess(
  emptyStringToUndefined,
  z.string().email("Email invalido").optional(),
);

const optionalUrl = z.preprocess(
  emptyStringToUndefined,
  z.string().url("URL invalida").optional(),
);

const optionalCep = z.preprocess(
  emptyStringToUndefined,
  z.string().regex(cepRegex, "CEP invalido").optional(),
);

const optionalSlug = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toLowerCase();
    return normalized === "" ? undefined : normalized;
  },
  z
    .string()
    .min(3, "Slug deve ter no minimo 3 caracteres")
    .max(60, "Slug deve ter no maximo 60 caracteres")
    .refine(isSafeSlug, "Use apenas letras minusculas, numeros e hifens")
    .optional(),
);

const optionalCnpj = z.preprocess(
  emptyStringToUndefined,
  z.string().regex(cnpjRegex, "CNPJ invalido").optional(),
);

const stringArraySchema = z
  .array(z.string().trim().min(1))
  .transform((items) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))));

const businessHoursDaySchema = z.object({
  open: z.string().regex(/^\d{2}:\d{2}$/, "Hora de abertura invalida"),
  close: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fechamento invalida"),
  closed: z.boolean().optional(),
});

const businessHoursSchema = z.record(businessHoursDaySchema);

const baseBusinessObjectSchema = z.object({
    name: z
      .string()
      .min(3, "Nome deve ter no minimo 3 caracteres")
      .max(100, "Nome deve ter no maximo 100 caracteres")
      .trim(),

    legal_name: optionalTrimmedString(150, "Razao social deve ter no maximo 150 caracteres"),
    cnpj: optionalCnpj,
    company_type: z.enum(BUSINESS_COMPANY_TYPES).optional(),
    industry: optionalTrimmedString(100, "Segmento deve ter no maximo 100 caracteres"),
    employee_count: z.enum(BUSINESS_EMPLOYEE_COUNTS).optional(),
    founded_year: z
      .number()
      .int("Ano de fundacao invalido")
      .min(1800, "Ano de fundacao invalido")
      .max(currentYear, "Ano de fundacao nao pode ser no futuro")
      .optional(),

    description: z
      .string()
      .min(10, "Descricao deve ter no minimo 10 caracteres")
      .max(1000, "Descricao deve ter no maximo 1000 caracteres")
      .trim(),

    category: z.enum(BUSINESS_CATEGORIES, {
      required_error: "Categoria e obrigatoria",
    }),

    subcategoria: optionalTrimmedString(80, "Subcategoria deve ter no maximo 80 caracteres"),
    slug: optionalSlug,

    phone: optionalPhone,
    whatsapp: optionalPhone,
    email: optionalEmail,
    website: optionalUrl,
    instagram: optionalTrimmedString(120, "Instagram deve ter no maximo 120 caracteres"),
    facebook: optionalTrimmedString(200, "Facebook deve ter no maximo 200 caracteres"),

    // Modelo canonico
    address_id: z.string().uuid().optional(),
    location_id: z.preprocess(emptyStringToUndefined, z.string().uuid().optional()),
    city: optionalTrimmedString(100, "Cidade deve ter no maximo 100 caracteres"),
    state: optionalTrimmedString(100, "Estado deve ter no maximo 100 caracteres"),
    postal_code: optionalCep,
    address_street: optionalTrimmedString(160, "Rua deve ter no maximo 160 caracteres"),
    address_number: optionalTrimmedString(20, "Numero deve ter no maximo 20 caracteres"),
    address_complement: optionalTrimmedString(120, "Complemento deve ter no maximo 120 caracteres"),

    // Campos legados de compatibilidade
    address: optionalTrimmedString(240, "Endereco deve ter no maximo 240 caracteres"),
    neighborhood: optionalTrimmedString(100, "Bairro deve ter no maximo 100 caracteres"),
    cep: optionalCep,
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    business_role: z.enum(BUSINESS_ROLES).optional(),
    parent_business_id: z.preprocess(emptyStringToUndefined, z.string().uuid().nullable().optional()),
    is_headquarters: z.boolean().optional(),
    unit_name: optionalTrimmedString(80, "Nome da unidade deve ter no maximo 80 caracteres"),

    horario_funcionamento: businessHoursSchema.optional(),

    formas_pagamento: stringArraySchema.optional(),
    especialidades: stringArraySchema.optional(),
    facilidades: stringArraySchema.optional(),
    modos_atendimento: stringArraySchema.optional(),

    tem_delivery: z.boolean().optional(),
    aceita_cartao: z.boolean().optional(),
    aceita_pix: z.boolean().optional(),
    can_post_vagas: z.boolean().optional(),

    logo_url: optionalMediaAssetReference("business_logo"),
    banner_url: optionalMediaAssetReference("business_banner"),

    status: z.enum(["active", "inactive", "pending", "suspended"]).optional(),

    /** Campos administrativos — apenas super_admin/admin */
    is_verified: z.boolean().optional(),
    is_premium: z.boolean().optional(),
  });

function applyBusinessRules<T extends z.AnyZodObject>(
  schema: T,
  options: {
    requireLocation?: boolean;
    requireContactChannel?: boolean;
  } = {},
): z.ZodEffects<T, z.infer<T>, z.input<T>> {
  return schema.superRefine((data, ctx) => {
    const businessRole = data.business_role ?? "standalone";
    const hasContactChannel = Boolean(
      data.phone || data.whatsapp || data.email || data.website,
    );
    const hasAddressDetails = Boolean(
      data.address_street || data.address_number || data.address_complement || data.postal_code,
    );

    if (options.requireLocation && businessRole !== "brand_hub" && !data.location_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location_id"],
        message: "Selecione o territorio principal da empresa",
      });
    }

    if (businessRole === "branch" && !data.parent_business_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parent_business_id"],
        message: "Filiais precisam informar a empresa matriz",
      });
    }

    if (options.requireContactChannel && !hasContactChannel) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Informe pelo menos um canal de contato",
      });
    }

    if (hasAddressDetails && !data.address_street) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["address_street"],
        message: "Informe a rua para cadastrar o endereco fisico",
      });
    }
  });
}

export const createBusinessSchema = applyBusinessRules(baseBusinessObjectSchema, {
  requireLocation: true,
  requireContactChannel: true,
});

export const createBusinessStep1Schema = baseBusinessObjectSchema.pick({
  name: true,
  legal_name: true,
  cnpj: true,
  category: true,
  subcategoria: true,
  company_type: true,
  employee_count: true,
  founded_year: true,
  industry: true,
  description: true,
  slug: true,
});

export const createBusinessStep2Schema = applyBusinessRules(
  baseBusinessObjectSchema.pick({
    phone: true,
    whatsapp: true,
    email: true,
    website: true,
    location_id: true,
    address_street: true,
    address_number: true,
    address_complement: true,
    postal_code: true,
    horario_funcionamento: true,
    modos_atendimento: true,
  }),
  {
    requireLocation: true,
    requireContactChannel: true,
  },
);

export const updateBusinessSchema = applyBusinessRules(baseBusinessObjectSchema.partial());

export const businessUXSchema = baseBusinessObjectSchema.pick({
  name: true,
  description: true,
  category: true,
  location_id: true,
  phone: true,
  whatsapp: true,
  email: true,
  website: true,
});

export const getBusinessesSchema = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  verified: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
export type BusinessUXInput = z.infer<typeof businessUXSchema>;
export type GetBusinessesInput = z.infer<typeof getBusinessesSchema>;

export const businessSchema = createBusinessSchema;
export type BusinessInput = CreateBusinessInput;
