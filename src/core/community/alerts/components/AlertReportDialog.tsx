import {
  ReportReasonDialog,
  reportReasonOptionsFromLabels,
} from "@/core/moderation";

import { ALERT_REPORT_REASON_LABELS } from "../config/alertConfig";
import type { AlertReportReason } from "../domain/types";
import { useAlertReport } from "../hooks/useAlertReport";

interface AlertReportDialogProps {
  alertId: string;
  open: boolean;
  onClose: () => void;
}

const ALERT_REPORT_REASON_OPTIONS = reportReasonOptionsFromLabels(
  ALERT_REPORT_REASON_LABELS,
);

export function AlertReportDialog({
  alertId,
  open,
  onClose,
}: AlertReportDialogProps) {
  const { mutateAsync: report } = useAlertReport();

  return (
    <ReportReasonDialog<AlertReportReason>
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      contentLabel="alerta"
      reasonOptions={ALERT_REPORT_REASON_OPTIONS}
      allowDetails={false}
      onSubmit={async (reason) => {
        const accepted = await report({ alert_id: alertId, reason });
        if (accepted === false) throw new Error("Denuncia nao aceita.");
      }}
    />
  );
}
