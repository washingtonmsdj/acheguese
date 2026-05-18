/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useSessionContext } from "@/core/session";
import { ModerationService } from "@/core/moderation/services/ModerationService";
import { adminCommunityService } from "@/core/admin";
import type { ModerationStats, CommunityPost, PostFlag } from "@/core/admin";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Shield,
  Flag,
  CheckCircle2,
  XCircle,
  Trash2,
  Eye,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  MessageSquare,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { RIDE_STATUS, USER_ROLE } from "@/shared/types/constants";
import { logger } from "@/shared/utils/logger";
import type { LucideIcon } from "lucide-react";

type FilterStatus = "all" | "pending" | "flagged" | "approved" | "rejected";
type ModerationAction = "approve" | "reject" | "flag" | "delete";
type PostModerationService = {
  moderatePost: (
    postId: string,
    moderatedBy: string,
    action: ModerationAction,
    reason?: string,
  ) => Promise<void>;
};

const statusConfig = {
  pending: {
    label: "Pendente",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
  },
  approved: {
    label: "Aprovado",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejeitado",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: XCircle,
  },
  flagged: {
    label: "Denunciado",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: Flag,
  },
};

const flagReasons = {
  spam: "Spam",
  inappropriate: "Conteúdo Inapropriado",
  fake: "Informação Falsa",
  offensive: "Ofensivo",
  other: "Outro",
};

