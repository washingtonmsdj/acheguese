import { useState, useRef } from "react";
import { mediaService } from "@/core/media/services/MediaService";
import { useSessionContext } from "@/core/session";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { BUSINESS_IMAGE_UPLOAD_LIMITS } from "@/core/business/constants";

export function useBusinessImageUpload() {
  const { activeProfile } = useSessionContext();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [capaFile, setCapaFile] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);

  const logoRef = useRef<HTMLInputElement>(null);
  const capaRef = useRef<HTMLInputElement>(null);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > BUSINESS_IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      toast.error("Logo deve ter no máximo 5MB");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCapaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > BUSINESS_IMAGE_UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      toast.error("Capa deve ter no máximo 5MB");
      return;
    }

    setCapaFile(file);
    const reader = new FileReader();
    reader.onload = () => setCapaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile || !activeProfile) return null;

    try {
      const result = await mediaService.uploadBusinessImage(
        activeProfile.id,
        logoFile,
        "logo",
      );
      return result.url;
    } catch (error) {
      logger.error("Erro ao fazer upload do logo:", error);
      throw error;
    }
  };

  const uploadCapa = async (): Promise<string | null> => {
    if (!capaFile || !activeProfile) return null;

    try {
      const result = await mediaService.uploadBusinessImage(
        activeProfile.id,
        capaFile,
        "capa",
      );
      return result.url;
    } catch (error) {
      logger.error("Erro ao fazer upload da capa:", error);
      return null;
    }
  };

  const uploadImages = async () => {
    const [logoUrl, capaUrl] = await Promise.all([uploadLogo(), uploadCapa()]);

    return { logoUrl, capaUrl };
  };

  return {
    logoFile,
    logoPreview,
    capaFile,
    capaPreview,
    logoRef,
    capaRef,
    handleLogoChange,
    handleCapaChange,
    uploadImages,
  };
}
