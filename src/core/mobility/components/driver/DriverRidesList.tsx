import React, { useState } from "react";
import {
  Car,
  Package,
  Clock,
  DollarSign,
  Star,
  MapPin,
  Phone,
  MessageCircle,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Ban,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { PassengerTrustBadge } from "@/shared/components/badges/PassengerTrustBadge";
import { RideChatDialog } from "../RideChatDialog";
import { cn } from "@/shared/utils/cn";
import { formatBrl } from "@/shared/utils/currency";
import { getRecordValue } from "@/shared/utils/recordLookup";
import type { MobilityRide } from "@/core/mobility/types/ride";
import { useSessionContext } from "@/core/session";
import { RIDE_STATUS, PAYMENT_METHOD } from "@/shared/types/constants";
import { toast } from "sonner";
import { logger } from "@/shared/utils/logger";
import { profileService } from "@/core/profiles/services";
import { mobilityService } from "@/core/mobility/services/MobilityService";
import { DriverTrustFeedbackPanel } from "./DriverTrustFeedbackPanel";
import { buildTelUrl, openContactUrl } from "@/shared/utils/contactLinks";

const TRUST_RISK_LABELS: Record<string, string> = {
  trusted: "Confiavel",
  watchlist: "Observacao",
  restricted: "Prioridade reduzida",
  critical: "Revisao admin",
};

function resolvePaymentBadgeLabel(paymentMethod: string): string {
  if (paymentMethod === "pix" || paymentMethod === PAYMENT_METHOD.PIX) return "Pix";
  if (paymentMethod === "dinheiro" || paymentMethod === "cash") return "Dinheiro";
  if (paymentMethod === "cartao" || paymentMethod === "card_on_delivery") {
    return "Cartao na entrega";
  }
  if (paymentMethod === "link" || paymentMethod === "payment_link") {
    return "Link de pagamento";
  }
  return paymentMethod;
}

type PassengerTrustInfo = {
  passenger_trust_level?: string | null;
  passenger_rating?: number | null;
  passenger_completed_rides?: number | null;
};

function getPassengerTrustInfo(ride: MobilityRide): PassengerTrustInfo {
  return (ride.passenger as PassengerTrustInfo | null) ?? {};
}

function getTrustRiskValue(ride: MobilityRide): string | null {
  const risk =
    typeof ride.passenger_trust_risk_level === "string"
      ? ride.passenger_trust_risk_level
      : typeof ride.customer_trust_risk_level === "string"
        ? ride.customer_trust_risk_level
        : null;

  return risk && risk !== "trusted" ? risk : null;
}

interface DriverRidesListProps {
  rides: MobilityRide[];
  type: "available" | "accepted" | "history";
  onAccept?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string, ride?: MobilityRide) => void;
  onCancel?: (id: string) => void;
  loading: boolean;
  isSuspended?: boolean;
}

