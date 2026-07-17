import { useMemo, useState } from "react";
import {
  CheckCircle2,
  EyeOff,
  Flag,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import { usePendingComments } from "./hooks/usePendingComments";
import { usePendingPosts } from "./hooks/usePendingPosts";
import { useCommunityModerationStats } from "./hooks/useCommunityModerationStats";
import {
  communityContentModerationService,
  type CommunityContentModerationDecision,
} from "./CommunityContentModerationService";
import type { PendingComment, PendingPost } from "./types";
import { logger } from "@/shared/utils/logger";

type ReviewTarget = {
  targetType: "post" | "comment";
  targetId: string;
  content: string;
  decision: CommunityContentModerationDecision;
};

type QueueItem = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
  priority: number;
  reportsCount: number;
  reports: Array<Record<string, unknown>>;
};

const DECISION_LABELS: Record<CommunityContentModerationDecision, string> = {
  dismiss: "Descartar denuncias",
  hide: "Ocultar conteudo",
  remove: "Remover conteudo",
};

function reportReason(report: Record<string, unknown>): string | null {
  const value = report.reason ?? report.type;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeReports(reports: unknown): Array<Record<string, unknown>> {
  return Array.isArray(reports)
    ? reports.filter(
        (report): report is Record<string, unknown> =>
          Boolean(report) &&
          typeof report === "object" &&
          !Array.isArray(report),
      )
    : [];
}

function asPostItem(post: PendingPost): QueueItem {
  return {
    id: post.id,
    authorName: post.author_name,
    content: post.content,
    createdAt: post.created_at,
    priority: post.priority,
    reportsCount: post.reports_count,
    reports: normalizeReports(post.reports),
  };
}

function asCommentItem(comment: PendingComment): QueueItem {
  return {
    id: comment.id,
    authorName: comment.author_name,
    content: comment.content,
    createdAt: comment.created_at,
    priority: comment.priority,
    reportsCount: comment.reports_count,
    reports: normalizeReports(comment.reports),
  };
}

function QueueList({
  targetType,
  items,
  loading,
  error,
  hasMore,
  loadingMore,
  onLoadMore,
  onReview,
}: {
  targetType: "post" | "comment";
  items: QueueItem[];
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onReview: (target: ReviewTarget) => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
        Carregando fila
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-sm text-destructive">
        Nao foi possivel carregar a fila de moderacao.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Nenhuma denuncia pendente para este tipo de conteudo.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const reasons = Array.from(
          new Set(
            item.reports
              .map(reportReason)
              .filter((value): value is string => Boolean(value)),
          ),
        ).slice(0, 4);

        return (
          <article
            key={item.id}
            className="rounded-md border bg-card p-4 text-card-foreground"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {item.authorName}
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </time>
              <Badge variant="outline" className="ml-auto gap-1">
                <Flag className="h-3 w-3" aria-hidden="true" />
                {item.reportsCount} denuncia{item.reportsCount === 1 ? "" : "s"}
              </Badge>
            </div>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6">
              {item.content}
            </p>

            {reasons.length > 0 ? (
              <div
                className="mt-3 flex flex-wrap gap-1.5"
                aria-label="Motivos das denuncias"
              >
                {reasons.map((reason) => (
                  <Badge key={reason} variant="secondary">
                    {reason}
                  </Badge>
                ))}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onReview({
                    targetType,
                    targetId: item.id,
                    content: item.content,
                    decision: "dismiss",
                  })
                }
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Descartar
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  onReview({
                    targetType,
                    targetId: item.id,
                    content: item.content,
                    decision: "hide",
                  })
                }
              >
                <EyeOff className="h-4 w-4" aria-hidden="true" />
                Ocultar
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() =>
                  onReview({
                    targetType,
                    targetId: item.id,
                    content: item.content,
                    decision: "remove",
                  })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remover
              </Button>
            </div>
          </article>
        );
      })}

      {hasMore ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={loadingMore}
          onClick={onLoadMore}
        >
          {loadingMore ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : null}
          Carregar mais
        </Button>
      ) : null}
    </div>
  );
}

