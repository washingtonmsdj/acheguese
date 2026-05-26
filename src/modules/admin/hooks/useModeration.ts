import { useEffect, useState } from "react";
import { adminModerationService } from "@/core/admin";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { useToast } from "@/shared/hooks/use-toast";
import { logger } from "@/shared/utils/logger";
import { supabase } from "@/integrations/supabase";

export type TabType =
  | "posts"
  | "comments"
  | "profiles"
  | "warnings"
  | "history";

export function useModeration() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [posts, setPosts] = useState<Record<string, unknown>[]>([]);
  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [profiles, setProfiles] = useState<Record<string, unknown>[]>([]);
  const [postReports, setPostReports] = useState<Record<string, unknown>[]>([]);
  const [commentReports, setCommentReports] = useState<Record<string, unknown>[]>([]);
  const [profileReports, setProfileReports] = useState<Record<string, unknown>[]>([]);
  const [warnings, setWarnings] = useState<Record<string, unknown>[]>([]);
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await adminModerationService.getAllModerationData();
      const [postReportData, commentReportData, profileReportData] = await Promise.all([
        (supabase as any).from("admin_pending_post_reports").select("*"),
        (supabase as any).from("admin_pending_comment_reports").select("*"),
        (supabase as any)
          .from("community_reports")
          .select("*")
          .eq("target_type", "profile")
          .in("status", ["pending", "under_review"])
          .order("created_at", { ascending: false }),
      ]);

      setPosts((data.posts ?? []) as unknown as Record<string, unknown>[]);
      setComments((data.comments ?? []) as unknown as Record<string, unknown>[]);
      setProfiles((data.profiles ?? []) as unknown as Record<string, unknown>[]);
      setPostReports((postReportData.data ?? []) as Record<string, unknown>[]);
      setCommentReports((commentReportData.data ?? []) as Record<string, unknown>[]);
      setProfileReports((profileReportData.data ?? []) as Record<string, unknown>[]);
      setWarnings((data.warnings ?? []) as unknown as Record<string, unknown>[]);
      setAuditLogs((data.auditLogs ?? []) as unknown as Record<string, unknown>[]);
    } catch (e) {
      logger.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const getId = (value: Record<string, unknown>): string | null =>
    typeof value.id === "string" ? value.id : null;

  const getProfile = (userId: string) => profiles.find((p) => getId(p) === userId);
  const getPost = (postId: string) => posts.find((p) => getId(p) === postId);
  const getComment = (commentId: string) =>
    comments.find((c) => getId(c) === commentId);

  const handleReportAction = async (
    reportId: string,
    _table: string,
    status: string,
    adminNotes: string,
  ) => {
    try {
      const { error } = await (supabase as any)
        .from("community_reports")
        .update({
          status,
          admin_notes: adminNotes || null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;

      toast({ title: "Acao registrada" });
      await fetchAll();
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro";
      toast({ title: "Erro", description: message, variant: "destructive" });
      return false;
    }
  };

  const handleDeleteContent = async (
    type: "post" | "comment",
    id: string,
    report?: Record<string, unknown>,
    adminNotes?: string,
  ) => {
    try {
      await adminModerationService.deleteContent(type, id);

      if (type === "post") {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        setComments((prev) => prev.filter((c) => c.id !== id));
      }

      const reportId = typeof report?.id === "string" ? report.id : null;
      if (reportId) {
        const { error } = await (supabase as any)
          .from("community_reports")
          .update({
            status: "removed",
            admin_notes: adminNotes || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", reportId);

        if (error) throw error;
      }

      toast({ title: `${type === "post" ? "Post" : "Comentario"} excluido` });
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro";
      toast({ title: "Erro", description: message, variant: "destructive" });
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
      await adminModerationService.warnUser(userId, warnType, motivo, user.id);

      toast({
        title:
          warnType === "advertencia"
            ? "Advertencia aplicada"
            : "Usuario suspenso",
        description: "Acao aplicada com sucesso.",
      });

      await fetchAll();
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro";
      toast({ title: "Erro", description: message, variant: "destructive" });
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
