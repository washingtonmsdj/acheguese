import React, { memo } from "react";
import { cn } from "@/shared/utils/cn";
import { INLINE_STYLES, TYPOGRAPHY } from "./styles/communityDesignSystem";
import { ImageGallery } from "./ImageGallery";
import { normalizePublicPostContent } from "@/core/posts/utils/publicPostContent";

/**
 * Conteudo do post (texto e imagens).
 *
 * Requirements:
 * - Requirement 3: Criar post
 * - Requirement 5: Estrutura do card de post
 *
 * Design system:
 * - Prefixos destacados em ciano
 * - Texto principal em branco
 * - Imagens com bordas arredondadas
 *
 * Performance:
 * - Memoizado para evitar re-renders desnecessarios
 */

interface PostContentProps {
  content: string;
  images?: string[];
}

/**
 * Detecta e separa prefixos de tipo de post do conteudo.
 * Prefixos suportados: PET PERDIDO, ENQUETE, RECOMENDACAO, DISCUSSAO,
 * ACHADOS E PERDIDOS e EMERGENCIA.
 */
const parseContentPrefix = (
  content: string,
): { prefix: string | null; text: string } => {
  const prefixPattern =
    /^(PET PERDIDO|ENQUETE|RECOMENDACAO|DISCUSSAO|ACHADOS E PERDIDOS|EMERGENCIA):\s*/i;
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
      <p
        className={cn(
          TYPOGRAPHY.contentText,
          "whitespace-pre-wrap break-words",
        )}
      >
        {prefix ? (
          <span className="font-bold" style={INLINE_STYLES.textCyan}>
            {prefix}
          </span>
        ) : null}
        <span style={INLINE_STYLES.textPrimary}>{text}</span>
      </p>

      {images.length > 0 ? <ImageGallery images={images} /> : null}
    </div>
  );
});
