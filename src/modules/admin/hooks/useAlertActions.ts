import { useState } from "react";
import { adminAlertsService } from "@/core/admin";
import { useToast } from "@/shared/hooks/use-toast";
import type { AlertPost, Profile, PostReport } from "./useAlertData";

interface UseAlertActionsProps {
  setAlertPosts: React.Dispatch<React.SetStateAction<AlertPost[]>>;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  setReports: React.Dispatch<React.SetStateAction<PostReport[]>>;
}

export function useAlertActions({
  setAlertPosts,
  setProfiles,
  setReports,
}: UseAlertActionsProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleToggleHide = async (post: AlertPost) => {
    setActionLoading(post.id);
    try {
      // ✅ SSOT AAA - Usa AdminAlertsService que delega para PostsFacade
      await adminAlertsService.toggleAlertVisibility(post.id, !post.hidden);
      setAlertPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, hidden: !post.hidden } : p)),
      );
      toast({ title: post.hidden ? "Alerta reexibido" : "Alerta ocultado" });
    } catch (e: unknown) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Erro ao ocultar alerta",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Excluir permanentemente este alerta?")) return;
    setActionLoading(postId);
    try {
      // ✅ SSOT AAA - Usa AdminAlertsService que delega para PostsFacade
      await adminAlertsService.deleteAlert(postId);
      setAlertPosts((prev) => prev.filter((p) => p.id !== postId));
      toast({ title: "Alerta excluído" });
    } catch (e: unknown) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Erro ao excluir alerta",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBan = async (profile: Profile) => {
    setActionLoading(profile.id);
    try {
      // ✅ SSOT AAA - Usa AdminAlertsService que delega para ProfileService
      await adminAlertsService.toggleAlertBan(profile.id, !profile.alert_banned);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, alert_banned: !p.alert_banned } : p,
        ),
      );
      toast({
        title: profile.alert_banned
          ? "✅ Ban removido"
          : "🚫 Usuário banido de criar alertas",
        description: profile.alert_banned
          ? `${profile.name} pode criar alertas novamente`
          : `${profile.name} não poderá mais criar alertas`,
      });
    } catch (e: unknown) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Erro ao atualizar banimento",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    status: "resolvido" | "rejeitado",
    adminNotes: string,
  ) => {
    setActionLoading(reportId);
    try {
      // ✅ SSOT - Tabela post_reports não existe
      // Reports devem ser implementados quando necessário
      toast({ 
        title: "Funcionalidade não disponível", 
        description: "Sistema de reports ainda não implementado",
        variant: "destructive" 
      });
    } catch (e: unknown) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Erro ao resolver denúncia",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return {
    actionLoading,
    handleToggleHide,
    handleDeletePost,
    handleToggleBan,
    handleResolveReport,
  };
}
