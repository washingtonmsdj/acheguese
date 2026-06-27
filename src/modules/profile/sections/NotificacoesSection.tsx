/**
 * NotificacoesSection - Secao de notificacoes do perfil
 *
 * SSOT: Componente isolado com props tipadas
 * Sem gambiarras: Logica clara e organizada
 */

import { SectionFrame, NotificationsPanel } from "@/modules/profile/components/hub";
import { NotificationStatCard } from "@/modules/profile/components/cards";

import type { NotificacoesSectionProps } from "./types";

export function NotificacoesSection({
  notifications,
  navigate,
  appUrls,
}: NotificacoesSectionProps) {
  return (
    <div className="space-y-6">
      <SectionFrame
        title="Resumo de notificações"
        description="Estado atual dos avisos para triagem rápida."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <NotificationStatCard label="Não lidas" value={notifications.unread} />
          <NotificationStatCard label="Prioridade alta" value={notifications.highPriority} />
          <NotificationStatCard label="Urgentes" value={notifications.urgentPriority} />
          <NotificationStatCard label="Total" value={notifications.total} />
        </div>
      </SectionFrame>

      <NotificationsPanel
        notifications={notifications.recent || []}
        onNotificationClick={() => navigate(appUrls.notifications)}
        onViewAll={() => navigate(appUrls.notifications)}
      />
    </div>
  );
}
