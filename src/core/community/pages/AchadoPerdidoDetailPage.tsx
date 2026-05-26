/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { lostFoundRuntimeService as lostFoundService } from "@/core/community/services/LostFoundRuntimeService";
import { useAppUrls } from "@/core/routing/hooks"; // SSOT URLs
import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Flag,
  CheckCircle2,
  Send,
  Loader2,
  Calendar,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { ReportContentDialog } from "@/core/moderation/components/ReportContentDialog";
import {
  LostFoundMiniMap,
  LostFoundLocationCard,
} from "@/core/community-lost-found/components";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "@/shared/utils/dateLocale";
import { cn } from "@/shared/utils/cn";
import { motion } from "framer-motion";
import { ProfileService } from "@/core/profiles/services/ProfileService";
import { buildWhatsAppUrl } from "@/shared/utils/contactLinks";
import { getLostFoundCategoryLabel } from "@/shared/validation/schemas/lostfound.schema";
import type { ProfileRow } from "@/core/profiles/persistence/ProfileRow";
import type { LostFoundComment } from "@/core/community-lost-found/services";
type CommentProfileSummary = { id: string; name: string; avatarUrl?: string | null };

const profileServiceInstance = new ProfileService();

interface Post {
  id: string;
  tipo: string;
  category: string;
  titulo: string;
  description: string;
  photo_url: string;
  publicNeighborhood: string;
  localizacao_aprox: string;
  latitude: number | null;
  longitude: number | null;
  date_ocorrido: string;
  resolvido: boolean;
  created_at: string;
  autor_id: string;
  autor: { name: string; avatar_url: string; whatsapp: string } | null;
}

interface Comment {
  id: string;
  texto: string;
  created_at: string;
  autor: { name: string; avatar_url: string } | null;
}

