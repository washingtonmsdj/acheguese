import { useState, useCallback } from "react";
import { AuthService } from "@/core/auth/services/AuthService";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { trackError } from "@/shared/utils/errorTracking";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function useAvatarUpload(onSuccess?: (avatarUrl: string) => void) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = useCallback(
    async (file: File): Promise<boolean> => {
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 2MB",
          variant: "destructive",
        });
        return false;
      }

      setUploading(true);

      try {
        // ✅ SSOT - Usar AuthService para upload de avatar
        const avatarUrl = await AuthService.uploadAvatar(user.id, file);

        toast({ title: "Foto atualizada com sucesso!" });
        onSuccess?.(avatarUrl);
        return true;
      } catch (err) {
        trackError(err as Error, {
          component: "useAvatarUpload",
          action: "uploadAvatar",
          userId: user?.id,
          metadata: { fileName: file.name, fileSize: file.size },
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
    [user, toast, onSuccess],
  );

  return {
    uploading,
    uploadAvatar,
  };
}
