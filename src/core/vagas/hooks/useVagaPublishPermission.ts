import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { useVagasLocation } from "./useVagasLocation";
import { VagasPublishPermissionService } from "../services/VagasPublishPermissionService";

export function useVagaPublishPermission() {
  const { user, activeProfile } = useSessionContext();
  const { activeLocationId } = useVagasLocation();

  const query = useQuery({
    queryKey: [
      "vagas",
      "publish-permission",
      user?.id ?? null,
      activeProfile?.id ?? null,
      activeProfile?.profileType ?? null,
      activeLocationId ?? null,
    ],
    queryFn: () =>
      VagasPublishPermissionService.evaluate({
        userId: user?.id,
        activeProfileId: activeProfile?.id,
        activeProfileType: activeProfile?.profileType,
        activeLocationId,
      }),
    staleTime: 60_000,
  });

  const permission = useMemo(() => {
    return (
      query.data ?? {
        canPublish: false,
        isAdmin: false,
        message: "Validando permissões...",
      }
    );
  }, [query.data]);

  return {
    permission,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
