import {
  CheckCircle2,
  Mail,
  Settings2,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import type {
  AdminNotificationChannelStats,
  AdminNotificationSettingsStats,
  AdminNotificationTemplateStat,
} from "@/core/admin/services/AdminNotificationsService";
import {
  AdminDataState,
  AdminErrorState,
  AdminSectionCard,
} from "@/core/admin/components";
import { Badge } from "@/shared/components/ui/badge";
import {
  formatNotificationType,
  formatPercent,
} from "./AdminNotifications.helpers";

interface AdminNotificationsSidePanelsProps {
  topTypes: Array<[string, number]>;
  settingsStats?: AdminNotificationSettingsStats;
  channelStats?: AdminNotificationChannelStats;
  templateStats: AdminNotificationTemplateStat[];
  statsError: boolean;
  settingsError: boolean;
  channelError: boolean;
  templateError: boolean;
  templateLoading: boolean;
  onRetryStats: () => void;
  onRetrySettings: () => void;
  onRetryChannel: () => void;
  onRetryTemplate: () => void;
}

export function AdminNotificationsSidePanels({
  topTypes,
  settingsStats,
  channelStats,
  templateStats,
  statsError,
  settingsError,
  channelError,
  templateError,
  templateLoading,
  onRetryStats,
  onRetrySettings,
  onRetryChannel,
  onRetryTemplate,
}: AdminNotificationsSidePanelsProps) {
  return (
    <div className="space-y-4">
      <AdminSectionCard
        title="Distribuicao por tipo"
        description="Top 5 tipos atualmente emitidos."
        icon={ShieldCheck}
      >
        {statsError ? (
          <AdminErrorState
            title="Falha ao consolidar distribuicao por tipo"
            description="As estatisticas agregadas de `notifications` nao foram carregadas."
            onRetry={onRetryStats}
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
        {settingsError ? (
          <AdminErrorState
            title="Falha ao carregar preferencias de notificacao"
            description="O agregado de `user_notification_settings` nao ficou disponivel para leitura administrativa."
            onRetry={onRetrySettings}
          />
        ) : (
          <>
            <PreferencePercent label="Email ativo" value={settingsStats?.emailEnabled || 0} total={settingsStats?.totalUsersWithSettings || 0} />
            <PreferencePercent label="Push ativo" value={settingsStats?.pushEnabled || 0} total={settingsStats?.totalUsersWithSettings || 0} />
            <PreferencePercent label="Weekly digest" value={settingsStats?.weeklyDigestEnabled || 0} total={settingsStats?.totalUsersWithSettings || 0} />
            <PreferencePercent label="Novas mensagens" value={settingsStats?.newMessagesEnabled || 0} total={settingsStats?.totalUsersWithSettings || 0} />
            <PreferencePercent label="Updates de comunidade" value={settingsStats?.communityUpdatesEnabled || 0} total={settingsStats?.totalUsersWithSettings || 0} />
            <PreferencePercent label="Updates de business" value={settingsStats?.businessUpdatesEnabled || 0} total={settingsStats?.totalUsersWithSettings || 0} />
          </>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title="Canais de entrega"
        icon={UserRound}
        contentClassName="space-y-3 text-sm"
      >
        {channelError ? (
          <AdminErrorState
            title="Falha ao carregar canais de entrega"
            description="A governanca de canais (push/e-mail) nao respondeu nesta tentativa."
            onRetry={onRetryChannel}
          />
        ) : (
          <>
            <MetricRow label="Total de subscriptions push" value={channelStats?.totalPushSubscriptions || 0} />
            <MetricRow label="Usuarios com push" value={channelStats?.usersWithPushSubscriptions || 0} />
            <MetricRow label="E-mails enviados (24h)" value={channelStats?.emailSent24h || 0} />
            <MetricRow label="E-mails entregues (24h)" value={channelStats?.emailDelivered24h || 0} badgeClassName="bg-emerald-600 hover:bg-emerald-600" />
            <MetricRow label="E-mails com falha (24h)" value={channelStats?.emailFailed24h || 0} destructive />
          </>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title="Top templates de e-mail"
        description="Uso e entrega por template em `email_logs`."
        icon={Mail}
      >
        {templateError ? (
          <AdminErrorState
            title="Falha ao carregar templates"
            description="As metricas por template nao puderam ser consolidadas."
            onRetry={onRetryTemplate}
          />
        ) : (
          <AdminDataState
            loading={templateLoading}
            isEmpty={!templateStats.length}
            emptyTitle="Sem templates registrados"
            emptyDescription="Ainda nao existem e-mails suficientes para consolidacao por template."
          >
            <>
              {templateStats.map((template) => (
                <div key={template.template} className="space-y-1 rounded-lg border p-3">
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
  );
}

function PreferencePercent({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Badge variant="outline">{formatPercent(value, total)}</Badge>
    </div>
  );
}

function MetricRow({
  label,
  value,
  destructive,
  badgeClassName,
}: {
  label: string;
  value: number;
  destructive?: boolean;
  badgeClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <Badge variant={destructive ? "destructive" : "outline"} className={badgeClassName}>
        {value}
      </Badge>
    </div>
  );
}
