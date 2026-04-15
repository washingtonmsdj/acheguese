/**
 * DeliveryTrackingCard — Acompanhamento da entrega ativa
 *
 * Exibido para quem solicitou a entrega (empresa, restaurante, passageiro).
 * Mostra status, motoboy atribuído e prova de entrega quando concluída.
 */

import React from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Package,
  MapPin,
  User,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { RIDE_STATUS } from "../constants";

// ============================================
// TIPOS
// ============================================

interface DeliveryTrackingCardProps {
  delivery: {
    id: string;
    status: string;
    ride_mode: string;
    recipient_name?: string;
    origin?: string;
    destination?: string;
    suggested_price?: number;
    final_price?: number;
    driver_profile_id?: string;
    proof_of_delivery?: {
      photo_url?: string;
      code?: string;
      observation?: string;
      signed_at?: string;
    };
    delivered_at?: string;
    failed_delivery_reason?: string;
    created_at: string;
  };
  onCancel?: (rideId: string) => void;
}

// ============================================
// MAPA DE STATUS
// ============================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  [RIDE_STATUS.REQUESTED]: {
    label: "Aguardando",
    color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    icon: <Clock className="h-3 w-3" />,
  },
  [RIDE_STATUS.SEARCHING_DRIVER]: {
    label: "Buscando motoboy",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: <Clock className="h-3 w-3 animate-spin" />,
  },
  [RIDE_STATUS.DRIVER_ASSIGNED]: {
    label: "Motoboy a caminho",
    color: "bg-blue-500/20 text-blue-600 border-blue-500/30",
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.DRIVER_ACCEPTED]: {
    label: "Motoboy confirmado",
    color: "bg-indigo-500/20 text-indigo-600 border-indigo-500/30",
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.DRIVER_ARRIVING]: {
    label: "Motoboy chegando",
    color: "bg-purple-500/20 text-purple-600 border-purple-500/30",
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.PICKUP_CONFIRMED]: {
    label: "Pacote coletado",
    color: "bg-orange-500/20 text-orange-600 border-orange-500/30",
    icon: <Package className="h-3 w-3" />,
  },
  [RIDE_STATUS.IN_DELIVERY]: {
    label: "Em entrega",
    color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    icon: <Truck className="h-3 w-3" />,
  },
  [RIDE_STATUS.DELIVERED]: {
    label: "Entregue",
    color: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [RIDE_STATUS.COMPLETED]: {
    label: "Concluída",
    color: "bg-gray-500/20 text-gray-600 border-gray-500/30",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  [RIDE_STATUS.FAILED_DELIVERY]: {
    label: "Falha na entrega",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  [RIDE_STATUS.CANCELLED_BY_DRIVER]: {
    label: "Cancelada",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  [RIDE_STATUS.CANCELLED_BY_PASSENGER]: {
    label: "Cancelada",
    color: "bg-red-500/20 text-red-600 border-red-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
  [RIDE_STATUS.EXPIRED]: {
    label: "Expirada",
    color: "bg-gray-500/20 text-gray-500 border-gray-500/30",
    icon: <XCircle className="h-3 w-3" />,
  },
};

const CANCELLABLE_STATES = [
  RIDE_STATUS.REQUESTED,
  RIDE_STATUS.SEARCHING_DRIVER,
  RIDE_STATUS.DRIVER_ASSIGNED,
];

// ============================================
// COMPONENTE
// ============================================

export function DeliveryTrackingCard({ delivery, onCancel }: DeliveryTrackingCardProps) {
  if (delivery.ride_mode !== 'motoboy') return null;

  const statusConfig = STATUS_CONFIG[delivery.status] || {
    label: delivery.status,
    color: "bg-gray-500/20 text-gray-500 border-gray-500/30",
    icon: <Clock className="h-3 w-3" />,
  };

  const canCancel = CANCELLABLE_STATES.includes(delivery.status) && !!onCancel;
  const price = delivery.final_price ?? delivery.suggested_price;

  return (
    <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Entrega Motoboy</span>
        </div>
        <Badge
          className={cn(
            "flex items-center gap-1 text-xs border",
            statusConfig.color
          )}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </Badge>
      </div>

      {/* Rota */}
      <div className="space-y-1.5 text-sm">
        {delivery.origin && (
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <span className="text-muted-foreground">{delivery.origin}</span>
          </div>
        )}
        {delivery.destination && (
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
            <span className="text-muted-foreground">{delivery.destination}</span>
          </div>
        )}
      </div>

      {/* Destinatário */}
      {delivery.recipient_name && (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Para:</span>
          <span className="font-medium">{delivery.recipient_name}</span>
        </div>
      )}

      {/* Preço */}
      {price && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Valor</span>
          <span className="font-semibold text-foreground">
            R$ {price.toFixed(2)}
            {delivery.final_price && (
              <span className="text-xs text-muted-foreground ml-1">(final)</span>
            )}
          </span>
        </div>
      )}

      {/* Prova de entrega */}
      {delivery.proof_of_delivery && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Entrega confirmada
          </div>
          {delivery.proof_of_delivery.code && (
            <p className="text-xs text-muted-foreground">
              Código: <span className="font-mono font-medium">{delivery.proof_of_delivery.code}</span>
            </p>
          )}
          {delivery.proof_of_delivery.observation && (
            <p className="text-xs text-muted-foreground">{delivery.proof_of_delivery.observation}</p>
          )}
          {delivery.proof_of_delivery.signed_at && (
            <p className="text-xs text-muted-foreground">
              {new Date(delivery.proof_of_delivery.signed_at).toLocaleString("pt-BR")}
            </p>
          )}
        </div>
      )}

      {/* Falha na entrega */}
      {delivery.failed_delivery_reason && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            Falha na entrega
          </div>
          <p className="text-xs text-muted-foreground">{delivery.failed_delivery_reason}</p>
        </div>
      )}

      {/* Cancelar */}
      {canCancel && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => onCancel(delivery.id)}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Cancelar entrega
        </Button>
      )}
    </div>
  );
}