export function DriverRidesList({
  rides,
  type,
  onAccept,
  onStart,
  onComplete,
  onCancel,
  loading,
  isSuspended = false,
}: DriverRidesListProps) {
  const { activeProfile } = useSessionContext();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState<MobilityRide | null>(null);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatRelative = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min atrás`;
    return `${Math.floor(mins / 60)}h atrás`;
  };
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });

  const handleAction = async (
    actionFn: ((id: string, ride?: MobilityRide) => void) | undefined,
    rideId: string,
    ride?: MobilityRide,
  ) => {
    if (!actionFn || loadingAction) return;

    // SSOT: Validar motorista verificado antes de aceitar corrida
    if (actionFn === onAccept && activeProfile) {
      try {
        // SSOT: Buscar profile_id do motorista usando ProfileService
        const driverProfile = await profileService.getProfileByType(
          activeProfile.id,
          "driver",
        );

        if (!driverProfile) {
          toast.error("Perfil de motorista não encontrado");
          return;
        }

        // SSOT: Buscar dados de driver_data via MobilityService
        const driver = await mobilityService.getDriverVerificationStatus(
          driverProfile.id,
        );

        if (!driver.is_verified) {
          toast.error("Motorista não verificado", {
            description:
              "Complete o processo de verificação para aceitar corridas.",
          });
          return;
        }

        if (!driver.is_online) {
          toast.error("Você está offline", {
            description: "Ative o modo online para aceitar corridas.",
          });
          return;
        }

        if (!driver.subscription_active) {
          toast.error("Assinatura inativa", {
            description: "Renove sua assinatura para aceitar corridas.",
          });
          return;
        }
      } catch (err) {
        logger.error("Erro ao validar motorista:", err);
        toast.error("Erro ao validar motorista");
        return;
      }
    }

    setLoadingAction(rideId);
    try {
      await actionFn(rideId, ride);
    } finally {
      setLoadingAction(null);
    }
  };

  // U7: Skeleton loading
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-border p-4 bg-card">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg mb-3" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (rides.length === 0) {
    const emptyConfig = {
      available: {
        icon: isSuspended ? Ban : MapPin,
        title: isSuspended ? "Conta Suspensa" : "Nenhum pedido disponível",
        desc: isSuspended
          ? "Você não pode aceitar corridas durante a suspensão"
          : "Fique online para receber novos pedidos",
      },
      accepted: {
        icon: Car,
        title: "Nenhuma corrida ativa",
        desc: "Aceite um pedido para começar",
      },
      history: {
        icon: Clock,
        title: "Sem histórico",
        desc: "Suas corridas concluídas aparecerão aqui",
      },
    };
    const config = getRecordValue(emptyConfig, type) ?? emptyConfig.available;
    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center mb-1.5",
            isSuspended && type === "available"
              ? "bg-destructive/10"
              : "bg-secondary/50",
          )}
        >
          <config.icon
            className={cn(
              "h-4 w-4",
              isSuspended && type === "available"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          />
        </div>
        <h3 className="text-xs font-bold text-foreground mb-0.5">
          {config.title}
        </h3>
        <p className="text-[0.6rem] text-muted-foreground">{config.desc}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {rides.map((ride) => {
        const passengerTrust = getPassengerTrustInfo(ride);
        const isEntrega = ride.ride_mode === "motoboy" || ride.type === "entrega";
        const isActionLoading = loadingAction === ride.id;
        const passengerPhone =
          typeof ride.passenger?.phone === "string" ? ride.passenger.phone : null;
        const canStartStatuses: string[] = [
          RIDE_STATUS.DRIVER_ASSIGNED,
          RIDE_STATUS.DRIVER_ACCEPTED,
          RIDE_STATUS.DRIVER_ARRIVING,
          RIDE_STATUS.DRIVER_ARRIVED,
          RIDE_STATUS.PASSENGER_BOARDED,
          RIDE_STATUS.PASSENGER_ON_BOARD,
        ];
        const canStartRide = canStartStatuses.includes(ride.status);
        const canCompleteRide = ride.status === RIDE_STATUS.IN_PROGRESS;
        const canCancelStatuses: string[] = [
          RIDE_STATUS.REQUESTED,
          RIDE_STATUS.SEARCHING_DRIVER,
          RIDE_STATUS.DRIVER_ASSIGNED,
          RIDE_STATUS.DRIVER_ACCEPTED,
          RIDE_STATUS.DRIVER_ARRIVING,
          RIDE_STATUS.DRIVER_ARRIVED,
          RIDE_STATUS.PASSENGER_BOARDED,
          RIDE_STATUS.PASSENGER_ON_BOARD,
        ];
        const canCancelRide = canCancelStatuses.includes(ride.status);
        const canTrustFeedback =
          type === "history" &&
          (ride.status === RIDE_STATUS.COMPLETED || ride.status === RIDE_STATUS.DELIVERED);
        const trustRisk = type === "available" ? getTrustRiskValue(ride) : null;
        return (
          <div
            key={ride.id}
            className={cn(
              "rounded-2xl border p-3 transition-all bg-card",
              type === "available"
                ? "border-primary/20 hover:border-primary/40"
                : "border-border",
            )}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-9 w-9 border-2 border-primary/30">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-bold">
                  {ride.passenger?.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {ride.passenger?.name}
                  </span>
                  {ride.passenger?.pontos && (ride.passenger.pontos as number) > 1000 && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-warning fill-warning" />
                      <span className="text-[0.6rem] text-warning">
                        {ride.passenger.pontos as number}
                      </span>
                    </div>
                  )}
                  {type === "available" &&
                    passengerTrust.passenger_trust_level && (
                      <PassengerTrustBadge
                        trustLevel={passengerTrust.passenger_trust_level}
                        rating={passengerTrust.passenger_rating}
                        totalRides={passengerTrust.passenger_completed_rides}
                        className="text-[0.6rem]"
                      />
                    )}
                  {trustRisk && (
                    <Badge variant="outline" className="text-[0.6rem]">
                      {getRecordValue(TRUST_RISK_LABELS, trustRisk) ?? trustRisk}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {(ride.passenger?.neighborhood as string | undefined) ?? (ride.origin as string | undefined)} ·{" "}
                  {type === "history"
                    ? formatDate(ride.updated_at ?? ride.created_at ?? new Date().toISOString())
                    : formatRelative(ride.created_at ?? new Date().toISOString())}
                </span>
              </div>
              <Badge
                className={cn(
                  "text-[0.6rem] font-semibold px-2 py-0.5 rounded-full",
                  isEntrega
                    ? "bg-warning/20 text-warning border border-warning/30"
                    : "bg-primary/20 text-primary border border-primary/30",
                )}
              >
                {isEntrega ? (
                  <Package className="h-3 w-3 mr-1" />
                ) : (
                  <Car className="h-3 w-3 mr-1" />
                )}
                {isEntrega ? "Entrega" : "Viagem"}
              </Badge>
            </div>

            {/* Route */}
            <div className="flex items-start gap-2 mb-2">
              <div className="mt-1 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-0.5 h-5 bg-gradient-to-b from-primary/50 to-warning/50" />
                <div className="w-2 h-2 rounded-full bg-warning" />
              </div>
              <div className="flex-1 space-y-1.5">
                <div>
                  <p className="text-[0.6rem] text-muted-foreground">Origem</p>
                  <p className="text-sm text-foreground font-medium">
                    {String(ride.origin ?? "")}
                  </p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-muted-foreground">Destino</p>
                  <p className="text-sm text-foreground font-medium">
                    {String(ride.destination ?? "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {ride.departure_time ? formatTime(ride.departure_time as string) : formatRelative(ride.created_at ?? new Date().toISOString())}
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-success" />
                <span className="text-success font-bold text-sm">
                  {formatBrl((ride.final_price ?? ride.suggested_price) != null ? (ride.final_price ?? ride.suggested_price) : 0)}
                </span>
              </div>
              {ride.payment_method && (
                <Badge className="bg-secondary/50 text-muted-foreground text-[0.6rem] px-2 rounded-full border border-border">
                  {resolvePaymentBadgeLabel(String(ride.payment_method))}
                </Badge>
              )}
            </div>

            {ride.observation && (
              <div className="mb-2 px-2 py-1.5 rounded-lg bg-secondary/50 border border-border">
                <p className="text-xs text-muted-foreground italic">
                  "{ride.observation as string}"
                </p>
              </div>
            )}

            {/* Actions — U1: Loading states */}
            {type === "available" && onAccept && (
              <Button
                onClick={() => handleAction(onAccept, ride.id)}
                disabled={isActionLoading}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold rounded-xl h-10 shadow-lg shadow-primary/20"
              >
                {isActionLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Car className="h-4 w-4 mr-2" />
                )}
                {isActionLoading ? "Aceitando..." : isEntrega ? "Aceitar Entrega" : "Aceitar Corrida"}
              </Button>
            )}

            {type === "accepted" && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedRide(ride);
                      setChatOpen(true);
                    }}
                    className="bg-primary/15 text-primary hover:bg-primary/25 rounded-xl text-xs h-9"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Chat
                  </Button>
                  {passengerPhone && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const url = buildTelUrl(passengerPhone);
                        openContactUrl(url);
                      }}
                      className="bg-success/15 text-success hover:bg-success/25 rounded-xl text-xs h-9"
                    >
                      <Phone className="h-3.5 w-3.5 mr-1.5" /> Ligar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {canStartRide && onStart && (
                    <Button
                      onClick={() => handleAction(onStart, ride.id)}
                      disabled={isActionLoading}
                      className="bg-success/15 text-success hover:bg-success/25 rounded-xl text-xs h-9"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Iniciar
                    </Button>
                  )}
                  {canCompleteRide && onComplete && (
                    <Button
                      onClick={() => handleAction(onComplete, ride.id, ride)}
                      disabled={isActionLoading}
                      className="bg-success/15 text-success hover:bg-success/25 rounded-xl text-xs h-9"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Concluir
                    </Button>
                  )}
                  {canCancelRide && onCancel && (
                    <Button
                      onClick={() => handleAction(onCancel, ride.id)}
                      disabled={isActionLoading}
                      variant="outline"
                      className="border-destructive/30 text-destructive hover:bg-destructive/10 rounded-xl text-xs h-9"
                    >
                      {isActionLoading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            )}

            {type === "history" && ride.status === RIDE_STATUS.COMPLETED && (
              <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-success/10 border border-success/20">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-success font-semibold">
                  Concluída
                </span>
              </div>
            )}

            {canTrustFeedback && (
              <div className="mt-3">
                <DriverTrustFeedbackPanel ride={ride} />
              </div>
            )}
          </div>
        );
      })}

      {/* Chat Dialog */}
      {selectedRide && activeProfile && (
        <RideChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          rideId={selectedRide.id}
          otherUserName={(selectedRide.passenger?.name as string | undefined) || "Passageiro"}
          isDriver={true}
        />
      )}
    </div>
  );
}
