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

export default function NotificationsPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notificações</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas atualizações e mensagens
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/settings/notifications')}
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
