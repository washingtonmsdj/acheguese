import { useState, useRef } from "react";
import { toast } from "sonner";
import {
  optimizeImage,
  validateImageFile,
} from "@/shared/utils/imageOptimizer";
import type { PostType } from "@/core/posts/types";
import { logger } from "@/shared/utils/logger";

export type UnifiedPostType = PostType;

export function usePostForm() {
  const [texto, setTexto] = useState("");
  const [tipo, setTipo] = useState<UnifiedPostType>("texto");
  const [imagens, setImagens] = useState<File[]>([]);
  const [imagensPreview, setImagensPreview] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [reach, setReach] = useState<"street" | "neighborhood" | "city">(
    "neighborhood",
  );
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImagens = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 3 - imagens.length;
    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToAdd) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      try {
        const optimized = await optimizeImage(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.85,
        });

        setImagens((prev) => [...prev, optimized]);

        const reader = new FileReader();
        reader.onload = () => {
          setImagensPreview((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(optimized);
      } catch (err) {
        logger.error("Error optimizing image:", err);
        toast.error("Erro ao processar imagem");
      }
    }
  };

  const handleRemoverImagem = (index: number) => {
    setImagens(imagens.filter((_, i) => i !== index));
    setImagensPreview(imagensPreview.filter((_, i) => i !== index));
  };

  const getTags = () => {
    return tagsInput
      .split(/[,\s]+/)
      .map((tag) => tag.replace(/^#/, "").trim())
      .filter((tag) => tag.length > 0);
  };

  const reset = () => {
    setTexto("");
    setTipo("texto");
    setImagens([]);
    setImagensPreview([]);
    setTagsInput("");
    setLocation(null);
    setReach("neighborhood");
  };

  return {
    texto,
    setTexto,
    tipo,
    setTipo,
    imagens,
    imagensPreview,
    tagsInput,
    setTagsInput,
    location,
    setLocation,
    reach,
    setReach,
    showLocationPicker,
    setShowLocationPicker,
    showWarning,
    setShowWarning,
    fileRef,
    handleImagens,
    handleRemoverImagem,
    getTags,
    reset,
  };
}
