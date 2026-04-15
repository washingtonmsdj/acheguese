import React from "react";
import { Image, X, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { PostData } from "@/modules/community/hooks/useNovoPost";

interface PostMediaSectionProps {
  postData: PostData;
  onImageSelect: () => void;
  onImageRemove: () => void;
  onLocationToggle: () => void;
  onLocationRemove: () => void;
}

export function PostMediaSection({
  postData,
  onImageSelect,
  onImageRemove,
  onLocationToggle,
  onLocationRemove,
}: PostMediaSectionProps) {
  return (
    <div className="px-4 py-3 border-b">
      {/* Image Preview */}
      <AnimatePresence>
        {postData.imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={postData.imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                onClick={onImageRemove}
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                aria-label="Remover imagem"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Preview */}
      <AnimatePresence>
        {postData.location && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  Localização adicionada
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLocationRemove}
                aria-label="Remover localização"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Controls */}
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onImageSelect}
          className="flex items-center gap-2"
          disabled={!!postData.imagePreview}
        >
          <Image className="h-4 w-4" />
          Foto
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLocationToggle}
          className="flex items-center gap-2"
          disabled={!!postData.location}
        >
          <MapPin className="h-4 w-4" />
          Localização
        </Button>
      </div>
    </div>
  );
}
