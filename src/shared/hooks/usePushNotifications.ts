/**
 * usePushNotifications
 *
 * Hook para gerenciar preferências e permissões de notificações push.
 * Delega operações ao PushService (SSOT em src/core/notifications/services/PushService.ts).
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { PushService } from "@/core/notifications/services/PushService";
import { PushNotificationPreferencesService } from "@/core/notifications/services/PushNotificationPreferencesService";

interface NotificationPreferences {
  notify_pet_perdido: boolean;
  notify_alerta: boolean;
  notify_evento: boolean;
  notify_recomendacao: boolean;
  notify_discussao: boolean;
  radius_meters: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  notify_pet_perdido: true,
  notify_alerta: true,
  notify_evento: false,
  notify_recomendacao: false,
  notify_discussao: false,
  radius_meters: 500,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export function usePushNotifications(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Carregar preferências do usuário via Supabase
  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      try {
        const data = await PushNotificationPreferencesService.getByUserId(userId);

        if (data) {
          setPreferences({
            notify_pet_perdido: data.notify_pet_perdido ?? DEFAULT_PREFERENCES.notify_pet_perdido,
            notify_alerta: data.notify_alerta ?? DEFAULT_PREFERENCES.notify_alerta,
            notify_evento: data.notify_evento ?? DEFAULT_PREFERENCES.notify_evento,
            notify_recomendacao: data.notify_recomendacao ?? DEFAULT_PREFERENCES.notify_recomendacao,
            notify_discussao: data.notify_discussao ?? DEFAULT_PREFERENCES.notify_discussao,
            radius_meters: data.radius_meters ?? DEFAULT_PREFERENCES.radius_meters,
            quiet_hours_start: data.quiet_hours_start ?? null,
            quiet_hours_end: data.quiet_hours_end ?? null,
          });
        }
      } catch (error) {
        logger.error("[usePushNotifications] Erro ao carregar preferências", error);
      }
    };

    loadPreferences();
  }, [userId]);

  // Solicitar permissão de notificações via PushService
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!PushService.isSupported()) {
      toast.error("Notificações não suportadas neste navegador");
      return false;
    }

    try {
      const granted = await PushService.requestPermission();

      if (granted) {
        toast.success("Notificações ativadas!");
      } else {
        toast.error("Permissão de notificações negada");
      }

      return granted;
    } catch (error) {
      logger.error("[usePushNotifications] Erro ao solicitar permissão", error);
      toast.error("Erro ao ativar notificações");
      return false;
    }
  };

  // Atualizar preferências no Supabase
  const updatePreferences = async (
    newPreferences: Partial<NotificationPreferences>,
  ): Promise<boolean> => {
    if (!userId) return false;

    setLoading(true);
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      await PushNotificationPreferencesService.upsertByUserId(userId, updatedPrefs);

      setPreferences(updatedPrefs);
      toast.success("Preferências atualizadas!");
      return true;
    } catch (error) {
      logger.error("[usePushNotifications] Erro ao atualizar preferências", error);
      toast.error("Erro ao salvar preferências");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Registrar token FCM via PushService
  const registerFCMToken = async (token: string): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await PushService.subscribe(userId);

      if (!result.success) {
        logger.warn("[usePushNotifications] Falha ao registrar token FCM", result.error);
        return false;
      }

      setFcmToken(token);
      return true;
    } catch (error) {
      logger.error("[usePushNotifications] Erro ao registrar token FCM", error);
      return false;
    }
  };

  return {
    preferences,
    loading,
    fcmToken,
    requestNotificationPermission,
    updatePreferences,
    registerFCMToken,
  };
}
