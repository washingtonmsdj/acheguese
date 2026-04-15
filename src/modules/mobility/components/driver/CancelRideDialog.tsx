import { useState, forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { AlertTriangle, Loader2 } from "lucide-react";

interface CancelRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<void>;
  rideId: string;
  isDriver?: boolean;
}

const DRIVER_CANCEL_REASONS = [
  "Passageiro não apareceu",
  "Destino incorreto",
  "Problema no carro",
  "Passageiro solicitou cancelamento",
  "Distância muito longa",
  "Condições climáticas ruins",
  "Outro motivo",
];

const PASSENGER_CANCEL_REASONS = [
  "Mudança de planos",
  "Encontrei outro transporte",
  "Motorista demorou muito",
  "Preço muito alto",
  "Destino incorreto",
  "Outro motivo",
];

export const CancelRideDialog = forwardRef<
  HTMLDivElement,
  CancelRideDialogProps
>(function CancelRideDialog(
  { open, onOpenChange, onConfirm, rideId, isDriver = false },
  ref,
) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = isDriver ? DRIVER_CANCEL_REASONS : PASSENGER_CANCEL_REASONS;

  const handleConfirm = async () => {
    const finalReason =
      selectedReason === "Outro motivo" ? customReason : selectedReason;

    if (!finalReason.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onConfirm(finalReason);
      onOpenChange(false);
      setSelectedReason("");
      setCustomReason("");
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    selectedReason &&
    (selectedReason !== "Outro motivo" || customReason.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Cancelar Corrida
          </DialogTitle>
          <DialogDescription>
            Por favor, informe o motivo do cancelamento. Isso nos ajuda a
            melhorar o serviço.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Motivo do cancelamento</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
            >
              {reasons.map((reason) => (
                <div key={reason} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason} id={reason} />
                  <Label
                    htmlFor={reason}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "Outro motivo" && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Descreva o motivo</Label>
              <Textarea
                id="custom-reason"
                placeholder="Digite o motivo do cancelamento..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {customReason.length}/200 caracteres
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValid || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