export function CommunityContentModerationQueue() {
  const postsQuery = usePendingPosts({ pageSize: 12 });
  const commentsQuery = usePendingComments({ pageSize: 12 });
  const statsQuery = useCommunityModerationStats();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reason, setReason] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const posts = useMemo(
    () => postsQuery.posts.map(asPostItem),
    [postsQuery.posts],
  );
  const comments = useMemo(
    () => commentsQuery.comments.map(asCommentItem),
    [commentsQuery.comments],
  );

  async function refreshQueue() {
    await Promise.all([
      postsQuery.refetch(),
      commentsQuery.refetch(),
      statsQuery.refetch(),
    ]);
  }

  function closeReviewDialog() {
    if (reviewing) return;
    setReviewTarget(null);
    setReason("");
  }

  async function confirmReview() {
    if (!reviewTarget || reason.trim().length < 3) return;

    setReviewing(true);
    try {
      const result =
        await communityContentModerationService.reviewContentReports({
          targetType: reviewTarget.targetType,
          targetId: reviewTarget.targetId,
          decision: reviewTarget.decision,
          reason,
        });

      toast.success(
        result.alreadyReviewed
          ? "Este conteudo ja havia sido revisado."
          : "Decisao de moderacao registrada.",
      );
      setReviewTarget(null);
      setReason("");
      await refreshQueue();
    } catch (error) {
      logger.error("[CommunityContentModerationQueue] review", error as Error, {
        targetType: reviewTarget.targetType,
        targetId: reviewTarget.targetId,
        decision: reviewTarget.decision,
      });
      toast.error(
        error instanceof Error ? error.message : "Erro ao revisar conteudo.",
      );
    } finally {
      setReviewing(false);
    }
  }

  const stats = statsQuery.data;

  return (
    <section
      className="space-y-4"
      aria-labelledby="community-content-moderation-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="community-content-moderation-title"
            className="text-lg font-semibold"
          >
            Conteudo comunitario denunciado
          </h2>
          <p className="text-sm text-muted-foreground">
            Decisoes atualizam conteudo, denuncias e auditoria na mesma
            transacao.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refreshQueue}
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-md border px-3 py-2">
          <span className="text-xs text-muted-foreground">Posts pendentes</span>
          <p className="text-xl font-semibold">
            {stats?.pending_reports.posts ?? 0}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2">
          <span className="text-xs text-muted-foreground">
            Comentarios pendentes
          </span>
          <p className="text-xl font-semibold">
            {stats?.pending_reports.comments ?? 0}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2">
          <span className="text-xs text-muted-foreground">Ocultos</span>
          <p className="text-xl font-semibold">
            {stats?.content_actions.hidden ?? 0}
          </p>
        </div>
        <div className="rounded-md border px-3 py-2">
          <span className="text-xs text-muted-foreground">Removidos</span>
          <p className="text-xl font-semibold">
            {stats?.content_actions.removed ?? 0}
          </p>
        </div>
      </div>

      <Tabs defaultValue="posts">
        <TabsList className="grid w-full grid-cols-2 sm:w-80">
          <TabsTrigger value="posts" className="gap-2">
            <Flag className="h-4 w-4" aria-hidden="true" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="gap-2">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Comentarios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="posts" className="mt-3">
          <QueueList
            targetType="post"
            items={posts}
            loading={postsQuery.isLoading}
            error={postsQuery.isError}
            hasMore={postsQuery.hasNextPage}
            loadingMore={postsQuery.isFetchingNextPage}
            onLoadMore={() => void postsQuery.loadMore()}
            onReview={setReviewTarget}
          />
        </TabsContent>
        <TabsContent value="comments" className="mt-3">
          <QueueList
            targetType="comment"
            items={comments}
            loading={commentsQuery.isLoading}
            error={commentsQuery.isError}
            hasMore={commentsQuery.hasNextPage}
            loadingMore={commentsQuery.isFetchingNextPage}
            onLoadMore={() => void commentsQuery.loadMore()}
            onReview={setReviewTarget}
          />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(reviewTarget)}
        onOpenChange={(open) => !open && closeReviewDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewTarget
                ? DECISION_LABELS[reviewTarget.decision]
                : "Revisar conteudo"}
            </DialogTitle>
            <DialogDescription>
              A decisao sera aplicada a todas as denuncias pendentes deste
              conteudo e registrada na trilha de auditoria.
            </DialogDescription>
          </DialogHeader>

          {reviewTarget ? (
            <p className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-sm">
              {reviewTarget.content}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="community-review-reason">Motivo da decisao</Label>
            <Textarea
              id="community-review-reason"
              value={reason}
              maxLength={1_000}
              placeholder="Registre a justificativa para auditoria."
              onChange={(event) => setReason(event.target.value)}
            />
            <p className="text-right text-xs text-muted-foreground">
              {reason.length}/1000
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={reviewing}
              onClick={closeReviewDialog}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={
                reviewTarget?.decision === "remove" ? "destructive" : "default"
              }
              disabled={reviewing || reason.trim().length < 3}
              onClick={confirmReview}
            >
              {reviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              Confirmar decisao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
