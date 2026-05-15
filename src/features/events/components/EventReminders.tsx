/**
 * ðŸ”” EVENT REMINDERS
 * 
 * Sistema de lembretes para eventos
 * Permite configurar notificaÃ§Ãµes antes do evento
 * 
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, Check, Clock, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/utils/cn';
import type { Event } from '../types';

interface EventReminder {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reminders: ReminderTime[];
}

type ReminderTime = '1hour' | '1day' | '1week';

interface EventRemindersProps {
  event: Event;
}

const REMINDER_OPTIONS: { value: ReminderTime; label: string; minutes: number }[] = [
  { value: '1hour', label: '1 hora antes', minutes: 60 },
  { value: '1day', label: '1 dia antes', minutes: 1440 },
  { value: '1week', label: '1 semana antes', minutes: 10080 },
];

const STORAGE_KEY = 'acheguese_event_reminders';

export function EventReminders({ event }: EventRemindersProps) {
  const [reminders, setReminders] = useState<ReminderTime[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load reminders from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allReminders: EventReminder[] = JSON.parse(stored);
        const eventReminder = allReminders.find(r => r.eventId === event.id);
        if (eventReminder) {
          setReminders(eventReminder.reminders);
        }
      }
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }

    // Check if notifications are supported and enabled
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [event.id]);

  // Save reminders to localStorage
  const saveReminders = (newReminders: ReminderTime[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allReminders: EventReminder[] = stored ? JSON.parse(stored) : [];
      
      const index = allReminders.findIndex(r => r.eventId === event.id);
      const reminderData: EventReminder = {
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.start_date,
        reminders: newReminders,
      };

      if (index >= 0) {
        if (newReminders.length === 0) {
          allReminders.splice(index, 1);
        } else {
          allReminders[index] = reminderData;
        }
      } else if (newReminders.length > 0) {
        allReminders.push(reminderData);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allReminders));
      setReminders(newReminders);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      return permission === 'granted';
    }
    return notificationsEnabled;
  };

  // Toggle reminder
  const toggleReminder = async (time: ReminderTime) => {
    // Request permission if needed
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Por favor, habilite as notificaÃ§Ãµes para receber lembretes.');
        return;
      }
    }

    const newReminders = reminders.includes(time)
      ? reminders.filter(r => r !== time)
      : [...reminders, time];

    saveReminders(newReminders);

    // Schedule notification (in production, use a proper scheduling service)
    if (newReminders.includes(time)) {
      scheduleNotification(time);
    }
  };

  // Schedule notification (simplified - in production, use service worker)
  const scheduleNotification = (time: ReminderTime) => {
    const option = REMINDER_OPTIONS.find(o => o.value === time);
    if (!option) return;

    const eventDate = new Date(event.start_date);
    const notificationTime = new Date(eventDate.getTime() - option.minutes * 60 * 1000);
    const now = new Date();

    if (notificationTime > now) {
      const timeout = notificationTime.getTime() - now.getTime();
      
      // Only schedule if within reasonable time (24 hours)
      if (timeout < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Lembrete: ${event.title}`, {
              body: `O evento comeÃ§a em ${option.label.replace(' antes', '')}!`,
              icon: event.cover_image_url,
              badge: '/logo.png',
              tag: `event-${event.id}-${time}`,
            });
          }
        }, timeout);
      }
    }
  };

  // Clear all reminders
  const clearAllReminders = () => {
    saveReminders([]);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      {/* Header */}
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

      {/* Notification permission warning */}
      {!notificationsEnabled && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>AtenÃ§Ã£o:</strong> Habilite as notificaÃ§Ãµes para receber lembretes.
          </p>
        </div>
      )}

      {/* Reminder options */}
      <div className="space-y-2">
        {REMINDER_OPTIONS.map(option => {
          const isActive = reminders.includes(option.value);
          
          return (
            <motion.button
              key={option.value}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleReminder(option.value)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border p-3 transition-all",
                isActive
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full",
                  isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
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

      {/* Clear all button */}
      {reminders.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllReminders}
          className="mt-4 w-full gap-2 text-muted-foreground hover:text-destructive"
        >
          <BellOff className="h-4 w-4" />
          Remover todos os lembretes
        </Button>
      )}

      {/* Success message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300"
          >
            <Check className="h-4 w-4" />
            Lembretes atualizados!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <p className="mt-4 text-xs text-muted-foreground">
        Você receberÃ¡ uma notificaÃ§Ã£o nos horÃ¡rios selecionados. Certifique-se de que as notificaÃ§Ãµes estÃ£o habilitadas no seu navegador.
      </p>
    </div>
  );
}
