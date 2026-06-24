import React, { memo } from "react";
import { cn } from "@/shared/utils/cn";
import { INLINE_STYLES, TYPOGRAPHY } from "./styles/communityDesignSystem";
import { ImageGallery } from "./ImageGallery";
import { normalizePublicPostContent } from "@/core/posts/utils/publicPostContent";
/**
 * Conteúdo do post (texto e imagens)
 *
 * Requirements:
 * - Requirement 3: Criar Post
 * - Requirement 5: Estrutura do Card de Post
 *
 * Design System:
 * - Prefixos destacados em ciano (#4FD1C5)
 * - Texto principal em branco (#FFFFFF)
 * - Imagens com bordas arredondadas (rounded-xl)
 * - Lazy loading para performance
 *
 * Performance:
 * - Memoizado para evitar re-renders desnecessários
 */

interface PostContentProps {
  content: string;
  images?: string[];
}

/**
 * Detecta e separa prefixos de tipo de post do conteúdo
 * Prefixos suportados: PET PERDIDO, ENQUETE, SUGESTÃO, DISCUSSÃO, ACHADOS E PERDIDOS, EMERGÊNCIA
 */
const parseContentPrefix = (
  content: string,
): { prefix: string | null; text: string } => {
  const prefixPattern =
    /^(PET PERDIDO|ENQUETE|SUGESTÃO|DISCUSSÃO|ACHADOS E PERDIDOS|EMERGÊNCIA):\s*/i;
  const match = content.match(prefixPattern);

  if (match) {
    return {
      prefix: match[0],
      text: content.slice(match[0].length),
    };
  }

  return { prefix: null, text: content };
};

export const PostContent = memo(function PostContent({
  content,
  images = [],
}: PostContentProps) {
  const { prefix, text } = parseContentPrefix(normalizePublicPostContent(content));

  return (
    <div className="space-y-3">
      {/* Texto do post com prefixo destacado */}
      <p
        className={cn(
          TYPOGRAPHY.contentText,
          "whitespace-pre-wrap break-words",
        )}
      >
        {prefix && (
          <span className="font-bold" style={INLINE_STYLES.textCyan}>
            {prefix}
          </span>
        )}
        <span style={INLINE_STYLES.textPrimary}>{text}</span>
      </p>

      {/* Galeria de imagens profissional */}
      {images.length > 0 && <ImageGallery images={images} />}
    </div>
  );
});
