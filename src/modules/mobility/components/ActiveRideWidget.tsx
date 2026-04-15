/**
 * Widget de Corrida Ativa
 * Mostra a corrida em andamento do usuário com informações resumidas
 */

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Car, MapPin, Clock, User, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/modules/mobility/types"; // TODO: Migrar para mobility.generated.ts;

interface ActiveRideWidgetProps {
  ride: RideRequest;
  isDriver?: boolean;
  compact?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Aguardando",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  accepted: {
    label: "Aceita",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  driver_on_the_way: {
    label: "A caminho",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  driver_arrived: {
    label: "Motorista chegou",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  in_progress: {
    label: "Em andamento",
    color: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  },
  completed: {
    label: "Concluída",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  cancelled: {
    label: "Cancelada",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
} as const;

export const ActiveRideWidget = memo(
  ({
    ride,
    isDriver = false,
    compact = false,
    className,
  }: ActiveRideWidgetProps) => {
    const navigate = useNavigate();

    const statusConfig = STATUS_CONFIG[ride.status] || STATUS_CONFIG.pending;
    const otherPerson = isDriver ? ride.passenger : ride.driver;
    const otherPersonName = isDriver
      ? ride.passenger?.name || "Passageiro"
      : ride.driver?.name || "Motorista";

    const handleClick = () => {
      if (isDriver) {
        navigate("/mobilidade/motorista");
      } else {
        navigate("/mobilidade/passageiro");
      }
    };

    if (compact) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("w-full", className)}
        >
          <Card
            className="border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 hover:from-teal-500/15 hover:to-cyan-500/10 transition-all cursor-pointer"
            onClick={handleClick}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center">
                    <Car className="w-6 h-6 text-teal-400" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", statusConfig.color)}
                    >
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {ride.destination_details || ride.destination}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {isDriver ? "Passageiro" : "Motorista"}: {otherPersonName}
                  </p>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("w-full", className)}
      >
        <Card className="border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-cyan-500/5">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Car className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {isDriver ? "Corrida em Andamento" : "Sua Viagem"}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn("text-xs mt-1", statusConfig.color)}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Rotas */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Origem</p>
                  <p className="text-sm text-white truncate">
                    {ride.origin_details || ride.origin}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">Destino</p>
                  <p className="text-sm text-white truncate">
                    {ride.destination_details || ride.destination}
                  </p>
                </div>
              </div>
            </div>

            {/* Informações da outra pessoa */}
            {otherPerson && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-4">
                <Avatar className="h-10 w-10 border-2 border-teal-400/30">
                  <AvatarImage
                    src={
                      isDriver
                        ? ride.passenger?.avatar_url
                        : ride.driver?.profile?.avatar_url
                    }
                    alt={otherPersonName}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-teal-400 to-cyan-400 text-white text-xs">
                    {(otherPersonName ?? '?').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {otherPersonName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {isDriver ? "Passageiro" : "Motorista"}
                    {!isDriver &&
                      ride.driver?.vehicle_model &&
                      ` • ${ride.driver.vehicle_model}`}
                  </p>
                </div>
                {!isDriver && ride.driver?.rating && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="text-sm font-medium">
                      {ride.driver.rating.toFixed(1)}
                    </span>
                    <span className="text-xs">⭐</span>
                  </div>
                )}
              </div>
            )}

            {/* Preço */}
            {ride.final_price && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 mb-4">
                <span className="text-sm text-gray-400">Valor</span>
                <span className="text-lg font-bold text-teal-400">
                  R$ {ride.final_price.toFixed(2)}
                </span>
              </div>
            )}

            {/* Botão de ação */}
            <Button
              onClick={handleClick}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              Ver Detalhes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  },
);

ActiveRideWidget.displayName = "ActiveRideWidget";
