// @ts-nocheck
/**
 * useCreatePostForm - Hook para gerenciar formulário de criação de post
 */

import { useState, useRef } from "react";
import type { PostType } from "@/core/posts/types/Post";

export function useCreatePostForm() {
  const [content, setContent] = useState("");
  const [type, setType] = useState<PostType>("discussao");
  const [reach, setReach] = useState<"street" | "neighborhood" | "city">("neighborhood");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const characterCount = content.length;
  const isValid = characterCount >= 20 && characterCount <= 2000;

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.slice(0, 3 - images.length).map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...newImages].slice(0, 3));
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
    setImages([]);
  };

  return {
    content,
    setContent,
    type,
    setType,
    reach,
    setReach,
    images,
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
