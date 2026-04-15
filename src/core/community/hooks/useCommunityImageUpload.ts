import { useState } from "react";
import { AuthService } from "@/core/auth/services/AuthService";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles";

export function useCommunityImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // ✅ FASE 2: Usar ProfileService.getRequiredActiveProfile() para contexto social
      const activeProfile = await profileService.getRequiredActiveProfile();

      setUploadProgress(50);

      // ✅ SSOT - Usar AuthService para upload de imagem
      const publicUrl = await AuthService.uploadImage(
        "community-posts",
        activeProfile.id,
        file,
      );

      setUploadProgress(100);
      return publicUrl;
    } catch (error) {
      logger.error("Erro no upload:", error);
      toast.error(
        error instanceof Error ? error.message : "Error fazer upload da image",
      );
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of files) {
      const url = await uploadImage(file);
      if (url) {
        urls.push(url);
      }
    }

    return urls;
  };

  const deleteImage = async (imageUrl: string): Promise<boolean> => {
    try {
      // ✅ SSOT - Usar AuthService para deletar imagem
      return await AuthService.deleteStorageImage("community-posts", imageUrl);
    } catch (error) {
      logger.error("Error delete image:", error);
      return false;
    }
  };

  return {
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    isUploading,
    uploadProgress,
  };
}
