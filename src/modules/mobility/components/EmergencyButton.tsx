import { useState } from "react";
import {
  AlertTriangle,
  Check,
  Loader2,
  Phone,
  Share2,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import type { RideRequest } from "@/core/mobility/types";
import { useEmergencyAlerts } from "@/core/safety";
import { useSessionContext } from "@/core/session";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { GeolocationService } from "@/shared/services/GeolocationService";
import { cn } from "@/shared/utils/cn";
import { logger } from "@/shared/utils/logger";

type EmergencyRide = RideRequest & {
  driver?: {
    id?: string | null;
    name?: string | null;
    vehicle_plate?: string | null;
    vehicle_model?: string | null;
    is_verified?: boolean | null;
  } | null;
};

interface EmergencyButtonProps {
  ride?: EmergencyRide;
  className?: string;
  variant?: "full" | "compact";
}

export function EmergencyButton({
  ride,
  className,
  variant = "full",
}: EmergencyButtonProps) {
  const { activeProfile } = useSessionContext();
  const { createAlert } = useEmergencyAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const handleTrigger = async () => {
    if (!activeProfile?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setSending(true);

    try {
      let location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      } | null = null;

      try {
        const geoResult = await GeolocationService.getCurrentLocation({
          useCache: true,
        });
        location = {
          latitude: geoResult.coords.latitude,
          longitude: geoResult.coords.longitude,
          accuracy: geoResult.coords.accuracy,
        };
      } catch (gpsError) {
        logger.warn("GPS não disponível para o alerta de emergência:", gpsError);
      }

      const result = await createAlert({
        profileId: activeProfile.id,
        rideId: ride?.id,
        alertType: "sos",
        location,
        metadata: {
          driverProfileId: ride?.driver?.id,
          driverName: ride?.driver?.name,
          vehiclePlate: ride?.driver?.vehicle_plate,
          origin: ride?.origin,
          destination: ride?.destination,
          timestamp: new Date().toISOString(),
        },
        description: `Alerta SOS acionado${ride ? ` durante corrida ${ride.id}` : ""}`,
      });

      if (!result.success) {
        logger.error("Erro ao salvar alerta:", result.error);
        toast.error(result.error || "Erro ao enviar alerta");
        return;
      }

      setIsOpen(false);
      toast.success("Alerta de emergência registrado", {
        description: location
          ? "Sua localização e os dados disponíveis da corrida foram registrados."
          : "Os dados disponíveis da corrida foram registrados. GPS indisponível.",
      });
    } catch (error) {
      logger.error("Erro ao acionar emergência:", error);
      toast.error("Erro ao enviar alerta. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleShareRide = async () => {
    const text = ride
      ? `Estou em uma viagem com ${ride.driver?.name || "motorista"}\n` +
        `Placa: ${ride.driver?.vehicle_plate || "N/A"}\n` +
        `De: ${ride.origin}\n` +
        `Para: ${ride.destination}`
      : "Estou em uma viagem agora";

    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }

      await navigator.clipboard.writeText(text);
      toast.success("Dados da viagem copiados");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      logger.warn("Não foi possível compartilhar os dados da viagem:", error);
      toast.error("Não foi possível compartilhar os dados da viagem.");
    }
  };

  if (variant === "compact") {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className={cn(
            "h-8 border-destructive/30 bg-destructive/10 text-xs font-semibold text-destructive hover:bg-destructive/15 hover:text-destructive",
            className,
          )}
        >
          <AlertTriangle className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          SOS
        </Button>
        <EmergencyDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          ride={ride}
          onTrigger={handleTrigger}
          onShare={handleShareRide}
          sending={sending}
        />
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border border-destructive/20 bg-destructive/5 p-4",
          className,
        )}
      >
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/10">
            <Shield className="h-5 w-5 text-destructive" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-foreground">Segurança da viagem</h3>
            <p className="text-[0.65rem] text-muted-foreground">
              Alerta e compartilhamento de dados da corrida
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleShareRide()}
          className="mb-3 h-auto w-full justify-start rounded-xl p-2.5 text-left"
        >
          <Share2 className="mr-2 h-4 w-4 shrink-0 text-info" aria-hidden="true" />
          <span>
            <span className="block text-xs font-semibold text-foreground">
              Compartilhar dados
            </span>
            <span className="block text-[0.6rem] font-normal text-muted-foreground">
              Enviar motorista, placa e trajeto disponíveis
            </span>
          </span>
        </Button>

        {ride ? (
          <div className="mb-3 rounded-xl border border-border bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">
                  {ride.driver?.name || "Motorista"}
                </p>
                <p className="truncate text-[0.6rem] text-muted-foreground">
                  {[ride.driver?.vehicle_model, ride.driver?.vehicle_plate]
                    .filter(Boolean)
                    .join(" · ") || "Dados do veículo indisponíveis"}
                  {ride.driver?.is_verified ? " · Verificado" : ""}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsOpen(true)}
          className="w-full font-bold"
        >
          <AlertTriangle className="mr-2 h-4 w-4" aria-hidden="true" />
          Acionar emergência
        </Button>
      </div>

      <EmergencyDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        ride={ride}
        onTrigger={handleTrigger}
        onShare={handleShareRide}
        sending={sending}
      />
    </>
  );
}

