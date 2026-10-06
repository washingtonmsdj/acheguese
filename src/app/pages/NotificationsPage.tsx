/**
 * ══════════════════════════════════════════════════════════════════════════
 * NOTIFICATIONS PAGE
 * ══════════════════════════════════════════════════════════════════════════
 *
 * Página completa de notificações.
 *
 * ══════════════════════════════════════════════════════════════════════════
 */

import { NotificationCenter } from "@/app/components/notifications/NotificationCenter";
import { ACCOUNT_PATHS } from "@/core/routing/config/account";
import { Button } from "@/shared/components/ui/button";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 text-territory-ink sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-territory-border bg-territory-surface p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-territory-ink">
            Notificações
          </h1>
          <p className="mt-1 text-sm text-territory-muted">
            Acompanhe suas atualizações e avisos
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised sm:w-auto"
          onClick={() => navigate(ACCOUNT_PATHS.notifications)}
        >
          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
          Preferências
        </Button>
      </div>

      <NotificationCenter />
    </div>
  );
}
