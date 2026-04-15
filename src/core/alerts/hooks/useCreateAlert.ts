import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertService } from "@/core/alerts/services";
import type { CreateAlertData } from "@/core/alerts/types";

interface UseCreateAlertParams {
  profileId: string;
  date: CreateAlertData;
}

export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ profileId, date }: UseCreateAlertParams) =>
      alertService.createAlert(profileId, date),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
