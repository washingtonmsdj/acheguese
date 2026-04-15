import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import { categories } from "@/modules/community/components/FeedCategoryFilter";
import type { FeedCategory } from "@/modules/community/components/FeedCategoryFilter";

interface PostCategorySelectorProps {
  selectedCategory: FeedCategory;
  onCategoryChange: (category: FeedCategory) => void;
}

const postCategories = categories.filter((c) => c.id !== "todos");

export function PostCategorySelector({
  selectedCategory,
  onCategoryChange,
}: PostCategorySelectorProps) {
  return (
    <div className="px-4 py-3 border-b">
      <p className="text-sm font-medium mb-3">Categoria do post</p>
      <div className="flex flex-wrap gap-2">
        {postCategories.map((cat) => (
          <motion.button
            key={cat.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onCategoryChange(cat.id as FeedCategory)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              selectedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            )}
            aria-pressed={selectedCategory === cat.id}
            aria-label={`Selecionar categoria ${cat.label}`}
          >
            <span className="mr-1.5">{cat.emoji}</span>
            {cat.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
