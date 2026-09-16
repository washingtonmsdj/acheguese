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

type CancellationReasonOption = {
  code: string;
  label: string;
  requiresDetail?: boolean;
};

const DRIVER_CANCEL_REASONS: readonly CancellationReasonOption[] = [
  { code: "passenger_no_show", label: "Passageiro não apareceu" },
  { code: "passenger_requested", label: "Passageiro solicitou o cancelamento" },
  { code: "passenger_or_identity_mismatch", label: "Pessoa/identidade não corresponde ao esperado" },
  { code: "unsafe_pickup", label: "Local de embarque sem condições seguras" },
  { code: "capacity_or_restraint_safety", label: "Lotação ou equipamento de segurança inadequado" },
  { code: "vehicle_issue", label: "Problema no veículo" },
  { code: "destination_issue", label: "Problema com o destino informado" },
  { code: "weather_safety", label: "Condições climáticas sem segurança" },
  { code: "other", label: "Outro motivo", requiresDetail: true },
];

const PASSENGER_CANCEL_REASONS: readonly CancellationReasonOption[] = [
  { code: "plans_changed", label: "Mudança de planos" },
  { code: "other_transport", label: "Encontrei outro transporte" },
  { code: "driver_delay", label: "Motorista demorou muito" },
  { code: "driver_or_vehicle_mismatch", label: "Motorista ou veículo não corresponde ao informado" },
  { code: "unsafe_pickup_or_approach", label: "Situação de segurança no embarque/aproximação" },
  { code: "destination_issue", label: "Problema com o destino informado" },
  { code: "price_concern", label: "Valor não atende ao esperado" },
  { code: "other", label: "Outro motivo", requiresDetail: true },
];

function serializeCancellationReason(
  option: CancellationReasonOption,
  detail: string,
): string {
  const normalizedDetail = detail.trim().replace(/\s+/g, " ");
  return option.requiresDetail
    ? `[${option.code}] ${normalizedDetail}`
    : `[${option.code}] ${option.label}`;
}

export const CancelRideDialog = forwardRef<
  HTMLDivElement,
  CancelRideDialogProps
>(function CancelRideDialog(
  { open, onOpenChange, onConfirm, isDriver = false },
  ref,
) {
  const [selectedReasonCode, setSelectedReasonCode] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reasons = isDriver ? DRIVER_CANCEL_REASONS : PASSENGER_CANCEL_REASONS;
  const selectedReason = reasons.find(
    (reason) => reason.code === selectedReasonCode,
  );

  const handleConfirm = async () => {
    if (!selectedReason) return;
    if (selectedReason.requiresDetail && !customReason.trim()) return;

    const finalReason = serializeCancellationReason(
      selectedReason,
      customReason,
    );

    setLoading(true);
    try {
      await onConfirm(finalReason);
      onOpenChange(false);
      setSelectedReasonCode("");
      setCustomReason("");
    } finally {
      setLoading(false);
    }
  };

  const isValid = Boolean(
    selectedReason &&
      (!selectedReason.requiresDetail || customReason.trim()),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={ref} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Cancelar Corrida
          </DialogTitle>
          <DialogDescription>
            Informe o motivo real do cancelamento. O registro fica associado à
            corrida para segurança, suporte e auditoria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Motivo do cancelamento</Label>
            <RadioGroup
              value={selectedReasonCode}
              onValueChange={setSelectedReasonCode}
            >
              {reasons.map((reason) => (
                <div key={reason.code} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.code} id={`cancel-${reason.code}`} />
                  <Label
                    htmlFor={`cancel-${reason.code}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason?.requiresDetail && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason">Descreva o motivo</Label>
              <Textarea
                id="custom-reason"
                placeholder="Descreva objetivamente o que aconteceu..."
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
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
