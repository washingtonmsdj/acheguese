/**
 * MotoboyDeliveryActions - acoes do motoboy durante a entrega.
 *
 * Exibido no dashboard do motorista quando ride_mode = 'motoboy'.
 * Controla confirmar coleta, iniciar entrega, confirmar entrega e registrar falha.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import {
  Package,
  CheckCircle2,
  Truck,
  XCircle,
  Hash,
  MapPin,
  User,
  Phone,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import { RIDE_STATUS } from "@/core/mobility/constants";
import type { DeliveryProof } from "@/core/mobility/delivery/proof-of-delivery/types";
import { OperationalVerificationService } from "@/core/mobility/services/OperationalVerificationService";
import { buildTelUrl } from "@/shared/utils/contactLinks";

interface MotoboyDeliveryActionsProps {
  ride: {
    id: string;
    status: string;
    ride_mode?: string | null;
    recipient_name?: string;
    recipient_phone?: string;
    delivery_notes?: string;
    package_description?: string;
    package_size?: string;
    origin?: string;
    destination?: string;
  };
  driverProfileId: string;
  onGoToPickup: (rideId: string, driverProfileId: string) => Promise<void>;
  onConfirmPickup: (rideId: string, driverProfileId: string) => Promise<void>;
  onStartDelivery: (rideId: string, driverProfileId: string) => Promise<void>;
  onConfirmDelivery: (
    rideId: string,
    driverProfileId: string,
    proof: DeliveryProof,
    finalPrice?: number,
    pin?: string,
  ) => Promise<boolean>;
  onFailDelivery: (
    rideId: string,
    driverProfileId: string,
    reason: string,
  ) => Promise<void>;
}

const FAIL_REASON_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "recipient_unavailable", label: "Destinatario ausente" },
  { value: "address_not_found", label: "Endereco nao encontrado" },
  { value: "address_inaccessible", label: "Endereco inacessivel" },
  { value: "package_damaged", label: "Pacote danificado" },
  { value: "safety_issue", label: "Risco de seguranca" },
  { value: "vehicle_issue", label: "Problema no veiculo" },
  { value: "other", label: "Outro motivo" },
];

type VerificationUiState =
  | { status: "idle" | "loading" | "not_required" | "verified" }
  | { status: "required"; attemptsRemaining?: number }
  | { status: "error"; message: string };

export function MotoboyDeliveryActions({
  ride,
  driverProfileId,
  onGoToPickup,
  onConfirmPickup,
  onStartDelivery,
  onConfirmDelivery,
  onFailDelivery,
}: MotoboyDeliveryActionsProps) {
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [proofReference, setProofReference] = useState("");
  const [proofObservation, setProofObservation] = useState("");
  const [deliveryPin, setDeliveryPin] = useState("");
  const [verificationState, setVerificationState] = useState<VerificationUiState>({
    status: "idle",
  });
  const [failReasonCode, setFailReasonCode] = useState("");
  const [failReasonNotes, setFailReasonNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const refreshVerificationState = useCallback(async () => {
    if (
      ride.ride_mode !== "motoboy" ||
      ride.status !== RIDE_STATUS.IN_DELIVERY
    ) {
      setVerificationState({ status: "idle" });
      setDeliveryPin("");
      return;
    }

    setVerificationState({ status: "loading" });
    const result =
      await OperationalVerificationService.getVerificationStatusSummaryResult(
        ride.id,
      );

    if (!result.success) {
      setVerificationState({
        status: "error",
        message:
          result.error ||
          "Nao foi possivel validar o protocolo de seguranca da entrega.",
      });
      return;
    }

    const summary = result.data ?? null;
    if (!summary?.isRequired) {
      setVerificationState({ status: "not_required" });
      setDeliveryPin("");
      return;
    }

    if (summary.verified) {
      setVerificationState({ status: "verified" });
      setDeliveryPin("");
      return;
    }

    setVerificationState({
      status: "required",
      attemptsRemaining: summary.attemptsRemaining,
    });
  }, [ride.id, ride.ride_mode, ride.status]);

  useEffect(() => {
    void refreshVerificationState();
  }, [refreshVerificationState]);

  if (ride.ride_mode !== "motoboy") return null;

  const handleProofDialogChange = (open: boolean) => {
    if (isLoading) return;
    setProofDialogOpen(open);
    if (open) {
      void refreshVerificationState();
    }
  };

  const handleFailDialogChange = (open: boolean) => {
    if (isLoading) return;
    setFailDialogOpen(open);
  };

  const runAction = async (action: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const verificationBlocksConfirmation =
    verificationState.status === "idle" ||
    verificationState.status === "loading" ||
    verificationState.status === "error" ||
    (verificationState.status === "required" &&
      !OperationalVerificationService.isValidPINFormat(deliveryPin));

  const handleConfirmDelivery = async () => {
    if (verificationBlocksConfirmation) return;

    setIsLoading(true);
    try {
      const proof: DeliveryProof = {
        code: proofReference.trim() || undefined,
        observation: proofObservation.trim() || undefined,
      };

      const confirmed = await onConfirmDelivery(
        ride.id,
        driverProfileId,
        proof,
        undefined,
        verificationState.status === "required" ? deliveryPin : undefined,
      );

      if (!confirmed) {
        await refreshVerificationState();
        return;
      }

      setProofDialogOpen(false);
      setProofReference("");
      setProofObservation("");
      setDeliveryPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailDelivery = async () => {
    const reason = failReasonCode === "other" ? failReasonNotes.trim() : failReasonCode;
    if (!reason.trim()) return;

    await runAction(async () => {
      await onFailDelivery(ride.id, driverProfileId, reason);
      setFailDialogOpen(false);
      setFailReasonCode("");
      setFailReasonNotes("");
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-card border border-border space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package className="h-4 w-4 text-primary" />
          Entrega Motoboy
        </div>

        {ride.recipient_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Destinatario:</span>
            <span className="font-medium">{ride.recipient_name}</span>
          </div>
        )}

        {ride.recipient_phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a
              href={buildTelUrl(ride.recipient_phone) ?? undefined}
              className="text-primary font-medium"
            >
              {ride.recipient_phone}
            </a>
          </div>
        )}

        {ride.package_description && (
          <div className="flex items-start gap-2 text-sm">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">Pacote:</span>
            <span>{ride.package_description}</span>
          </div>
        )}

        {ride.delivery_notes && (
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-700 dark:text-yellow-400">
            {ride.delivery_notes}
          </div>
        )}

        {ride.destination && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-red-500 mt-0.5" />
            <span>{ride.destination}</span>
          </div>
        )}
      </div>

      {ride.status === RIDE_STATUS.DRIVER_ACCEPTED && (
        <Button
          className="w-full"
          onClick={() => runAction(() => onGoToPickup(ride.id, driverProfileId))}
          disabled={isLoading}
        >
          <Truck className="h-4 w-4 mr-2" />
          Ir para coleta
        </Button>
      )}

      {ride.status === RIDE_STATUS.DRIVER_ARRIVING && (
        <Button
          className="w-full"
          onClick={() => runAction(() => onConfirmPickup(ride.id, driverProfileId))}
          disabled={isLoading}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Confirmar coleta
        </Button>
      )}

      {ride.status === RIDE_STATUS.PICKUP_CONFIRMED && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => runAction(() => onStartDelivery(ride.id, driverProfileId))}
            disabled={isLoading}
          >
            <Truck className="h-4 w-4 mr-2" />
            Iniciar entrega
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setFailDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Registrar falha
          </Button>
        </div>
      )}

      {ride.status === RIDE_STATUS.IN_DELIVERY && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => handleProofDialogChange(true)}
            disabled={isLoading}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Entregue
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setFailDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Registrar falha
          </Button>
        </div>
      )}

      <Dialog open={proofDialogOpen} onOpenChange={handleProofDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {verificationState.status === "loading" && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando protocolo de seguranca...
              </div>
            )}

            {verificationState.status === "error" && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 space-y-2">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <ShieldAlert className="h-4 w-4 mt-0.5" />
                  <span>
                    Nao e seguro concluir a entrega enquanto o protocolo de verificacao estiver indisponivel.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshVerificationState()}
                  disabled={isLoading}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            )}

            {verificationState.status === "required" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                <Label htmlFor="deliveryPin" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  PIN operacional de 4 digitos
                </Label>
                <Input
                  id="deliveryPin"
                  value={deliveryPin}
                  onChange={(event) =>
                    setDeliveryPin(
                      event.target.value.replace(/\D/g, "").slice(0, 4),
                    )
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={4}
                  placeholder="0000"
                />
                <p className="text-xs text-muted-foreground">
                  Use somente o PIN operacional exibido ao solicitante. Ele e validado no servidor e controla tentativas.
                  {verificationState.attemptsRemaining !== undefined
                    ? ` Tentativas restantes: ${verificationState.attemptsRemaining}.`
                    : ""}
                </p>
              </div>
            )}

            {verificationState.status === "verified" && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-primary" />
                PIN operacional ja validado para esta entrega.
              </div>
            )}

            <div>
              <Label htmlFor="proofReference" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Referencia do comprovante (opcional)
              </Label>
              <Input
                id="proofReference"
                value={proofReference}
                onChange={(event) => setProofReference(event.target.value)}
                placeholder="Ex: protocolo, recibo ou identificador externo"
                maxLength={128}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Esta referencia faz parte da prova de entrega e nao substitui o PIN operacional.
              </p>
            </div>
            <div>
              <Label htmlFor="proofObs">
                Observacao <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="proofObs"
                value={proofObservation}
                onChange={(event) => setProofObservation(event.target.value)}
                placeholder="Ex: Entregue pessoalmente, deixei com porteiro, destinatario assinou..."
                rows={3}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descreva como a entrega foi realizada. Isso fica registrado como prova.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setProofDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmDelivery}
                disabled={
                  isLoading ||
                  !proofObservation.trim() ||
                  verificationBlocksConfirmation
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmar entrega"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={failDialogOpen} onOpenChange={handleFailDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar falha na entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Apos a coleta, o pacote permanece sob sua custodia ate a resolucao operacional da falha.
            </p>
            <div>
              <Label>Motivo da falha *</Label>
              <RadioGroup
                value={failReasonCode}
                onValueChange={setFailReasonCode}
                className="space-y-2 mt-2"
              >
                {FAIL_REASON_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={`fail-${option.value}`} />
                    <Label htmlFor={`fail-${option.value}`} className="text-sm font-normal">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            {failReasonCode === "other" && (
              <div>
                <Label htmlFor="failReasonNotes">Descreva o motivo *</Label>
                <Textarea
                  id="failReasonNotes"
                  value={failReasonNotes}
                  onChange={(event) => setFailReasonNotes(event.target.value)}
                  placeholder="Descreva o incidente..."
                  rows={3}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFailDialogOpen(false)}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleFailDelivery}
                disabled={
                  isLoading ||
                  !failReasonCode ||
                  (failReasonCode === "other" && !failReasonNotes.trim())
                }
              >
                Registrar falha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
