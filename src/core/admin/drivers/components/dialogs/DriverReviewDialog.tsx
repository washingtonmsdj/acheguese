/**
 * DriverReviewDialog
 * 
 * Dialog para revisar cadastro de motorista
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { Car, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { DriverReviewDialogProps } from "../../sections/types";
import { DriverInfoCard } from "../cards";

export function DriverReviewDialog({
  open,
  onOpenChange,
  driver,
  rejectionReason,
  onRejectionReasonChange,
  onApprove,
  onReject,
  processing,
}: DriverReviewDialogProps) {
  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-teal-500" />
            Revisar Cadastro de Motorista
          </DialogTitle>
          <DialogDescription>
            Analise os dados e documentos do motorista antes de aprovar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 mt-4">
          {/* Driver Info */}
          <DriverInfoCard driver={driver} />

          {/* Rejection Reason */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              Motivo da rejeição (se aplicável)
            </h4>
            <Textarea
              placeholder="Descreva o motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onApprove}
                  disabled={processing}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Aprovar Motorista
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Aprovar cadastro e permitir que o motorista comece a aceitar corridas</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={onReject}
                  disabled={processing}
                  variant="destructive"
                  className="flex-1"
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeitar
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rejeitar cadastro - motorista será notificado com o motivo informado</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
