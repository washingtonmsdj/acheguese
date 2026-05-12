/**
 * MotoboyDeliveryActions - acoes do motoboy durante a entrega.
 *
 * Exibido no dashboard do motorista quando ride_mode = 'motoboy'.
 * Controla confirmar coleta, iniciar entrega, confirmar entrega e registrar falha.
 */

import { useState } from "react";
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
} from "lucide-react";
import { RIDE_STATUS } from "../../constants";
import type { DeliveryProof } from "../../hooks/useDelivery";

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
  onConfirmDelivery: (rideId: string, driverProfileId: string, proof: DeliveryProof, finalPrice?: number) => Promise<void>;
  onFailDelivery: (rideId: string, driverProfileId: string, reason: string) => Promise<void>;
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
  const [proofCode, setProofCode] = useState("");
  const [proofObservation, setProofObservation] = useState("");
  const [failReasonCode, setFailReasonCode] = useState("");
  const [failReasonNotes, setFailReasonNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (ride.ride_mode !== 'motoboy') return null;

  const handleProofDialogChange = (open: boolean) => {
    if (isLoading) return;
    setProofDialogOpen(open);
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

  const handleConfirmDelivery = async () => {
    await runAction(async () => {
      const proof: DeliveryProof = {
        code: proofCode.trim() || undefined,
        observation: proofObservation.trim() || undefined,
      };

      await onConfirmDelivery(ride.id, driverProfileId, proof);
      setProofDialogOpen(false);
      setProofCode("");
      setProofObservation("");
    });
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
            <a href={`tel:${ride.recipient_phone}`} className="text-primary font-medium">
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
        <Button
          className="w-full"
          onClick={() => runAction(() => onStartDelivery(ride.id, driverProfileId))}
          disabled={isLoading}
        >
          <Truck className="h-4 w-4 mr-2" />
          Iniciar entrega
        </Button>
      )}

      {ride.status === RIDE_STATUS.IN_DELIVERY && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            onClick={() => setProofDialogOpen(true)}
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
            Falha
          </Button>
        </div>
      )}

      <Dialog open={proofDialogOpen} onOpenChange={handleProofDialogChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar entrega</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="proofCode" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Codigo de confirmacao (opcional)
              </Label>
              <Input
                id="proofCode"
                value={proofCode}
                onChange={(e) => setProofCode(e.target.value)}
                placeholder="Codigo fornecido pelo destinatario"
              />
            </div>
            <div>
              <Label htmlFor="proofObs">
                Observacao <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="proofObs"
                value={proofObservation}
                onChange={(e) => setProofObservation(e.target.value)}
                placeholder="Ex: Entregue pessoalmente, deixei com porteiro, destinatario assinou..."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descreva como a entrega foi realizada. Isso fica registrado como prova.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => setProofDialogOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmDelivery}
                disabled={isLoading || !proofObservation.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar entrega"}
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
                  onChange={(e) => setFailReasonNotes(e.target.value)}
                  placeholder="Descreva o incidente..."
                  rows={3}
                  required
                />
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={() => setFailDialogOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleFailDelivery}
                disabled={isLoading || !failReasonCode || (failReasonCode === "other" && !failReasonNotes.trim())}
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
