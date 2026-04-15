import { useState, useEffect } from "react";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
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

export function usePushNotifications(userId: string | undefined) {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notify_pet_perdido: true,
    notify_alerta: true,
    notify_evento: false,
    notify_recomendacao: false,
    notify_discussao: false,
    radius_meters: 500,
    quiet_hours_start: null,
    quiet_hours_end: null,
  });
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // Carregar prefer├¬ncias do usu├írio
  useEffect(() => {
    if (!userId) return;

    const loadPreferences = async () => {
      try {
        // TODO: Implementar carregamento do Supabase
        if (import.meta.env.DEV) {
          logger.info("Loading prefer├¬ncias para:", userId);
        }
      } catch (error) {
        logger.error("Error load prefer├¬ncias:", error);
      }
    };

    loadPreferences();
  }, [userId]);

  // Solicitar permiss├úo de notifica├º├Áes
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Notifica├º├Áes n├úo suportadas neste navegador");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        toast.success("Notifica├º├Áes ativadas!");
        return true;
      } else if (permission === "denied") {
        toast.error("Permiss├úo de notifica├º├Áes negada");
        return false;
      }

      return false;
    } catch (error) {
      logger.error("Error solicitar permiss├úo:", error);
      toast.error("Error ativar notifica├º├Áes");
      return false;
    }
  };

  // Atualizar prefer├¬ncias
  const updatePreferences = async (
    newPreferences: Partial<NotificationPreferences>,
  ) => {
    if (!userId) return false;

    setLoading(true);
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };

      // TODO: Implementar atualiza├º├úo no Supabase
      if (import.meta.env.DEV) {
        logger.info("Updating prefer├¬ncias:", updatedPrefs);
      }

      setPreferences(updatedPrefs);
      toast.success("Prefer├¬ncias atualizadas!");
      return true;
    } catch (error) {
      logger.error("Error update prefer├¬ncias:", error);
      toast.error("Error save prefer├¬ncias");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Registrar token FCM (Firebase Cloud Messaging)
  const registerFCMToken = async (token: string) => {
    if (!userId) return false;

    try {
      // TODO: Implementar registro no Supabase
      if (import.meta.env.DEV) {
        logger.info("Registrando token FCM:", token);
      }

      setFcmToken(token);
      return true;
    } catch (error) {
      logger.error("Error registrar token FCM:", error);
      return false;
    }
  };

  // Escutar notifica├º├Áes em tempo real
  useEffect(() => {
    if (!userId) return;

    // TODO: Implementar listener do Supabase quando necess├írio
    if (import.meta.env.DEV) {
      logger.info("Listener de notifica├º├Áes active para:", userId);
    }
  }, [userId]);

  return {
    preferences,
    loading,
    fcmToken,
    requestNotificationPermission,
    updatePreferences,
    registerFCMToken,
  };
}
