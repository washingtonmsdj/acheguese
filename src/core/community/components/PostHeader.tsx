import React, { memo } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { MapPin, MoreVertical, Trash2, Flag, Edit } from "lucide-react";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
import { VerifiedResidentBadge } from "@/shared/components/badges";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";

/**
 * Cabeçalho do card de post
 *
 * Requirements:
 * - Requirement 5: Estrutura do Card de Post
 *
 * Design System:
 * - Nome do autor em branco (#FFFFFF)
 * - Localização e timestamp em cinza claro (#A0AEC0)
 * - Avatar com fallback de iniciais
 *
 * Performance:
 * - Memoizado para evitar re-renders desnecessários
 */

interface PostHeaderProps {
  authorName: string;
  authorAvatar?: string;
  city: string;
  neighborhood: string;
  timestamp: string;
  isVerifiedResident?: boolean;
  isOwnPost?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onReport?: () => void;
}

/**
 * Gera iniciais a partir do name completo
 * Exemplo: "João Silva" -> "JS"
 */
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const PostHeader = memo(function PostHeader({
  authorName,
  authorAvatar,
  city,
  neighborhood,
  timestamp,
  isVerifiedResident = false,
  isOwnPost = false,
  onDelete,
  onEdit,
  onReport,
}: PostHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10 ring-2 ring-white/10">
        <AvatarImage src={authorAvatar} alt={authorName} />
        <AvatarFallback className="bg-gradient-to-br from-teal-400 to-pink-400 text-white font-semibold">
          {getInitials(authorName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className="font-semibold text-sm truncate"
            style={INLINE_STYLES.textPrimary}
          >
            {authorName}
          </span>
          {isVerifiedResident && <VerifiedResidentBadge size="small" />}
          <span className="text-xs" style={INLINE_STYLES.textSecondary}>
            · {timestamp}
          </span>
        </div>

        <div
          className="flex items-center gap-1 text-xs mt-0.5"
          style={INLINE_STYLES.textSecondary}
        >
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">
            {neighborhood} · {city}
          </span>
        </div>
      </div>

      {/* Menu de Opções */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-full hover:bg-white/5 transition-colors">
            <MoreVertical className="w-4 h-4" style={{ color: "#9CA3AF" }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="rounded-lg border min-w-[180px]"
          style={{
            backgroundColor: "#1E2529",
            borderColor: "rgba(255, 255, 255, 0.2)",
          }}
        >
          {isOwnPost ? (
            <>
              {onEdit && (
                <DropdownMenuItem
                  onClick={onEdit}
                  className="text-xs gap-2 focus:bg-white/10 cursor-pointer"
                  style={{ color: "#4FD1C5" }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar post
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  />
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-xs gap-2 focus:bg-white/10 cursor-pointer"
                    style={{ color: "#EF4444" }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir post
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <>
              {onReport && (
                <DropdownMenuItem
                  onClick={onReport}
                  className="text-xs gap-2 focus:bg-white/10 cursor-pointer"
                  style={{ color: "#F59E0B" }}
                >
                  <Flag className="w-3.5 h-3.5" />
                  Denunciar post
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
