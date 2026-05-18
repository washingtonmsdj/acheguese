import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Loader2,
  Construction,
  AlertTriangle,
  Lightbulb,
  Trash2,
  TreePine,
  Droplets,
  AlertCircle,
} from "lucide-react";
import {
  getCardBackground,
  INLINE_STYLES,
  SPACING,
} from "./styles/communityDesignSystem";
import {
  CivicReportHeader,
  CommunityPostHeader,
} from "./detail-modal/DetailModalHeader";
import {
  CommunityPostContent,
  CivicReportContent,
} from "./detail-modal/DetailModalContent";
import {
  CommunityPostMetrics,
  CivicReportMetrics,
} from "./detail-modal/DetailModalMetrics";
import { CommentsList } from "./detail-modal/CommentsList";
import { CommentInput } from "./detail-modal/CommentInput";
import { useUnifiedDetailModal } from "../hooks/modals/useUnifiedDetailModal";
import { PostType } from "./PostBadge";
import { Poll } from "@/shared/types/poll";

/**
 * Modal unificado para visualização de posts e reportes cívicos
 * Arquitetura AAA: Abstração, Adaptabilidade, Acessibilidade
 */

interface Comment {
  id: string;
  author_name?: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  likes_count: number;
  is_liked?: boolean;
  profile?: {
    name: string;
    avatar_url?: string;
  };
}

interface CommunityPost {
  id: string;
  author_profile_id: string;
  author_name: string;
  author_avatar?: string;
  type: PostType;
  content: string;
  images?: string[];
  poll?: Poll;
  tags: string[];
  city: string;
  neighborhood: string;
  rua: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_saved?: boolean;
  is_verified?: boolean;
}

interface CivicReport {
  id: string;
  profile_id: string;
  type:
    | "buraco"
    | "iluminacao"
    | "lixo"
    | "arvore"
    | "esgoto"
    | "calcada"
    | "outro";
  description: string;
  location: string;
  status: CivicReportStatus;
  urgency: "low" | "medium" | "high" | "critical";
  upvotes: number;
  created_at: string;
  profile?: {
    name: string;
    avatar_url?: string;
  };
}

type UnifiedContent =
  | { type: "post"; date: CommunityPost }
  | { type: "civic_report"; reportId: string };

interface UnifiedDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: UnifiedContent;
  comments?: Comment[];
  onLike?: (id: string) => void;
  onSave?: (id: string) => void;
  onShare?: (id: string) => void;
  onReport?: (id: string) => void;
  onUpvote?: (id: string) => void;
  onTagClick?: (tag: string) => void;
}

const PROBLEM_TYPES = {
  buraco: { label: "Buraco na Rua", icon: AlertTriangle, color: "#EF4444" },
  iluminacao: {
    label: "Iluminação Pública",
    icon: Lightbulb,
    color: "#F59E0B",
  },
  lixo: { label: "Acúmulo de Lixo", icon: Trash2, color: "#10B981" },
  arvore: { label: "Poda de Árvore", icon: TreePine, color: "#059669" },
  esgoto: { label: "Esgoto/Vazamento", icon: Droplets, color: "#3B82F6" },
  calcada: {
    label: "Calçada Danificada",
    icon: Construction,
    color: "#F97316",
  },
  outro: { label: "Outro", icon: AlertCircle, color: "#6B7280" },
};

const CIVIC_REPORT_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  REJECTED: "rejected",
} as const;

type CivicReportStatus =
  (typeof CIVIC_REPORT_STATUSES)[keyof typeof CIVIC_REPORT_STATUSES];

const STATUS_CONFIG = {
  [CIVIC_REPORT_STATUSES.PENDING]: { label: "Pendente", color: "#F59E0B" },
  [CIVIC_REPORT_STATUSES.IN_PROGRESS]: { label: "Em Andamento", color: "#3B82F6" },
  [CIVIC_REPORT_STATUSES.RESOLVED]: { label: "Resolvido", color: "#10B981" },
  [CIVIC_REPORT_STATUSES.REJECTED]: { label: "Rejeitado", color: "#EF4444" },
};