export default function AdminModeracaoComunidade() {
  const { user } = useSessionContext();
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");

  // Modal de ação
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    post: CommunityPost | null;
    action: ModerationAction | null;
  }>({ open: false, post: null, action: null });
  const [actionReason, setActionReason] = useState("");

  // Modal de detalhes
  const [detailsModal, setDetailsModal] = useState<{
    open: boolean;
    post: CommunityPost | null;
    flags: PostFlag[];
  }>({ open: false, post: null, flags: [] });

  // Buscar estatísticas
  const fetchStats = async () => {
    const data = await adminCommunityService.getModerationStats();
    if (data) {
      setStats(data);
    }
  };

  // Buscar postagens
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const filterValue =
        filter === "all"
          ? undefined
          : (filter as "pending" | "approved" | "rejected" | "flagged");
      const data = await adminCommunityService.getCommunityPosts(filterValue);
      setPosts(data);
    } catch (err) {
      logger.error("Erro ao buscar postagens:", err);
      toast.error("Erro ao carregar postagens");
    } finally {
      setLoading(false);
    }
  };

  // Buscar denúncias de uma postagem
  const fetchFlags = async (postId: string): Promise<PostFlag[]> => {
    try {
      return await adminCommunityService.getPostFlags(postId);
    } catch (error) {
      logger.error("Erro ao buscar denúncias:", error);
      return [];
    }
  };

  // Executar ação de moderação
  const executeAction = async () => {
    if (!actionModal.post || !actionModal.action || !user) return;

    try {
      await (ModerationService as unknown as PostModerationService).moderatePost(
        actionModal.post.id,
        user.id,
        actionModal.action,
        actionReason || undefined,
      );

      toast.success(
        `Postagem ${actionModal.action === "approve" ? "aprovada" : actionModal.action === "reject" ? "rejeitada" : actionModal.action === "delete" ? "deletada" : "marcada"}!`,
      );

      setActionModal({ open: false, post: null, action: null });
      setActionReason("");

      fetchPosts();
      fetchStats();
    } catch (err) {
      logger.error("Erro ao moderar:", err);
      toast.error("Erro ao executar ação");
    }
  };

  // Abrir modal de detalhes
  const openDetails = async (post: CommunityPost) => {
    const flags = await fetchFlags(post.id);
    setDetailsModal({ open: true, post, flags });
  };

  useEffect(() => {
    fetchStats();
    fetchPosts();
  }, [filter]);

  // Verificar se é admin
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F14] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="h-6 w-6 text-teal-400" />
              Moderação da Comunidade
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Gerencie postagens e denúncias do feed da comunidade
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              fetchPosts();
              fetchStats();
            }}
            className="bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard
              label="Total"
              value={stats.total_posts}
              icon={MessageSquare}
              color="text-gray-400"
            />
            <StatCard
              label="Pendentes"
              value={stats.pending_posts}
              icon={Clock}
              color="text-yellow-400"
            />
            <StatCard
              label="Aprovados"
              value={stats.approved_posts}
              icon={CheckCircle2}
              color="text-green-400"
            />
            <StatCard
              label="Rejeitados"
              value={stats.rejected_posts}
              icon={XCircle}
              color="text-red-400"
            />
            <StatCard
              label="Denunciados"
              value={stats.flagged_posts}
              icon={Flag}
              color="text-orange-400"
            />
            <StatCard
              label="Denúncias"
              value={stats.total_flags}
              icon={AlertTriangle}
              color="text-amber-400"
            />
            <StatCard
              label="Com Denúncias"
              value={stats.posts_with_flags}
              icon={TrendingUp}
              color="text-purple-400"
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[
            { key: "all", label: "Todos", count: stats?.total_posts || 0 },
            {
              key: RIDE_STATUS.PENDING,
              label: "Pendentes",
              count: stats?.pending_posts || 0,
            },
            {
              key: "flagged",
              label: "Denunciados",
              count: stats?.flagged_posts || 0,
            },
            {
              key: "approved",
              label: "Aprovados",
              count: stats?.approved_posts || 0,
            },
            {
              key: "rejected",
              label: "Rejeitados",
              count: stats?.rejected_posts || 0,
            },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as FilterStatus)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap",
                filter === f.key
                  ? "bg-teal-500 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10",
              )}
            >
              {f.label}
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs">
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 text-teal-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Carregando postagens...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma postagem encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onAction={(action) =>
                  setActionModal({ open: true, post, action })
                }
                onDetails={() => openDetails(post)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Dialog
        open={actionModal.open}
        onOpenChange={(open) =>
          !open && setActionModal({ open: false, post: null, action: null })
        }
      >
        <DialogContent className="bg-[#1E2529] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>
              {actionModal.action === "approve" && "✅ Aprovar Postagem"}
              {actionModal.action === "reject" && "❌ Rejeitar Postagem"}
              {actionModal.action === "flag" && "🚩 Marcar Postagem"}
              {actionModal.action === "delete" && "🗑️ Deletar Postagem"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {actionModal.post?.content}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-400">Motivo (opcional)</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Descreva o motivo da ação..."
                className="bg-white/5 border-white/10 text-white mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionModal({ open: false, post: null, action: null })
              }
              className="border-white/10 text-gray-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={executeAction}
              className={cn(
                "text-white",
                actionModal.action === "approve" &&
                  "bg-green-500 hover:bg-green-600",
                actionModal.action === "reject" &&
                  "bg-red-500 hover:bg-red-600",
                actionModal.action === "flag" &&
                  "bg-orange-500 hover:bg-orange-600",
                actionModal.action === "delete" &&
                  "bg-red-600 hover:bg-red-700",
              )}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog
        open={detailsModal.open}
        onOpenChange={(open) =>
          !open && setDetailsModal({ open: false, post: null, flags: [] })
        }
      >
        <DialogContent className="bg-[#1E2529] border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Postagem</DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Moderar conteúdo da comunidade
          </DialogDescription>

          {detailsModal.post && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Conteúdo:</p>
                <p className="text-white mt-1">{detailsModal.post.content}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400">Autor:</p>
                  <p className="text-white">{detailsModal.post.author_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Bairro:</p>
                  <p className="text-white">
                    {detailsModal.post.author_neighborhood}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Destino:</p>
                  <p className="text-white">{detailsModal.post.destination}</p>
                </div>
                <div>
                  <p className="text-gray-400">Interessados:</p>
                  <p className="text-white">
                    {detailsModal.post.interested_count}
                  </p>
                </div>
              </div>

              {detailsModal.flags.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-white mb-2">
                    Denúncias ({detailsModal.flags.length})
                  </p>
                  <div className="space-y-2">
                    {detailsModal.flags.map((flag) => (
                      <div
                        key={flag.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-orange-400">
                            {
                              flagReasons[
                                flag.reason as keyof typeof flagReasons
                              ]
                            }
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(flag.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Por: {flag.flagged_by_name}
                        </p>
                        {flag.description && (
                          <p className="text-xs text-gray-300 mt-1">
                            {flag.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <Icon className={cn("h-4 w-4", color)} />
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function PostCard({
  post,
  onAction,
  onDetails,
}: {
  post: CommunityPost;
  onAction: (action: ModerationAction) => void;
  onDetails: () => void;
}) {
  const config = statusConfig[post.moderation_status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("text-xs border", config.color)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
            {post.flag_count > 0 && (
              <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                <Flag className="h-3 w-3 mr-1" />
                {post.flag_count} denúncia{post.flag_count > 1 ? "s" : ""}
              </Badge>
            )}
            <span className="text-xs text-gray-500">
              {new Date(post.created_at).toLocaleString("pt-BR")}
            </span>
          </div>

          <p className="text-sm text-white mb-2">{post.content}</p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>👤 {post.author_name}</span>
            <span>📍 {post.destination}</span>
            <span>❤️ {post.interested_count} interessados</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDetails}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {post.moderation_status !== "approved" && (
            <Button
              size="sm"
              onClick={() => onAction("approve")}
              className="h-8 bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          {post.moderation_status !== "rejected" && (
            <Button
              size="sm"
              onClick={() => onAction("reject")}
              className="h-8 bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onAction("delete")}
            className="h-8 bg-red-600/20 text-red-400 hover:bg-red-600/30"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

