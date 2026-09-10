import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MobilityRpcService } from "@/core/mobility/services/MobilityRpcService";
import { MOBILITY_QUERY_KEYS } from "@/core/mobility/constants";
import {
  buildDriverProfileCreatePayload,
  type DriverRegistrationInput,
} from "@/modules/mobility/utils/driverRegistration";

type CreateDriverInput = DriverRegistrationInput;

interface UseDriverCreateOptions {
  onSuccess?: (result: { profile_id: string; handle: string }) => void;
  onError?: (error: Error) => void;
}

interface UseDriverCreateReturn {
  createDriver: (data: CreateDriverInput) => void;
  createDriverAsync: (data: CreateDriverInput) => Promise<{ profile_id: string; handle: string }>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: { profile_id: string; handle: string } | undefined;
  reset: () => void;
}

export function useDriverCreateMultiProfile(
  options: UseDriverCreateOptions = {},
): UseDriverCreateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (
      input: CreateDriverInput,
    ): Promise<{ profile_id: string; handle: string }> => {
      const payload = await buildDriverProfileCreatePayload(input);

      const result = await MobilityRpcService.createDriverProfile({
        handle: payload.handle,
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
        bio: payload.bio,
        extensionData: payload.extensionData,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Falha ao criar perfil de motorista");
      }

      const handle = result.data.handle?.trim();
      if (!handle) {
        throw new Error("Resposta inválida ao criar perfil de motorista");
      }

      return {
        profile_id: result.data.profile_id,
        handle,
      };
    },

    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.drivers() });
      queryClient.invalidateQueries({ queryKey: MOBILITY_QUERY_KEYS.profiles() });

      toast.success("Cadastro de motorista criado com sucesso", {
        description: "Aguarde a validação da sua documentação para começar a operar.",
      });
      options.onSuccess?.(result);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar perfil de motorista");
      options.onError?.(error);
    },
  });

  return {
    createDriver: mutation.mutate,
    createDriverAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}