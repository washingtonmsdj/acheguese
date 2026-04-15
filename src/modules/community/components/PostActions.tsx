import React from "react";
import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Heart, MessageSquare, Bookmark, Share2, Flag } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { ReportModal } from "./ReportModal";
import { useModeration } from "../hooks/useModeration";
import { ReportReason } from "@/modules/community/types";
import { INLINE_STYLES } from "./styles/communityDesignSystem";
/**
 * Ações do post (curtir, comentar, save, compartilhar, denunciar)
 *
 * Design System:
 * - Botões com texto em cinza claro (#A0AEC0)
 * - Hover com destaque
 */

interface PostActionsProps {
  postId: string;
  isLiked: boolean;
  isSaved: boolean;
  onLike: () => void;
  onComment: () => void;
  onSave: () => void;
  onShare: () => void;
}

export function PostActions({
  postId,
  isLiked,
  isSaved,
  onLike,
  onComment,
  onSave,
  onShare,
}: PostActionsProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const { reportPost, isReportingPost } = useModeration();

  const handleReport = (reason: ReportReason, description?: string) => {
    reportPost({ postId, reason, description });
    setShowReportModal(false);
  };

  return (
    <>
      <div
        className="flex items-center gap-1"
        style={INLINE_STYLES.textSecondary}
      >
        {/* Curtir */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onLike}
          className={cn(
            "gap-1.5 px-3 h-9 hover:bg-white/5 transition-colors",
            isLiked && "text-red-500 hover:text-red-600",
          )}
          title="Curtir"
        >
          <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
        </Button>

        {/* Comentar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onComment}
          className="gap-1.5 px-3 h-9 hover:bg-white/5 transition-colors"
          title="Comentar"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>

        {/* Salvar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onSave}
          className={cn(
            "gap-1.5 px-3 h-9 hover:bg-white/5 transition-colors",
            isSaved && "text-primary",
          )}
          title="Salvar"
        >
          <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
        </Button>

        {/* Compartilhar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onShare}
          className="gap-1.5 px-3 h-9 hover:bg-white/5 transition-colors"
          title="Compartilhar"
        >
          <Share2 className="h-4 w-4" />
        </Button>

        {/* Denunciar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowReportModal(true)}
          className="gap-1.5 px-3 h-9 hover:bg-white/5 hover:text-destructive transition-colors ml-auto"
          title="Denunciar"
        >
          <Flag className="h-4 w-4" />
        </Button>
      </div>

      {/* Report Modal */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        onSubmit={handleReport}
        isSubmitting={isReportingPost}
        contentType="post"
      />
    </>
  );
}
