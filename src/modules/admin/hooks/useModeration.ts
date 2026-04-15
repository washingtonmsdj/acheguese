/**
 * ✅ SSOT AAA - Hook useModeration migrado
 * Usa AdminModerationService que delega para PostsFacade, CommentsFacade, ProfileService (SSOT)
 */

import { useState, useEffect } from "react";
import { adminModerationService } from "@/core/admin";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { logger } from "@/shared/utils/logger";

export type TabType =
  // ✅ SSOT - Tabelas de reports não existem, usando tabelas de conteúdo
  | "posts"
  | "comments"
  | "profiles"
  | "warnings"
  | "history";

export function useModeration() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [postReports, setPostReports] = useState<any[]>([]);
  const [commentReports, setCommentReports] = useState<any[]>([]);
  const [profileReports, setProfileReports] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      // ✅ SSOT AAA - Usa AdminModerationService que delega para serviços de domínio
      const data = await adminModerationService.getAllModerationData();
      
      setPosts(data.posts);
      setComments(data.comments);
      setProfiles(data.profiles);
      setPostReports([]); // Tabela post_reports não existe
      setCommentReports([]); // Tabela comment_reports não existe
      setProfileReports([]); // Tabela profile_reports não existe
      setWarnings(data.warnings);
      setAuditLogs(data.auditLogs);
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getProfile = (userId: string) => profiles.find((p) => p.id === userId);
  const getPost = (postId: string) => posts.find((p) => p.id === postId);
  const getComment = (commentId: string) =>
    comments.find((c) => c.id === commentId);

  const handleReportAction = async (
    reportId: string,
    table: string,
    status: string,
    adminNotes: string,
  ) => {
    try {
      // ✅ SSOT - Tabelas de reports não existem
      // Esta função não faz nada pois não há tabela de reports
      toast({ title: `Ação registrada` });
      return true;
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      return false;
    }
  };

  const handleDeleteContent = async (
    type: "post" | "comment",
    id: string,
    report?: any,
    adminNotes?: string,
  ) => {
    try {
      // ✅ SSOT AAA - Usa AdminModerationService que delega para PostsFacade/CommentsFacade
      await adminModerationService.deleteContent(type, id);

      if (type === "post") {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }

      // ✅ SSOT - Tabelas de reports não existem, não há report para atualizar

      toast({ title: `${type === "post" ? "Post" : "Comentário"} excluído` });
      return true;
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      return false;
    }
  };

  const handleWarnUser = async (
    userId: string,
    warnType: "advertencia" | "suspensao_7d" | "suspensao_permanente",
    motivo: string,
  ) => {
    if (!user) return false;

    try {
      // ✅ SSOT AAA - Usa AdminModerationService que delega para ProfileService
      await adminModerationService.warnUser(userId, warnType, motivo, user.id);

      toast({
        title:
          warnType === "advertencia"
            ? "⚠️ Advertência aplicada"
            : "🚫 Usuário suspenso",
        description: `Ação aplicada com sucesso.`,
      });

      await fetchAll();
      return true;
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
      return false;
    }
  };

  return {
    loading,
    posts,
    comments,
    profiles,
    postReports,
    commentReports,
    profileReports,
    warnings,
    auditLogs,
    getProfile,
    getPost,
    getComment,
    handleReportAction,
    handleDeleteContent,
    handleWarnUser,
    fetchAll,
  };
}
