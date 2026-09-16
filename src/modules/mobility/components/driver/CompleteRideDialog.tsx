import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2, Info } from "lucide-react";
import { formatBrl } from "@/shared/utils/currency";

interface RideLike {
  id: string;
  status: string;
  origin?: string | null;
  destination?: string | null;
  suggested_price?: number | null;
  final_price?: number | null;
  [key: string]: unknown;
}

interface CompleteRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: RideLike | null;
  onComplete: (rideId: string) => Promise<void>;
  loading?: boolean;
}

export function CompleteRideDialog({
  open,
  onOpenChange,
  ride,
  onComplete,
  loading = false,
}: CompleteRideDialogProps) {
  const handleComplete = async () => {
    if (!ride) return;

    await onComplete(ride.id);
    onOpenChange(false);
  };

  const agreedPrice = ride?.final_price ?? ride?.suggested_price ?? 0;
  const agreedPriceLabel = formatBrl(agreedPrice);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
            Finalizar corrida
          </DialogTitle>
          <DialogDescription>
            Confirme a conclusão da corrida. O valor é controlado pelo contrato de pricing do servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Origem</span>
              <span className="text-right font-medium text-foreground">
                {ride?.origin || "Não informada"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Destino</span>
              <span className="text-right font-medium text-foreground">
                {ride?.destination || "Não informado"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Valor registrado</span>
              <span className="font-bold text-success">{agreedPriceLabel}</span>
            </div>
          </div>

          <div className="flex gap-2 rounded-lg border border-info/25 bg-info/10 p-3 text-info">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p className="text-xs leading-relaxed">
              <strong>Contrato de pricing:</strong> o motorista não altera o valor ao finalizar a corrida. Ajustes comerciais passam pelo owner server-side apropriado.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleComplete()}
            disabled={loading || !ride}
          >
            {loading ? "Finalizando..." : "Finalizar corrida"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
