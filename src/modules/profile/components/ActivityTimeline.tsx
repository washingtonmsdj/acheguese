import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import type { LucideIcon } from "lucide-react";
import {
  Activity as ActivityIcon,
  AtSign,
  BarChart3,
  CheckCircle,
  FileText,
  Heart,
  MessageSquare,
  Bookmark,
  TrendingUp,
} from "lucide-react";
import { useActivityStats } from "../hooks/useActivityStats";
import { useUserActivity } from "../hooks/useUserActivity";
import { EmptyStateProfile } from "./EmptyStateProfile";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { InfiniteScrollTrigger } from "@/shared/components/ui";
import type {
  ActivityItem,
  ActivityMetadata,
  ActivityType,
  CommentCreatedMetadate,
  PollVotedMetadate,
  PostCreatedMetadate,
  PostLikedMetadate,
  PostSavedMetadate,
} from "@/shared/types/activity";

interface ActivityTimelineProps {
  userId: string;
  profileId: string;
  onPostClick?: (postId: string) => void;
}

type ActivityFilterValue = ActivityType | "all";

const ACTIVITY_CONFIG: Record<
  ActivityType,
  {
    icon: LucideIcon;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  post_created: {
    icon: FileText,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    label: "Criou um post",
  },
  comment_created: {
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    label: "Comentou",
  },
  post_liked: {
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    label: "Curtiu um post",
  },
  comment_liked: {
    icon: Heart,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    label: "Curtiu um comentario",
  },
  post_saved: {
    icon: Bookmark,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    label: "Salvou um post",
  },
  poll_voted: {
    icon: BarChart3,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    label: "Votou em uma enquete",
  },
  alert_confirmed: {
    icon: CheckCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Confirmou um alerta",
  },
  mention_received: {
    icon: AtSign,
    color: "text-teal-500",
    bgColor: "bg-teal-500/10",
    label: "Foi mencionado",
  },
};

const FILTER_OPTIONS: Array<{ value: ActivityFilterValue; label: string }> = [
  { value: "all", label: "Todas as atividades" },
  { value: "post_created", label: "Posts" },
  { value: "comment_created", label: "Comentarios" },
  { value: "post_liked", label: "Curtidas" },
  { value: "post_saved", label: "Posts salvos" },
  { value: "poll_voted", label: "Votos" },
];

function getActivityMetadata(activity: ActivityItem): ActivityMetadata | undefined {
  return activity.metadata ?? activity.metadate;
}

function isFilterValue(value: string): value is ActivityFilterValue {
  return FILTER_OPTIONS.some((option) => option.value === value);
}

function isPostCreatedMetadata(
  metadata: ActivityMetadata | undefined,
): metadata is PostCreatedMetadate {
  return (
    metadata !== undefined &&
    "post_content" in metadata &&
    "likes_count" in metadata &&
    "comments_count" in metadata
  );
}

function isCommentCreatedMetadata(
  metadata: ActivityMetadata | undefined,
): metadata is CommentCreatedMetadate {
  return metadata !== undefined && "comment_content" in metadata;
}

function isPostInteractionMetadata(
  metadata: ActivityMetadata | undefined,
): metadata is PostLikedMetadate | PostSavedMetadate {
  return (
    metadata !== undefined &&
    "author_name" in metadata &&
    "post_content" in metadata
  );
}

function isPollVoteMetadata(
  metadata: ActivityMetadata | undefined,
): metadata is PollVotedMetadate {
  return (
    metadata !== undefined &&
    "question" in metadata &&
    "option_text" in metadata
  );
}

function getPostTargetId(activity: ActivityItem): string | null {
  const metadata = getActivityMetadata(activity);

  if (!metadata || !("post_id" in metadata)) {
    return null;
  }

  return typeof metadata.post_id === "string" && metadata.post_id.length > 0
    ? metadata.post_id
    : null;
}

export function ActivityTimeline({
  userId,
  profileId,
  onPostClick,
}: ActivityTimelineProps) {
  const [filterType, setFilterType] = useState<ActivityFilterValue>("all");
  const filters = filterType !== "all" ? { types: [filterType] } : {};

  const {
    activities,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
  } = useUserActivity({ userId, profileId, filters });

  const { data: stats, isLoading: statsLoading } = useActivityStats({
    userId,
    profileId,
  });

  const renderActivityContent = (activity: ActivityItem) => {
    const config = ACTIVITY_CONFIG[activity.type];
    const Icon = config.icon;
    const metadata = getActivityMetadata(activity);

    return (
      <div className="flex gap-4">
        <div
          className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">{config.label}</p>

          {activity.type === "post_created" && isPostCreatedMetadata(metadata) && (
            <div>
              <Badge variant="outline" className="mb-2">
                {metadata.post_type}
              </Badge>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metadata.post_content}
              </p>
              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {metadata.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {metadata.comments_count}
                </span>
              </div>
            </div>
          )}

          {activity.type === "comment_created" &&
            isCommentCreatedMetadata(metadata) && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {metadata.comment_content}
              </p>
            )}

          {(activity.type === "post_liked" || activity.type === "post_saved") &&
            isPostInteractionMetadata(metadata) && (
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={metadata.author_avatar || undefined} />
                  <AvatarFallback>
                    {metadata.author_name.slice(0, 1).toUpperCase() || "P"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{metadata.author_name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {metadata.post_content}
                  </p>
                </div>
              </div>
            )}

          {activity.type === "poll_voted" && isPollVoteMetadata(metadata) && (
            <div>
              <p className="text-sm font-medium mb-1">{metadata.question}</p>
              <Badge variant="secondary">{metadata.option_text}</Badge>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(activity.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Erro ao carregar atividades.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.total_posts}</div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.total_comments}</div>
              <div className="text-xs text-muted-foreground">Comentarios</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-6 h-6 mx-auto mb-2 text-pink-500" />
              <div className="text-2xl font-bold">
                {stats.total_likes_received}
              </div>
              <div className="text-xs text-muted-foreground">Curtidas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-teal-500" />
              <div className="text-2xl font-bold">
                {stats.total_posts + stats.total_comments}
              </div>
              <div className="text-xs text-muted-foreground">Contribuicoes</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon className="w-5 h-5" />
              Historico de atividades
            </CardTitle>
            <Select
              value={filterType}
              onValueChange={(value) => {
                if (isFilterValue(value)) {
                  setFilterType(value);
                }
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {activities.length === 0 ? (
        <EmptyStateProfile
          icon={ActivityIcon}
          title="Nenhuma atividade"
          description="Você ainda não tem atividades registradas. Comece interagindo com a comunidade."
        />
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => {
            const postTargetId = getPostTargetId(activity);
            const isClickable = Boolean(onPostClick && postTargetId);

            return (
              <Card
                key={activity.id}
                className={`transition-shadow ${isClickable ? "hover:shadow-md cursor-pointer" : ""}`}
                onClick={
                  isClickable && postTargetId
                    ? () => onPostClick(postTargetId)
                    : undefined
                }
              >
                <CardContent className="p-6">
                  {renderActivityContent(activity)}
                </CardContent>
              </Card>
            );
          })}

          <InfiniteScrollTrigger
            onLoadMore={loadMore}
            hasMore={Boolean(hasNextPage)}
            isLoading={isFetchingNextPage}
          />
        </div>
      )}
    </div>
  );
}
