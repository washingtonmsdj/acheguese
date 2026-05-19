import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { PostHeader } from "@/core/community/components/PostHeader";
import { PostBadge, PostType } from "../PostBadge";
import { Construction, MapPin, Clock } from "lucide-react";
import { INLINE_STYLES } from "../styles/communityDesignSystem";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CivicReportHeaderProps {
  authorName: string;
  authorAvatar?: string;
  location: string;
  createdAt: string;
  problemType: {
    label: string;
    icon: React.ComponentType<{
      className?: string;
      style?: React.CSSProperties;
    }>;
    color: string;
  };
  status: { label: string; color: string };
  urgency: { label: string; color: string };
}

interface PostHeaderProps {
  authorName: string;
  authorAvatar?: string;
  city: string;
  neighborhood: string;
  createdAt: string;
  postType: PostType;
  isVerified?: boolean;
}

const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), {
    addSuffix: true,
    locale: ptBR,
  });
};

export const CivicReportHeader = ({
  authorName,
  authorAvatar,
  location,
  createdAt,
  problemType,
  status,
  urgency,
}: CivicReportHeaderProps) => {
  const ProblemIcon = problemType.icon;

  return (
    <div className="pt-2">
      <div className="flex items-start gap-3 mb-3">
        <Avatar
          className="h-10 w-10 border-2"
          style={{ borderColor: "rgba(255, 107, 53, 0.3)" }}
        >
          <AvatarImage src={authorAvatar} />
          <AvatarFallback
            className="text-sm font-semibold"
            style={{
              background: "linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)",
              color: "#FFFFFF",
            }}
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
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" style={{ color: "#9CA3AF" }} />
              <span className="text-xs truncate" style={{ color: "#9CA3AF" }}>
                {location}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "#9CA3AF" }}
          >
            <Clock className="w-3 h-3" />
            <span>{getRelativeTime(createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <Badge
          className="border-0 text-xs font-medium px-3 py-1"
          style={{
            backgroundColor: "rgba(255, 107, 53, 0.2)",
            color: "#FF6B35",
          }}
        >
          <Construction className="w-3 h-3 mr-1.5" />
          Zeladoria
        </Badge>
      </div>

      <div
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3"
        style={{
          backgroundColor: `${problemType.color}20`,
          border: `1px solid ${problemType.color}40`,
        }}
      >
        <ProblemIcon className="w-4 h-4" style={{ color: problemType.color }} />
        <span
          className="text-sm font-medium"
          style={{ color: problemType.color }}
        >
          {problemType.label}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Badge
          className="border-0 text-xs"
          style={{
            backgroundColor: `${status.color}20`,
            color: status.color,
          }}
        >
          {status.label}
        </Badge>
        <Badge
          className="border-0 text-xs"
          style={{
            backgroundColor: `${urgency.color}20`,
            color: urgency.color,
          }}
        >
          Urgência: {urgency.label}
        </Badge>
      </div>
    </div>
  );
};

export const CommunityPostHeader = ({
  authorName,
  authorAvatar,
  city,
  neighborhood,
  createdAt,
  postType,
  isVerified,
}: PostHeaderProps) => {
  return (
    <div className="pt-2">
      <PostHeader
        authorName={authorName}
        authorAvatar={authorAvatar}
        city={city}
        neighborhood={neighborhood}
        timestamp={getRelativeTime(createdAt)}
      />

      {postType === "achados_e_perdidos" && (
        <div className="mt-2">
          <PostBadge type={postType} isVerified={isVerified} />
        </div>
      )}
    </div>
  );
};
