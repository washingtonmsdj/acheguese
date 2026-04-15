import React from "react";
import { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import {
  CIVIC_PROBLEM_TYPES,
  type CivicProblemType,
} from "@/shared/constants/civicProblemTypes";
import {
  STATUS_CONFIG,
  URGENCY_CONFIG,
  type PostStatus,
  type PostUrgency,
} from "@/shared/constants/statusConfig";
import { type PostType } from "@/shared/constants/postTypeConfig";
import { INLINE_STYLES } from "../styles/communityDesignSystem";
interface PostContentProps {
  postType: PostType;
  content: string;
  image?: string;
  civicType?: CivicProblemType;
  status?: PostStatus;
  urgency?: PostUrgency;
  tags?: string[];
  onTagClick?: (tag: string) => void;
}

/**
 * Conteúdo principal do post
 * Inclui texto, image, badges de tipo/status e tags
 *
 * @component
 */
export const PostContent = memo<PostContentProps>(
  ({
    postType,
    content,
    image,
    civicType,
    status,
    urgency,
    tags,
    onTagClick,
  }) => {
    return (
      <>
        {/* Tipo específico para civic_reports */}
        {postType === "civic_report" && civicType && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
            style={{
              backgroundColor: `${CIVIC_PROBLEM_TYPES[civicType].color}20`,
              border: `1px solid ${CIVIC_PROBLEM_TYPES[civicType].color}40`,
            }}
          >
            {(() => {
              const ProblemIcon = CIVIC_PROBLEM_TYPES[civicType].icon;
              return (
                <ProblemIcon
                  className="w-4 h-4"
                  style={{ color: CIVIC_PROBLEM_TYPES[civicType].color }}
                />
              );
            })()}
            <span
              className="text-sm font-medium"
              style={{ color: CIVIC_PROBLEM_TYPES[civicType].color }}
            >
              {CIVIC_PROBLEM_TYPES[civicType].label}
            </span>
          </div>
        )}

        {/* Conteúdo do Post */}
        <p
          className="text-sm leading-relaxed mb-3"
          style={INLINE_STYLES.textSecondary}
        >
          {content}
        </p>

        {/* Imagem do Post */}
        {image && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img
              src={image}
              alt={`Imagem anexada ao post: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Status e Urgência (para civic_reports) */}
        {postType === "civic_report" && (status || urgency) && (
          <div className="flex items-center gap-2 mb-3">
            {status && (
              <Badge
                className="border-0 text-xs"
                style={{
                  backgroundColor: `${STATUS_CONFIG[status].color}20`,
                  color: STATUS_CONFIG[status].color,
                }}
              >
                {STATUS_CONFIG[status].label}
              </Badge>
            )}
            {urgency && (
              <Badge
                className="border-0 text-xs"
                style={{
                  backgroundColor: `${URGENCY_CONFIG[urgency].color}20`,
                  color: URGENCY_CONFIG[urgency].color,
                }}
              >
                Urgência: {URGENCY_CONFIG[urgency].label}
              </Badge>
            )}
          </div>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div
            className="flex flex-wrap gap-1 mt-3"
            role="list"
            aria-label="Tags do post"
          >
            {tags.map((tag, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="text-xs px-2 py-1 rounded-full bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 transition-colors"
                aria-label={`Filtrar por tag ${tag}`}
                role="listitem"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </>
    );
  },
);

PostContent.displayName = "PostContent";
