import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSessionContext } from "@/core/session";
import { MOBILITY_QUERY_KEYS } from "@/core/mobility/constants";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import { mobilityService } from "@/core/mobility/services/MobilityService";

export function useDriverProfile() {
  const { user } = useSessionContext();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const queryKey = MOBILITY_QUERY_KEYS.driverProfile(user?.id ?? "");

  const {
    driverData,
    driverProfileId,
    isRegistered,
    isLoading,
  } = useDriverProfileIdentity({
    queryKey,
  });

  const updateProfile = async (updates: Record<string, unknown>) => {
    if (!driverProfileId) {
      return;
    }

    setSaving(true);
    try {
      await mobilityService.updateDriverData(driverProfileId, updates);
      queryClient.invalidateQueries({ queryKey });
      toast.success("Perfil atualizado");
    } catch {
      toast.error("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  return {
    driverProfile: driverData,
    isDriver: isRegistered,
    isLoading,
    saving,
    updateProfile,
  };
}