export default function AchadoPerdidoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const appUrls = useAppUrls(); // SSOT URLs
  const { toast } = useToast();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    if (!id) return;
    const data = await lostFoundService.getPostById(id);

    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const profile = (await profileServiceInstance.getProfileById(
      data.autor_id,
    )) as ProfileRow | null;

    setPost({
      id: data.id,
      tipo: data.tipo,
      category: data.categoria || "",
      titulo: data.titulo,
      description: data.descricao || "",
      photo_url: data.imagens?.[0] || "",
      publicNeighborhood: "",
      localizacao_aprox: data.local_perdido || "",
      latitude: null,
      longitude: null,
      date_ocorrido: data.data_perdido || "",
      resolvido: data.resolvido || false,
      created_at: data.created_at || "",
      autor_id: data.autor_id,
      autor: profile
        ? {
            name: profile.name,
            avatar_url: profile.avatar_url || "",
            whatsapp: profile.whatsapp || "",
          }
        : null,
    });

    await loadComments();
    setLoading(false);
  }

  async function loadComments() {
    if (!id) return;
    const data = await lostFoundService.getComments(id);

    if (!data) return;

    const autorIds = [...new Set(data.map((c: LostFoundComment) => c.autor_id))];
    const profiles =
      autorIds.length > 0
        ? ((await profileServiceInstance.getProfilesSummary(
            autorIds,
          )) as CommentProfileSummary[])
        : [];

    const profileMap = new Map(
      profiles.map((p) => [
        p.id,
        { name: p.name, avatar_url: p.avatarUrl || "" },
      ]),
    );
    setComments(
      data.map((c) => ({
        id: c.id,
        texto: c.texto || c.conteudo || "",
        created_at: c.created_at || "",
        autor: (profileMap.get(c.autor_id) as {
          name: string;
          avatar_url: string;
        }) || { name: "Usuário", avatar_url: "" },
      })),
    );
  }

  async function handleComment() {
    if (!user) {
      toast({ title: "Faça login para comentar", variant: "destructive" });
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await lostFoundService.createComment({
        post_id: id,
        autor_id: user.id,
        conteudo: commentText.trim(),
      });
      setCommentText("");
      toast({ title: "Comentário enviado!" });
      await loadComments();
    } catch {
      toast({ title: "Erro ao comentar", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMarkResolved() {
    if (!post || post.autor_id !== user?.id) return;
    await lostFoundService.toggleResolved(post.id);
    toast({
      title: post.resolvido
        ? "Marcado como não resolvido"
        : "Marcado como resolvido!",
    });
    loadPost();
  }

  if (loading)
    return (
      <div className="px-4 pt-16 space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );

  if (notFound || !post)
    return (
      <div className="p-4 text-center">
        <p>Publicação não encontrada.</p>
        <Button
          variant="outline"
          onClick={() => navigate(appUrls.community.lostAndFound)} // SSOT
          className="mt-4"
        >
          Voltar
        </Button>
      </div>
    );

  const isAuthor = user?.id === post.autor_id;
  const hasLocation = post.latitude !== null && post.longitude !== null;

  return (
    <div className="flex flex-col lg:flex-row pb-24 gap-6 max-w-7xl mx-auto">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b sticky top-0 bg-background z-10">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold font-display">
            {post.tipo === "perdido" ? "Item Perdido" : "Item Encontrado"}
          </h1>
          <button
            onClick={() => setReportOpen(true)}
            className="ml-auto h-9 w-9 rounded-full bg-secondary flex items-center justify-center"
          >
            <Flag className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {post.photo_url ? (
          <img
            src={post.photo_url}
            alt={post.titulo}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-secondary flex items-center justify-center">
            <Flag className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        <div className="px-4 py-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              variant={post.tipo === "perdido" ? "destructive" : "default"}
            >
              {post.tipo === "perdido" ? "Perdido" : "Encontrado"}
            </Badge>
            <Badge variant="secondary">
              {getLostFoundCategoryLabel(post.category)}
            </Badge>
            {post.resolvido && (
              <Badge
                variant="secondary"
                className="gap-0.5 text-success border-success/30"
              >
                <CheckCircle2 className="h-3 w-3" /> Resolvido
              </Badge>
            )}
          </div>

          <h2 className="text-lg font-bold font-display">{post.titulo}</h2>

          {post.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {post.description}
            </p>
          )}

          <div className="flex flex-col gap-2 text-sm">
            {post.publicNeighborhood && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {post.publicNeighborhood}
                  {post.localizacao_aprox ? ` - ${post.localizacao_aprox}` : ""}
                </span>
              </div>
            )}
            {post.date_ocorrido && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(
                    new Date(post.date_ocorrido + "T12:00:00"),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR },
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 py-3 border-t border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.autor?.avatar_url} />
              <AvatarFallback>{post.autor?.name?.[0] || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {post.autor?.name || "Anônimo"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            {post.autor?.whatsapp && (
              <Button
                asChild
                size="sm"
                className="bg-success hover:bg-success/90"
              >
                <a
                  href={buildWhatsAppUrl(post.autor.whatsapp) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                </a>
              </Button>
            )}
          </div>

          {isAuthor && (
            <Button
              variant={post.resolvido ? "outline" : "default"}
              className="w-full"
              onClick={handleMarkResolved}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {post.resolvido
                ? "Desmarcar como resolvido"
                : "Marcar como resolvido"}
            </Button>
          )}

          <div>
            <h3 className="text-sm font-bold mb-3">
              Comentários ({comments.length})
            </h3>
            {comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum comentário ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.autor?.avatar_url} />
                        <AvatarFallback>
                          {c.autor?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {c.autor?.name || "Anônimo"}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {formatDistanceToNow(new Date(c.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                    <p className="text-sm">{c.texto}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-background border-t px-4 py-3 z-20">
          <div className="flex gap-2">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value.slice(0, 500))}
              placeholder="Deixe um comentário..."
              className="min-h-[40px] max-h-[80px] text-sm resize-none flex-1"
              rows={1}
            />
            <Button
              size="icon"
              className="flex-shrink-0 h-10 w-10"
              onClick={handleComment}
              disabled={submitting || !commentText.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <ReportContentDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetType="post"
          targetId={post.id}
        />
      </div>

      <div className="hidden lg:block lg:w-[380px] lg:sticky lg:top-4 lg:self-start">
        <div className="space-y-4">
          {hasLocation ? (
            <LostFoundMiniMap
              latitude={post.latitude!}
              longitude={post.longitude!}
              title={post.titulo}
              tipo={post.tipo as "perdido" | "encontrado"}
              className="h-[400px]"
            />
          ) : (
            <LostFoundLocationCard
              neighborhood={post.publicNeighborhood}
              localizacaoAprox={post.localizacao_aprox}
            />
          )}

          <div className="bg-card rounded-xl border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Informações</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={post.resolvido ? "secondary" : "default"}
                  className="text-xs"
                >
                  {post.resolvido ? "Resolvido" : "Em aberto"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <Badge
                  variant={post.tipo === "perdido" ? "destructive" : "default"}
                  className="text-xs"
                >
                  {post.tipo === "perdido" ? "Perdido" : "Encontrado"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Categoria:</span>
                <span className="font-medium">
                  {getLostFoundCategoryLabel(post.category)}
                </span>
              </div>
              {post.publicNeighborhood && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Bairro:</span>
                  <span className="font-medium">{post.publicNeighborhood}</span>
                </div>
              )}
              {post.date_ocorrido && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-medium">
                    {format(
                      new Date(post.date_ocorrido + "T12:00:00"),
                      "dd/MM/yyyy",
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="flex items-start gap-2 text-xs text-blue-500 leading-relaxed">
              <Lightbulb className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>Dica:</strong>{" "}
                {post.tipo === "perdido"
                  ? "Se você encontrou este item, entre em contato com o autor pelo WhatsApp."
                  : "Se este item é seu, entre em contato com quem encontrou para combinar a devolução."}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
