import { useState, useCallback } from "react";
import { profileService } from "@/core/profiles/services/ProfileService";
import { useSessionContext } from "@/core/session";
import { useToast } from "@/shared/hooks/use-toast";
import { trackError } from "@/shared/utils/errorTracking";
import { AUTH_AVATAR_UPLOAD_LIMITS } from "@/core/auth/constants/avatar";

export function useAvatarUpload(onSuccess?: (avatarReference: string) => void) {
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      if (!activeProfile) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return false;
      }

      if (file.size > AUTH_AVATAR_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 2MB",
          variant: "destructive",
        });
        return false;
      }

      setUploading(true);

      try {
        // Profile owns both the MediaAsset and the persisted avatar reference.
        const avatarReference = await profileService.uploadAvatar(
          activeProfile.id,
          file,
        );

        toast({ title: "Foto atualizada com sucesso!" });
        onSuccess?.(avatarReference);
        return true;
      } catch (err) {
        trackError(err as Error, {
          component: "useAvatarUpload",
          action: "uploadAvatar",
          metadata: {
            profileId: activeProfile.id,
            fileName: file.name,
            fileSize: file.size,
          },
        });
        toast({
          title: "Error send photo",
          description: err instanceof Error ? err.message : "Erro desconhecido",
          variant: "destructive",
        });
        return false;
      } finally {
        setUploading(false);
      }
    },
    [activeProfile, toast, onSuccess],
  );

  return {
    uploading,
    uploadAvatar,
  };
}
