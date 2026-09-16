import { forwardRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Textarea } from "@/shared/components/ui/textarea";

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
  {
    code: "passenger_or_identity_mismatch",
    label: "Pessoa/identidade não corresponde ao esperado",
  },
  { code: "unsafe_pickup", label: "Local de embarque sem condições seguras" },
  {
    code: "capacity_or_restraint_safety",
    label: "Lotação ou equipamento de segurança inadequado",
  },
  { code: "vehicle_issue", label: "Problema no veículo" },
  { code: "destination_issue", label: "Problema com o destino informado" },
  { code: "weather_safety", label: "Condições climáticas sem segurança" },
  { code: "other", label: "Outro motivo", requiresDetail: true },
];

const PASSENGER_CANCEL_REASONS: readonly CancellationReasonOption[] = [
  { code: "plans_changed", label: "Mudança de planos" },
  { code: "other_transport", label: "Encontrei outro transporte" },
  { code: "driver_delay", label: "Motorista demorou muito" },
  {
    code: "driver_or_vehicle_mismatch",
    label: "Motorista ou veículo não corresponde ao informado",
  },
  {
    code: "unsafe_pickup_or_approach",
    label: "Situação de segurança no embarque/aproximação",
  },
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

  const resetForm = () => {
    setSelectedReasonCode("");
    setCustomReason("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) return;
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleConfirm = async () => {
    if (!selectedReason) return;
    if (selectedReason.requiresDetail && !customReason.trim()) return;

    setLoading(true);
    try {
      await onConfirm(serializeCancellationReason(selectedReason, customReason));
      onOpenChange(false);
      resetForm();
    } finally {
      setLoading(false);
    }
  };

  const isValid = Boolean(
    selectedReason &&
      (!selectedReason.requiresDetail || customReason.trim()),
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent ref={ref} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
            Cancelar corrida
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
                  <RadioGroupItem
                    value={reason.code}
                    id={`cancel-${reason.code}`}
                  />
                  <Label
                    htmlFor={`cancel-${reason.code}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason?.requiresDetail ? (
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
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={!isValid || loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
