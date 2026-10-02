import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NotificationCenter } from "@/app/components/notifications/NotificationCenter";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { AccountSettingsShell } from "@/modules/profile/components/AccountSettingsShell";
import { Button } from "@/shared/components/ui/button";

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <AccountSettingsShell
      title="Notificações"
      desktopTitle="Notificações recebidas"
      mobileDescription="Acompanhe seus avisos e atualizações."
      desktopDescription="Acompanhe avisos da sua conta. Canais e frequência ficam em Preferências de notificação."
      backTo={ACCOUNT_PATHS.home}
    >
      <div className="mb-4 flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 border-territory-border bg-territory-surface text-territory-ink"
          onClick={() => navigate(ACCOUNT_PATHS.notifications)}
        >
          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
          Preferências
        </Button>
      </div>

      <NotificationCenter />
    </AccountSettingsShell>
  );
}
