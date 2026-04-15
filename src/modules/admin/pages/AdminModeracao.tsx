import { useState, useEffect } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "@/core/authorization";
import { Input } from "@/shared/components/ui/input";
import { Loader2, Search, Shield } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { USER_ROLE } from "@/shared/types/constants";
import { useModeration } from "@/modules/admin/hooks/useModeration";
import { useModerationFilters } from "@/modules/admin/hooks/useModerationFilters";
import { ModerationTabs } from "@/modules/admin/components/moderation/ModerationTabs";
import { StatusFilter } from "@/modules/admin/components/moderation/StatusFilter";
import { ReportCard } from "@/modules/admin/components/moderation/ReportCard";
import { WarningCard } from "@/modules/admin/components/moderation/WarningCard";
import { AuditLogCard } from "@/modules/admin/components/moderation/AuditLogCard";
import { ReportDetailDialog } from "@/modules/admin/components/moderation/ReportDetailDialog";
import { WarnUserDialog } from "@/modules/admin/components/moderation/WarnUserDialog";

export default function AdminModeracao() {
  const { activeProfile } = useSessionContext();
  const [canModerate, setCanModerate] = useState<boolean | null>(null);

  const {
    loading,
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
  } = useModeration();

  const {
    tab,
    search,
    reportFilter,
    setTab,
    setSearch,
    setReportFilter,
    filterReports,
    filterWarnings,
    filterLogs,
  } = useModerationFilters();

  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportType, setReportType] = useState<"post" | "comment" | "profile">(
    "post",
  );
  const [actionLoading, setActionLoading] = useState(false);

  const [warnDialog, setWarnDialog] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  // Check moderation permission via AuthorizationEngine
  useEffect(() => {
    if (!activeProfile) {
      setCanModerate(false);
      return;
    }
    AuthorizationEngine.canProfilePerformAction(
      activeProfile.id,
      "moderateContent",
      {},
    ).then(setCanModerate);
  }, [activeProfile?.id]);

  // Validação de admin
  if (canModerate === false) {
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

  const postReportsPending = postReports.filter(
    (r) => r.status === "pendente",
  ).length;
  const commentReportsPending = commentReports.filter(
    (r) => r.status === "pendente",
  ).length;
  const profileReportsPending = profileReports.filter(
    (r) => r.status === "pendente",
  ).length;
  const totalPending =
    postReportsPending + commentReportsPending + profileReportsPending;

  const currentReports =
    tab === "posts"
      ? postReports
      : tab === "comments"
        ? commentReports
        : tab === "profiles"
          ? profileReports
          : [];

  const filteredReports = filterReports(
    currentReports,
    tab,
    getPost,
    getComment,
    getProfile,
  );
  const filteredWarningsList = filterWarnings(warnings, getProfile);
  const filteredLogsList = filterLogs(auditLogs);

  const handleReportView = (
    report: any,
    type: "post" | "comment" | "profile",
  ) => {
    setSelectedReport(report);
    setReportType(type);
  };

  const handleReportActionWrapper = async (
    reportId: string,
    table: string,
    status: string,
    notes: string,
  ) => {
    setActionLoading(true);
    const success = await handleReportAction(reportId, table, status, notes);
    setActionLoading(false);
    return success;
  };

  const handleDeleteWrapper = async (
    type: "post" | "comment",
    id: string,
    report: any,
    notes: string,
  ) => {
    setActionLoading(true);
    const success = await handleDeleteContent(type, id, report, notes);
    setActionLoading(false);
    return success;
  };

  const handleWarnWrapper = async (
    userId: string,
    type: "advertencia" | "suspensao_7d" | "suspensao_permanente",
    motivo: string,
  ) => {
    setActionLoading(true);
    const success = await handleWarnUser(userId, type, motivo);
    setActionLoading(false);
    return success;
  };

  const getReportContent = () => {
    if (!selectedReport) return { content: null, author: null, table: "" };

    let content: any = null;
    let authorProfileId: string | null = null;
    const table =
      reportType === "post"
        ? "posts"
        : reportType === "comment"
          ? "comments"
          : "profiles";

    if (reportType === "post") {
      content = getPost(selectedReport.post_id);
      authorProfileId = content?.autor_id;
    } else if (reportType === "comment") {
      content = getComment(selectedReport.comment_id);
      authorProfileId = content?.autor_id;
    } else {
      content = getProfile(selectedReport.profile_id);
      authorProfileId = selectedReport.profile_id;
    }

    const author = authorProfileId ? getProfile(authorProfileId) : null;

    return { content, author, table };
  };

  const { content, author, table } = getReportContent();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold font-display">Moderação</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie conteúdo e denúncias da comunidade
          </p>
        </div>
        {totalPending > 0 && (
          <Badge variant="destructive" className="self-start">
            {totalPending} pendente{totalPending > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      <ModerationTabs
        currentTab={tab}
        postReportsPending={postReportsPending}
        commentReportsPending={commentReportsPending}
        profileReportsPending={profileReportsPending}
        warningsCount={warnings.length}
        onTabChange={setTab}
      />

      {(tab === "posts" ||
        tab === "comments" ||
        tab === "profiles") && (
        <StatusFilter
          currentFilter={reportFilter}
          onFilterChange={setReportFilter}
        />
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "posts" ||
        tab === "comments" ||
        tab === "profiles" ? (
        <div className="space-y-2">
          {filteredReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhuma denúncia encontrada.
            </p>
          ) : (
            filteredReports.map((r) => {
              let content: any = null;
              let authorProfileId: string | null = null;

              if (tab === "posts") {
                content = getPost(r.post_id);
                authorProfileId = content?.autor_id;
              } else if (tab === "comments") {
                content = getComment(r.comment_id);
                authorProfileId = content?.autor_id;
              } else if (tab === "profiles") {
                content = getProfile(r.profile_id);
                authorProfileId = r.profile_id;
              }

              const author = authorProfileId
                ? getProfile(authorProfileId)
                : null;

              return (
                <ReportCard
                  key={r.id}
                  report={r}
                  content={content}
                  author={author}
                  type={
                    tab === "posts"
                      ? "post"
                      : tab === "comments"
                        ? "comment"
                        : "profile"
                  }
                  onView={() =>
                    handleReportView(
                      r,
                      tab === "posts"
                        ? "post"
                        : tab === "comments"
                          ? "comment"
                          : "profile",
                    )
                  }
                />
              );
            })
          )}
        </div>
      ) : tab === "warnings" ? (
        <div className="space-y-2">
          {filteredWarningsList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhuma advertência registrada.
            </p>
          ) : (
            filteredWarningsList.map((w) => (
              <WarningCard
                key={w.id}
                warning={w}
                targetUser={getProfile(w.user_id)}
                adminUser={getProfile(w.admin_id)}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogsList.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhum registro de auditoria.
            </p>
          ) : (
            filteredLogsList.map((l) => (
              <AuditLogCard
                key={l.id}
                log={l}
                adminUser={getProfile(l.admin_id)}
              />
            ))
          )}
        </div>
      )}

      <ReportDetailDialog
        report={selectedReport}
        content={content}
        author={author}
        type={reportType}
        table={table}
        isOpen={!!selectedReport}
        isLoading={actionLoading}
        onClose={() => setSelectedReport(null)}
        onAction={handleReportActionWrapper}
        onDelete={handleDeleteWrapper}
        onWarn={(userId, userName) => setWarnDialog({ userId, userName })}
      />

      <WarnUserDialog
        isOpen={!!warnDialog}
        userId={warnDialog?.userId || ""}
        userName={warnDialog?.userName || ""}
        isLoading={actionLoading}
        onClose={() => setWarnDialog(null)}
        onWarn={handleWarnWrapper}
      />
    </div>
  );
}
