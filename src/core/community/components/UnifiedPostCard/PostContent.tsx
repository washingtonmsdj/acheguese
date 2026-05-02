import React, { memo } from "react";
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

const civicTypeConfigMap = new Map(
  Object.entries(CIVIC_PROBLEM_TYPES) as Array<
    [CivicProblemType, (typeof CIVIC_PROBLEM_TYPES)[CivicProblemType]]
  >,
);
const statusConfigMap = new Map(
  Object.entries(STATUS_CONFIG) as Array<[PostStatus, (typeof STATUS_CONFIG)[PostStatus]]>,
);
const urgencyConfigMap = new Map(
  Object.entries(URGENCY_CONFIG) as Array<[PostUrgency, (typeof URGENCY_CONFIG)[PostUrgency]]>,
);

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

export const PostContent = memo<PostContentProps>(
  ({ postType, content, image, civicType, status, urgency, tags, onTagClick }) => {
    const civicTypeConfig = civicType ? civicTypeConfigMap.get(civicType) : undefined;
    const statusConfig = status ? statusConfigMap.get(status) : undefined;
    const urgencyConfig = urgency ? urgencyConfigMap.get(urgency) : undefined;

    return (
      <>
        {postType === "civic_report" && civicTypeConfig && (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
            style={{
              backgroundColor: `${civicTypeConfig.color}20`,
              border: `1px solid ${civicTypeConfig.color}40`,
            }}
          >
            {(() => {
              const ProblemIcon = civicTypeConfig.icon;
              return (
                <ProblemIcon
                  className="w-4 h-4"
                  style={{ color: civicTypeConfig.color }}
                />
              );
            })()}
            <span
              className="text-sm font-medium"
              style={{ color: civicTypeConfig.color }}
            >
              {civicTypeConfig.label}
            </span>
          </div>
        )}

        <p className="mb-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-white/82">
          {content}
        </p>

        {image && (
          <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <img
              src={image}
              alt={`Imagem anexada ao post: ${content.substring(0, 100)}${content.length > 100 ? "..." : ""}`}
              className="aspect-[4/5] max-h-[680px] w-full object-cover sm:aspect-[1/1]"
            />
          </div>
        )}

        {postType === "civic_report" && (statusConfig || urgencyConfig) && (
          <div className="flex items-center gap-2 mb-3">
            {statusConfig && (
              <Badge
                className="border-0 text-xs"
                style={{
                  backgroundColor: `${statusConfig.color}20`,
                  color: statusConfig.color,
                }}
              >
                {statusConfig.label}
              </Badge>
            )}
            {urgencyConfig && (
              <Badge
                className="border-0 text-xs"
                style={{
                  backgroundColor: `${urgencyConfig.color}20`,
                  color: urgencyConfig.color,
                }}
              >
                Urgencia: {urgencyConfig.label}
              </Badge>
            )}
          </div>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3" role="list" aria-label="Tags do post">
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
