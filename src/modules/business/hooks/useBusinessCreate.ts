/**
 * USE BUSINESS CREATE - Hook SSOT para criacao de empresas
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessService } from "@/core/business/services/BusinessService";
import { createBusinessSchema } from "@/shared/schemas/business/businessSchemas";
import { useSessionContext } from "@/core/session";
import { mediaService } from "@/core/media/services/MediaService";
import { toast } from "sonner";
import { locationContextStore } from "@/core/location/stores/LocationContextStore";
import type { CreateBusinessInput, Business } from "@/core/business/types";

interface UseBusinessCreateOptions {
  onSuccess?: (business: Business) => void;
  onError?: (error: Error) => void;
}

interface UseBusinessCreateReturn {
  createBusiness: (data: CreateBusinessInput) => void;
  createBusinessAsync: (data: CreateBusinessInput) => Promise<Business>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: Business | undefined;
  reset: () => void;
}

export function useBusinessCreate(
  options: UseBusinessCreateOptions = {},
): UseBusinessCreateReturn {
  const { activeProfile } = useSessionContext();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: CreateBusinessInput): Promise<Business> => {
      if (!activeProfile?.id) {
        throw new Error("Perfil ativo nao encontrado");
      }

      const activeLocation = locationContextStore.getActiveLocation();
      const inputWithLocation: CreateBusinessInput = {
        ...input,
        location_id: input.location_id ?? activeLocation?.id ?? undefined,
      };

      const validation = createBusinessSchema.safeParse(inputWithLocation);
      if (!validation.success) {
        throw new Error(
          `Validacao: ${validation.error.errors.map((error) => error.message).join(", ")}`,
        );
      }

      return await BusinessService.createBusiness(validation.data as CreateBusinessInput, activeProfile.id);
    },

    onSuccess: (business) => {
      queryClient.invalidateQueries({ queryKey: ["businesses"] });
      queryClient.setQueryData(["business", business.id], business);
      toast.success("Empresa criada com sucesso!");
      options.onSuccess?.(business);
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

/**
 * Hook para upload de imagens (logo/banner)
 */
export function useBusinessImageUpload() {
  const { activeProfile } = useSessionContext();

  const uploadImage = async (input: {
    file: File;
    folder: "logos" | "banners";
  }): Promise<string> => {
    if (!activeProfile?.id) {
      throw new Error("Perfil ativo nao encontrado");
    }

    const type = input.folder === "logos" ? "logo" : "capa";
    const result = await mediaService.uploadBusinessImage(activeProfile.id, input.file, type);
    return result.url;
  };

  return useMutation({
    mutationFn: uploadImage,
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao fazer upload da imagem");
    },
  });
}
