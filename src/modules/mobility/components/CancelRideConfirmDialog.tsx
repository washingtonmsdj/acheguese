/**
 * Diálogo de confirmação de cancelamento de corrida
 * Mostra informações sobre o estado atual e consequências do cancelamento
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
    switch (rideStatus) {
      case "requested":
      case "searching_driver":
        return "A corrida ainda está buscando um motorista. Você pode cancelar sem penalidades.";
      case "driver_assigned":
      case "driver_accepted":
        return "Um motorista já foi atribuído. O cancelamento pode afetar sua avaliação.";
      case "driver_arriving":
        return "O motorista está a caminho. O cancelamento pode resultar em penalidades.";
      default:
        return "Tem certeza que deseja cancelar esta corrida?";
    }
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
                    {rideStatus === "searching_driver" && "Buscando motorista"}
                    {rideStatus === "driver_assigned" && "Motorista atribuído"}
                    {rideStatus === "driver_accepted" && "Motorista aceitou"}
                    {rideStatus === "driver_arriving" && "Motorista a caminho"}
                    {!["searching_driver", "driver_assigned", "driver_accepted", "driver_arriving"].includes(rideStatus) && rideStatus}
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
