import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Bell,
  CheckCircle2,
  Eye,
  Filter,
  Mail,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import {
  adminNotificationsService,
} from "@/core/admin";
import type { AdminNotificationRecord } from "@/core/admin/services/AdminNotificationsService";
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

function getTypeCount(byType: Record<string, number> | undefined, type: string): number {
  if (!byType) {
    return 0;
  }

  const typeEntry = Object.entries(byType).find(([key]) => key === type);
  return typeEntry ? Number(typeEntry[1]) : 0;
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
        <AdminStatsCard
          title="Push ativos"
          value={channelStatsQuery.isError ? "--" : channelStats?.activePushSubscriptions || 0}
          subtitle={
            channelStatsQuery.isError
              ? "Falha ao carregar canais push"
              : `${channelStats?.inactivePushSubscriptions || 0} inativos`
          }
          icon={Bell}
          iconColor="text-indigo-600"
          loading={channelStatsQuery.isLoading}
        />
        <AdminStatsCard
          title="E-mails com falha (24h)"
          value={channelStatsQuery.isError ? "--" : channelStats?.emailFailed24h || 0}
          subtitle={
            channelStatsQuery.isError
              ? "Falha ao carregar auditoria de e-mail"
              : `${channelStats?.emailDelivered24h || 0} entregues em 24h`
          }
          icon={Mail}
          iconColor="text-rose-600"
          loading={channelStatsQuery.isLoading}
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
            title="Canais de entrega"
            icon={UserRound}
            contentClassName="space-y-3 text-sm"
          >
            {channelStatsQuery.isError ? (
              <AdminErrorState
                title="Falha ao carregar canais de entrega"
                description="A governanca de canais (push/e-mail) nao respondeu nesta tentativa."
                onRetry={() => {
                  void channelStatsQuery.refetch();
                }}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span>Total de subscriptions push</span>
                  <Badge variant="outline">
                    {channelStats?.totalPushSubscriptions || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Usuarios com push</span>
                  <Badge variant="outline">
                    {channelStats?.usersWithPushSubscriptions || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>E-mails enviados (24h)</span>
                  <Badge variant="outline">{channelStats?.emailSent24h || 0}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>E-mails entregues (24h)</span>
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">
                    {channelStats?.emailDelivered24h || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>E-mails com falha (24h)</span>
                  <Badge variant="destructive">
                    {channelStats?.emailFailed24h || 0}
                  </Badge>
                </div>
              </>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            title="Top templates de e-mail"
            description="Uso e entrega por template em `email_logs`."
            icon={Mail}
          >
            {templateStatsQuery.isError ? (
              <AdminErrorState
                title="Falha ao carregar templates"
                description="As metricas por template nao puderam ser consolidadas."
                onRetry={() => {
                  void templateStatsQuery.refetch();
                }}
              />
            ) : (
              <AdminDataState
                loading={templateStatsQuery.isLoading}
                isEmpty={!templateStats.length}
                emptyTitle="Sem templates registrados"
                emptyDescription="Ainda nao existem e-mails suficientes para consolidacao por template."
              >
                <>
                  {templateStats.map((template) => (
                    <div
                      key={template.template}
                      className="rounded-lg border p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium">{template.template}</p>
                        <Badge variant="outline">{template.total}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {template.delivered}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          {template.failed}
                        </span>
                        <span>Abertos: {template.opened}</span>
                        <span>Cliques: {template.clicked}</span>
                      </div>
                    </div>
                  ))}
                </>
              </AdminDataState>
            )}
          </AdminSectionCard>
        </div>
      </div>

      <AdminSectionCard
        title="Auditoria de entrega (e-mail)"
        description="Eventos recentes de `email_logs` para governanca de envio, entrega e falhas."
        icon={Mail}
      >
        {deliveryAuditQuery.isError ? (
          <AdminErrorState
            title="Falha ao carregar auditoria de entrega"
            description="A leitura canonica de `email_logs` nao ficou disponivel."
            onRetry={() => {
              void deliveryAuditQuery.refetch();
            }}
          />
        ) : (
          <AdminDataState
            loading={deliveryAuditQuery.isLoading}
            isEmpty={!deliveryAuditQuery.isLoading && !deliveryAudit?.data.length}
            emptyTitle="Sem eventos de entrega"
            emptyDescription="Nao foram encontrados registros recentes em `email_logs`."
          >
            <AdminTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveryAudit?.data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.template}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.status === "failed" || item.status === "bounced" ? (
                        <Badge variant="destructive">{item.status}</Badge>
                      ) : (
                        <Badge className="bg-emerald-600 hover:bg-emerald-600">
                          {item.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate">{item.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.createdAt
                        ? format(new Date(item.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </AdminTable>
          </AdminDataState>
        )}
      </AdminSectionCard>

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
                  {JSON.stringify(selectedNotification.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
