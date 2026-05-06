/**
 * USE BUSINESS CREATE MULTI-PROFILE
 *
 * Cria o profile business via RPC e, em seguida, sincroniza todo o dominio
 * canonico em business_data pelo BusinessService.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MultiProfileService } from "@/core/profiles/services/multi-profile";
import { BusinessService } from "@/core/business/services/BusinessService";
import { createBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { toast } from "sonner";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { mediaService } from "@/core/media/services/MediaService";
import { PublicIdentityService } from "@/core/public-identity/services/PublicIdentityService";
import type { CreateBusinessInput } from "@/modules/business/types";
import { BusinessUrlService } from "@/core/business/services/BusinessUrlService";

export interface BusinessCreateResult {
  profile_id: string;
  handle: string;
  business_data_id: string | null;
}

export interface CreateBusinessSubmission {
  data: CreateBusinessInput;
  logoFile?: File | null;
  bannerFile?: File | null;
}

interface UseBusinessCreateOptions {
  onSuccess?: (result: BusinessCreateResult) => void;
  onError?: (error: Error) => void;
}

interface UseBusinessCreateReturn {
  createBusiness: (payload: CreateBusinessSubmission) => void;
  createBusinessAsync: (payload: CreateBusinessSubmission) => Promise<BusinessCreateResult>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: BusinessCreateResult | undefined;
  reset: () => void;
}

function isLikelyDuplicateHandleError(error: string): boolean {
  return /duplicate|already exists|unique/i.test(error);
}

async function createProfileWithHandleFallback(params: {
  handleBase: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  extension_data: Record<string, unknown>;
}): Promise<{ profile_id: string; handle: string }> {
  const baseHandle = params.handleBase.slice(0, 30);
  const fallbackHandle = `${baseHandle.slice(0, 24)}-${Date.now().toString().slice(-5)}`;

  const handles = [baseHandle, fallbackHandle].filter(
    (handle, index, array) => handle && array.indexOf(handle) === index,
  );

  for (let index = 0; index < handles.length; index += 1) {
    const handle = handles[index];
    const result = await MultiProfileService.createProfile({
      profile_type: "business",
      handle,
      display_name: params.displayName,
      avatar_url: params.avatarUrl,
      bio: params.bio,
      extension_data: params.extension_data,
    });

    if (result.success && result.data) {
      return result.data;
    }

    const error = result.error || "Falha ao criar perfil business";
    if (index === handles.length - 1 || !isLikelyDuplicateHandleError(error)) {
      throw new Error(error);
    }
  }

  throw new Error("Falha ao criar perfil business");
}

export function useBusinessCreateMultiProfile(
  options: UseBusinessCreateOptions = {},
): UseBusinessCreateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      data,
      logoFile,
      bannerFile,
    }: CreateBusinessSubmission): Promise<BusinessCreateResult> => {
      const activeLocation = locationContextStore.getActiveLocation();
      const inputWithLocation: CreateBusinessInput = {
        ...data,
        location_id: data.location_id ?? activeLocation?.id ?? undefined,
      };

      const validation = createBusinessSchema.safeParse(inputWithLocation);
      if (!validation.success) {
        throw new Error(
          `Validacao: ${validation.error.errors.map((error) => error.message).join(", ")}`,
        );
      }

      const normalizedInput = validation.data;

      let finalSlug = normalizedInput.slug;
      if (finalSlug) {
        const availability = await PublicIdentityService.checkAvailability({
          identifier: finalSlug,
          entityType: "business",
        });

        if (availability.status !== "available") {
          throw new Error(
            availability.message ||
              `Slug "${finalSlug}" nao esta disponivel.` +
                (availability.suggestion ? ` Sugestao: ${availability.suggestion}` : ""),
          );
        }
      } else {
        finalSlug = await BusinessUrlService.generateUniqueSlug(normalizedInput.name);
      }

      const extension_data = {
        legal_name: normalizedInput.legal_name ?? normalizedInput.name,
        cnpj: normalizedInput.cnpj ?? null,
        company_type: normalizedInput.company_type ?? null,
        industry: normalizedInput.industry ?? normalizedInput.category,
        status: normalizedInput.status ?? "active",
        address_id: normalizedInput.address_id ?? null,
        location_id: normalizedInput.location_id ?? null,
      };

      const createdProfile = await createProfileWithHandleFallback({
        handleBase: finalSlug,
        displayName: normalizedInput.name,
        avatarUrl: normalizedInput.logo_url,
        bio: normalizedInput.description,
        extension_data,
      });

      let logoUrl = normalizedInput.logo_url;
      let bannerUrl = normalizedInput.banner_url;

      if (logoFile) {
        const upload = await mediaService.uploadBusinessImage(createdProfile.profile_id, logoFile, "logo");
        logoUrl = upload.url;
      }

      if (bannerFile) {
        const upload = await mediaService.uploadBusinessImage(createdProfile.profile_id, bannerFile, "capa");
        bannerUrl = upload.url;
      }

      await BusinessService.updateBusiness(createdProfile.profile_id, {
        ...normalizedInput,
        slug: finalSlug,
        logo_url: logoUrl,
        banner_url: bannerUrl,
      });

      const businessDataId = await BusinessService.getBusinessDataIdByProfileId(
        createdProfile.profile_id,
      );

      return {
        profile_id: createdProfile.profile_id,
        handle: createdProfile.handle,
        business_data_id: businessDataId,
      };
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Empresa criada com sucesso!");
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar empresa");
      options.onError?.(error);
    },
  });

  return {
    createBusiness: mutation.mutate,
    createBusinessAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}
