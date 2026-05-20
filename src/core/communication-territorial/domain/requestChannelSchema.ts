import { z } from "zod";
import type { RequestCommunicationChannelInput } from "../types";

const CHANNEL_KIND_VALUES = [
  "tv_bairro",
  "radio",
  "portal",
  "collective",
  "newspaper",
  "public_utility",
  "other",
] as const;

const phoneRegex = /^[+()\d\s-]{8,25}$/;

function trimToUndefined(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeUrl(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol;
}

const optionalUrlSchema = z.preprocess(
  normalizeUrl,
  z.string().url("URL invalida").max(500, "URL muito longa").optional(),
);

export const requestCommunicationChannelSchema = z.object({
  requested_profile_id: z.preprocess(
    trimToUndefined,
    z.string().uuid("Perfil invalido").optional(),
  ),
  public_name: z
    .string()
    .trim()
    .min(3, "Nome publico deve ter no minimo 3 caracteres")
    .max(120, "Nome publico deve ter no maximo 120 caracteres"),
  channel_kind: z.enum(CHANNEL_KIND_VALUES, {
    required_error: "Tipo de canal e obrigatorio",
  }),
  description: z
    .string()
    .trim()
    .min(20, "Descricao deve ter no minimo 20 caracteres")
    .max(2000, "Descricao deve ter no maximo 2000 caracteres"),
  website_url: optionalUrlSchema,
  contact_email: z
    .string()
    .trim()
    .email("Email invalido")
    .max(255, "Email muito longo")
    .toLowerCase(),
  contact_phone: z.preprocess(
    trimToUndefined,
    z
      .string()
      .regex(phoneRegex, "Telefone invalido")
      .optional(),
  ),
  requested_location_id: z.string().uuid("Territorio invalido"),
});

export type RequestCommunicationChannelSchema = z.infer<
  typeof requestCommunicationChannelSchema
>;

export function parseRequestCommunicationChannelInput(
  input: RequestCommunicationChannelInput,
): RequestCommunicationChannelSchema {
  const result = requestCommunicationChannelSchema.safeParse(input);
  if (result.success) return result.data;

  const firstIssue = result.error.issues[0];
  throw new Error(firstIssue?.message || "Dados invalidos para solicitacao de canal.");
}
