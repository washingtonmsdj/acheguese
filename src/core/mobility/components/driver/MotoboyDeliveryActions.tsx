/**
 * Ações do motoboy durante uma entrega já aceita.
 *
 * As transições e a verificação operacional permanecem server-owned. Este
 * componente apenas coleta prova, PIN e motivo de falha e aciona os commands.
 */

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Hash,
  Loader2,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { RIDE_STATUS } from "@/core/mobility/constants";
import type { DeliveryProof } from "@/core/mobility/delivery/proof-of-delivery/types";
import { OperationalVerificationService } from "@/core/mobility/services/OperationalVerificationService";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Textarea } from "@/shared/components/ui/textarea";
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
    pin?: string,
  ) => Promise<boolean>;
  onFailDelivery: (
    rideId: string,
    driverProfileId: string,
    reason: string,
  ) => Promise<void>;
}

const FAIL_REASON_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "recipient_unavailable", label: "Destinatário ausente" },
  { value: "address_not_found", label: "Endereço não encontrado" },
  { value: "address_inaccessible", label: "Endereço inacessível" },
  { value: "package_damaged", label: "Pacote danificado" },
  { value: "safety_issue", label: "Risco de segurança" },
  { value: "vehicle_issue", label: "Problema no veículo" },
  { value: "other", label: "Outro motivo" },
];

