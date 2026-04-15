import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  Eye,
  Filter,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  adminNotificationsService,
  type AdminNotificationRecord,
} from "@/core/admin";
import { NotificationPriority } from "@/core/notifications";
import {
  AdminDataState,
  AdminErrorState,
  AdminFiltersBar,
  AdminPageHeader,
  AdminPagination,
  AdminSectionCard,
  AdminStatsCard,
  AdminStatsGrid,
  AdminTable,
  type FilterOption,
} from "@/modules/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

type ReadFilter = "all" | "read" | "unread";

function formatNotificationType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPercent(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return <Badge variant="destructive">Urgente</Badge>;
    case "high":
      return <Badge className="bg-orange-500 hover:bg-orange-500">Alta</Badge>;
    case "medium":
      return <Badge variant="secondary">Media</Badge>;
    default:
      return <Badge variant="outline">Baixa</Badge>;
  }
}

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
  const notifications = notificationsQuery.data;

  const typeOptions = useMemo(() => {
    return Object.keys(stats?.byType || {}).sort((left, right) => {
      const leftCount = stats?.byType[left] || 0;
      const rightCount = stats?.byType[right] || 0;
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
    statsQuery.isFetching || settingsStatsQuery.isFetching || notificationsQuery.isFetching;
  const retryAll = () => {
    void statsQuery.refetch();
    void settingsStatsQuery.refetch();
    void notificationsQuery.refetch();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Governanca de Notificacoes"
        description="Cobertura administrativa do fluxo global de notifications e das preferencias do usuario."
        icon={Bell}
        actions={
          <Button
            variant="outline"
            onClick={retryAll}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        }
      />

      <AdminStatsGrid>
        <AdminStatsCard
          title="Total de notificacoes"
          value={statsQuery.isError ? "--" : stats?.total || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar estatisticas"
              : `${stats?.last24h || 0} criadas nas ultimas 24h`
          }
          icon={Bell}
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Backlog nao lido"
          value={statsQuery.isError ? "--" : stats?.unread || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar backlog"
              : `${stats?.urgentPriority || 0} urgentes e ${stats?.highPriority || 0} altas`
          }
          icon={ShieldCheck}
          iconColor="text-orange-600"
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Usuarios impactados"
          value={statsQuery.isError ? "--" : stats?.uniqueUsers || 0}
          subtitle={
            statsQuery.isError
              ? "Falha ao carregar impacto"
              : `${stats?.last7d || 0} registros nos ultimos 7 dias`
          }
          icon={UserRound}
          iconColor="text-sky-600"
          loading={statsQuery.isLoading}
        />
        <AdminStatsCard
          title="Settings configurados"
          value={settingsStatsQuery.isError ? "--" : settingsStats?.totalUsersWithSettings || 0}
          subtitle={
            settingsStatsQuery.isError
              ? "Falha ao carregar preferencias"
              : `${formatPercent(settingsStats?.pushEnabled || 0, settingsStats?.totalUsersWithSettings || 0)} com push ativo`
          }
          icon={Settings2}
          iconColor="text-emerald-600"
          loading={settingsStatsQuery.isLoading}
        />
      </AdminStatsGrid>

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
        <AdminSectionCard
          title="Fila operacional"
          description="Leitura central do backlog global de notificacoes, sem acessar o banco direto da page."
          icon={Filter}
        >
          {notificationsQuery.isError ? (
            <AdminErrorState
              title="Falha ao carregar a fila de notificacoes"
              description="O dominio `notifications` nao retornou a fila administrativa canonica nesta tentativa."
              onRetry={() => {
                void notificationsQuery.refetch();
              }}
            />
          ) : (
            <AdminDataState
              loading={notificationsQuery.isLoading}
              isEmpty={!notificationsQuery.isLoading && !notifications?.data.length}
              emptyTitle="Nenhuma notificacao encontrada"
              emptyDescription="Nenhuma notificacao corresponde aos filtros atuais."
            >
              <AdminTable
                footer={
                  <AdminPagination
                    currentPage={notifications?.page || 1}
                    totalPages={notifications?.totalPages || 1}
                    totalItems={notifications?.total || 0}
                    itemsPerPage={20}
                    onPageChange={setPage}
                  />
                }
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Detalhe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications?.data.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="space-y-0.5">
                          <div className="font-medium">
                            {notification.profile?.display_name ||
                              notification.profile?.name ||
                              notification.profile?.username ||
                              "Usuario sem perfil resolvido"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {notification.profile?.username
                              ? `@${notification.profile.username}`
                              : notification.user_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatNotificationType(notification.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-[280px]">
                        <div className="space-y-0.5">
                          <div className="font-medium">{notification.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message || "Sem mensagem"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(notification.priority)}</TableCell>
                      <TableCell>
                        {notification.read ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600">
                            Lida
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Nao lida</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {notification.created_at
                          ? format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedNotification(notification)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </AdminTable>
            </AdminDataState>
          )}
        </AdminSectionCard>

        <div className="space-y-4">
          <AdminSectionCard
            title="Distribuicao por tipo"
            description="Top 5 tipos atualmente emitidos."
            icon={ShieldCheck}
          >
            {statsQuery.isError ? (
              <AdminErrorState
                title="Falha ao consolidar distribuicao por tipo"
                description="As estatisticas agregadas de `notifications` nao foram carregadas."
                onRetry={() => {
                  void statsQuery.refetch();
                }}
              />
            ) : (
              <AdminDataState
                isEmpty={!topTypes.length}
                emptyTitle="Sem dados de tipos"
                emptyDescription="Ainda nao ha distribuicao suficiente para leitura administrativa."
              >
                <>
                  {topTypes.map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between gap-3">
                      <p className="text-sm">{formatNotificationType(type)}</p>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </>
              </AdminDataState>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            title="Aderencia de preferencias"
            description="Estado agregado de `user_notification_settings`."
            icon={Settings2}
            contentClassName="space-y-3 text-sm"
          >
            {settingsStatsQuery.isError ? (
              <AdminErrorState
                title="Falha ao carregar preferencias de notificacao"
                description="O agregado de `user_notification_settings` nao ficou disponivel para leitura administrativa."
                onRetry={() => {
                  void settingsStatsQuery.refetch();
                }}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span>Email ativo</span>
                  <Badge variant="outline">
                    {formatPercent(
                      settingsStats?.emailEnabled || 0,
                      settingsStats?.totalUsersWithSettings || 0,
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Push ativo</span>
                  <Badge variant="outline">
                    {formatPercent(
                      settingsStats?.pushEnabled || 0,
                      settingsStats?.totalUsersWithSettings || 0,
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Weekly digest</span>
                  <Badge variant="outline">
                    {formatPercent(
                      settingsStats?.weeklyDigestEnabled || 0,
                      settingsStats?.totalUsersWithSettings || 0,
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Novas mensagens</span>
                  <Badge variant="outline">
                    {formatPercent(
                      settingsStats?.newMessagesEnabled || 0,
                      settingsStats?.totalUsersWithSettings || 0,
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Updates de comunidade</span>
                  <Badge variant="outline">
                    {formatPercent(
                      settingsStats?.communityUpdatesEnabled || 0,
                      settingsStats?.totalUsersWithSettings || 0,
                    )}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Updates de business</span>
                  <Badge variant="outline">
                    {formatPercent(
                      settingsStats?.businessUpdatesEnabled || 0,
                      settingsStats?.totalUsersWithSettings || 0,
                    )}
                  </Badge>
                </div>
              </>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            title="Leitura operacional"
            icon={UserRound}
            contentClassName="space-y-2 text-sm text-muted-foreground"
          >
            <p>
              Esta pagina abre coverage administrativa real para o dominio sem criar
              service paralelo fora de `core/admin`.
            </p>
            <p>
              O backlog segue faltando em templates globais, canais externos e auditoria
              de entrega, que devem entrar apenas depois do SSOT atual estar estavel.
            </p>
          </AdminSectionCard>
        </div>
      </div>

      <Dialog
        open={Boolean(selectedNotification)}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalhe da notificacao</DialogTitle>
          </DialogHeader>

          {selectedNotification ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tipo
                  </p>
                  <p className="font-medium">
                    {formatNotificationType(selectedNotification.type)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Prioridade
                  </p>
                  <div className="mt-1">
                    {getPriorityBadge(selectedNotification.priority)}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Usuario
                  </p>
                  <p className="font-medium">
                    {selectedNotification.profile?.display_name ||
                      selectedNotification.profile?.name ||
                      selectedNotification.user_id}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Criada em
                  </p>
                  <p className="font-medium">
                    {selectedNotification.created_at
                      ? format(
                          new Date(selectedNotification.created_at),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR },
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Mensagem
                </p>
                <p className="text-sm leading-6 whitespace-pre-wrap">
                  {selectedNotification.message || "Sem mensagem"}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Payload
                </p>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedNotification.data || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
