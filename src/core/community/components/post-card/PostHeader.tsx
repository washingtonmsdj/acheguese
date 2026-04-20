import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { MapPin, Clock, MoreHorizontal, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { INLINE_STYLES, SPACING } from "../styles/communityDesignSystem";
import { getInitials, getRelativeTime } from "@/shared/utils/formatters";

interface PostHeaderProps {
  authorProfileId: string;
  authorName: string;
  authorAvatar?: string;
  isVerifiedResident?: boolean;
  location: string;
  createdAt: string;
  typeIcon: React.ComponentType<{ className?: string }>;
  typeBadge: string;
  typeColor: string;
  typeBgColor: string;
  isOwnPost: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
}

export function PostHeader({
  authorName,
  authorAvatar,
  isVerifiedResident,
  location,
  createdAt,
  typeIcon: TypeIcon,
  typeBadge,
  typeColor,
  typeBgColor,
  isOwnPost,
  onEdit,
  onDelete,
  onReport,
}: PostHeaderProps) {
  return (
    <div className={`${SPACING.cardPadding} pb-3`}>
      {/* Header com Avatar e Info do Usuário */}
      <div className="flex items-start gap-3">
        <Avatar
          className="h-10 w-10 border-2"
          style={{ borderColor: "rgba(255, 107, 53, 0.3)" }}
        >
          <AvatarImage
            src={authorAvatar}
            alt={`Foto de perfil de ${authorName}`}
          />
          <AvatarFallback
            className="text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
              color: "#FFFFFF",
            }}
            aria-label={`Iniciais de ${authorName}`}
          >
            {getInitials(authorName)}
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
              <time dateTime={createdAt}>{getRelativeTime(createdAt)}</time>
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
                Denunciar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badge do Tipo de Post */}
      <div className="mt-3">
        <Badge
          className="border-0 text-xs font-medium px-3 py-1"
          style={{
            backgroundColor: typeBgColor,
            color: typeColor,
          }}
        >
          <TypeIcon className="w-3 h-3 mr-1.5" />
          {typeBadge}
        </Badge>
      </div>
    </div>
  );
}
