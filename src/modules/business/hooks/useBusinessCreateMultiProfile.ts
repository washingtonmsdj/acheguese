/**
 * USE BUSINESS CREATE MULTI-PROFILE
 *
 * Compatibility hook for the current create page. Business creation itself is
 * owned exclusively by BusinessService; this hook only adds UI concerns such as
 * active territory, media uploads, cache invalidation and toasts.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { createBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { toast } from "sonner";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import { mediaService } from "@/core/media/services/MediaService";
import type { CreateBusinessInput } from "@/core/business/types";

export interface BusinessCreateResult {
  profile_id: string;
  business_data_id: string | null;
  mediaSetupIncomplete?: boolean;
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

      // Single creation authority: profile, membership and business_data are
      // created only by the core Business owner. The core mutation performs the
      // canonical sanitization/validation again before persisting.
      const createdBusiness = await BusinessService.createBusiness(inputWithLocation);
      const profileId = createdBusiness.profile_id;

      // Creation has already committed. Media failures must never turn this
      // result into a failed creation and encourage a duplicate submission.
      let mediaSetupIncomplete = false;
      let logoReference: string | undefined;
      let bannerReference: string | undefined;
      if (logoFile) {
        try {
          const upload = await mediaService.uploadMediaAsset(
            profileId,
            logoFile,
            "business_logo",
          );
          logoReference = upload.reference;
        } catch {
          mediaSetupIncomplete = true;
        }
      }

      if (bannerFile) {
        try {
          const upload = await mediaService.uploadMediaAsset(
            profileId,
            bannerFile,
            "business_banner",
          );
          bannerReference = upload.reference;
        } catch {
          mediaSetupIncomplete = true;
        }
      }

      if (logoReference || bannerReference) {
        try {
          await BusinessService.updateBusiness(profileId, {
            ...(logoReference ? { logo_url: logoReference } : {}),
            ...(bannerReference ? { banner_url: bannerReference } : {}),
          });
        } catch {
          mediaSetupIncomplete = true;
        }
      }

      let businessDataId = createdBusiness.business_data_id ?? null;
      if (!businessDataId) {
        try {
          businessDataId = await BusinessService.getBusinessDataIdByProfileId(profileId);
        } catch {
          // The profile ID remains authoritative after a committed creation.
          // A read-model lookup failure is not a reason to create again.
        }
      }

      return {
        profile_id: profileId,
        business_data_id: businessDataId,
        mediaSetupIncomplete,
      };
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (result.mediaSetupIncomplete) {
        toast.warning("Empresa criada, mas algumas imagens não foram salvas. Complete-as na edição da empresa.");
      } else {
        toast.success("Empresa criada com sucesso!");
      }
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
