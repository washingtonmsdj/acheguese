import { useQuery } from "@tanstack/react-query";
import { alertService } from "@/core/alerts/services";
import type { AlertStatus } from "@/core/alerts/types";

interface UseAlertsParams {
  city: string;
  neighborhood?: string;
  street?: string;
  status?: AlertStatus;
  limit?: number;
}

export function useAlerts(params: UseAlertsParams) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => alertService.getAlerts(params),
    enabled: !!params.city,
  });
}
