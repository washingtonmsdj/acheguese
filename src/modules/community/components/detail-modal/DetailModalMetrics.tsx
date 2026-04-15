import React from "react";
import { Button } from "@/shared/components/ui/button";
import { PostMetrics } from "../PostMetrics";
import { AlertTriangle, Send, Loader2 } from "lucide-react";

interface PostMetricsProps {
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  isProcessing: boolean;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onReport: () => void;
}

interface CivicReportMetricsProps {
  upvotes: number;
  commentsCount: number;
  isUpvoting: boolean;
  onUpvote: () => void;
  onShare: () => void;
}

export const CommunityPostMetrics = ({
  likesCount,
  commentsCount,
  isLiked,
  isSaved,
  isProcessing,
  onLike,
  onSave,
  onShare,
  onReport,
}: PostMetricsProps) => {
  return (
    <PostMetrics
      likesCount={likesCount}
      commentsCount={commentsCount}
      isLiked={isLiked}
      isSaved={isSaved}
      onLike={onLike}
      onComment={() => {}}
      onSave={onSave}
      onShare={onShare}
      onReport={onReport}
      disabled={isProcessing}
    />
  );
};

export const CivicReportMetrics = ({
  upvotes,
  commentsCount,
  isUpvoting,
  onUpvote,
  onShare,
}: CivicReportMetricsProps) => {
  return (
    <div
      className="flex items-center justify-between pt-2"
      style={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUpvote}
          disabled={isUpvoting}
          className="h-8 px-3 text-xs text-gray-400 hover:text-orange-400 hover:bg-orange-500/5 transition-colors"
        >
          {isUpvoting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <AlertTriangle className="w-4 h-4 mr-1" />
          )}
          {upvotes} Apoios
        </Button>

        <span className="text-xs" style={{ color: "#9CA3AF" }}>
          {commentsCount} comentários
        </span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onShare}
        className="h-8 px-3 text-xs text-gray-400 hover:text-green-400 hover:bg-green-500/5 transition-colors"
      >
        <Send className="w-4 h-4 mr-1" />
        Compartilhar
      </Button>
    </div>
  );
};
