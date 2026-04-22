/**
 * AlertReportDialog — Dialog de report de abuso
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { useAlertReport } from "../hooks/useAlertReport";
import { ALERT_REPORT_REASON_LABELS } from "../config/alertConfig";
import type { AlertReportReason } from "../domain/types";

interface AlertReportDialogProps {
  alertId: string;
  open: boolean;
  onClose: () => void;
}

export function AlertReportDialog({ alertId, open, onClose }: AlertReportDialogProps) {
  const [reason, setReason] = useState<AlertReportReason | "">("");
  const [done, setDone] = useState(false);
  const { mutateAsync: report, isPending } = useAlertReport();

  async function handleSubmit() {
    if (!reason) return;
    const ok = await report({ alert_id: alertId, reason: reason as AlertReportReason });
    if (ok !== false) setDone(true);
  }

  function handleClose() {
    setReason("");
    setDone(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reportar alerta</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Report recebido. Nossa equipe irá revisar.
            </p>
            <Button onClick={handleClose} className="w-full">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Por que este alerta é inadequado?
            </p>

            <RadioGroup
              value={reason}
              onValueChange={(v) => setReason(v as AlertReportReason)}
              className="space-y-2"
            >
              {(Object.entries(ALERT_REPORT_REASON_LABELS) as [AlertReportReason, string][]).map(
                ([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value={value} />
                    {label}
                  </label>
                )
              )}
            </RadioGroup>

            <div className="flex gap-2 pt-2">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || isPending}
                className="flex-1"
              >
                {isPending ? "Enviando..." : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