const URGENCY_CONFIG = {
  low: { label: "Baixa", color: "#6B7280" },
  medium: { label: "Média", color: "#F59E0B" },
  high: { label: "Alta", color: "#F97316" },
  critical: { label: "Crítica", color: "#EF4444" },
};

export function UnifiedDetailModal({
  isOpen,
  onClose,
  content,
  comments = [],
  onLike,
  onSave,
  onShare,
  onReport,
  onUpvote,
  onTagClick,
}: UnifiedDetailModalProps) {
  const {
    commentText,
    setCommentText,
    isPost,
    isLoadingReport,
    id,
    authorName,
    authorAvatar,
    createdAt,
    description,
    location,
    civicReportData,
    state,
    isProcessing,
    handleLike: likePost,
    handleSave: savePost,
    handleShare: sharePost,
    handleUpvoteReport,
    handleSubmitComment,
  } = useUnifiedDetailModal(content);

  const isCivicReport = content.type === "civic_report";
  const allComments = isPost ? comments : [];

  if (isCivicReport && isLoadingReport) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] p-0 gap-0 border-0"
          style={getCardBackground("card")}
          aria-describedby="dialog-description"
        >
          <div className="flex items-center justify-center h-96">
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "#4FD1C5" }}
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const renderHeader = () => {
    if (isPost && content.type === "post") {
      return (
        <CommunityPostHeader
          authorName={authorName}
          authorAvatar={authorAvatar}
          city={content.date.city}
          neighborhood={content.date.neighborhood}
          createdAt={createdAt}
          postType={content.date.type}
          isVerified={content.date.is_verified}
        />
      );
    }

    const problemType = PROBLEM_TYPES[civicReportData?.type || "outro"];
    const statusConfig =
      STATUS_CONFIG[civicReportData?.status || CIVIC_REPORT_STATUSES.PENDING];
    const urgencyConfig = URGENCY_CONFIG[civicReportData?.urgency || "low"];

    return (
      <CivicReportHeader
        authorName={authorName}
        authorAvatar={authorAvatar}
        location={location}
        createdAt={createdAt}
        problemType={problemType}
        status={statusConfig}
        urgency={urgencyConfig}
      />
    );
  };

  const renderContent = () => {
    if (isPost && content.type === "post") {
      return (
        <CommunityPostContent
          content={description}
          images={content.date.images}
          poll={content.date.poll}
          postType={content.date.type}
          postId={id}
          tags={content.date.tags}
          onTagClick={onTagClick}
        />
      );
    }

    return <CivicReportContent description={description} />;
  };

  const renderMetrics = () => {
    if (isPost && content.type === "post") {
      return (
        <CommunityPostMetrics
          likesCount={state.likesCount}
          commentsCount={content.date.comments_count}
          isLiked={state.isLiked}
          isSaved={state.isSaved}
          isProcessing={isProcessing}
          onLike={likePost}
          onSave={savePost}
          onShare={sharePost}
          onReport={() => onReport?.(id)}
        />
      );
    }

    return (
      <CivicReportMetrics
        upvotes={civicReportData?.upvotes || 0}
        commentsCount={allComments.length}
        isUpvoting={isProcessing}
        onUpvote={handleUpvoteReport}
        onShare={() => onShare?.(id)}
      />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[95vh] p-0 gap-0 border-0 flex flex-col"
        style={getCardBackground("card")}
        aria-describedby="dialog-description"
      >
        <DialogHeader className="flex-shrink-0 p-4 pb-3 border-b border-white/10">
          <DialogTitle style={INLINE_STYLES.textPrimary}>
            {isPost ? "Detalhes do Post" : "Detalhes do Reporte"}
          </DialogTitle>
          <span id="dialog-description" className="sr-only">
            Conteúdo do diálogo
          </span>
        </DialogHeader>
        <DialogDescription className="sr-only">
          Visualize os detalhes completos do item selecionado
        </DialogDescription>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <div className={SPACING.sectionGap}>
            {renderHeader()}
            {renderContent()}
            {renderMetrics()}
            <CommentsList comments={allComments} />
          </div>
        </div>

        <CommentInput
          value={commentText}
          onChange={setCommentText}
          onSubmit={handleSubmitComment}
          isSubmitting={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
}
