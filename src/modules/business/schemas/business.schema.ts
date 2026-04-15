/**
 * Business schema facade.
 *
 * Mantem compatibilidade com imports historicos, mas a fonte unica de
 * validacao agora vive em src/shared/schemas/business/businessSchemas.ts.
 */

export {
  businessSchema as CreateBusinessSchema,
  updateBusinessSchema as UpdateBusinessSchema,
  createBusinessSchema,
  updateBusinessSchema,
  businessUXSchema,
} from "@/shared/schemas/business/businessSchemas";

export type {
  CreateBusinessInput,
  UpdateBusinessInput,
  BusinessUXInput,
  BusinessInput,
} from "@/shared/schemas/business/businessSchemas";

import { z } from "zod";

export const GetBusinessesSchema = z.object({
  city: z.string().optional(),
  category: z.string().optional(),
  verified: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type GetBusinessesInput = z.infer<typeof GetBusinessesSchema>;
