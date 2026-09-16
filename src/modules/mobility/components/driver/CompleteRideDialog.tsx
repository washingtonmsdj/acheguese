import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle2 } from "lucide-react";
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
      <DialogContent className="sm:max-w-md bg-[#1E2529] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Finalizar Corrida
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Confirme a conclusao da corrida. O valor e controlado pelo contrato de pricing do servidor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-white/5 p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Origem:</span>
              <span className="text-white font-medium">{ride?.origin}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Destino:</span>
              <span className="text-white font-medium">
                {ride?.destination}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Valor registrado:</span>
              <span className="text-emerald-400 font-bold">
                {agreedPriceLabel}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-300">
              <strong>Contrato de Pricing:</strong> o motorista nao altera o valor ao finalizar a corrida. Ajustes comerciais precisam passar pelo owner server-side apropriado.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-white/10 text-gray-300 hover:bg-white/5"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleComplete}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-white"
          >
            {loading ? "Finalizando..." : "Finalizar Corrida"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
