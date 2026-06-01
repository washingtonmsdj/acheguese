import React from "react";
import { useNavigate } from "react-router-dom";
import { useMobilityUrls } from "@/modules/mobility/hooks/useMobilityUrls";

/**
 * ✅ SSOT COMPLIANT - DriverProfileCard migrado
 * Usa useMobilityUrls para navegação
 */
import {
  Car,
  Star,
  Crown,
  Shield,
  CheckCircle2,
  Clock,
  TrendingUp,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn";
import type { DriverPlan, DriverEarnings } from "@/core/mobility/types";

interface DriverProfileCardProps {
  isOnline: boolean;
  plan: DriverPlan;
  rating: number;
  totalRides: number;
  earnings?: DriverEarnings;
  onlineHours?: number;
  vehicleModel?: string;
  vehiclePlate?: string;
}

export function DriverProfileCard({
  isOnline,
  plan,
  rating,
  totalRides,
  earnings,
  onlineHours = 4.5,
  vehicleModel = "Honda Civic 2022",
  vehiclePlate = "ABC-1D23",
}: DriverProfileCardProps) {
  const navigate = useNavigate();
  const mobilityUrls = useMobilityUrls();
  const isPrioritario = plan === "prioritario";

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1E2529] to-[#1a2025] p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-5">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-teal-400/30">
              <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-xl font-bold">
                VM
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1E2529] flex items-center justify-center",
                isOnline ? "bg-emerald-400" : "bg-gray-600",
              )}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-white animate-pulse" : "bg-gray-400",
                )}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                Você (Motorista)
              </h3>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                className={cn(
                  "text-[0.6rem] px-2 py-0.5 rounded-full",
                  isPrioritario
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/10 text-gray-400",
                )}
              >
                {isPrioritario ? (
                  <Crown className="h-3 w-3 mr-1" />
                ) : (
                  <Shield className="h-3 w-3 mr-1" />
                )}
                {isPrioritario ? "Prioritário" : "Padrão"}
              </Badge>
              <Badge className="bg-emerald-500/10 text-emerald-400 text-[0.6rem] px-2 rounded-full border border-emerald-500/20">
                Verificado
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-500">
              <Car className="h-3 w-3" />
              <span>{vehicleModel}</span>
              <span className="text-gray-600">·</span>
              <span className="font-mono text-[0.65rem]">{vehiclePlate}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 text-center">
            <Star className="h-4 w-4 text-yellow-400 mx-auto mb-1 fill-yellow-400" />
            <p className="text-lg font-bold text-yellow-400">
              {rating.toFixed(1)}
            </p>
            <p className="text-[0.55rem] text-gray-500">Avaliação</p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/10 text-center">
            <TrendingUp className="h-4 w-4 text-teal-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-teal-400">{totalRides}</p>
            <p className="text-[0.55rem] text-gray-500">Corridas</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
            <Wallet className="h-4 w-4 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-emerald-400">
              R$ {earnings?.today?.toFixed(0) || "0"}
            </p>
            <p className="text-[0.55rem] text-gray-500">Hoje</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 text-center">
            <Clock className="h-4 w-4 text-purple-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-400">{onlineHours}h</p>
            <p className="text-[0.55rem] text-gray-500">Online hoje</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-row md:flex-col gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 md:flex-initial border-white/10 text-gray-300 hover:bg-white/5 rounded-xl text-xs h-9"
            onClick={() => navigate(mobilityUrls.driver)}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Meu Perfil
          </Button>
        </div>
      </div>
    </div>
  );
}
