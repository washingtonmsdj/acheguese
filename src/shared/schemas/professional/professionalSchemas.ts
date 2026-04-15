/**
 * 🧠 PROFESSIONAL VALIDATION SCHEMAS - SSOT
 *
 * ✅ Validação centralizada para profissionais
 * ✅ Reutilizável em create/update
 * ✅ Baseado no padrão BusinessService
 * ✅ Sanitização + validação dupla
 *
 * @version 1.0.0 - SSOT Migration
 */

import { z } from "zod";

// ============================================================================
// BASE SCHEMAS
// ============================================================================

const professionalCategorySchema = z.enum([
  "eletricista",
  "encanador",
  "pedreiro",
  "pintor",
  "diarista",
  "tecnico_celular",
  "mecanico",
  "chaveiro",
  "jardineiro",
  "saude",
  "beleza",
  "educacao",
  "tecnologia",
  "construcao",
  "consultoria",
  "design",
  "fotografia",
  "juridico",
  "contabilidade",
  "outros",
]);

const professionalStatusSchema = z.enum([
  "active",
  "inactive",
  "pending",
  "suspended",
]);

// ============================================================================
// FIELD SCHEMAS
// ============================================================================

const nameSchema = z
  .string()
  .min(2, "Nome deve ter pelo menos 2 caracteres")
  .max(255, "Nome deve ter no máximo 255 caracteres")
  .trim();

const descriptionSchema = z
  .string()
  .max(2000, "Descrição deve ter no máximo 2000 caracteres")
  .trim()
  .optional();

const phoneSchema = z
  .string()
  .min(8, "Telefone deve ter pelo menos 8 dígitos")
  .max(20, "Telefone inválido")
  .optional();

const emailSchema = z
  .string()
  .email("Email inválido")
  .max(255, "Email deve ter no máximo 255 caracteres")
  .toLowerCase()
  .optional();

const urlSchema = z
  .string()
  .url("URL inválida")
  .max(500, "URL deve ter no máximo 500 caracteres")
  .optional();

const slugSchema = z
  .string()
  .min(2, "Slug deve ter pelo menos 2 caracteres")
  .max(100, "Slug deve ter no maximo 100 caracteres")
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, "Slug invalido")
  .optional();

const cepSchema = z
  .string()
  .regex(/^\d{5}-?\d{3}$/, "CEP deve estar no formato XXXXX-XXX")
  .optional();

const coordinateSchema = z
  .number()
  .min(-180, "Coordenada inválida")
  .max(180, "Coordenada inválida")
  .optional();

const arrayStringSchema = z
  .array(z.string().trim().min(1))
  .max(20, "Máximo 20 itens permitidos")
  .default([]);

const experienceYearsSchema = z
  .number()
  .int("Anos de experiência deve ser um número inteiro")
  .min(0, "Anos de experiência não pode ser negativo")
  .max(50, "Anos de experiência deve ser no máximo 50")
  .optional();

const serviceRadiusSchema = z
  .number()
  .min(0, "Raio de atendimento não pode ser negativo")
  .max(500, "Raio de atendimento deve ser no máximo 500km")
  .optional();

// ============================================================================
// BASE PROFESSIONAL SCHEMA
// ============================================================================

const baseProfessionalSchema = z.object({
  // Required fields
  name: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  category: professionalCategorySchema,

  // Optional basic info
  subcategory: z.string().max(100).trim().optional(),

  // Contact
  phone: phoneSchema,
  whatsapp: phoneSchema,
  email: emailSchema,

  // ETAPA 10: Campos canônicos (prioridade)
  /** FK para addresses (endereço físico do consultório/escritório) */
  address_id: z.string().uuid().optional(),
  /** FK para locations (território principal de atuação) */
  location_id: z.string().uuid().optional(),

  // Location legada (transitório)
  address: z.string().max(500).trim().optional(),
  neighborhood: z.string().max(100).trim().optional(),
  city: z.string().max(100).trim().optional(),
  state: z.string().max(50).trim().optional(),
  cep: cepSchema,
  latitude: coordinateSchema,
  longitude: coordinateSchema,

  // Professional Info
  certifications: arrayStringSchema,
  experience_years: experienceYearsSchema,
  education: z.string().max(1000).trim().optional(),
  price_range: z.string().max(50).trim().optional(),
  service_areas: arrayStringSchema,
  service_radius_km: serviceRadiusSchema,
  available_hours: z.record(z.any()).optional(),

  // Media
  logo_url: urlSchema,
  banner_url: urlSchema,
  portfolio_images: z
    .array(urlSchema)
    .max(10, "Máximo 10 imagens no portfólio")
    .default([]),

  // Social
  instagram: z.string().max(100).trim().optional(),
  facebook: urlSchema,
  linkedin: urlSchema,
  website: urlSchema,

  // Status
  is_accepting_clients: z.boolean().default(true),

  // Meta
  languages: arrayStringSchema,
});

// ============================================================================
// CREATE SCHEMA
// ============================================================================

export const createProfessionalSchema = baseProfessionalSchema.extend({
  name: nameSchema, // Required for create
  category: professionalCategorySchema, // Required for create
});

// ============================================================================
// UPDATE SCHEMA
// ============================================================================

export const updateProfessionalSchema = baseProfessionalSchema
  .partial()
  .extend({
    // All fields are optional for updates, but if provided, must be valid
  });

// ============================================================================
// FILTER SCHEMA
// ============================================================================

export const professionalFiltersSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  search: z.string().max(100).trim().optional(),
  city: z.string().max(100).trim().optional(),
  neighborhood: z.string().max(100).trim().optional(),
  is_verified: z.boolean().optional(),
  is_accepting_clients: z.boolean().optional(),
  price_range: z.string().max(50).optional(),
  has_portfolio: z.boolean().optional(),
  min_rating: z.number().min(0).max(5).optional(),
  sortBy: z
    .enum(["created_at", "rating", "name", "experience_years"])
    .default("created_at"),
  latitude: coordinateSchema,
  longitude: coordinateSchema,
  radius_km: z.number().min(0).max(100).optional(),
});

// ============================================================================
// JOB/SERVICE SCHEMAS
// ============================================================================

export const createProfessionalJobSchema = z.object({
  titulo: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(200),
  descricao: z.string().max(2000).trim().optional(),
  categoria: z.string().max(100).trim().optional(),
  preco: z.number().min(0, "Preço não pode ser negativo").optional(),
  duracao: z.string().max(100).trim().optional(),
  imagens: z
    .array(urlSchema)
    .max(5, "Máximo 5 imagens por serviço")
    .default([]),
  destaque: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

// ============================================================================
// REVIEW SCHEMA
// ============================================================================

export const createProfessionalReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating deve ser entre 1 e 5")
    .max(5, "Rating deve ser entre 1 e 5"),
  comment: z
    .string()
    .max(1000, "Comentário deve ter no máximo 1000 caracteres")
    .trim()
    .optional(),
  job_type: z.string().max(100).trim().optional(),
});

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type CreateProfessionalSchema = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalSchema = z.infer<typeof updateProfessionalSchema>;
export type ProfessionalFiltersSchema = z.infer<
  typeof professionalFiltersSchema
>;
export type CreateProfessionalJobSchema = z.infer<
  typeof createProfessionalJobSchema
>;
export type CreateProfessionalReviewSchema = z.infer<
  typeof createProfessionalReviewSchema
>;
