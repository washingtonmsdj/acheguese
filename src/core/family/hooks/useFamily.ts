// ============================================
// USE FAMILY TRACKING HOOK
// Hook para gerenciar rastreamento familiar
// ============================================

import { useCallback, useEffect, useState } from "react";
import { familyService } from "@/core/family/services/FamilyService";
import type {
  FamilyConnection,
  FamilyGeofence,
  FamilyLocationAlert,
  FamilyLocationData,
  FamilyLocationSharingSettings,
  FamilyRelationshipType,
} from "@/core/family/types";
import { logger } from "@/shared/utils/logger";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

export function useFamilyConnections() {
  const [children, setChildren] = useState<FamilyConnection[]>([]);
  const [parents, setParents] = useState<FamilyConnection[]>([]);
  const [pendingInvites, setPendingInvites] = useState<FamilyConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [childrenData, parentsData, invitesData] = await Promise.all([
        familyService.getMyChildren(),
        familyService.getMyParents(),
        familyService.getPendingInvites(),
      ]);

      setChildren(childrenData);
      setParents(parentsData);
      setPendingInvites(invitesData);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const sendInvite = useCallback(
    async (childEmail: string, relationshipType: FamilyRelationshipType) => {
      try {
        await familyService.sendFamilyInvite({ childEmail, relationshipType });
        await loadConnections();
        return { success: true };
      } catch (sendError) {
        return { success: false, error: getErrorMessage(sendError) };
      }
    },
    [loadConnections],
  );

  const acceptInvite = useCallback(
    async (connectionId: string) => {
      try {
        await familyService.acceptFamilyInvite(connectionId);
        await loadConnections();
        return { success: true };
      } catch (acceptError) {
        return { success: false, error: getErrorMessage(acceptError) };
      }
    },
    [loadConnections],
  );

  const rejectInvite = useCallback(
    async (connectionId: string) => {
      try {
        await familyService.rejectFamilyInvite(connectionId);
        await loadConnections();
        return { success: true };
      } catch (rejectError) {
        return { success: false, error: getErrorMessage(rejectError) };
      }
    },
    [loadConnections],
  );

  const removeConnection = useCallback(
    async (connectionId: string) => {
      try {
        await familyService.removeFamilyConnection(connectionId);
        await loadConnections();
        return { success: true };
      } catch (removeError) {
        return { success: false, error: getErrorMessage(removeError) };
      }
    },
    [loadConnections],
  );

  return {
    children,
    parents,
    pendingInvites,
    loading,
    error,
    sendInvite,
    acceptInvite,
    rejectInvite,
    removeConnection,
    refresh: loadConnections,
  };
}

export function useChildrenLocations() {
  const [locations, setLocations] = useState<FamilyLocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await familyService.getChildrenLocations();
      setLocations(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();

    const interval = setInterval(loadLocations, 30000);
    const subscription = familyService.subscribeToChildrenLocations((location) => {
      setLocations((prev) => {
        const locationIdentity = location.profile_id ?? location.user_id;
        const index = prev.findIndex(
          (item) => (item.profile_id ?? item.user_id) === locationIdentity,
        );

        if (index >= 0) {
          return prev.map((item, itemIndex) =>
            itemIndex === index ? { ...item, ...location } : item,
          );
        }

        return prev;
      });
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [loadLocations]);

  return { locations, loading, error, refresh: loadLocations };
}

export function useLocationSharing() {
  const [settings, setSettings] = useState<FamilyLocationSharingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await familyService.getLocationSharingSettings();
      setSettings(data);
    } catch (loadError) {
      logger.error("Error loading settings:", loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<FamilyLocationSharingSettings>) => {
      try {
        setUpdating(true);
        const data = await familyService.updateLocationSharingSettings(updates);
        setSettings(data);
        return { success: true };
      } catch (updateError) {
        return { success: false, error: getErrorMessage(updateError) };
      } finally {
        setUpdating(false);
      }
    },
    [],
  );

  const updateLocation = useCallback(
    async (
      location: Omit<FamilyLocationData, "profile_id" | "user_id" | "updated_at">,
    ) => {
      try {
        await familyService.updateMyLocation(location);
        return { success: true };
      } catch (updateError) {
        return { success: false, error: getErrorMessage(updateError) };
      }
    },
    [],
  );

  return {
    settings,
    loading,
    updating,
    updateSettings,
    updateLocation,
    refresh: loadSettings,
  };
}

export function useGeofences() {
  const [geofences, setGeofences] = useState<FamilyGeofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGeofences = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await familyService.getMyGeofences();
      setGeofences(data);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGeofences();
  }, [loadGeofences]);

  const createGeofence = useCallback(
    async (geofence: Omit<FamilyGeofence, "id" | "profile_id" | "user_id">) => {
      try {
        await familyService.createGeofence(geofence);
        await loadGeofences();
        return { success: true };
      } catch (createError) {
        return { success: false, error: getErrorMessage(createError) };
      }
    },
    [loadGeofences],
  );

  const updateGeofence = useCallback(
    async (id: string, updates: Partial<FamilyGeofence>) => {
      try {
        await familyService.updateGeofence(id, updates);
        await loadGeofences();
        return { success: true };
      } catch (updateError) {
        return { success: false, error: getErrorMessage(updateError) };
      }
    },
    [loadGeofences],
  );

  const deleteGeofence = useCallback(
    async (id: string) => {
      try {
        await familyService.deleteGeofence(id);
        await loadGeofences();
        return { success: true };
      } catch (deleteError) {
        return { success: false, error: getErrorMessage(deleteError) };
      }
    },
    [loadGeofences],
  );

  return {
    geofences,
    loading,
    error,
    createGeofence,
    updateGeofence,
    deleteGeofence,
    refresh: loadGeofences,
  };
}

export function useLocationAlerts() {
  const [alerts, setAlerts] = useState<FamilyLocationAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await familyService.getMyAlerts();
      setAlerts(data);
      setUnreadCount(data.filter((alert) => !alert.read).length);
    } catch (loadError) {
      logger.error("Error loading alerts:", loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    const subscription = familyService.subscribeToAlerts((alert) => {
      setAlerts((prev) => [alert, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadAlerts]);

  const markAsRead = useCallback(async (alertId: string) => {
    try {
      await familyService.markAlertAsRead(alertId);
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, read: true } : alert,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (markError) {
      logger.error("Error marking alert as read:", markError);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await familyService.markAllAlertsAsRead();
      setAlerts((prev) => prev.map((alert) => ({ ...alert, read: true })));
      setUnreadCount(0);
    } catch (markError) {
      logger.error("Error marking all alerts as read:", markError);
    }
  }, []);

  return {
    alerts,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadAlerts,
  };
}
