import React, { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Hash } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { INLINE_STYLES } from "@/core/community/components/styles/communityDesignSystem";
/**
 * Lista de hashtags do post
 *
 * Requirements:
 * - Requirement 3: Criar Post (tags opcionais)
 * - Requirement 26: Sistema de Tags Populares
 *
 * Design System:
 * - Tags com fundo semi-transparente
 * - Texto branco para contraste
 * - Hover com destaque sutil
 *
 * Performance:
 * - Memoizado para evitar re-renders desnecessários
 */

interface PostTagsProps {
  tags: string[];
  onTagClick?: (tag: string) => void;
}

export const PostTags = memo(function PostTags({
  tags,
  onTagClick,
}: PostTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant="secondary"
          className={cn(
            "text-xs border-0",
            onTagClick && "cursor-pointer hover:bg-white/20 transition-colors",
          )}
          style={INLINE_STYLES.tagBackground}
          onClick={() => onTagClick?.(tag)}
        >
          <Hash className="h-3 w-3 mr-1" />
          {tag}
        </Badge>
      ))}
    </div>
  );
});
