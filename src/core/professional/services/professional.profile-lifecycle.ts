import { supabase } from "@/integrations/supabase";
import { PublicIdentityService } from "@/core/public-identity";
import { profileService } from "@/core/profiles/services/ProfileService";
import {
  evaluateProfessionalSlugSafety,
  isProfessionalSlugSafetyBypassAllowed,
} from "@/core/public-identity/domain/professionalSlugSafety";
import {
  createProfessionalSchema,
  updateProfessionalSchema,
} from "@/shared/schemas/professional/professionalSchemas";
import {
  sanitizeString,
  sanitizeArray,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
} from "@/shared/utils/sanitization";
import { normalizeMediaAssetReference } from "@/core/media/references/mediaAssetReference";
import { EntityContactService } from "@/core/contact";
import { SessionService } from "@/core/session/services/SessionService";
import { ProfileMembersService } from "@/core/profiles/services/multi-profile/profileMembersService";
import type {
  Professional,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalDataRecord,
  ProfessionalMetadata,
} from "@/core/professional/types";
import {
  generateUniqueProfessionalSlug,
  getProfessionalById,
  validateAvailableProfessionalSlug,
} from "./professional.queries";

interface QueryError {
  message?: string | null;
}

interface QueryArrayResult<TRow> {
  data: TRow[] | null;
  error: QueryError | null;
}

interface QuerySingleResult<TRow> {
  data: TRow | null;
  error: QueryError | null;
}

interface QueryBuilder<TRow> extends PromiseLike<QueryArrayResult<TRow>> {
  select: (columns?: string) => QueryBuilder<TRow>;
  insert: (values: unknown | unknown[]) => QueryBuilder<TRow>;
  update: (values: unknown) => QueryBuilder<TRow>;
  eq: (column: string, value: unknown) => QueryBuilder<TRow>;
  or: (filters: string) => QueryBuilder<TRow>;
  maybeSingle: () => Promise<QuerySingleResult<TRow>>;
  single: () => Promise<QuerySingleResult<TRow>>;
}

interface ProfessionalProfileLifecycleDbClient {
  from: <TRow = never>(table: string) => QueryBuilder<TRow>;
}


interface ProfessionalDataIdentityRow {
  id: string;
  profile_id: string;
}

interface ProfessionalDataLifecycleRow extends ProfessionalDataIdentityRow {
  slug?: string | null;
  metadata?: ProfessionalMetadata | null;
  professional_name?: string | null;
  is_verified?: boolean | null;
}

interface ProfessionalStatsInsertRow {
  profile_id: string;
  views_count: number;
  contacts_count: number;
  favorites_count: number;
  shares_count: number;
  jobs_completed: number;
  response_rate: number;
  average_response_time: number;
}

const professionalProfileLifecycleDb =
  supabase as unknown as ProfessionalProfileLifecycleDbClient;

