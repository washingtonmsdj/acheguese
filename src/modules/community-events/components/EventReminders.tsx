import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellOff, Check, Clock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import { useToast } from '@/shared/hooks/use-toast';
import { useSessionContext } from '@/core/session';
import type { Event } from '../types';
import {
  EventEngagementService,
  type EventReminderTime,
} from '../services/EventEngagementService';

interface EventRemindersProps {
  event: Event;
}

const REMINDER_OPTIONS: { value: EventReminderTime; label: string; minutes: number }[] = [
  { value: '1hour', label: '1 hora antes', minutes: 60 },
  { value: '1day', label: '1 dia antes', minutes: 1440 },
  { value: '1week', label: '1 semana antes', minutes: 10080 },
];

export function EventReminders({ event }: EventRemindersProps) {
  const [reminders, setReminders] = useState<EventReminderTime[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { activeProfile } = useSessionContext();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    async function loadReminders() {
      if (!activeProfile?.id) {
        setReminders([]);
        return;
      }

      const savedReminders = await EventEngagementService.getReminderTimes(event.id, activeProfile.id);
      if (mounted) setReminders(savedReminders);
    }

    loadReminders();

    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    return () => {
      mounted = false;
    };
  }, [event.id, activeProfile?.id]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      return granted;
    }
    return notificationsEnabled;
  };

  const persistReminders = async (newReminders: EventReminderTime[]) => {
    if (!activeProfile?.id) {
      toast({
        title: 'Acesso necessario',
        description: 'Entre com um perfil para salvar lembretes deste evento.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const saved = await EventEngagementService.saveReminderTimes(event.id, activeProfile.id, newReminders);
      setReminders(saved);
      setShowSuccess(true);
      window.setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: error instanceof Error ? error.message : 'Nao foi possivel salvar os lembretes.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const notifyInCurrentSession = (time: EventReminderTime) => {
    const option = REMINDER_OPTIONS.find((item) => item.value === time);
    if (!option || !('Notification' in window) || Notification.permission !== 'granted') return;

    const eventDate = new Date(event.start_date);
    const notificationTime = new Date(eventDate.getTime() - option.minutes * 60 * 1000);
    const timeout = notificationTime.getTime() - Date.now();
    const maxBrowserTimeout = 24 * 60 * 60 * 1000;

    if (timeout <= 0 || timeout > maxBrowserTimeout) return;

    window.setTimeout(() => {
      new Notification(`Lembrete: ${event.title}`, {
        body: `O evento comeca em ${option.label.replace(' antes', '')}.`,
        icon: event.cover_image_url,
        badge: '/logo.png',
        tag: `event-${event.id}-${time}`,
      });
    }, timeout);
  };

  const toggleReminder = async (time: EventReminderTime) => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast({
          title: 'Notificacoes bloqueadas',
          description: 'Habilite as notificacoes do navegador para receber lembretes.',
          variant: 'destructive',
        });
        return;
      }
    }

    const newReminders = reminders.includes(time)
      ? reminders.filter((reminder) => reminder !== time)
      : [...reminders, time];

    await persistReminders(newReminders);
    if (!reminders.includes(time)) notifyInCurrentSession(time);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Lembretes</h3>
        </div>
        {reminders.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            <Check className="h-3 w-3" />
            {reminders.length} ativo{reminders.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {!notificationsEnabled && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Habilite as notificacoes para receber lembretes no navegador.
          </p>
        </div>
      )}

      <div className="space-y-2">
        {REMINDER_OPTIONS.map((option) => {
          const isActive = reminders.includes(option.value);

          return (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={isSaving}
              onClick={() => toggleReminder(option.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg border p-3 transition-all',
                isActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted',
                isSaving && 'cursor-wait opacity-70',
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <span className="font-medium">{option.label}</span>
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {reminders.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => persistReminders([])}
          disabled={isSaving}
          className="mt-4 w-full gap-2 text-muted-foreground hover:text-destructive"
        >
          <BellOff className="h-4 w-4" />
          Remover todos os lembretes
        </Button>
      )}

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300"
          >
            <Check className="h-4 w-4" />
            Lembretes atualizados.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
