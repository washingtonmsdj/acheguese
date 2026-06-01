import { useMemo, useState } from "react";
import { Flag, MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/components/ui/use-toast";
import { useSessionContext } from "@/core/session";
import {
  useClassifiedComments,
  useCreateClassifiedComment,
  useDeleteClassifiedComment,
} from "@/modules/classifieds/hooks/useClassifiedComments";
import { classifiedCommentService } from "@/core/classifieds/services/ClassifiedCommentService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";

interface ClassifiedCommentsSectionProps {
  classifiedId: string;
  sellerProfileId?: string | null;
}

export function ClassifiedCommentsSection({
  classifiedId,
  sellerProfileId,
}: ClassifiedCommentsSectionProps) {
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(new Set());

  const commentsQuery = useClassifiedComments(classifiedId);
  const createMutation = useCreateClassifiedComment(classifiedId);
  const deleteMutation = useDeleteClassifiedComment(classifiedId);

  const comments = useMemo(() => commentsQuery.data ?? [], [commentsQuery.data]);
  const canPost = Boolean(activeProfile?.id);
  const isBusy = createMutation.isPending || deleteMutation.isPending;

  const placeholder = useMemo(() => {
    if (!canPost) return "Entre para fazer uma pergunta pública sobre este anúncio.";
    return "Escreva uma pergunta ou comentário público para o vendedor...";
  }, [canPost]);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (!activeProfile?.id) {
      toast({
        title: "Login necessário",
        description: "Entre para comentar no anúncio.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        authorProfileId: activeProfile.id,
        content: trimmed,
      });
      setContent("");
      toast({ title: "Comentário publicado" });
    } catch {
      toast({
        title: "Erro ao publicar comentário",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!activeProfile?.id) return;
    try {
      await deleteMutation.mutateAsync({
        commentId,
        authorProfileId: activeProfile.id,
      });
      toast({ title: "Comentário removido" });
    } catch {
      toast({
        title: "Erro ao remover comentário",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  const reportTarget = useMemo(
    () => comments.find((comment) => comment.id === reportingCommentId) ?? null,
    [comments, reportingCommentId],
  );

  const handleReport = async () => {
    const comment = reportTarget;
    if (!comment) return;

    if (!activeProfile?.id) {
      toast({
        title: "Login necessário",
        description: "Entre para denunciar comentários deste anúncio.",
        variant: "destructive",
      });
      return;
    }

    if (activeProfile.id === comment.author_profile_id) {
      toast({
        title: "Ação inválida",
        description: "Você não pode denunciar o próprio comentário.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReport(true);
    try {
      const reporterRole = activeProfile.id === sellerProfileId ? "merchant" : "customer";
      const commentAuthorRole =
        comment.author_profile_id === sellerProfileId ? "merchant" : "customer";

      const response = await classifiedCommentService.reportComment({
        classifiedId,
        commentId: comment.id,
        commentAuthorProfileId: comment.author_profile_id,
        commentAuthorRole,
        reporterProfileId: activeProfile.id,
        reporterRole,
        reasonCode: `classified_comment_${reportReason}`,
        description: reportDescription.trim() || undefined,
        evidence: {
          comment_content: comment.content,
          comment_created_at: comment.created_at,
          comment_author_name: comment.author?.name ?? null,
        },
      });

      if (!response.created) {
        toast({
          title: "Denúncia já registrada",
          description: "Este comentário já está em análise na moderação.",
        });
      } else {
        toast({
          title: "Denúncia registrada",
          description: "Nossa equipe vai analisar este comentário.",
        });
      }

      setReportedCommentIds((current) => new Set(current).add(comment.id));
      setReportingCommentId(null);
      setReportReason("spam");
      setReportDescription("");
    } catch {
      toast({
        title: "Erro ao denunciar comentário",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <section className="mt-10 rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h2 className="text-base font-bold text-foreground">Perguntas e comentários</h2>
      </div>

      <div className="mb-4 space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={!canPost || isBusy}
          maxLength={1000}
          className="min-h-[90px]"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Conversa pública visível para o bairro.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!canPost || !content.trim() || isBusy}
          >
            <Send className="mr-1 h-3.5 w-3.5" />
            Publicar
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {commentsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Carregando comentários...</p>
        )}

        {!commentsQuery.isLoading && comments.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Ainda não há comentários. Seja o primeiro a perguntar.
          </p>
        )}

        {comments.map((comment) => {
          const canDelete = activeProfile?.id === comment.author_profile_id;
          const isReported = reportedCommentIds.has(comment.id);
          return (
            <article key={comment.id} className="rounded-xl border border-border p-3">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {comment.author?.name || "Morador"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  {canDelete && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDelete(comment.id)}
                      disabled={isBusy}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {!canDelete && canPost && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setReportingCommentId(comment.id)}
                      disabled={isBusy || isReported}
                      title={
                        isReported
                          ? "Comentário já denunciado por você."
                          : "Denunciar comentário"
                      }
                    >
                      <Flag className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              {isReported && (
                <p className="mb-1 text-xs text-amber-600">
                  Denúncia enviada por você. Em análise.
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {comment.content}
              </p>
            </article>
          );
        })}
      </div>

      <Dialog
        open={Boolean(reportingCommentId)}
        onOpenChange={(open) => {
          if (!open && !submittingReport) setReportingCommentId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Denunciar comentário</DialogTitle>
            <DialogDescription>
              Essa denúncia gera um evento privado para moderação administrativa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="classified-comment-report-reason">Motivo</Label>
              <Select
                value={reportReason}
                onValueChange={setReportReason}
                disabled={submittingReport}
              >
                <SelectTrigger id="classified-comment-report-reason">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="offensive">Ofensivo</SelectItem>
                  <SelectItem value="fraud">Suspeita de golpe</SelectItem>
                  <SelectItem value="harassment">Assédio</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="classified-comment-report-description">
                Detalhes (opcional)
              </Label>
              <Textarea
                id="classified-comment-report-description"
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                placeholder="Descreva rapidamente o problema para ajudar a moderação."
                maxLength={600}
                disabled={submittingReport}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportingCommentId(null)}
              disabled={submittingReport}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleReport} disabled={submittingReport}>
              {submittingReport ? "Enviando..." : "Enviar denúncia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
