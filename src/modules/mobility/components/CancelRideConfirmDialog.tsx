/**
 * Diálogo de confirmação de cancelamento de corrida.
 * Mostra o lifecycle atual sem inventar penalidades ou regras comerciais locais.
 */

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { AlertTriangle, Info } from "lucide-react";
import {
  isClosedRideStatus,
  isDriverOwnedOpenRideStatus,
  isPreAcceptRideStatus,
} from "@/core/mobility/core/RideLifecycleStatus";
import { getRideStatusLabel } from "@/core/mobility/services/mobility.helpers";
import { logger } from "@/shared/utils/logger";

interface CancelRideConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
  rideStatus?: string;
  isDriver?: boolean;
}

export function CancelRideConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  rideStatus,
  isDriver = false,
}: CancelRideConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    logger.info("CancelRideConfirmDialog - confirmando cancelamento", { rideStatus, isDriver });

    try {
      const success = await onConfirm();
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusMessage = () => {
    if (!rideStatus) {
      return "Tem certeza que deseja solicitar o cancelamento desta corrida?";
    }

    if (isPreAcceptRideStatus(rideStatus)) {
      return "A corrida ainda está na etapa de busca ou oferta ao motorista. Confirme se deseja solicitar o cancelamento.";
    }

    if (isDriverOwnedOpenRideStatus(rideStatus)) {
      return "O motorista já confirmou participação e a corrida entrou na etapa operacional. Confirme se deseja solicitar o cancelamento.";
    }

    if (isClosedRideStatus(rideStatus)) {
      return "Esta corrida já está encerrada. O servidor validará a solicitação antes de qualquer alteração.";
    }

    return "Tem certeza que deseja solicitar o cancelamento desta corrida? A regra final é validada pelo servidor.";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Cancelar Corrida
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>{getStatusMessage()}</p>

            {rideStatus && (
              <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-xs">
                <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">Estado atual da corrida:</p>
                  <p className="text-muted-foreground">
                    {getRideStatusLabel(rideStatus)}
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Manter Corrida
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Cancelando..." : "Sim, Cancelar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
