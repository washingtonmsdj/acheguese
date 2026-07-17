import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mediaService } from "@/core/media/services/MediaService";
import { ProfessionalService } from "@/core/professional/services/ProfessionalService";
import { SessionService } from "@/core/session/services/SessionService";
import type { CreateProfessionalInput, ProfessionalCategory } from "@/core/professional/types";

interface CreateProfessionalCommand extends CreateProfessionalInput {
  logoFile?: File | null;
}

export interface ProfessionalCreateResult {
  profile_id: string;
  handle: string;
  mediaWarning?: string;
}

interface UseProfessionalCreateOptions {
  onSuccess?: (result: ProfessionalCreateResult) => void;
  onError?: (error: Error) => void;
}

interface UseProfessionalCreateReturn {
  createProfessional: (data: CreateProfessionalCommand) => void;
  createProfessionalAsync: (data: CreateProfessionalCommand) => Promise<ProfessionalCreateResult>;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  data: ProfessionalCreateResult | undefined;
  reset: () => void;
}

export function useProfessionalProfileCreate(
  options: UseProfessionalCreateOptions = {},
): UseProfessionalCreateReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (command: CreateProfessionalCommand): Promise<ProfessionalCreateResult> => {
      const { logoFile, ...input } = command;
      const user = await SessionService.getCurrentUser();
      if (!user) throw new Error("Autenticacao obrigatoria para cadastrar servico");

      const professional = await ProfessionalService.createProfessional(input, user.id);
      let mediaWarning: string | undefined;

      if (logoFile) {
        try {
          const asset = await mediaService.uploadMediaAsset(
            professional.profile_id,
            logoFile,
            "professional_logo",
          );
          await ProfessionalService.updateProfessional(professional.id, {
            logo_url: asset.reference,
          });
        } catch {
          mediaWarning = "O servico foi criado, mas a imagem nao foi enviada. Voce pode tentar novamente na edicao.";
        }
      }

      return {
        profile_id: professional.profile_id,
        handle: professional.slug ?? professional.id,
        mediaWarning,
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["professionals"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      options.onSuccess?.(result);
    },
    onError: (error: Error) => options.onError?.(error),
  });

  return {
    createProfessional: mutation.mutate,
    createProfessionalAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

export type { CreateProfessionalCommand, ProfessionalCategory };
