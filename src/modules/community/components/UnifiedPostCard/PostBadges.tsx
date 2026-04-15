import React from "react";
import { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import {
  POST_TYPE_CONFIG,
  type PostType,
} from "@/shared/constants/postTypeConfig";
import { MessageCircle } from "lucide-react";
interface PostBadgesProps {
  postType: PostType;
}

/**
 * Badge indicando o tipo do post
 * Exibe ícone e label coloridos de acordo com o tipo
 *
 * @component
 */
export const PostBadges = memo<PostBadgesProps>(({ postType }) => {
  const typeConfig =
    POST_TYPE_CONFIG[postType] || POST_TYPE_CONFIG["discussao"];
  const TypeIcon = typeConfig?.icon || MessageCircle;

  return (
    <div className="mt-3">
      <Badge
        className="border-0 text-xs font-medium px-3 py-1"
        style={{
          backgroundColor: typeConfig.bgColor,
          color: typeConfig.color,
        }}
      >
        <TypeIcon className="w-3 h-3 mr-1.5" />
        {typeConfig.badge}
      </Badge>
    </div>
  );
});

PostBadges.displayName = "PostBadges";