interface EmergencyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride?: EmergencyRide;
  onTrigger: () => Promise<void>;
  onShare: () => Promise<void>;
  sending?: boolean;
}

function EmergencyDialog({
  open,
  onOpenChange,
  ride,
  onTrigger,
  onShare,
  sending = false,
}: EmergencyDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (sending) return;
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm border-destructive/30">
        <DialogTitle className="text-center text-xl font-bold text-destructive">
          Emergência
        </DialogTitle>
        <DialogDescription className="text-center text-sm">
          Ao confirmar, o alerta será registrado com os dados disponíveis da
          corrida e sua localização, quando o GPS estiver disponível. Se houver
          contatos de emergência configurados, o sistema tentará notificá-los.
        </DialogDescription>

        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-destructive/30 bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" aria-hidden="true" />
          </div>

          {ride ? (
            <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3 text-left">
              <p className="text-xs font-semibold text-muted-foreground">
                Dados da corrida
              </p>
              <p className="text-xs text-foreground">
                Motorista: {ride.driver?.name || "N/A"}
              </p>
              <p className="text-xs text-foreground">
                Placa: {ride.driver?.vehicle_plate || "N/A"}
              </p>
              <p className="text-xs text-foreground">
                Destino: {ride.destination || "N/A"}
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => void onTrigger()}
              disabled={sending}
              aria-busy={sending}
              className="h-12 w-full text-base font-bold"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  Registrando alerta...
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-2 h-5 w-5" aria-hidden="true" />
                  Acionar emergência
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={() => void onShare()}
              variant="outline"
              disabled={sending}
              className="h-10 w-full"
            >
              <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Compartilhar dados da viagem
            </Button>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              variant="ghost"
              disabled={sending}
              className="w-full text-muted-foreground"
            >
              Cancelar. Estou bem
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function SecurityChecklist({
  isVerified = false,
}: {
  isVerified?: boolean;
}) {
  const features = [
    {
      label: "Verificação de motorista",
      done: isVerified,
      icon: <Shield className="h-3 w-3" aria-hidden="true" />,
    },
    {
      label: "Botão de emergência",
      done: true,
      icon: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    },
    {
      label: "Compartilhamento de viagem",
      done: true,
      icon: <Share2 className="h-3 w-3" aria-hidden="true" />,
    },
    {
      label: "Histórico de corridas",
      done: true,
      icon: <Phone className="h-3 w-3" aria-hidden="true" />,
    },
    {
      label: "Identificação de usuários",
      done: true,
      icon: <Users className="h-3 w-3" aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-1.5">
      {features.map((feature) => (
        <div key={feature.label} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
              feature.done
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground",
            )}
          >
            {feature.done ? (
              <Check className="h-3 w-3" aria-hidden="true" />
            ) : (
              feature.icon
            )}
          </div>
          <span
            className={cn(
              "text-xs",
              feature.done ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {feature.label}
          </span>
        </div>
      ))}
    </div>
  );
}
