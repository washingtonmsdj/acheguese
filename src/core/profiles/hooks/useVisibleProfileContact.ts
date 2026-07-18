import { useQuery } from "@tanstack/react-query";
import { useSessionContext } from "@/core/session";
import { profileService } from "../services/ProfileService";

export function useVisibleProfileContact(profileId: string | undefined) {
  const { user } = useSessionContext();
  const query = useQuery({
    queryKey: ["visible-profile-contact", user?.id ?? null, profileId ?? null],
    queryFn: () => profileService.getVisibleContact(profileId!),
    enabled: Boolean(user?.id && profileId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    contact: query.data ?? null,
    isLoading: query.isLoading,
  };
}
