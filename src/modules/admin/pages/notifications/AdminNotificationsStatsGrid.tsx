import {
  Bell,
  Mail,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  AdminNotificationChannelStats,
  AdminNotificationSettingsStats,
  AdminNotificationStats,
} from "@/core/admin/services/AdminNotificationsService";
import {
  AdminStatsCard,
  AdminStatsGrid,
} from "@/modules/admin/components";
import { formatPercent } from "./AdminNotifications.helpers";

interface AdminNotificationsStatsGridProps {
  stats?: AdminNotificationStats;
  settingsStats?: AdminNotificationSettingsStats;
  channelStats?: AdminNotificationChannelStats;
  statsError: boolean;
  settingsError: boolean;
  channelError: boolean;
  statsLoading: boolean;
  settingsLoading: boolean;
  channelLoading: boolean;
}

export function AdminNotificationsStatsGrid({
  stats,
  settingsStats,
  channelStats,
  statsError,
  settingsError,
  channelError,
  statsLoading,
  settingsLoading,
  channelLoading,
}: AdminNotificationsStatsGridProps) {
  return (
    <AdminStatsGrid>
      <AdminStatsCard
        title="Total de notificacoes"
        value={statsError ? "--" : stats?.total || 0}
        subtitle={
          statsError
            ? "Falha ao carregar estatisticas"
            : `${stats?.last24h || 0} criadas nas ultimas 24h`
        }
        icon={Bell}
        loading={statsLoading}
      />
      <AdminStatsCard
        title="Backlog nao lido"
        value={statsError ? "--" : stats?.unread || 0}
        subtitle={
          statsError
            ? "Falha ao carregar backlog"
            : `${stats?.urgentPriority || 0} urgentes e ${stats?.highPriority || 0} altas`
        }
        icon={ShieldCheck}
        iconColor="text-orange-600"
        loading={statsLoading}
      />
      <AdminStatsCard
        title="Usuarios impactados"
        value={statsError ? "--" : stats?.uniqueUsers || 0}
        subtitle={
          statsError
            ? "Falha ao carregar impacto"
            : `${stats?.last7d || 0} registros nos ultimos 7 dias`
        }
        icon={UserRound}
        iconColor="text-sky-600"
        loading={statsLoading}
      />
      <AdminStatsCard
        title="Settings configurados"
        value={settingsError ? "--" : settingsStats?.totalUsersWithSettings || 0}
        subtitle={
          settingsError
            ? "Falha ao carregar preferencias"
            : `${formatPercent(
                settingsStats?.pushEnabled || 0,
                settingsStats?.totalUsersWithSettings || 0,
              )} com push ativo`
        }
        icon={Settings2}
        iconColor="text-emerald-600"
        loading={settingsLoading}
      />
      <AdminStatsCard
        title="Push ativos"
        value={channelError ? "--" : channelStats?.activePushSubscriptions || 0}
        subtitle={
          channelError
            ? "Falha ao carregar canais push"
            : `${channelStats?.inactivePushSubscriptions || 0} inativos`
        }
        icon={Bell}
        iconColor="text-indigo-600"
        loading={channelLoading}
      />
      <AdminStatsCard
        title="E-mails com falha (24h)"
        value={channelError ? "--" : channelStats?.emailFailed24h || 0}
        subtitle={
          channelError
            ? "Falha ao carregar auditoria de e-mail"
            : `${channelStats?.emailDelivered24h || 0} entregues em 24h`
        }
        icon={Mail}
        iconColor="text-rose-600"
        loading={channelLoading}
      />
    </AdminStatsGrid>
  );
}
