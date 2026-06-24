/**
 * NotificationsPanel - Painel de notificações recentes
 *
 * Exibe últimas notificações do usuário
 */

import { Bell } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { SectionFrame } from './SectionFrame';
import { cn } from '@/shared/utils/cn';

interface Notification {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationsPanelProps {
  notifications: readonly Notification[];
  onNotificationClick: () => void;
  onViewAll: () => void;
}

export function NotificationsPanel({
  notifications,
  onNotificationClick,
  onViewAll,
}: NotificationsPanelProps) {
  return (
    <SectionFrame
      title="Notificações recentes"
      description="Ultimos sinais do sistema para o perfil ativo, sem sair do hub."
      action={
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={onViewAll}>
          <Bell className="h-4 w-4" />
          Ver avisos
        </Button>
      }
    >
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.slice(0, 5).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={onNotificationClick}
              className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border bg-background p-3 text-left transition-colors hover:bg-accent/30"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.type} · {new Date(item.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!item.read && (
                  <Badge className="bg-primary px-2 text-[10px] text-primary-foreground">Nova</Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    item.priority === 'urgent'
                      ? 'border-destructive/20 bg-destructive/10 text-destructive'
                      : item.priority === 'high'
                        ? 'border-amber-500/20 bg-amber-500/10 text-amber-700'
                        : 'border-border bg-muted text-muted-foreground',
                  )}
                >
                  {item.priority}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nenhuma notificacao recente consolidada para este perfil.
        </p>
      )}
    </SectionFrame>
  );
}
