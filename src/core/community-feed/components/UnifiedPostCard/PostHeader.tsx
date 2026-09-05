import React from "react";
import { memo } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { MapPin, Clock, Shield, MoreHorizontal, Flag } from "lucide-react";
import { INLINE_STYLES } from "@/core/community/components/styles/communityDesignSystem";
interface PostHeaderProps {
  authorProfileId: string;
  authorName: string;
  authorAvatar?: string;
  authorInitials: string;
  isVerifiedResident?: boolean;
  location: string;
  relativeTime: string;
  createdAt: string;
  isOwnPost: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

/**
 * Header do card de post com informações do autor
 * Inclui avatar, name, localização, timestamp e menu de opções
 *
 * @component
 */
export const PostHeader = memo<PostHeaderProps>(
  ({
    authorProfileId,
    authorName,
    authorAvatar,
    authorInitials,
    isVerifiedResident,
    location,
    relativeTime,
    createdAt,
    isOwnPost,
    onEdit,
    onDelete,
    onReport,
  }) => {
    return (
      <div className="flex items-start gap-3">
        <Avatar
          className="h-10 w-10 border-2"
          style={{ borderColor: "rgba(255, 107, 53, 0.3)" }}
        >
          <AvatarImage
            src={authorAvatar}
            alt={`Foto de profile de ${authorName}`}
          />
          <AvatarFallback
            className="text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
              color: "#FFFFFF",
            }}
            aria-label={`Iniciais de ${authorName}`}
          >
            {authorInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="font-semibold text-sm"
              style={INLINE_STYLES.textPrimary}
            >
              {authorName}
            </span>
            {isVerifiedResident && (
              <Shield
                className="w-4 h-4 text-blue-400"
                aria-label="Morador verificado"
                role="img"
              />
            )}
            <div className="flex items-center gap-1">
              <MapPin
                className="w-3 h-3"
                style={{ color: "#9CA3AF" }}
                aria-hidden="true"
              />
              <span className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                {location}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "#9CA3AF" }}
          >
            <Clock className="w-3 h-3" aria-hidden="true" />
            <span>
              <time dateTime={createdAt}>{relativeTime}</time>
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              style={{ color: "#9CA3AF" }}
              aria-label="Mais opções do post"
            >
              <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-gray-800 border-gray-700"
          >
            {isOwnPost ? (
              <>
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit} className="text-gray-300">
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-400">
                    Excluir
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <DropdownMenuItem onClick={onReport} className="text-red-400">
                <Flag className="w-4 h-4 mr-2" aria-hidden="true" />
                Denunciar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
);

PostHeader.displayName = "PostHeader";
