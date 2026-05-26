import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Badge } from "@/shared/components/ui/badge";
import { Flag, Ban } from "lucide-react";
import { useAlertData } from "@/modules/admin/hooks/useAlertData";
import { useAlertActions } from "@/modules/admin/hooks/useAlertActions";
import { useAlertFilters } from "@/modules/admin/hooks/useAlertFilters";
import { AlertsStats } from "@/modules/admin/components/alerts/AlertsStats";
import { AlertFilters } from "@/modules/admin/components/alerts/AlertFilters";
import { AlertsList } from "@/modules/admin/components/alerts/AlertsList";
import { ReportsList } from "@/modules/admin/components/alerts/ReportsList";
import { BannedUsersList } from "@/modules/admin/components/alerts/BannedUsersList";
import { AlertDetailDialog } from "@/modules/admin/components/alerts/AlertDetailDialog";
import { ReportDetailDialog } from "@/modules/admin/components/alerts/ReportDetailDialog";
import type { AlertPost, PostReport } from "@/modules/admin/hooks/useAlertData";

export default function AdminAlertas() {
  const [tab, setTab] = useState<"alertas" | "denuncias" | "users">("alertas");
  const [selectedPost, setSelectedPost] = useState<AlertPost | null>(null);
  const [selectedReport, setSelectedReport] = useState<PostReport | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const {
    alertPosts,
    setAlertPosts,
    reports,
    setReports,
    profiles,
    setProfiles,
    confirmations,
    loading,
  } = useAlertData();

  const actions = useAlertActions({ setAlertPosts, setProfiles, setReports });
  const AlertActionConfirmDialog = actions.ConfirmDialog;

  const getPostReportCount = (postId: string) =>
    alertReports.filter((r) => r.post_id === postId).length;

  const getPostConfirmations = (postId: string) =>
    confirmations.filter((c) => c.post_id === postId && c.confirmed).length;

  const getPostDenials = (postId: string) =>
    confirmations.filter((c) => c.post_id === postId && !c.confirmed).length;

  const getProfile = (userId: string) => profiles.find((p) => p.id === userId);

  const alertReports = reports.filter((r) =>
    alertPosts.some((p) => p.id === r.post_id),
  );

  const bannedUsers = profiles.filter((p) => p.alert_banned);

  const filters = useAlertFilters({
    alertPosts,
    profiles,
    getPostReportCount,
    getProfile,
  });

  const filteredReports = alertReports.filter(
    (r) =>
      !filters.search ||
      (r.motivo || "").toLowerCase().includes(filters.search.toLowerCase()),
  );

  const pendingReports = alertReports.filter(
    (r) => r.status === "pendente",
  ).length;
  const hiddenAlerts = alertPosts.filter((p) => p.hidden).length;
  const activeAlerts = alertPosts.filter(
    (p) => !p.hidden && !filters.isExpired(p),
  ).length;

  const handleResolveReport = async (
    reportId: string,
    status: "resolvido" | "rejeitado",
  ) => {
    await actions.handleResolveReport(reportId, status, adminNotes);
    setSelectedReport(null);
    setAdminNotes("");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            Alertas de Segurança
          </h1>
          <p className="text-sm text-muted-foreground">
            Gerenciar alertas denunciados e usuários abusivos
          </p>
        </div>
      </div>

      <AlertsStats
        totalAlerts={alertPosts.length}
        activeAlerts={activeAlerts}
        pendingReports={pendingReports}
        bannedUsers={bannedUsers.length}
      />

      <Tabs
        value={tab}
        onValueChange={(v: "alertas" | "denuncias" | "users") => setTab(v)}
        className="mb-4"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="alertas" className="gap-1.5 flex-1 sm:flex-none">
            <AlertTriangle className="h-3.5 w-3.5" />
            Alertas
            {hiddenAlerts > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] h-4 px-1.5"
              >
                {hiddenAlerts} ocultos
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="denuncias"
            className="gap-1.5 flex-1 sm:flex-none"
          >
            <Flag className="h-3.5 w-3.5" />
            Denúncias
            {pendingReports > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 text-[10px] h-4 px-1.5"
              >
                {pendingReports}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5 flex-1 sm:flex-none">
            <Ban className="h-3.5 w-3.5" />
            Usuários Banidos
            {bannedUsers.length > 0 && (
              <Badge
                variant="outline"
                className="ml-1 text-[10px] h-4 px-1.5 text-warning border-warning/50"
              >
                {bannedUsers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={
            tab === "alertas"
              ? "Buscar alertas..."
              : tab === "denuncias"
                ? "Buscar denúncias..."
                : "Buscar usuários..."
          }
          value={filters.search}
          onChange={(e) => filters.setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {tab === "alertas" && (
        <AlertFilters
          filterStatus={filters.filterStatus}
          onFilterStatusChange={(value) =>
            filters.setFilterStatus(
              value as "todos" | "active" | "expirado" | "oculto",
            )
          }
          filterBairro={filters.filterBairro}
          onFilterBairroChange={filters.setFilterBairro}
          filterDenuncias={filters.filterDenuncias}
          onFilterDenunciasChange={(value) =>
            filters.setFilterDenuncias(value as "todos" | "0" | "1-2" | "3+")
          }
          uniqueBairros={filters.uniqueBairros}
          hasActiveFilters={filters.hasActiveFilters}
          onClearFilters={filters.clearFilters}
        />
      )}

      {tab === "alertas" && (
        <AlertsList
          alerts={filters.sortedAlerts}
          getProfile={getProfile}
          getPostReportCount={getPostReportCount}
          getPostConfirmations={getPostConfirmations}
          getPostDenials={getPostDenials}
          isExpired={filters.isExpired}
          onSelectPost={setSelectedPost}
        />
      )}

      {tab === "denuncias" && (
        <ReportsList
          reports={filteredReports}
          alertPosts={alertPosts}
          getProfile={getProfile}
          onSelectReport={(r) => {
            setSelectedReport(r);
            setAdminNotes(r.admin_notes || "");
          }}
        />
      )}

      {tab === "users" && (
        <BannedUsersList
          profiles={profiles}
          alertPosts={alertPosts}
          search={filters.search}
          getPostReportCount={getPostReportCount}
          actionLoading={actions.actionLoading}
          onToggleBan={actions.handleToggleBan}
        />
      )}

      <AlertDetailDialog
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
        getProfile={getProfile}
        getPostReportCount={getPostReportCount}
        getPostConfirmations={getPostConfirmations}
        getPostDenials={getPostDenials}
        alertReports={alertReports}
        isExpired={filters.isExpired}
        actionLoading={actions.actionLoading}
        onToggleHide={actions.handleToggleHide}
        onDeletePost={actions.handleDeletePost}
        onToggleBan={actions.handleToggleBan}
      />

      <ReportDetailDialog
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        alertPosts={alertPosts}
        getProfile={getProfile}
        adminNotes={adminNotes}
        onAdminNotesChange={setAdminNotes}
        actionLoading={actions.actionLoading}
        onResolve={handleResolveReport}
        onToggleBan={actions.handleToggleBan}
      />
      <AlertActionConfirmDialog />
    </div>
  );
}