function sanitizeAndValidateInput(
  input: CreateProfessionalInput | UpdateProfessionalInput,
  isUpdate = false,
): CreateProfessionalInput | UpdateProfessionalInput {
  const sanitizedBase = {
    ...input,
    name: sanitizeString(input.name),
    description: sanitizeString(input.description),
    phone: sanitizePhone(input.phone),
    whatsapp: sanitizePhone(input.whatsapp),
    email: sanitizeEmail(input.email),
    website: sanitizeUrl(input.website),
    facebook: sanitizeUrl(input.facebook),
    linkedin: sanitizeUrl(input.linkedin),
    address: sanitizeString(input.address),
    neighborhood: sanitizeString(input.neighborhood),
    city: sanitizeString(input.city),
    state: sanitizeString(input.state),
    cep: sanitizeString(input.cep),
    education: sanitizeString(input.education),
    price_range: sanitizeString(input.price_range),
    availability_notes: sanitizeString(input.availability_notes),
    instagram: sanitizeString(input.instagram),
    logo_url: normalizeMediaAssetReference(input.logo_url, "professional_logo"),
    banner_url: normalizeMediaAssetReference(input.banner_url, "professional_banner"),
    portfolio_images: input.portfolio_images
      ? (input.portfolio_images
          .map((url) => normalizeMediaAssetReference(url, "professional_portfolio"))
          .filter(Boolean) as string[])
      : undefined,
    certifications: sanitizeArray(
      Array.isArray(input.certifications) ? input.certifications.join(",") : "",
    ),
    languages: sanitizeArray(
      Array.isArray(input.languages) ? input.languages.join(",") : "",
    ),
  };

  if (input.slug) {
    sanitizedBase.slug = PublicIdentityService.normalize(input.slug, "professional");
  }

  if (isUpdate) {
    const sanitizedUpdate: Partial<UpdateProfessionalInput> = {};
    if ("name" in input) sanitizedUpdate.name = sanitizedBase.name;
    if ("slug" in input) sanitizedUpdate.slug = sanitizedBase.slug;
    if ("category" in input) sanitizedUpdate.category = sanitizedBase.category;
    if ("subcategory" in input) sanitizedUpdate.subcategory = sanitizedBase.subcategory;
    if ("description" in input) sanitizedUpdate.description = sanitizedBase.description;
    if ("experience_years" in input) sanitizedUpdate.experience_years = sanitizedBase.experience_years;
    if ("phone" in input) sanitizedUpdate.phone = sanitizedBase.phone;
    if ("whatsapp" in input) sanitizedUpdate.whatsapp = sanitizedBase.whatsapp;
    if ("email" in input) sanitizedUpdate.email = sanitizedBase.email;
    if ("website" in input) sanitizedUpdate.website = sanitizedBase.website;
    if ("facebook" in input) sanitizedUpdate.facebook = sanitizedBase.facebook;
    if ("linkedin" in input) sanitizedUpdate.linkedin = sanitizedBase.linkedin;
    if ("address" in input) sanitizedUpdate.address = sanitizedBase.address;
    if ("neighborhood" in input) sanitizedUpdate.neighborhood = sanitizedBase.neighborhood;
    if ("city" in input) sanitizedUpdate.city = sanitizedBase.city;
    if ("state" in input) sanitizedUpdate.state = sanitizedBase.state;
    if ("cep" in input) sanitizedUpdate.cep = sanitizedBase.cep;
    if ("education" in input) sanitizedUpdate.education = sanitizedBase.education;
    if ("price_range" in input) sanitizedUpdate.price_range = sanitizedBase.price_range;
    if ("availability_notes" in input) sanitizedUpdate.availability_notes = sanitizedBase.availability_notes;
    if ("instagram" in input) sanitizedUpdate.instagram = sanitizedBase.instagram;
    if ("logo_url" in input) sanitizedUpdate.logo_url = sanitizedBase.logo_url;
    if ("banner_url" in input) sanitizedUpdate.banner_url = sanitizedBase.banner_url;
    if ("portfolio_images" in input) sanitizedUpdate.portfolio_images = sanitizedBase.portfolio_images;
    if ("certifications" in input) sanitizedUpdate.certifications = sanitizedBase.certifications;
    if ("languages" in input) sanitizedUpdate.languages = sanitizedBase.languages;
    if ("available_hours" in input) sanitizedUpdate.available_hours = sanitizedBase.available_hours;
    if ("location_id" in input) sanitizedUpdate.location_id = sanitizedBase.location_id;
    if ("address_id" in input) sanitizedUpdate.address_id = sanitizedBase.address_id;
    if ("is_accepting_clients" in input) sanitizedUpdate.is_accepting_clients = sanitizedBase.is_accepting_clients;
    if ("visibility" in input) sanitizedUpdate.visibility = sanitizedBase.visibility;

    const validation = updateProfessionalSchema.safeParse(sanitizedUpdate);
    if (!validation.success) {
      const errors = validation.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Dados invalidos: ${errors}`);
    }
    return validation.data;
  }

  const validation = createProfessionalSchema.safeParse(sanitizedBase);
  if (!validation.success) {
    const errors = validation.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    throw new Error(`Dados invalidos: ${errors}`);
  }

  return validation.data;
}

function toProfessionalData(
  input: CreateProfessionalInput | UpdateProfessionalInput,
  options: {
    mode: "create" | "update";
    currentMetadata?: ProfessionalMetadata | null;
  },
): Partial<ProfessionalDataRecord> {
  const result: Partial<ProfessionalDataRecord> = {};

  if (input.slug !== undefined) result.slug = input.slug;
  if (input.name !== undefined) result.professional_name = input.name;
  if (input.category !== undefined) result.service_category = input.category;
  if (input.subcategory !== undefined) result.service_subcategory = input.subcategory;
  if (input.description !== undefined) result.description = input.description;
  if (input.certifications !== undefined) result.certifications = input.certifications;
  if (input.experience_years !== undefined) result.experience_years = input.experience_years;
  if (input.education !== undefined) result.education = input.education;
  if (input.price_range !== undefined) result.price_range = input.price_range;
  if (input.available_hours !== undefined) result.available_hours = input.available_hours;
  if (input.availability_notes !== undefined) result.availability_notes = input.availability_notes;
  if (input.location_id !== undefined) result.location_id = input.location_id;
  if (input.address_id !== undefined) result.address_id = input.address_id;
  if (input.visibility !== undefined) result.visibility = input.visibility;

  if (input.is_accepting_clients !== undefined) {
    result.is_accepting_clients = input.is_accepting_clients;
  } else if (options.mode === "create") {
    result.is_accepting_clients = true;
  }

  const metadata: ProfessionalMetadata = { ...(options.currentMetadata ?? {}) };
  delete metadata.location;
  delete metadata.portfolio_images;

  if (input.logo_url !== undefined) metadata.logo_url = input.logo_url;
  if (input.banner_url !== undefined) metadata.banner_url = input.banner_url;
  if (input.portfolio_images !== undefined) {
    result.portfolio_items = input.portfolio_images.map((url, index) => ({
      url,
      media_type: "image" as const,
      is_cover: index === 0,
    }));
  } else if (options.mode === "create") {
    result.portfolio_items = [];
  }

  const socialLinks = {
    ...(typeof metadata.social_links === "object" ? metadata.social_links : {}),
  };
  if (input.instagram !== undefined) socialLinks.instagram = input.instagram;
  if (input.facebook !== undefined) socialLinks.facebook = input.facebook;
  if (input.linkedin !== undefined) socialLinks.linkedin = input.linkedin;
  if (input.website !== undefined) socialLinks.website = input.website;
  if (Object.keys(socialLinks).length > 0) metadata.social_links = socialLinks;

  if (input.languages !== undefined) {
    metadata.languages = input.languages;
  } else if (options.mode === "create") {
    metadata.languages = [];
  }

  if (options.mode === "create") {
    metadata.rating = metadata.rating ?? 0;
    metadata.total_reviews = metadata.total_reviews ?? 0;
    metadata.total_jobs = metadata.total_jobs ?? 0;
  }

  result.metadata = metadata;
  return result;
}

function generateProfessionalUsername(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "")
      .substring(0, 20) + "_pro"
  );
}

export async function createProfessionalWithProfile(
  input: CreateProfessionalInput,
): Promise<Professional> {
  const user = await SessionService.getCurrentUser();
  if (!user) throw new Error("Autenticacao obrigatoria para cadastrar profissional");

  const validatedInput = sanitizeAndValidateInput(input, false) as CreateProfessionalInput;
  const slug = validatedInput.slug
    ? await validateAvailableProfessionalSlug(validatedInput.slug)
    : await generateUniqueProfessionalSlug(validatedInput.name);

  if (!isProfessionalSlugSafetyBypassAllowed({ isVerifiedProfessional: false })) {
    const slugSafety = evaluateProfessionalSlugSafety({
      professionalName: validatedInput.name,
      slug,
    });
    if (slugSafety.status === "review") {
      throw new Error(
        "O link publico esta muito diferente do nome do profissional. Ajuste o link para manter autenticidade.",
      );
    }
  }

  if (!validatedInput.location_id) {
    throw new Error("location_id e obrigatorio para cadastrar profissional.");
  }

  const profile = await profileService.createProfile({
    profile_type: "professional",
    name: validatedInput.name,
    username: generateProfessionalUsername(validatedInput.name),
    city: validatedInput.city || "Nao informado",
    bio: validatedInput.description,
  });
  if (!profile) throw new Error("Erro ao criar perfil do profissional");

  const memberResult = await ProfileMembersService.addMember(
    profile.id,
    user.id,
    "owner",
  );
  if (!memberResult.success) {
    throw new Error(
      memberResult.error || "Erro ao registrar owner do perfil profissional",
    );
  }

  const professionalData = toProfessionalData({ ...validatedInput, slug }, { mode: "create" });
  const { data: professionalRow, error } = await professionalProfileLifecycleDb
    .from<ProfessionalDataIdentityRow>("professional_data")
    .insert({
      profile_id: profile.id,
      ...professionalData,
      rating: 0,
    })
    .select("id")
    .single();

  if (error) throw error;

  await EntityContactService.patchOwnedChannels(
    "professional",
    professionalRow.id,
    EntityContactService.buildPatch(validatedInput),
  );

  await professionalProfileLifecycleDb
    .from<ProfessionalStatsInsertRow>("professional_stats")
    .insert({
      profile_id: profile.id,
      views_count: 0,
      contacts_count: 0,
      favorites_count: 0,
      shares_count: 0,
      jobs_completed: 0,
      response_rate: 0,
      average_response_time: 0,
    });

  return getProfessionalById(professionalRow.id);
}

export async function updateProfessionalWithProfile(
  id: string,
  input: UpdateProfessionalInput,
): Promise<Professional> {
  const validatedInput = sanitizeAndValidateInput(input, true) as UpdateProfessionalInput;
  const { data: currentProfessional, error: currentError } =
    await professionalProfileLifecycleDb
      .from<ProfessionalDataLifecycleRow>("professional_data")
    .select("id, profile_id, slug, metadata, professional_name, is_verified")
    .or(`profile_id.eq.${id},id.eq.${id}`)
    .maybeSingle();

  if (currentError) throw currentError;
  if (!currentProfessional) throw new Error("Profissional nao encontrado");

  const professionalData = toProfessionalData(validatedInput, {
    mode: "update",
    currentMetadata: currentProfessional.metadata as ProfessionalMetadata,
  });
  const updatePayload: Partial<ProfessionalDataRecord> & { updated_at: string } = {
    ...professionalData,
    updated_at: new Date().toISOString(),
  };
  delete updatePayload.slug;

  if (validatedInput.name) {
    await profileService.updateProfile(currentProfessional.profile_id, {
      name: validatedInput.name,
      bio: validatedInput.description,
    });
  }

  if (validatedInput.slug !== undefined && validatedInput.slug !== currentProfessional.slug) {
    if (
      !isProfessionalSlugSafetyBypassAllowed({
        isVerifiedProfessional: Boolean(currentProfessional.is_verified),
      })
    ) {
      const slugSafety = evaluateProfessionalSlugSafety({
        professionalName:
          validatedInput.name ?? currentProfessional.professional_name ?? "",
        slug: validatedInput.slug,
      });
      if (slugSafety.status === "review") {
        throw new Error(
          "O link publico esta muito diferente do nome do profissional. Ajuste o link para manter autenticidade.",
        );
      }
    }

    const cooldown = await PublicIdentityService.canChangeIdentifier({
      entityType: "professional",
      entityId: currentProfessional.id,
    });
    if (!cooldown.canChange) {
      throw new Error(
        `Nao e possivel alterar o slug do profissional agora. Aguarde ${cooldown.daysRemaining || 0} dia(s).`,
      );
    }

    const availability = await PublicIdentityService.checkAvailability({
      identifier: validatedInput.slug,
      entityType: "professional",
      excludeEntityId: currentProfessional.id,
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

  const { error } = await professionalProfileLifecycleDb
    .from<ProfessionalDataRecord>("professional_data")
    .update(updatePayload)
    .eq("profile_id", currentProfessional.profile_id);
  if (error) throw error;

  const contactPatch = EntityContactService.buildPatch(validatedInput);
  if (contactPatch.length > 0) {
    await EntityContactService.patchOwnedChannels(
      "professional",
      currentProfessional.id,
      contactPatch,
    );
  }

  return getProfessionalById(currentProfessional.id);
}

export async function deleteProfessionalWithProfile(id: string): Promise<void> {
  const { data: professional, error: resolveError } =
    await professionalProfileLifecycleDb
      .from<ProfessionalDataIdentityRow>("professional_data")
    .select("id, profile_id")
    .or(`profile_id.eq.${id},id.eq.${id}`)
    .maybeSingle();

  if (resolveError) throw resolveError;
  if (!professional) throw new Error("Profissional nao encontrado");

  const { error } = await professionalProfileLifecycleDb
    .from<ProfessionalDataRecord>("professional_data")
    .update({
      is_accepting_clients: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", professional.id);
  if (error) throw error;

  try {
    await profileService.updateProfile(professional.profile_id, { is_active: false });
  } catch {
    // Best effort: profile may no longer exist.
  }
}
