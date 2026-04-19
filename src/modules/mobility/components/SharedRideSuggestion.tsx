import React from "react";
import { Users, DollarSign, MapPin, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import type { RideRequest } from "@/modules/mobility/types";

interface SharedRideSuggestionProps {
  myRide: RideRequest;
  matchedRide: RideRequest;
  savings: number;
  driverBonus: number;
  onAccept: () => void;
  onDecline: () => void;
}

export function SharedRideSuggestion({
  myRide,
  matchedRide,
  savings,
  driverBonus,
  onAccept,
  onDecline,
}: SharedRideSuggestionProps) {
  return (
    <div className="rounded-2xl border border-teal-400/30 bg-gradient-to-br from-teal-500/10 to-cyan-500/5 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-teal-400/20 flex items-center justify-center">
          <Users className="h-4 w-4 text-teal-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">
            Carona Compartilhada Disponível
          </h3>
          <p className="text-[0.65rem] text-teal-300">
            Destinos próximos encontrados!
          </p>
        </div>
        <Badge className="bg-teal-400/20 text-teal-400 border border-teal-400/30 text-[0.6rem] px-2">
          <Zap className="h-2.5 w-2.5 mr-1" />
          NOVO
        </Badge>
      </div>

      {/* Savings highlight */}
      <div className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <DollarSign className="h-4 w-4 text-emerald-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-emerald-400">
            Economize R$ {savings.toFixed(2)} dividindo a viagem
          </p>
          <p className="text-[0.6rem] text-gray-400">
            Motorista ganha R$ {driverBonus.toFixed(2)} a mais
          </p>
        </div>
      </div>

      {/* Passengers */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
            <span className="text-[0.55rem] text-white font-bold">
              {myRide.passenger?.name?.charAt(0) || "V"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-white font-medium">Você</span>
            <div className="flex items-center gap-1 text-[0.6rem] text-gray-400">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate">{myRide.destination}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
            <span className="text-[0.55rem] text-white font-bold">
              {matchedRide.passenger?.name?.charAt(0) || "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-white font-medium">
              {matchedRide.passenger?.name}
            </span>
            <div className="flex items-center gap-1 text-[0.6rem] text-gray-400">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate">{matchedRide.destination}</span>
            </div>
          </div>
          <Badge className="bg-white/10 text-gray-400 text-[0.55rem] px-1.5">
            {matchedRide.passenger?.neighborhood}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={onAccept}
          size="sm"
          className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold rounded-xl h-9 text-xs"
        >
          Aceitar Carona
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>
        <Button
          onClick={onDecline}
          size="sm"
          variant="outline"
          className="border-white/10 text-gray-400 hover:bg-white/5 rounded-xl h-9 text-xs px-3"
        >
          Recusar
        </Button>
      </div>
    </div>
  );
}

// Component to show shared ride badge on ride cards
export function SharedRideBadge() {
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
      <Users className="h-2.5 w-2.5 text-purple-400" />
      <span className="text-[0.55rem] text-purple-400 font-semibold">
        Compartilhada
      </span>
    </div>
  );
}
