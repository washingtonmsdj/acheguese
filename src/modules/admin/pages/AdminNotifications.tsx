import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, RefreshCw } from "lucide-react";
import { adminNotificationsService } from "@/core/admin";
import type { AdminNotificationRecord } from "@/core/admin/services/AdminNotificationsService";
import { NotificationPriority } from "@/core/notifications";
import {
  AdminFiltersBar,
  AdminPageHeader,
  type FilterOption,
} from "@/modules/admin/components";
import { Button } from "@/shared/components/ui/button";
import { AdminNotificationDetailDialog } from "./notifications/AdminNotificationDetailDialog";
import { AdminNotificationsDeliveryAudit } from "./notifications/AdminNotificationsDeliveryAudit";
import {
  formatNotificationType,
  getTypeCount,
  type ReadFilter,
} from "./notifications/AdminNotifications.helpers";
import { AdminNotificationsQueue } from "./notifications/AdminNotificationsQueue";
import { AdminNotificationsSidePanels } from "./notifications/AdminNotificationsSidePanels";
import { AdminNotificationsStatsGrid } from "./notifications/AdminNotificationsStatsGrid";

export default function AdminNotifications() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] =
    useState<AdminNotificationRecord | null>(null);

  const readValue = useMemo(() => {
    if (readFilter === "read") return true;
    if (readFilter === "unread") return false;
    return undefined;
  }, [readFilter]);

  const statsQuery = useQuery({
    queryKey: ["admin-notifications-stats"],
    queryFn: () => adminNotificationsService.getStats(),
  });

  const settingsStatsQuery = useQuery({
    queryKey: ["admin-notifications-settings-stats"],
    queryFn: () => adminNotificationsService.getSettingsStats(),
  });

  const channelStatsQuery = useQuery({
    queryKey: ["admin-notifications-channel-stats"],
    queryFn: () => adminNotificationsService.getChannelStats(),
  });

  const templateStatsQuery = useQuery({
    queryKey: ["admin-notifications-template-stats"],
    queryFn: () => adminNotificationsService.getTemplateStats(8),
  });

  const deliveryAuditQuery = useQuery({
    queryKey: ["admin-notifications-delivery-audit"],
    queryFn: () =>
      adminNotificationsService.getEmailDeliveryAudit({
        page: 1,
        limit: 10,
      }),
  });

  const notificationsQuery = useQuery({
    queryKey: [
      "admin-notifications-list",
      page,
      search,
      typeFilter,
      priorityFilter,
      readFilter,
    ],
    queryFn: () =>
      adminNotificationsService.getNotifications({
        page,
        limit: 20,
        search: search || undefined,
        type: typeFilter || undefined,
        priority: priorityFilter ? (priorityFilter as NotificationPriority) : undefined,
        read: readValue,
      }),
  });

  const stats = statsQuery.data;
  const settingsStats = settingsStatsQuery.data;
  const channelStats = channelStatsQuery.data;
  const templateStats = templateStatsQuery.data || [];
  const deliveryAudit = deliveryAuditQuery.data;
  const notifications = notificationsQuery.data;

  const typeOptions = useMemo(() => {
    return Object.keys(stats?.byType || {}).sort((left, right) => {
      const leftCount = getTypeCount(stats?.byType, left);
      const rightCount = getTypeCount(stats?.byType, right);
      return rightCount - leftCount;
    });
  }, [stats?.byType]);

  const topTypes = useMemo(
    () =>
      Object.entries(stats?.byType || {})
        .sort(([, left], [, right]) => Number(right) - Number(left))
        .slice(0, 5),
    [stats?.byType],
  );

  const filters = useMemo<FilterOption[]>(
    () => [
      {
        label: "Tipo",
        value: "type",
        placeholder: "Todos os tipos",
        options: typeOptions.map((type) => ({
          label: formatNotificationType(type),
          value: type,
        })),
      },
      {
        label: "Prioridade",
        value: "priority",
        placeholder: "Todas as prioridades",
        options: Object.values(NotificationPriority).map((priority) => ({
          label: formatNotificationType(priority),
          value: priority,
        })),
      },
      {
        label: "Leitura",
        value: "read",
        placeholder: "Todos os status",
        options: [
          { label: "Nao lidas", value: "unread" },
          { label: "Lidas", value: "read" },
        ],
      },
    ],
    [typeOptions],
  );

  const isRefreshing =
    statsQuery.isFetching ||
    settingsStatsQuery.isFetching ||
    channelStatsQuery.isFetching ||
    templateStatsQuery.isFetching ||
    deliveryAuditQuery.isFetching ||
    notificationsQuery.isFetching;

  const retryAll = () => {
    void statsQuery.refetch();
    void settingsStatsQuery.refetch();
    void channelStatsQuery.refetch();
    void templateStatsQuery.refetch();
    void deliveryAuditQuery.refetch();
    void notificationsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Governanca de Notificacoes"
        description="Cobertura administrativa do fluxo global de notifications e das preferencias do usuario."
        icon={Bell}
        actions={
          <Button variant="outline" onClick={retryAll} disabled={isRefreshing}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        }
      />

      <AdminNotificationsStatsGrid
        stats={stats}
        settingsStats={settingsStats}
        channelStats={channelStats}
        statsError={statsQuery.isError}
        settingsError={settingsStatsQuery.isError}
        channelError={channelStatsQuery.isError}
        statsLoading={statsQuery.isLoading}
        settingsLoading={settingsStatsQuery.isLoading}
        channelLoading={channelStatsQuery.isLoading}
      />

      <AdminFiltersBar
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Buscar por titulo, mensagem, tipo ou user_id"
        filters={filters}
        filterValues={{
          type: typeFilter,
          priority: priorityFilter,
          read: readFilter === "all" ? "" : readFilter,
        }}
        onFilterChange={(key, value) => {
          if (key === "type") setTypeFilter(value);
          if (key === "priority") setPriorityFilter(value);
          if (key === "read") setReadFilter((value || "all") as ReadFilter);
          setPage(1);
        }}
        onClear={() => {
          setSearch("");
          setTypeFilter("");
          setPriorityFilter("");
          setReadFilter("all");
          setPage(1);
        }}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        <AdminNotificationsQueue
          notifications={notifications}
          isLoading={notificationsQuery.isLoading}
          isError={notificationsQuery.isError}
          onRetry={() => {
            void notificationsQuery.refetch();
          }}
          onPageChange={setPage}
          onSelectNotification={setSelectedNotification}
        />

        <AdminNotificationsSidePanels
          topTypes={topTypes}
          settingsStats={settingsStats}
          channelStats={channelStats}
          templateStats={templateStats}
          statsError={statsQuery.isError}
          settingsError={settingsStatsQuery.isError}
          channelError={channelStatsQuery.isError}
          templateError={templateStatsQuery.isError}
          templateLoading={templateStatsQuery.isLoading}
          onRetryStats={() => {
            void statsQuery.refetch();
          }}
          onRetrySettings={() => {
            void settingsStatsQuery.refetch();
          }}
          onRetryChannel={() => {
            void channelStatsQuery.refetch();
          }}
          onRetryTemplate={() => {
            void templateStatsQuery.refetch();
          }}
        />
      </div>

      <AdminNotificationsDeliveryAudit
        deliveryAudit={deliveryAudit}
        isLoading={deliveryAuditQuery.isLoading}
        isError={deliveryAuditQuery.isError}
        onRetry={() => {
          void deliveryAuditQuery.refetch();
        }}
      />

      <AdminNotificationDetailDialog
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </div>
  );
}
