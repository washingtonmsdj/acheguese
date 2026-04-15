/**
 * useAlertReport — Report de abuso de alerta
 */

import { useMutation } from "@tanstack/react-query";
import { alertModerationService } from "../services/AlertModerationService";
import type { CreateAlertReportPayload } from "../domain/types";

export function useAlertReport() {
  return useMutation({
    mutationFn: (payload: CreateAlertReportPayload) =>
      alertModerationService.reportAlert(payload),
  });
}
