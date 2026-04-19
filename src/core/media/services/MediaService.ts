/**
 * MediaService - SSOT para upload e gerenciamento de mídia
 *
 * Responsável por:
 * - Upload de avatares
 * - Upload de imagens de posts
 * - Upload de arquivos de negócios
 * - Gerenciamento de storage do Supabase
 */

import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";

export class MediaError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message);
    this.name = "MediaError";
  }
}

export interface UploadResult {
  url: string;
  path: string;
}

class MediaServiceClass {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  /**
   * Upload de avatar de usuário
   */
  async uploadAvatar(userId: string, file: File): Promise<UploadResult> {
    try {
      // Validações
      if (file.size > this.MAX_AVATAR_SIZE) {
        throw new MediaError(
          "Avatar muito grande. Máximo 2MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        logger.error("Error uploading avatar:", uploadError);
        throw new MediaError("Erro ao fazer upload do avatar", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      // Adicionar timestamp para cache busting
      const url = `${urlData.publicUrl}?t=${Date.now()}`;

      return { url, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading avatar:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Upload de imagem de post/conteúdo
   */
  async uploadPostImage(userId: string, file: File): Promise<UploadResult> {
    try {
      // Validações
      if (file.size > this.MAX_FILE_SIZE) {
        throw new MediaError(
          "Imagem muito grande. Máximo 5MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const timestamp = Date.now();
      const ext = file.name.split(".").pop();
      const path = `${userId}/posts/${timestamp}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, {
          contentType: file.type,
        });

      if (uploadError) {
        logger.error("Error uploading post image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading post image:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Upload de múltiplas imagens
   */
  async uploadMultipleImages(
    userId: string,
    files: File[],
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadPostImage(userId, file);
        results.push(result);
      } catch (error) {
        logger.error("Error uploading image in batch:", error);
        // Continua com as outras imagens
      }
    }

    return results;
  }

  /**
   * Deletar arquivo do storage
   */
  async deleteFile(
    bucket: "avatars" | "post-images",
    path: string,
  ): Promise<boolean> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        logger.error("Error deleting file:", error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error("Unexpected error deleting file:", error);
      return false;
    }
  }

  /**
   * Upload de imagem de profissional (logo ou portfólio)
   */
  async uploadProfessionalImage(
    userId: string,
    file: File,
    type: "logo" | "portfolio",
  ): Promise<UploadResult> {
    try {
      // Validações
      if (file.size > this.MAX_FILE_SIZE) {
        throw new MediaError(
          "Imagem muito grande. Máximo 5MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const timestamp = Date.now();
      const random = Math.random().toString(36).slice(2);
      const ext = file.name.split(".").pop();
      const folder = type === "logo" ? "" : "portfolio/";
      const path = `professionals/${userId}/${folder}${timestamp}-${random}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          contentType: file.type,
        });

      if (uploadError) {
        logger.error("Error uploading professional image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading professional image:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Upload de imagem de negócio (logo ou capa)
   */
  async uploadBusinessImage(
    profileId: string,
    file: File,
    type: "logo" | "capa",
  ): Promise<UploadResult> {
    try {
      // Validações
      if (file.size > this.MAX_FILE_SIZE) {
        throw new MediaError(
          "Imagem muito grande. Máximo 5MB",
          "FILE_TOO_LARGE",
        );
      }

      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
        throw new MediaError(
          "Tipo de arquivo não permitido",
          "INVALID_FILE_TYPE",
        );
      }

      // Gerar path único
      const timestamp = Date.now();
      const ext = file.name.split(".").pop();
      const folder = type === "logo" ? "logos" : "capas";
      const path = `${folder}/${profileId}/${timestamp}.${ext}`;

      // Upload para storage
      const { error: uploadError } = await supabase.storage
        .from("business-logos")
        .upload(path, file, {
          contentType: file.type,
        });

      if (uploadError) {
        logger.error("Error uploading business image:", uploadError);
        throw new MediaError("Erro ao fazer upload da imagem", "UPLOAD_FAILED");
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from("business-logos")
        .getPublicUrl(path);

      return { url: urlData.publicUrl, path };
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading business image:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }

  /**
   * Obter URL pública de um arquivo
   */
  getPublicUrl(bucket: "avatars" | "post-images", path: string): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Upload de documento de verificação
   * ✅ SSOT para storage de documentos de verificação
   */
  async uploadVerificationDocument(
    profileId: string,
    file: File,
    type: "proof" | "photo"
  ): Promise<string> {
    try {
      // Validações
      if (file.size > this.MAX_FILE_SIZE) {
        throw new MediaError(
          "Arquivo muito grande. Máximo 5MB",
          "FILE_TOO_LARGE",
        );
      }

      const timestamp = Date.now();
      const fileName = `${type}_${timestamp}_${file.name}`;
      const path = `${profileId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("verification-documents")
        .upload(path, file, { upsert: true });

      if (uploadError) {
        logger.error("Error uploading verification document:", uploadError);
        throw new MediaError("Erro ao fazer upload do documento", "UPLOAD_FAILED");
      }

      const { data: urlData } = supabase.storage
        .from("verification-documents")
        .getPublicUrl(path);

      return urlData.publicUrl;
    } catch (error) {
      if (error instanceof MediaError) throw error;
      logger.error("Unexpected error uploading verification document:", error);
      throw new MediaError(
        "Erro inesperado ao fazer upload",
        "UNEXPECTED_ERROR",
      );
    }
  }
}

export const mediaService = new MediaServiceClass();
