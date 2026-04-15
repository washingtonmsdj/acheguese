import { useMutation, useQueryClient } from "@tanstack/react-query";
import { alertService } from "@/core/alerts/services";

interface UseConfirmAlertParams {
  alertId: string;
  profileId: string;
}

export function useConfirmAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, profileId }: UseConfirmAlertParams) =>
      alertService.confirmAlert(alertId, profileId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
