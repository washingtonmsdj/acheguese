/**
 * ══════════════════════════════════════════════════════════════════════════
 * NOTIFICATIONS PAGE
 * ══════════════════════════════════════════════════════════════════════════
 * 
 * Página completa de notificações.
 * 
 * ══════════════════════════════════════════════════════════════════════════
 */

import { NotificationCenter } from '@/app/components/notifications/NotificationCenter';
import { Button } from '@/shared/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ACCOUNT_PATHS } from '@/core/routing/config/account';

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 text-territory-ink sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 rounded-3xl border border-territory-border bg-territory-surface p-5 shadow-sm sm:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-territory-ink">Notificações</h1>
          <p className="mt-1 text-sm text-territory-muted">
            Acompanhe suas atualizações e avisos
          </p>
        </div>
        <Button
          variant="outline"
          className="border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised"
          onClick={() => navigate(ACCOUNT_PATHS.notifications)}
        >
          <Settings className="h-4 w-4 mr-2" />
          Preferências
        </Button>
      </div>

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}
