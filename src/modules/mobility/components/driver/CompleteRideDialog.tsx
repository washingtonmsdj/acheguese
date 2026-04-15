import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { DollarSign, CheckCircle2 } from "lucide-react";

interface RideLike {
  id: string;
  status: string;
  suggested_price?: number | null;
  final_price?: number | null;
  [key: string]: unknown;
}

interface CompleteRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: RideLike | null;
  onComplete: (rideId: string, finalPrice?: number) => Promise<void>;
  loading?: boolean;
}

export function CompleteRideDialog({
  open,
  onOpenChange,
  ride,
  onComplete,
  loading = false,
}: CompleteRideDialogProps) {
  const [finalPrice, setFinalPrice] = useState("");

  const handleComplete = async () => {
    if (!ride) return;

    const price = finalPrice
      ? parseFloat(finalPrice.replace(",", "."))
      : undefined;
    await onComplete(ride.id, price);
    onOpenChange(false);
    setFinalPrice("");
  };

  const suggestedPrice = ride?.suggested_price || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1E2529] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Finalizar Corrida
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Registre o valor pago pelo passageiro para fins estatísticos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações da corrida */}
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
              <span className="text-gray-400">Valor acordado:</span>
              <span className="text-emerald-400 font-bold">
                R$ {suggestedPrice.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Explicação do contrato de pricing */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
            <p className="text-xs text-blue-300">
              <strong>Contrato de Pricing:</strong> O valor acordado foi R$ {suggestedPrice.toFixed(2)}. 
              Você pode confirmar este valor ou informar o valor real pago pelo passageiro.
            </p>
          </div>

          {/* Input de valor final */}
          <div className="space-y-2">
            <Label htmlFor="finalPrice" className="text-white">
              Valor pago pelo passageiro (opcional)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="finalPrice"
                type="text"
                placeholder={`Deixe vazio para confirmar R$ ${suggestedPrice.toFixed(2)}`}
                value={finalPrice}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d,]/g, "");
                  setFinalPrice(value);
                }}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500">
              {finalPrice 
                ? `Será registrado R$ ${parseFloat(finalPrice.replace(",", ".")).toFixed(2)} como valor final`
                : `Será confirmado R$ ${suggestedPrice.toFixed(2)} como valor final`
              }
            </p>
          </div>

          {/* Botões de atalho */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFinalPrice("")}
              className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
            >
              Confirmar acordado
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFinalPrice(suggestedPrice.toFixed(2))}
              className="flex-1 border-white/10 text-gray-300 hover:bg-white/5"
            >
              Preencher acordado
            </Button>
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
