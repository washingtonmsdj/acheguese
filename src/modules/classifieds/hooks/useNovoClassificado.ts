import { logger } from '@/shared/utils/logger';
import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { toast } from "sonner";
import { ClassifiedsFacade } from "@/modules/classifieds/services";
import { useClassifiedsLocation } from "./useClassifiedsLocation";
/**
 * ✅ SSOT COMPLIANT - Hook useNovoClassificado migrado
 * Usa useAppUrls para navegação (sem hardcoded URLs)
 */

export function useNovoClassificado() {
  const { activeProfile } = useSessionContext();
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { hasActiveLocation, activeLocationId, validateLocationId } = useClassifiedsLocation();

  const [titulo, setTitulo] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddPhotos = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setPhotos((prev) => [...prev, ...fileArray]);
    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) =>
        setPhotoPreviews((prev) => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
  }, []);

  const removePhoto = useCallback((index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handlePublish = useCallback(async () => {
    const newErrors: Record<string, string> = {};
    if (!titulo) newErrors.titulo = "Título obrigatório";
    if (!description) newErrors.description = "Descrição obrigatória";
    if (!price) newErrors.price = "Preço obrigatório";
    if (!category) newErrors.category = "Categoria obrigatória";

    // Validar localização ativa antes de publicar
    if (!hasActiveLocation) {
      newErrors.location = "Selecione uma localização antes de publicar";
    } else if (activeLocationId) {
      const isValidLocation = await validateLocationId(activeLocationId);
      if (!isValidLocation) {
        newErrors.location = "Localização inválida ou inativa";
      }
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setPublishing(true);
    setErrors({});
    try {
      const uploadedUrls: string[] = [];

      await ClassifiedsFacade.mutations.createClassified(activeProfile.id, {
        title: titulo,
        description,
        price: parseFloat(price),
        category,
        condition: "usado",
        photos: uploadedUrls,
        neighborhood,
        location_id: activeLocationId ?? undefined,
      });

      toast.success("Classificado publicado!");
      navigate(appUrls.classifieds.list);
    } catch (error) {
      logger.error("Error publishing classified:", error);
      toast.error("Erro ao publicar classificado");
    } finally {
      setPublishing(false);
    }
  }, [
    titulo,
    description,
    price,
    category,
    neighborhood,
    photos,
    activeProfile,
    navigate,
    hasActiveLocation,
    activeLocationId,
    validateLocationId,
  ]);

  // Redirect if no active profile - usando useEffect para evitar navigate durante render
  useEffect(() => {
    if (!activeProfile) {
      navigate(appUrls.auth.login);
    }
  }, [activeProfile, navigate, appUrls.auth.login]);

  // Retorna estado vazio se não houver perfil ativo
  if (!activeProfile) {
    return {
      titulo: "",
      setTitulo: () => {},
      description: "",
      setDescription: () => {},
      price: "",
      setPrice: () => {},
      category: "",
      setCategory: () => {},
      neighborhood: "",
      setNeighborhood: () => {},
      photos: [],
      photoPreviews: [],
      fileInputRef,
      handleAddPhotos: () => {},
      removePhoto: () => {},
      uploading: false,
      publishing: false,
      errors: {},
      handlePublish: async () => {},
      handleSubmit: async () => {},
      canPublish: false,
    };
  }

  return {
    titulo,
    setTitulo,
    description,
    setDescription,
    price,
    setPrice,
    category,
    setCategory,
    neighborhood,
    setNeighborhood,
    photos,
    photoPreviews,
    fileInputRef,
    handleAddPhotos,
    removePhoto,
    uploading,
    publishing,
    errors,
    handlePublish,
    handleSubmit: handlePublish,
    /** Indica se publicação está liberada (requer localização ativa) */
    canPublish: hasActiveLocation,
  };
}