const DELIVERY_PII_VISIBLE_STATUSES = new Set<string>([
  RIDE_STATUS.DRIVER_ACCEPTED,
  RIDE_STATUS.DRIVER_ARRIVING,
  RIDE_STATUS.PICKUP_CONFIRMED,
  RIDE_STATUS.IN_DELIVERY,
]);

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
          "Não foi possível validar o protocolo de segurança da entrega.",
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

  if (
    ride.ride_mode !== "motoboy" ||
    !DELIVERY_PII_VISIBLE_STATUSES.has(ride.status)
  ) {
    return null;
  }

  const resetProofForm = () => {
    setProofReference("");
    setProofObservation("");
    setDeliveryPin("");
  };

  const resetFailForm = () => {
    setFailReasonCode("");
    setFailReasonNotes("");
  };

  const handleProofDialogChange = (open: boolean) => {
    if (isLoading) return;
    setProofDialogOpen(open);
    if (open) {
      void refreshVerificationState();
    } else {
      resetProofForm();
    }
  };

  const handleFailDialogChange = (open: boolean) => {
    if (isLoading) return;
    setFailDialogOpen(open);
    if (!open) resetFailForm();
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
        verificationState.status === "required" ? deliveryPin : undefined,
      );

      if (!confirmed) {
        await refreshVerificationState();
        return;
      }

      setProofDialogOpen(false);
      resetProofForm();
    } finally {
      setIsLoading(false);
    }
  };

  const handleFailDelivery = async () => {
    const reason =
      failReasonCode === "other" ? failReasonNotes.trim() : failReasonCode;
    if (!reason.trim()) return;

    await runAction(async () => {
      await onFailDelivery(ride.id, driverProfileId, reason);
      setFailDialogOpen(false);
      resetFailForm();
    });
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-xl border bg-card p-4 text-card-foreground">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Package className="h-4 w-4 text-category-mobility" aria-hidden="true" />
          Entrega motoboy
        </div>

        {ride.recipient_name ? (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Destinatário:</span>
            <span className="font-medium">{ride.recipient_name}</span>
          </div>
        ) : null}

        {ride.recipient_phone ? (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <a
              href={buildTelUrl(ride.recipient_phone) ?? undefined}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {ride.recipient_phone}
            </a>
          </div>
        ) : null}

        {ride.package_description ? (
          <div className="flex items-start gap-2 text-sm">
            <Package
              className="mt-0.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="text-muted-foreground">Pacote:</span>
            <span>{ride.package_description}</span>
          </div>
        ) : null}

        {ride.delivery_notes ? (
          <div className="rounded-lg border border-warning/25 bg-warning/10 p-2 text-sm text-warning">
            {ride.delivery_notes}
          </div>
        ) : null}

        {ride.destination ? (
          <div className="flex items-start gap-2 text-sm">
            <MapPin
              className="mt-0.5 h-4 w-4 text-destructive"
              aria-hidden="true"
            />
            <span>{ride.destination}</span>
          </div>
        ) : null}
      </section>

      {ride.status === RIDE_STATUS.DRIVER_ACCEPTED ? (
        <Button
          type="button"
          className="w-full"
          onClick={() =>
            void runAction(() => onGoToPickup(ride.id, driverProfileId))
          }
          disabled={isLoading}
        >
          <Truck className="mr-2 h-4 w-4" aria-hidden="true" />
          Ir para coleta
        </Button>
      ) : null}

      {ride.status === RIDE_STATUS.DRIVER_ARRIVING ? (
        <Button
          type="button"
          className="w-full"
          onClick={() =>
            void runAction(() => onConfirmPickup(ride.id, driverProfileId))
          }
          disabled={isLoading}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
          Confirmar coleta
        </Button>
      ) : null}

      {ride.status === RIDE_STATUS.PICKUP_CONFIRMED ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() =>
              void runAction(() => onStartDelivery(ride.id, driverProfileId))
            }
            disabled={isLoading}
          >
            <Truck className="mr-2 h-4 w-4" aria-hidden="true" />
            Iniciar entrega
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => setFailDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            Registrar falha
          </Button>
        </div>
      ) : null}

      {ride.status === RIDE_STATUS.IN_DELIVERY ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            onClick={() => handleProofDialogChange(true)}
            disabled={isLoading}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Entregue
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1"
            onClick={() => setFailDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            Registrar falha
          </Button>
        </div>
      ) : null}

      <Dialog open={proofDialogOpen} onOpenChange={handleProofDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {verificationState.status === "loading" ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Validando protocolo de segurança...
              </div>
            ) : null}

            {verificationState.status === "error" ? (
              <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <ShieldAlert className="mt-0.5 h-4 w-4" aria-hidden="true" />
                  <span>
                    Não é seguro concluir a entrega enquanto o protocolo de
                    verificação estiver indisponível.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshVerificationState()}
                  disabled={isLoading}
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Tentar novamente
                </Button>
              </div>
            ) : null}

            {verificationState.status === "required" ? (
              <div className="space-y-2 rounded-lg border border-info/25 bg-info/10 p-3">
                <Label htmlFor="deliveryPin" className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-info" aria-hidden="true" />
                  PIN operacional de 4 dígitos
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
                  Use somente o PIN operacional exibido ao solicitante. Ele é
                  validado no servidor e controla tentativas.
                  {verificationState.attemptsRemaining !== undefined
                    ? ` Tentativas restantes: ${verificationState.attemptsRemaining}.`
                    : ""}
                </p>
              </div>
            ) : null}

            {verificationState.status === "verified" ? (
              <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 p-3 text-sm text-success">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                PIN operacional já validado para esta entrega.
              </div>
            ) : null}

            <div>
              <Label htmlFor="proofReference" className="flex items-center gap-2">
                <Hash className="h-4 w-4" aria-hidden="true" />
                Referência do comprovante (opcional)
              </Label>
              <Input
                id="proofReference"
                value={proofReference}
                onChange={(event) => setProofReference(event.target.value)}
                placeholder="Ex: protocolo, recibo ou identificador externo"
                maxLength={128}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Esta referência faz parte da prova de entrega e não substitui o
                PIN operacional.
              </p>
            </div>

            <div>
              <Label htmlFor="proofObs">
                Observação <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="proofObs"
                value={proofObservation}
                onChange={(event) => setProofObservation(event.target.value)}
                placeholder="Ex: Entregue pessoalmente, deixei com porteiro, destinatário assinou..."
                rows={3}
                maxLength={1000}
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Descreva como a entrega foi realizada. Isso fica registrado como prova.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleProofDialogChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => void handleConfirmDelivery()}
                disabled={
                  isLoading ||
                  !proofObservation.trim() ||
                  verificationBlocksConfirmation
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
              Após a coleta, o pacote permanece sob sua custódia até a resolução
              operacional da falha.
            </p>
            <div>
              <Label>Motivo da falha *</Label>
              <RadioGroup
                value={failReasonCode}
                onValueChange={setFailReasonCode}
                className="mt-2 space-y-2"
              >
                {FAIL_REASON_OPTIONS.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`fail-${option.value}`}
                    />
                    <Label
                      htmlFor={`fail-${option.value}`}
                      className="text-sm font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {failReasonCode === "other" ? (
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
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleFailDialogChange(false)}
                disabled={isLoading}
              >
                Voltar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => void handleFailDelivery()}
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
