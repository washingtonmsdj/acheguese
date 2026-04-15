/**
 * 🪝 HOOK: Upload de Imagens de Classificados
 *
 * Hook React para gerenciar upload de imagens com estado e callbacks.
 */

import { useState, useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { ClassifiedImageService, UploadedImage, UploadProgress } from "@/core/classifieds/services/ClassifiedImageService";
import { toast } from "sonner";

interface UploadState {
  uploading: boolean;
  progress: Record<string, UploadProgress>;
  uploadedImages: UploadedImage[];
  error: string | null;
}

export function useClassifiedImageUpload() {
  const { activeProfile } = useSessionContext();
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: {},
    uploadedImages: [],
    error: null,
  });

  /**
   * Valida uma imagem antes do upload.
   */
  const validateImage = useCallback((file: File) => {
    return ClassifiedImageService.validateImage(file);
  }, []);

  /**
   * Faz upload de uma única imagem.
   */
  const uploadImage = useCallback(
    async (file: File): Promise<UploadedImage | null> => {
      if (!activeProfile) {
        toast.error("Você precisa estar logado para fazer upload");
        return null;
      }

      // Validação
      const validation = validateImage(file);
      if (!validation.valid) {
        toast.error(validation.error);
        setState((prev) => ({ ...prev, error: validation.error || null }));
        return null;
      }

      setState((prev) => ({
        ...prev,
        uploading: true,
        error: null,
      }));

      try {
        const uploaded = await ClassifiedImageService.uploadClassifiedImage(
          file,
          activeProfile.id,
          (progress) => {
            setState((prev) => ({
              ...prev,
              progress: {
                ...prev.progress,
                [file.name]: progress,
              },
            }));
          }
        );

        setState((prev) => ({
          ...prev,
          uploading: false,
          uploadedImages: [...prev.uploadedImages, uploaded],
        }));

        toast.success("Imagem enviada com sucesso!");
        return uploaded;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao fazer upload";
        
        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);
        return null;
      }
    },
    [activeProfile, validateImage]
  );

  /**
   * Faz upload de múltiplas imagens.
   */
  const uploadMultipleImages = useCallback(
    async (files: File[]): Promise<UploadedImage[]> => {
      if (!activeProfile) {
        toast.error("Você precisa estar logado para fazer upload");
        return [];
      }

      // Validar todas as imagens primeiro
      const validations = files.map((file) => ({
        file,
        validation: validateImage(file),
      }));

      const invalidFiles = validations.filter((v) => !v.validation.valid);
      if (invalidFiles.length > 0) {
        toast.error(
          `${invalidFiles.length} arquivo(s) inválido(s): ${invalidFiles[0].validation.error}`
        );
        return [];
      }

      setState((prev) => ({
        ...prev,
        uploading: true,
        error: null,
      }));

      try {
        const uploaded = await ClassifiedImageService.uploadMultipleImages(
          files,
          activeProfile.id,
          (fileName, progress) => {
            setState((prev) => ({
              ...prev,
              progress: {
                ...prev.progress,
                [fileName]: progress,
              },
            }));
          }
        );

        setState((prev) => ({
          ...prev,
          uploading: false,
          uploadedImages: [...prev.uploadedImages, ...uploaded],
        }));

        toast.success(`${uploaded.length} imagem(ns) enviada(s) com sucesso!`);
        return uploaded;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao fazer upload";

        setState((prev) => ({
          ...prev,
          uploading: false,
          error: errorMessage,
        }));

        toast.error(errorMessage);
        return [];
      }
    },
    [activeProfile, validateImage]
  );

  /**
   * Deleta uma imagem.
   */
  const deleteImage = useCallback(async (imageUrl: string) => {
    try {
      await ClassifiedImageService.deleteImage(imageUrl);
      
      setState((prev) => ({
        ...prev,
        uploadedImages: prev.uploadedImages.filter((img) => img.url !== imageUrl),
      }));

      toast.success("Imagem removida");
    } catch (error) {
      toast.error("Erro ao remover imagem");
      console.error(error);
    }
  }, []);

  /**
   * Reseta o estado.
   */
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: {},
      uploadedImages: [],
      error: null,
    });
  }, []);

  return {
    // Estado
    uploading: state.uploading,
    progress: state.progress,
    uploadedImages: state.uploadedImages,
    error: state.error,

    // Métodos
    validateImage,
    uploadImage,
    uploadMultipleImages,
    deleteImage,
    reset,
  };
}
