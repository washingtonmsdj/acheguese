/**
 * useCreatePostForm - Hook para gerenciar formulário de criação de post
 */

import { useEffect, useRef, useState } from "react";
import type { PostType } from "@/core/posts/types.ts";
import { POST_LIMITS } from "@/shared/constants/socialContent";

export function useCreatePostForm() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("discussao");
  const [reach, setReach] = useState<"street" | "neighborhood" | "city">(
    "neighborhood",
  );
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const imagesRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(
    () => () => {
      imagesRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  const characterCount = content.length;
  const isValid = characterCount >= 20 && characterCount <= 2000;

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const availableSlots = POST_LIMITS.MAX_IMAGES - imageFiles.length;
    const files = Array.from(e.target.files || [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots);
    if (files.length === 0) return;

    const newImages = files.map((file) => URL.createObjectURL(file));
    setImageFiles((current) => [...current, ...files]);
    setImages((current) => [...current, ...newImages]);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setImages((current) => {
      const removed = current[index];
      if (removed) URL.revokeObjectURL(removed);
      return current.filter((_, currentIndex) => currentIndex !== index);
    });
    setImageFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const validateForm = () => {
    return isValid;
  };

  const getFormData = () => {
    return {
      content,
      type,
      reach,
      images,
    };
  };

  const resetForm = () => {
    setContent("");
    setType("discussao");
    setReach("neighborhood");
    imagesRef.current.forEach((url) => URL.revokeObjectURL(url));
    imagesRef.current = [];
    setImages([]);
    setImageFiles([]);
  };

  return {
    content,
    setContent,
    type,
    setType,
    reach,
    setReach,
    images,
    imageFiles,
    characterCount,
    isValid,
    fileInputRef,
    handleAddImage,
    handleFileSelect,
    handleRemoveImage,
    validateForm,
    getFormData,
    resetForm,
  };
}
