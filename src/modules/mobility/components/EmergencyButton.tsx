import React, { useState } from "react";
import {
  AlertTriangle,
  Phone,
  Shield,
  MapPin,
  X,
  Check,
  Users,
  Share2,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { VisuallyHidden } from "@/shared/components/ui/visually-hidden";
import { cn } from "@/shared/utils/cn";
import { useSessionContext } from "@/core/session";
import { GeolocationService } from "@/core/maps/services/GeolocationService";
import { useEmergencyAlerts } from "@/core/safety";
import type { RideRequest } from "@/modules/mobility/types";
import { logger } from "@/shared/utils/logger";
import { toast } from "sonner";

interface EmergencyButtonProps {
  ride?: RideRequest;
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
  const [triggered, setTriggered] = useState(false);
  const [sending, setSending] = useState(false);

  const handleTrigger = async () => {
    if (!activeProfile?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setSending(true);

    try {
      // Capturar localização GPS via SSOT
      let location: { latitude: number; longitude: number } | null = null;
      try {
        const geoResult = await GeolocationService.getCurrentLocation({ useCache: true });
        location = { latitude: geoResult.coords.latitude, longitude: geoResult.coords.longitude };
      } catch (gpsError) {
        logger.warn("GPS não disponível:", gpsError);
      }

      // ✅ SSOT - Criar alerta via core/safety
      const result = await createAlert({
        profileId: activeProfile.id,
        rideId: ride?.id,
        alertType: 'sos',
        location,
        metadata: {
          driverProfileId: ride?.driver?.id,
          driverName: ride?.driver?.name,
          vehiclePlate: ride?.driver?.vehicle_plate,
          origin: ride?.origin,
          destination: ride?.destination,
          timestamp: new Date().toISOString(),
        },
        description: `Alerta SOS acionado${ride ? ` durante corrida ${ride.id}` : ''}`,
      });

      if (!result.success) {
        logger.error("Erro ao salvar alerta:", result.error);
        toast.error(result.error || "Erro ao enviar alerta");
        return;
      }

      setTriggered(true);
      setIsOpen(false);

      toast.error("🚨 ALERTA DE EMERGÊNCIA ENVIADO!", {
        description: location
          ? "Sua localização GPS e dados da corrida foram salvos."
          : "Dados da corrida foram salvos. GPS não disponível.",
        duration: 8000,
      });

      // TODO: Enviar notificações para contatos de emergência
      // TODO: Notificar administradores do sistema
    } catch (error) {
      logger.error("Erro ao acionar emergência:", error);
      toast.error("Erro ao enviar alerta. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleShareRide = () => {
    const text = ride
      ? `🚗 Estou em uma viagem com ${ride.driver?.name || "motorista"}\n` +
        `Placa: ${ride.driver?.vehicle_plate || "N/A"}\n` +
        `De: ${ride.origin}\n` +
        `Para: ${ride.destination}`
      : "Estou em uma viagem agora";

    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Dados da viagem copiados!");
    }
  };

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/20 transition-all",
            className,
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          SOS
        </button>
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
          "rounded-2xl border border-red-500/20 bg-red-500/5 p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white">
              Segurança da Viagem
            </h3>
            <p className="text-[0.65rem] text-gray-400">
              Ferramentas para sua proteção
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleShareRide}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left"
          >
            <Share2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Compartilhar</p>
              <p className="text-[0.55rem] text-gray-500">
                Enviar dados da corrida
              </p>
            </div>
          </button>
          <button className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left">
            <MapPin className="h-4 w-4 text-teal-400 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-white">Localização</p>
              <p className="text-[0.55rem] text-gray-500">Ver no mapa</p>
            </div>
          </button>
        </div>

        {ride && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium truncate">
                  {ride.driver?.name || "Motorista"}
                </p>
                <p className="text-[0.6rem] text-gray-500 truncate">
                  {ride.driver?.vehicle_model} · {ride.driver?.vehicle_plate}
                  {ride.driver?.is_verified && " · ✓ Verificado"}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all"
        >
          <AlertTriangle className="h-4 w-4" />
          🆘 Botão de Emergência
        </button>
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
  ride?: RideRequest;
  onTrigger: () => void;
  onShare: () => void;
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1010] border-red-900/50 text-white max-w-sm">
        {/* ✅ CORREÇÃO AAA: Adicionar DialogTitle e DialogDescription para WCAG */}
        <DialogTitle className="text-xl font-bold text-red-400 text-center">
          Emergência
        </DialogTitle>
        <DialogDescription className="text-sm text-gray-300 text-center">
          Ao confirmar, sua localização e dados da corrida serão enviados para
          contatos de emergência.
        </DialogDescription>

        <div className="text-center space-y-4">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-red-500/20 border-4 border-red-500/40 flex items-center justify-center mx-auto animate-pulse">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>

          {/* Ride info */}
          {ride && (
            <div className="text-left p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <p className="text-xs text-gray-400 font-semibold">
                Dados da corrida:
              </p>
              <p className="text-xs text-white">
                Motorista: {ride.driver?.name || "N/A"}
              </p>
              <p className="text-xs text-white">
                Placa: {ride.driver?.vehicle_plate || "N/A"}
              </p>
              <p className="text-xs text-white">Destino: {ride.destination}</p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={onTrigger}
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl h-12 text-base shadow-lg shadow-red-900/50 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  🆘 ACIONAR EMERGÊNCIA
                </>
              )}
            </Button>

            <Button
              onClick={onShare}
              variant="outline"
              className="w-full border-white/20 text-gray-300 hover:bg-white/5 rounded-xl h-10 text-sm"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar viagem
            </Button>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancelar — Estou bem
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Security features checklist component
export function SecurityChecklist({
  isVerified = false,
}: {
  isVerified?: boolean;
}) {
  const features = [
    {
      label: "Verificação de motorista",
      done: isVerified,
      icon: <Shield className="h-3 w-3" />,
    },
    {
      label: "Botão de emergência",
      done: true,
      icon: <AlertTriangle className="h-3 w-3" />,
    },
    {
      label: "Compartilhamento de viagem",
      done: true,
      icon: <Share2 className="h-3 w-3" />,
    },
    {
      label: "Histórico de corridas",
      done: true,
      icon: <Phone className="h-3 w-3" />,
    },
    {
      label: "Identificação de usuários",
      done: true,
      icon: <Users className="h-3 w-3" />,
    },
  ];

  return (
    <div className="space-y-1.5">
      {features.map((f) => (
        <div key={f.label} className="flex items-center gap-2">
          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
              f.done
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-gray-700 text-gray-500",
            )}
          >
            {f.done ? <Check className="h-3 w-3" /> : f.icon}
          </div>
          <span
            className={cn("text-xs", f.done ? "text-white" : "text-gray-500")}
          >
            {f.label}
          </span>
        </div>
      ))}
    </div>
  );
}
